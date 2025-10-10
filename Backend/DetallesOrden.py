from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_detalle_orden,
    modificar_detalle_orden,
    mostrar_detalles_orden,
    baja_detalle_orden
)

app = Blueprint("detalles_orden", __name__)

@app.route("/detalles_orden/", methods=["POST"])
def crear_detalle():
    data = request.get_json() or {}
    try:
        alta_detalle_orden(
            data["idDetalle"],
            data["nroDeOrden"],
            data["codigoServicio"],
            data["codRepuestos"],
            data["cuitProveedor"],
            data["costoServicio"],
            data["costoRepuesto"],
            data["subtotal"]
        )
        return jsonify({"mensaje": "Detalle de orden creado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "Error al crear detalle", "detail": str(e)}), 500

@app.route("/detalles_orden/<int:nroDeOrden>", methods=["GET"])
def listar_detalles(nroDeOrden):
    try:
        detalles = mostrar_detalles_orden(nroDeOrden)
        result = [
            {
                "idDetalle": d.idDetalle,
                "nroDeOrden": d.nroDeOrden,
                "codigoServicio": d.codigoServicio,
                "codRepuestos": d.codRepuestos,
                "cuitProveedor": d.cuitProveedor,
                "costoServicio": d.costoServicio,
                "costoRepuesto": d.costoRepuesto,
                "subtotal": d.subtotal,
            }
            for d in detalles
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Error al listar detalles", "detail": str(e)}), 500

@app.route("/detalles_orden/<int:nroDeOrden>/<int:idDetalle>", methods=["PUT"])
def modificar_detalle(nroDeOrden, idDetalle):
    data = request.get_json() or {}
    try:
        modificar_detalle_orden(
            idDetalle,
            nroDeOrden,
            data["codigoServicio"],
            data["codRepuestos"],
            data["cuitProveedor"],
            data["costoServicio"],
            data["costoRepuesto"],
            data["subtotal"]
        )
        return jsonify({"mensaje": "Detalle modificado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "Error al modificar detalle", "detail": str(e)}), 500


@app.route("/detalles_orden/<int:nroDeOrden>/<int:idDetalle>", methods=["DELETE"])
def eliminar_detalle(nroDeOrden, idDetalle):
    try:
        baja_detalle_orden(idDetalle, nroDeOrden)
        return jsonify({"mensaje": "Detalle eliminado"}), 200
    except Exception as e:
        return jsonify({"error": "Error al eliminar detalle", "detail": str(e)}), 500
