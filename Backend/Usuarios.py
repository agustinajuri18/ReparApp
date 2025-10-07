import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from ABMC_db import alta_usuario, baja_usuario, modificar_usuario, mostrar_usuarios

app = Blueprint('usuarios', __name__)

def validar_nombre_usuario(nombre):
    # 3-30 caracteres, solo letras, números y guión bajo
    if not isinstance(nombre, str):
        return False
    nombre = nombre.strip()
    return bool(re.match(r"^[A-Za-z0-9_]{3,30}$", nombre))

def validar_password(pw):
    # Al menos 6 caracteres, debe tener letra y número
    if not isinstance(pw, str) or len(pw) < 6:
        return False
    tiene_letra = re.search(r"[A-Za-z]", pw)
    tiene_numero = re.search(r"\d", pw)
    return bool(tiene_letra and tiene_numero)

def validar_activo(activo):
    if isinstance(activo, int):
        return activo in (0, 1)
    if isinstance(activo, str):
        return activo in ("0", "1", "true", "false", "True", "False")
    return False

def parse_activo(value):
    if value is None:
        return 1
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, int):
        return 1 if value != 0 else 0
    vs = str(value).lower()
    if vs in ("1", "true", "yes", "si"):
        return 1
    if vs in ("0", "false", "no"):
        return 0
    return 1

def find_user_by_id(id_value):
    for u in mostrar_usuarios():
        uid = getattr(u, "idUsuario", None)
        if uid is not None and str(uid) == str(id_value):
            return u
    return None

@app.route("/usuarios/", methods=["POST"])
def registrar_usuario():
    data = request.get_json() or {}
    nombre_usuario = data.get("nombreUsuario")
    password = data.get("password")
    activo = parse_activo(data.get("activo"))

    # Validaciones
    if not validar_nombre_usuario(nombre_usuario):
        return jsonify({"error": "nombreUsuario inválido (3-30 caracteres, solo letras, números y guión bajo)"}), 400
    if not validar_password(password):
        return jsonify({"error": "password inválido (mínimo 6 caracteres, debe contener letras y números)"}), 400
    if not validar_activo(activo):
        return jsonify({"error": "activo inválido (debe ser 0 o 1)"}), 400

    # Chequear que no exista ese nombre de usuario
    for u in mostrar_usuarios():
        if getattr(u, "nombreUsuario", None) == nombre_usuario:
            return jsonify({"error": "Ya existe un usuario con ese nombreUsuario"}), 409

    hashed = generate_password_hash(password)
    try:
        # idUsuario es autoincremental, no se pasa
        alta_usuario(None, nombre_usuario, hashed, activo)
        return jsonify({"mensaje": "Usuario creado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "No se pudo crear usuario", "detail": str(e)}), 500

@app.route("/usuarios/<id_usuario>", methods=["DELETE"])
def eliminar_usuario(id_usuario):
    u = find_user_by_id(id_usuario)
    if not u:
        return jsonify({"detail": "Usuario no encontrado"}), 404
    try:
        baja_usuario(id_usuario)
        return jsonify({"mensaje": "Usuario eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo eliminar usuario", "detail": str(e)}), 500

@app.route("/usuarios/<id_usuario>", methods=["PUT"])
def modificar_usuario_endpoint(id_usuario):
    u = find_user_by_id(id_usuario)
    if not u:
        return jsonify({"detail": "Usuario no encontrado"}), 404

    data = request.get_json() or {}
    new_password = data.get("password")
    activo = parse_activo(data.get("activo"))
    nuevo_nombreUsuario = data.get("nombreUsuario")

    # Validaciones
    if nuevo_nombreUsuario is not None and not validar_nombre_usuario(nuevo_nombreUsuario):
        return jsonify({"error": "nombreUsuario inválido (3-30 caracteres, solo letras, números y guión bajo)"}), 400
    if new_password and new_password.strip() != "" and not validar_password(new_password):
        return jsonify({"error": "password inválido (mínimo 6 caracteres, debe contener letras y números)"}), 400
    if not validar_activo(activo):
        return jsonify({"error": "activo inválido (debe ser 0 o 1)"}), 400

    # Chequear que el nuevo nombre de usuario no exista en otro usuario
    if nuevo_nombreUsuario and nuevo_nombreUsuario != u.nombreUsuario:
        for user in mostrar_usuarios():
            if getattr(user, "nombreUsuario", None) == nuevo_nombreUsuario and str(user.idUsuario) != str(id_usuario):
                return jsonify({"error": "Ya existe un usuario con ese nombreUsuario"}), 409

    try:
        hashed = generate_password_hash(new_password) if new_password and new_password.strip() != "" else None
        modificar_usuario(
            id_usuario,
            nueva_contraseña=hashed,
            nuevo_activo=activo,
            nuevo_nombreUsuario=nuevo_nombreUsuario
        )
        return jsonify({"mensaje": "Usuario modificado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo modificar usuario", "detail": str(e)}), 500

@app.route("/usuarios/<id_usuario>", methods=["GET"])
def mostrar_usuario(id_usuario):
    u = find_user_by_id(id_usuario)
    if not u:
        return jsonify({"detail": "Usuario no encontrado"}), 404
    uid = getattr(u, "idUsuario", None)
    return jsonify({
        "idUsuario": uid,
        "nombreUsuario": getattr(u, "nombreUsuario", ""),
        "activo": getattr(u, "activo", 1)
    }), 200

@app.route("/usuarios/", methods=["GET"])
def listar_usuarios():
    activos = request.args.get("activos", "true").lower() == "true"
    users = mostrar_usuarios()
    result = []
    for u in users:
        activo_val = getattr(u, "activo", 1)
        if activos and activo_val != 1:
            continue
        uid = getattr(u, "idUsuario", None)
        result.append({
            "idUsuario": uid,
            "nombreUsuario": getattr(u, "nombreUsuario", ""),
            "activo": activo_val
        })
    return jsonify(result), 200

if __name__ == "__main__":
    from flask import Flask
    from flask_cors import CORS
    app_server = Flask(__name__)
    CORS(app_server)
    app_server.register_blueprint(app, url_prefix='/')
    app_server.run(debug=True)