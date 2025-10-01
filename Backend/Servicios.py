from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
from ABMC_db import *

app = Blueprint('servicios', __name__)


@app.route("/servicios/", methods=["POST"])
def registrar_servicio():
    data = request.get_json()
    codigo = data.get("codigo")
    descripcion = data.get("descripcion")
    precio = data.get("precio")
    activo = data.get("activo")
    alta_servicio(codigo, descripcion, precio, activo)
    return jsonify({"mensaje": "Servicio creado exitosamente"}), 201

@app.route("/servicios/<codigo>", methods=["PUT"])
def modificar_datos_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).filter_by(codigo=codigo).first()
    if servicio:
        data = request.get_json()
        descripcion = data.get("descripcion")
        precio = data.get("precio")
        activo = data.get("activo")
        modificar_servicio(codigo, descripcion, precio, activo)
        session.close()
        return jsonify({"mensaje": "Servicio modificado exitosamente"}), 200
    session.close()
    return jsonify({"detail": "Servicio no encontrado"}), 404

@app.route("/servicios/<codigo>", methods=["GET"])
def mostrar_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).filter_by(codigo=codigo).first()
    session.close()
    if servicio:
        servicio_dict = {
            "codigo": servicio.codigo,
            "descripcion": servicio.descripcion,
            "precio": servicio.precioBase,
            "activo": servicio.activo
        }
        return jsonify(servicio_dict), 200
    return jsonify({"detail": "Servicio no encontrado"}), 404

@app.route("/servicios/<codigo>", methods=["DELETE"])
def baja_logica_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).filter_by(codigo=codigo).first()
    if servicio:
        baja_servicio(codigo)  # Esta función debe poner activo=False
        session.close()
        return jsonify({"mensaje": "Servicio dado de baja"}), 200
    session.close()
    return jsonify({"detail": "Servicio no encontrado"}), 404

@app.route("/servicios/", methods=["GET"])
def listar_servicio():
    activos = request.args.get("activos")
    if activos == "false":
        servicios = mostrar_servicios(activos_only=False)
    else:
        servicios = mostrar_servicios(activos_only=True)
    return jsonify([{
        "codigo": s.codigo,
        "descripcion": s.descripcion,
        "precio": s.precioBase,
        "activo": s.activo
    } for s in servicios]), 200

if __name__ == "__main__":
    app.run(debug=True)