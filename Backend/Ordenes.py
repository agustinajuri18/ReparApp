from flask import Blueprint, request, jsonify
from ABMC_db import (
    modificar_orden_de_reparacion,
    mostrar_ordenes_de_reparacion,
    eliminar_orden_de_reparacion,
    alta_orden_de_reparacion_con_detalles
)
from BDD.database import OrdenDeReparacion
from datetime import datetime

app = Blueprint("ordenes", __name__)

# ------------------------------
# Crear orden (con detalles opcionales)
# ------------------------------
@app.route("/ordenes/", methods=["POST"])
def registrar_orden():
    data = request.get_json() or {}
    detalles = data.get("detalles", [])
    fecha = datetime.strptime(data["fecha"], "%Y-%m-%d").date() if data.get("fecha") else None
    resultado, status = alta_orden_de_reparacion_con_detalles(
        data.get("nroSerieDispositivo"),
        fecha,
        data.get("descripcionDanos", ""),
        data.get("diagnostico", ""),
        detalles,
        data.get("idEmpleado")
    )
    return jsonify(resultado), status

# ------------------------------
# Modificar solo los campos de la orden
# ------------------------------
@app.route("/ordenes/<int:nroDeOrden>", methods=["PUT"])
def modificar_orden(nroDeOrden):
    data = request.get_json() or {}
    fecha = datetime.strptime(data["fecha"], "%Y-%m-%d").date() if data.get("fecha") else None

    # No tocar detalles aquí: solo modificar campos de la orden
    resultado, status = modificar_orden_de_reparacion(
        nroDeOrden,
        data.get("nroSerieDispositivo"),
        fecha,
        data.get("descripcionDanos", ""),
        data.get("diagnostico", ""),
        data.get("presupuesto", 0),
        data.get("idEmpleado")
    )
    return jsonify(resultado), status

# ------------------------------
# Listar órdenes
# ------------------------------
@app.route("/ordenes/", methods=["GET"])
def listar_ordenes():
    resultado = mostrar_ordenes_de_reparacion()
    return jsonify(resultado), 200

# ------------------------------
# Eliminar orden completa
# ------------------------------
@app.route("/ordenes/<int:nroDeOrden>", methods=["DELETE"])
def eliminar_orden_completa(nroDeOrden):
    resultado, status_code = eliminar_orden_de_reparacion(nroDeOrden)
    return jsonify(resultado), status_code
