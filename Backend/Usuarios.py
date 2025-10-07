import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from ABMC_db import alta_usuario, baja_usuario, modificar_usuario, mostrar_usuarios

app = Blueprint('usuarios', __name__)

def validar_id(value):
    if value is None:
        return False
    s = str(value).strip()
    return s != ""

def validar_password(pw):
    return isinstance(pw, str) and len(pw) >= 6

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
    print("POST /usuarios/ llamado")
    data = request.get_json() or {}
    id_usuario = data.get("idUsuario")
    password = data.get("password")
    activo = parse_activo(data.get("activo"))

    if not validar_id(id_usuario):
        return jsonify({"error": "idUsuario inválido"}), 400
    if not validar_password(password):
        return jsonify({"error": "password inválido (mínimo 6 caracteres)"}), 400

    if find_user_by_id(id_usuario):
        return jsonify({"error": "Usuario ya existe"}), 409

    hashed = generate_password_hash(password)
    try:
        alta_usuario(id_usuario, hashed)
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

    if new_password and not validar_password(new_password):
        return jsonify({"error": "password inválido (mínimo 6 caracteres)"}), 400

    try:
        modificar_usuario(id_usuario, nueva_contraseña=new_password, nuevo_activo=activo)
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