import re
from flask import Blueprint, request, jsonify
from ABMC_db import alta_cliente, mostrar_clientes, modificar_cliente, baja_cliente  # importa solo lo que uses

app = Blueprint('clientes', __name__)

def validar_dni(dni):
    return str(dni).isdigit() and 7 <= len(str(dni)) <= 8

def validar_pasaporte(pasaporte):
    return bool(re.match(r'^[A-Za-z0-9]{6,15}$', str(pasaporte)))

def validar_cuit_cuil(cuit):
    return str(cuit).isdigit() and len(str(cuit)) == 11

def validar_telefono(telefono):
    return str(telefono).isdigit() and 10 <= len(str(telefono)) <= 11

def validar_email(email):
    return bool(re.match(r'^[^@]+@[^@]+\.[^@]+$', str(email)))

@app.route("/clientes/", methods=["POST"])
def registrar_cliente():
    data = request.get_json() or {}
    tipoDocumento = data.get("tipoDocumento")
    numeroDni = data.get("numeroDni")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    telefono = data.get("telefono")
    mail = data.get("mail")

    if not tipoDocumento or not numeroDni or not nombre or not apellido:
        return jsonify({"error": "Faltan campos obligatorios"}), 400
    if tipoDocumento.lower() in ("dni", "dni_arg") and not validar_dni(numeroDni):
        return jsonify({"error": "DNI inválido"}), 400
    if telefono and not validar_telefono(telefono):
        return jsonify({"error": "Teléfono inválido"}), 400
    if mail and not validar_email(mail):
        return jsonify({"error": "Email inválido"}), 400

    try:
        alta_cliente(tipoDocumento, int(numeroDni), nombre, apellido, telefono, mail)
        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"error": "No se pudo crear cliente", "detail": str(e)}), 500

@app.route("/clientes/<tipoDocumento>/<int:numeroDni>", methods=["PUT"])
def modificar_datos_cliente(tipoDocumento, numeroDni):
    data = request.get_json()
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    telefono = data.get("telefono")
    mail = data.get("mail")
    activo = data.get("activo", 1)
    modificar_cliente(tipoDocumento, numeroDni, nombre, apellido, telefono, mail, activo)
    return jsonify({"mensaje": "Cliente modificado exitosamente"}), 200

@app.route("/clientes/<tipoDocumento>/<int:numeroDni>", methods=["GET"])
def mostrar_cliente(tipoDocumento, numeroDni):
    session = SessionLocal()
    cliente = session.query(Cliente).get((tipoDocumento, numeroDni))
    session.close()
    if cliente:
        cliente_dict = {
            "tipoDocumento": cliente.tipoDocumento,
            "numeroDni": cliente.numeroDni,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "telefono": cliente.telefono,
            "mail": cliente.mail,
            "activo": cliente.activo
        }
        return jsonify(cliente_dict), 200
    return jsonify({"detail": "Cliente no encontrado"}), 404

@app.route("/clientes/<tipoDocumento>/<int:numeroDni>", methods=["DELETE"])
def baja_logica_cliente(tipoDocumento, numeroDni):
    baja_cliente(tipoDocumento, numeroDni)
    return jsonify({"mensaje": "Cliente dado de baja"}), 200

@app.route("/clientes/", methods=["GET"])
def listar_clientes():
    activos = request.args.get("activos")
    if activos == "false":
        clientes = mostrar_clientes(activos_only=False)
    else:
        clientes = mostrar_clientes(activos_only=True)
    return jsonify([
        {
            "tipoDocumento": c.tipoDocumento,
            "numeroDni": c.numeroDni,
            "nombre": c.nombre,
            "apellido": c.apellido,
            "telefono": c.telefono,
            "mail": c.mail,
            "activo": c.activo
        } for c in clientes
    ]), 200


if __name__ == "__main__":
    app.run(debug=True)