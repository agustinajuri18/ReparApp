from flask import Flask, request, jsonify
from ABMC_db import *

app = Flask(__name__)

@app.route("/proveedores/", methods=["POST"])
def registrar_proveedor():
    data = request.get_json()
    cuil = data.get("cuil")
    nombre = data.get("nombre")
    telefono = data.get("telefono")
    razon_social = data.get("razon_social")
    alta_proveedor(cuil, nombre, telefono, razon_social)
    return jsonify({"mensaje": "Proveedor creado exitosamente"}), 201

@app.route("/proveedores/<cuil>", methods=["DELETE"])
def eliminar_proveedor(cuil):
    if buscar_proveedor(cuil):
        baja_proveedor(cuil)
        return jsonify({"mensaje": "Proveedor eliminado exitosamente"}), 200
    return jsonify({"detail": "Proveedor no encontrado"}), 404

@app.route("/proveedores/<cuil>", methods=["PUT"])
def modificar_datos_proveedor(cuil):
    if buscar_proveedor(cuil):
        data = request.get_json()
        nombre = data.get("nombre")
        telefono = data.get("telefono")
        razon_social = data.get("razon_social")
        modificar_proveedor(cuil, nombre, telefono, razon_social)
        return jsonify({"mensaje": "Proveedor modificado exitosamente"}), 200
    return jsonify({"detail": "Proveedor no encontrado"}), 404

@app.route("/proveedores/<cuil>", methods=["GET"])
def mostrar_proveedor(cuil):
    proveedor = buscar_proveedor(cuil)
    if proveedor:
        proveedor_dict = {
            "cuil": proveedor.cuil,
            "nombre": proveedor.nombre,
            "telefono": proveedor.telefono,
            "razon_social": proveedor.razon_social
        }
        return jsonify(proveedor_dict), 200
    return jsonify({"detail": "Proveedor no encontrado"}), 404

if __name__ == "__main__":
    app.run(debug=True)
