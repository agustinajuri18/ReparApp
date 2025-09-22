import re
from flask import Blueprint
from flask import Flask, request, jsonify
from flask_cors import CORS
from ABMC_db import *

app = Blueprint('empleados', __name__)

@app.route("/empleados/", methods=["POST"])
def registrar_empleado():
    data = request.get_json()
    idEmpleado = data.get("idEmpleado")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    idRol = data.get("idRol")
    idUsuario = data.get("idUsuario")
    alta_empleado(idEmpleado, nombre, apellido, idRol, idUsuario)
    return jsonify({"mensaje": "Empleado registrado exitosamente"}), 201

@app.route("/empleados/<int:idEmpleado>", methods=["DELETE"])
def eliminar_empleado(idEmpleado):
    if buscar_empleado(idEmpleado):
        baja_empleado(idEmpleado)
        return jsonify({"mensaje": "Empleado eliminado exitosamente"}), 200
    return jsonify({"detail": "Empleado no encontrado"}), 404

@app.route("/empleados/<int:idEmpleado>", methods=["PUT"])
def modificar_datos_empleado(idEmpleado):
    if buscar_empleado(idEmpleado):
        data = request.get_json()
        nombre = data.get("nombre")
        apellido = data.get("apellido")
        idRol = data.get("idRol")
        idUsuario = data.get("idUsuario")
        modificar_empleado(idEmpleado, nombre, apellido, idRol, idUsuario)
        return jsonify({"mensaje": "Empleado modificado exitosamente"}), 200
    return jsonify({"detail": "Empleado no encontrado"}), 404

@app.route("/empleados/<int:idEmpleado>", methods=["GET"])
def mostrar_empleado(idEmpleado):
    empleado = buscar_empleado(idEmpleado)
    if empleado:
        empleado_dict = {
            "idEmpleado": empleado.idEmpleado,
            "nombre": empleado.nombre,
            "apellido": empleado.apellido,
            "idRol": empleado.idRol,
            "idUsuario": empleado.idUsuario,
            "activo": empleado.activo
        }
        return jsonify(empleado_dict), 200
    return jsonify({"detail": "Empleado no encontrado"}), 404

@app.route("/empleados/", methods=["GET"])
def listar_empleados():
    empleados = mostrar_empleados()
    return jsonify([
        {
            "idEmpleado": e.idEmpleado,
            "nombre": e.nombre,
            "apellido": e.apellido,
            "idRol": e.idRol,
            "idUsuario": e.idUsuario,
            "activo": e.activo
        }
        for e in empleados
    ]), 200