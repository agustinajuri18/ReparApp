from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
from ABMC_db import *

app = Blueprint('repuestos', __name__)


@app.route("/repuestos/", methods=["POST"])
def registrar_repuesto():
    data = request.get_json()
    codigo = data.get("codigo")
    marca = data.get("marca")
    modelo = data.get("modelo")
    tipo = data.get("tipo")
    cuilProveedor = data.get("cuilProveedor")
    costo = data.get("costo")
    activo = data.get("activo")
    alta_repuesto(codigo, marca, modelo, tipo, cuilProveedor, costo, activo)
    return jsonify({"mensaje": "Repuesto creado exitosamente"}), 201

@app.route("/repuestos/<codigo>", methods=["PUT"])
def modificar_datos_repuesto(numero_dni):
    session = SessionLocal()
    repuesto = session.query(Repuesto).filter_by(codigo=codigo).first()
    if repuesto:
        data = request.get_json()
        codigo = data.get("codigo")
        marca = data.get("marca")
        modelo = data.get("modelo")
        tipo = data.get("tipo")
        cuilProveedor = data.get("cuilProveedor")
        costo = data.get("costo")
        activo = data.get("activo")
        modificar_repuesto(numero_dni, codigo, marca, modelo, tipo, cuilProveedor, costo, activo)
        session.close()
        return jsonify({"mensaje": "Repuesto modificado exitosamente"}), 200
    session.close()
    return jsonify({"detail": "Repuesto no encontrado"}), 404

@app.route("/repuestos/<codigo>", methods=["GET"])
def mostrar_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).filter_by(codigo=codigo).first()
    session.close()
    if repuesto:
        repuesto_dict = {
            "codigo": repuesto.codigo,
            "marca": repuesto.marca,
            "modelo": repuesto.modelo,
            "tipo": repuesto.tipo,
            "cuilProveedor": repuesto.cuilProveedor,
            "costo": repuesto.costo,
            "activo": repuesto.activo
        }
        return jsonify(repuesto_dict), 200
    return jsonify({"detail": "Repuesto no encontrado"}), 404

@app.route("/repuestos/<codigo>", methods=["DELETE"])
def baja_logica_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).filter_by(codigo=codigo).first()
    if repuesto:
        baja_repuesto(codigo)  # Esta función debe poner activo=False
        session.close()
        return jsonify({"mensaje": "Repuesto dado de baja"}), 200
    session.close()
    return jsonify({"detail": "Repuesto no encontrado"}), 404

@app.route("/repuestos/", methods=["GET"])
def listar_repuestos():
    activos = request.args.get("activos")
    if activos == "false":
        repuestos = mostrar_repuestos(activos_only=False)
    else:
        repuestos = mostrar_repuestos(activos_only=True)
    return jsonify([{
        "codigo": c.codigo,
        "marca": c.marca,
        "modelo": c.modelo,
        "tipo": c.tipo,
        "cuilProveedor": c.cuilProveedor,
        "costo": c.costo,
        "activo": c.activo
    } for c in repuestos]), 200

if __name__ == "__main__":
    app.run(debug=True)