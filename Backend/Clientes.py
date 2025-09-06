from flask import Flask, request, jsonify
from ABMC_db import *

app = Flask(__name__)

@app.route("/clientes/", methods=["POST"])
def registrar_cliente():
    data = request.get_json()
    tipo_documento = data.get("tipo_documento")
    numero_dni = data.get("numero_dni")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    telefono = data.get("telefono")
    mail = data.get("mail")
    alta_cliente(tipo_documento, numero_dni, nombre, apellido, telefono, mail)
    return jsonify({"mensaje": "Cliente creado exitosamente"}), 201

@app.route("/clientes/<numero_dni>", methods=["DELETE"])
def eliminar_cliente(numero_dni):
    clientes = mostrar_clientes()
    cliente = next((c for c in clientes if str(c.numero_dni) == str(numero_dni)), None)
    if cliente:
        # Aquí deberías tener una función baja_cliente, si no existe, agrégala en ABMC_db.py
        baja_cliente(numero_dni)
        return jsonify({"mensaje": "Cliente eliminado exitosamente"}), 200
    return jsonify({"detail": "Cliente no encontrado"}), 404

@app.route("/clientes/<numero_dni>", methods=["PUT"])
def modificar_datos_cliente(numero_dni):
    clientes = mostrar_clientes()
    cliente = next((c for c in clientes if str(c.numero_dni) == str(numero_dni)), None)
    if cliente:
        data = request.get_json()
        tipo_documento = data.get("tipo_documento")
        nombre = data.get("nombre")
        apellido = data.get("apellido")
        telefono = data.get("telefono")
        mail = data.get("mail")
        modificar_clientes(numero_dni, tipo_documento, nombre, apellido, telefono, mail)
        return jsonify({"mensaje": "Cliente modificado exitosamente"}), 200
    return jsonify({"detail": "Cliente no encontrado"}), 404

@app.route("/clientes/<numero_dni>", methods=["GET"])
def mostrar_cliente(numero_dni):
    clientes = mostrar_clientes()
    cliente = next((c for c in clientes if str(c.numero_dni) == str(numero_dni)), None)
    if cliente:
        cliente_dict = {
            "tipo_documento": cliente.tipo_documento,
            "numero_dni": cliente.numero_dni,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "telefono": cliente.telefono,
            "mail": cliente.mail
        }
        return jsonify(cliente_dict), 200
    return jsonify({"detail": "Cliente no encontrado"}), 404

@app.route("/clientes/", methods=["GET"])
def mostrar_todos_los_clientes():
    clientes = mostrar_clientes()
    clientes_list = [
        {
            "tipo_documento": c.tipo_documento,
            "numero_dni": c.numero_dni,
            "nombre": c.nombre,
            "apellido": c.apellido,
            "telefono": c.telefono,
            "mail": c.mail
        }
        for c in clientes
    ]
    return jsonify(clientes_list), 200

if __name__ == "__main__":
    app.run(debug=True)