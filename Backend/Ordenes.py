from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_orden_de_reparacion,
    modificar_orden_de_reparacion,
    mostrar_ordenes_de_reparacion,
)
from datetime import datetime

app = Blueprint("ordenes", __name__)

def validar_fecha(fecha):
    try:
        datetime.strptime(fecha, "%Y-%m-%d")
        return True
    except Exception:
        return False

@app.route("/ordenes/", methods=["POST"])
def registrar_orden():
    data = request.get_json() or {}
    nroSerieDispositivo = data.get("nroSerieDispositivo")
    fecha = data.get("fecha")
    descripcionDanos = data.get("descripcionDanos")
    diagnostico = data.get("diagnostico")
    presupuesto = data.get("presupuesto")
    idEmpleado = data.get("idEmpleado")

    if not nroSerieDispositivo or not validar_fecha(fecha):
        return jsonify({"error": "Datos de orden inválidos"}), 400

    try:
        alta_orden_de_reparacion(
            nroSerieDispositivo,
            fecha,
            descripcionDanos,
            diagnostico,
            presupuesto,
            idEmpleado
        )
        return jsonify({"mensaje": "Orden creada exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "Error al crear orden", "detail": str(e)}), 500

@app.route("/ordenes/<int:nroDeOrden>", methods=["PUT"])
def modificar_orden(nroDeOrden):
    data = request.get_json() or {}
    try:
        modificar_orden_de_reparacion(
            nroDeOrden,
            data.get("nroSerieDispositivo"),
            data.get("fecha"),
            data.get("descripcionDanos"),
            data.get("diagnostico"),
            data.get("presupuesto"),
            data.get("idEmpleado")
        )
        return jsonify({"mensaje": "Orden modificada exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo modificar la orden", "detail": str(e)}), 500

@app.route("/ordenes/", methods=["GET"])
def listar_ordenes():
    try:
        ordenes = mostrar_ordenes_de_reparacion()
        result = [
            {
                "nroDeOrden": o.nroDeOrden,
                "nroSerieDispositivo": o.nroSerieDispositivo,
                "fecha": str(o.fecha),
                "descripcionDanos": o.descripcionDanos,
                "diagnostico": o.diagnostico,
                "presupuesto": o.presupuesto,
                "idEmpleado": o.idEmpleado,
            }
            for o in ordenes
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Error al listar órdenes", "detail": str(e)}), 500
