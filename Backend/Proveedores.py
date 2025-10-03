import re
from flask import Blueprint, request, jsonify
from ABMC_db import alta_proveedor, buscar_proveedor, modificar_proveedor, mostrar_proveedores, baja_proveedor

app = Blueprint('proveedores', __name__)

# Validaciones
def validar_cuit_cuil(value):
    s = str(value).strip()
    return s.isdigit() and len(s) == 11

def validar_telefono(telefono):
    s = str(telefono).strip()
    return s.isdigit() and 10 <= len(s) <= 11

def validar_razon_social(razon):
    return isinstance(razon, str) and 2 <= len(razon.strip()) <= 255

def validar_email(email):
    if not email:
        return True
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', str(email).strip()))

# Helpers
def parse_int_safe(v):
    try:
        return int(v)
    except Exception:
        return None

# Endpoints
@app.route("/proveedores/", methods=["POST"])
def registrar_proveedor():
    data = request.get_json() or {}
    cuil = data.get("cuil")
    razonSocial = data.get("razonSocial")
    telefono = data.get("telefono")
    mail = data.get("mail")

    if not validar_cuit_cuil(cuil):
        return jsonify({"error": "CUIT/CUIL inválido, debe tener 11 dígitos numéricos"}), 400
    if not validar_razon_social(razonSocial):
        return jsonify({"error": "razonSocial inválida"}), 400
    if telefono is None or not validar_telefono(telefono):
        return jsonify({"error": "telefono inválido"}), 400
    if not validar_email(mail):
        return jsonify({"error": "mail inválido"}), 400

    cuil_int = parse_int_safe(cuil)
    if cuil_int is None:
        return jsonify({"error": "CUIL no convertible a entero"}), 400

    # evita duplicados
    try:
        if buscar_proveedor(cuil_int):
            return jsonify({"error": "Proveedor con ese CUIL ya existe"}), 409
        alta_proveedor(cuil_int, razonSocial.strip(), telefono.strip(), mail.strip() if mail else None)
        return jsonify({"mensaje": "Proveedor registrado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "Error al crear proveedor", "detail": str(e)}), 500

@app.route("/proveedores/<int:cuil>", methods=["DELETE"])
def eliminar_proveedor(cuil):
    try:
        if not buscar_proveedor(cuil):
            return jsonify({"detail": "Proveedor no encontrado"}), 404
        baja_proveedor(cuil)
        return jsonify({"mensaje": "Proveedor eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "Error al eliminar proveedor", "detail": str(e)}), 500

@app.route("/proveedores/<int:cuil>", methods=["PUT"])
def modificar_datos_proveedor(cuil):
    if not buscar_proveedor(cuil):
        return jsonify({"detail": "Proveedor no encontrado"}), 404

    data = request.get_json() or {}
    razonSocial = data.get("razonSocial")
    telefono = data.get("telefono")
    mail = data.get("mail")
    activo = data.get("activo", 1)

    if razonSocial is not None and not validar_razon_social(razonSocial):
        return jsonify({"error": "razonSocial inválida"}), 400
    if telefono is not None and not validar_telefono(telefono):
        return jsonify({"error": "telefono inválido"}), 400
    if mail is not None and not validar_email(mail):
        return jsonify({"error": "mail inválido"}), 400

    try:
        modificar_proveedor(cuil, razonSocial.strip() if razonSocial else None, telefono.strip() if telefono else None, activo, mail.strip() if mail else None)
        return jsonify({"mensaje": "Proveedor modificado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo modificar proveedor", "detail": str(e)}), 500

@app.route("/proveedores/<int:cuil>", methods=["GET"])
def mostrar_proveedor(cuil):
    try:
        proveedor = buscar_proveedor(cuil)
        if not proveedor:
            return jsonify({"detail": "Proveedor no encontrado"}), 404
        proveedor_dict = {
            "cuil": proveedor.cuil,
            "razonSocial": proveedor.razonSocial,
            "telefono": proveedor.telefono,
            "mail": getattr(proveedor, "mail", None),
            "activo": getattr(proveedor, "activo", 1),
        }
        return jsonify(proveedor_dict), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener proveedor", "detail": str(e)}), 500

@app.route("/proveedores/", methods=["GET"])
def listar_proveedores():
    activos_param = request.args.get("activos", "true").lower()
    try:
        proveedores = mostrar_proveedores()
        if activos_param == "false":
            result = [p for p in proveedores]
        else:
            result = [p for p in proveedores if getattr(p, "activo", 1) == 1]
        return jsonify([
            {
                "cuil": p.cuil,
                "razonSocial": p.razonSocial,
                "telefono": p.telefono,
                "mail": getattr(p, "mail", None),
                "activo": getattr(p, "activo", 1),
            } for p in result
        ]), 200
    except Exception as e:
        return jsonify({"error": "Error al listar proveedores", "detail": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
