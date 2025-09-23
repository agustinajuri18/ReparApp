import re
from flask import Blueprint
from flask import Flask, request, jsonify
from flask_cors import CORS
from ABMC_db import *

app = Blueprint('clientes', __name__)


def validar_dni(dni):
    return dni.isdigit() and 7 <= len(dni) <= 8

def validar_pasaporte(pasaporte):
    import re
    return bool(re.match(r'^[A-Za-z0-9]{6,15}$', pasaporte))

def validar_cuit_cuil(cuit):
    return cuit.isdigit() and len(cuit) == 11

def validar_telefono(telefono):
    return str(telefono).isdigit() and 10 <= len(str(telefono)) <= 11

@app.route("/clientes/", methods=["POST"])
def registrar_cliente():
    data = request.get_json()
    tipoDocumento = data.get("tipoDocumento")
    numeroDni = data.get("numeroDni")
    telefono = data.get("telefono")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    mail = data.get("mail")
    activo = data.get("activo", 1)

    if tipoDocumento == "DNI":
        if not validar_dni(numeroDni):
            return jsonify({"error": "DNI inválido"}), 400
    elif tipoDocumento == "Pasaporte":
        if not validar_pasaporte(numeroDni):
            return jsonify({"error": "Pasaporte inválido"}), 400
    elif tipoDocumento in ("CUIT", "CUIL"):
        if not validar_cuit_cuil(numeroDni):
            return jsonify({"error": "CUIT/CUIL inválido"}), 400
    else:
        return jsonify({"error": "Tipo de documento no soportado"}), 400

    if not validar_telefono(telefono):
        return jsonify({"error": "Teléfono inválido"}), 400

    alta_cliente(tipoDocumento, numeroDni, nombre, apellido, telefono, mail)
    return jsonify({"mensaje": "Cliente creado exitosamente"}), 201

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