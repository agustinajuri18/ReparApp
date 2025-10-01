from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
from ABMC_db import *

app = Blueprint('dispositivos', __name__)



@app.route("/dispositivos/", methods=["POST"])
def registrar_dispositivo():
    data = request.get_json()
    nroSerie = data.get("nroSerie")
    marca = data.get("marca")
    modelo = data.get("modelo")
    clienteTipoDocumento = data.get("clienteTipoDocumento")
    clienteNumeroDni = data.get("clienteNumeroDni")
    activo = data.get("activo")
    alta_dispositivo(nroSerie, marca, modelo, clienteTipoDocumento, clienteNumeroDni, activo)
    return jsonify({"mensaje": "Dispositivo creado exitosamente"}), 201

@app.route("/dispositivos/<nroSerie>", methods=["PUT"])
def modificar_datos_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
    if dispositivo:
        data = request.get_json()
        nroSerie = data.get("nroSerie")
        marca = data.get("marca")
        modelo = data.get("modelo")
        clienteTipoDocumento = data.get("clienteTipoDocumento")
        clienteNumeroDni = data.get("clienteNumeroDni")
        activo = data.get("activo")
        modificar_dispositivo(nroSerie, marca, modelo, clienteTipoDocumento, clienteNumeroDni, activo)
        session.close()
        return jsonify({"mensaje": "Dispositivo modificado exitosamente"}), 200
    session.close()
    return jsonify({"detail": "Dispositivo no encontrado"}), 404

@app.route("/dispositivos/<nroSerie>", methods=["GET"])
def mostrar_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
    session.close()
    if dispositivo:
        dispositivo_dict = {
            "nroSerie": dispositivo.nroSerie,
            "marca": dispositivo.marca,
            "modelo": dispositivo.modelo,
            "clienteTipoDocumento": dispositivo.clienteTipoDocumento,
            "clienteNumeroDni": dispositivo.clienteNumeroDni,
            "activo": dispositivo.activo
        }
        return jsonify(dispositivo_dict), 200
    return jsonify({"detail": "Dispositivo no encontrado"}), 404

@app.route("/dispositivos/<nroSerie>", methods=["DELETE"])
def baja_logica_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
    if dispositivo:
        baja_dispositivo(nroSerie) 
        session.close()
        return jsonify({"mensaje": "Dispositivo dado de baja"}), 200
    session.close()
    return jsonify({"detail": "Dispositivo no encontrado"}), 404

@app.route("/dispositivos/", methods=["GET"])
def listar_dispositivos():
    activos = request.args.get("activos", "true").lower() == "true"
    dispositivos = mostrar_dispositivos(activos_only=activos)
    return jsonify(dispositivos), 200

@app.route("/dispositivos/cliente", methods=["GET"])
def dispositivos_por_cliente():
    clienteTipoDocumento = request.args.get("clienteTipoDocumento")
    clienteNumeroDni = request.args.get("clienteNumeroDni")
    if not clienteTipoDocumento or not clienteNumeroDni:
        return jsonify({"detail": "Faltan parámetros clienteTipoDocumento o clienteNumeroDni"}), 400
    dispositivos = dispositivos_por_cliente(clienteTipoDocumento, clienteNumeroDni)
    return jsonify([{
        "nroSerie": d.nroSerie,
        "marca": d.marca,
        "modelo": d.modelo,
        "clienteTipoDocumento": d.clienteTipoDocumento,
        "clienteNumeroDni": d.clienteNumeroDni,
        "activo": d.activo
    } for d in dispositivos]), 200

if __name__ == "__main__":
    app.run(debug=True)