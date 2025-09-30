import re
from flask import Blueprint
from flask import Flask, request, jsonify
from flask_cors import CORS
from ABMC_db import *

app = Blueprint('proveedores', __name__)



def validar_cuit(cuit):
    return cuit.isdigit() and len(cuit) == 11


def validar_telefono(telefono):
    return telefono.isdigit() and 10 <= len(telefono) <= 11


@app.route("/proveedores/", methods=["POST"])  
def registrar_proveedor():
    data = request.get_json()
    cuil = data.get("cuil")
    razonSocial = data.get("razonSocial")
    telefono = data.get("telefono")

    if not validar_cuit(str(cuil)):
        return jsonify({"error": "CUIT inválidotot-"}), 400
    if not validar_telefono(str(telefono)):
        return jsonify({"error": "Teléfono inválido"}), 400

    alta_proveedor(cuil, razonSocial, telefono)
    return jsonify({"mensaje": "Proveedor registrado exitosamente"}), 201


@app.route("/proveedores/<int:cuil>", methods=["DELETE"])
def eliminar_proveedor(cuil):
    if buscar_proveedor(cuil):
        baja_proveedor(cuil)
        return jsonify({"mensaje": "Proveedor eliminado exitosamente"}), 200
    return jsonify({"detail": "Proveedor no encontrado"}), 404


@app.route("/proveedores/<int:cuil>", methods=["PUT"])
def modificar_datos_proveedor(cuil):
    if buscar_proveedor(cuil):
        data = request.get_json()
        razonSocial = data.get("razonSocial")
        telefono = data.get("telefono")
        activo = data.get("activo", 1)  # <--- Asegúrate de recibirlo
        modificar_proveedor(cuil, razonSocial, telefono, activo)
        return jsonify({"mensaje": "Proveedor modificado exitosamente"}), 200
    return jsonify({"detail": "Proveedor no encontrado"}), 404


@app.route("/proveedores/<int:cuil>", methods=["GET"])
def mostrar_proveedor(cuil):
    proveedor = buscar_proveedor(cuil)
    if proveedor:
        proveedor_dict = {
            "cuil": proveedor.cuil,
            "razonSocial": proveedor.razonSocial,
            "telefono": proveedor.telefono,
            "activo": proveedor.activo,
        }
        return jsonify(proveedor_dict), 200
    return jsonify({"detail": "Proveedor no encontrado"}), 404

@app.route("/proveedores/", methods=["GET"])
def listar_proveedores():
    activos = request.args.get("activos")
    if activos == "false":
        proveedores = mostrar_proveedores()
    else:
        proveedores = [p for p in mostrar_proveedores() if p.activo == 1]
    return jsonify(
        [
            {
                "cuil": p.cuil,
                "razonSocial": p.razonSocial,
                "telefono": p.telefono,
                "activo": p.activo,
            }
            for p in proveedores
        ]
    ), 200


if __name__ == "__main__":
    app.run(debug=True)
