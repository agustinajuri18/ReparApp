import re
from flask import Blueprint, request, jsonify
from ABMC_db import alta_empleado, baja_empleado, modificar_empleado, buscar_empleado, mostrar_empleados

app = Blueprint('empleados', __name__)

def validar_id(value):
    try:
        v = int(value)
        return v > 0
    except Exception:
        return False

def validar_text_field(v, min_len=1, max_len=255):
    return isinstance(v, str) and min_len <= len(v.strip()) <= max_len

def parse_id_maybe_int(value):
    if value is None:
        return None
    try:
        return int(value)
    except Exception:
        return str(value)

@app.route("/empleados/", methods=["POST"])
def registrar_empleado():
    data = request.get_json() or {}
    idEmpleado = data.get("idEmpleado")
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    idRol = data.get("idRol")
    idUsuario = data.get("idUsuario")
    activo = data.get("activo", 1)

    if not validar_id(idEmpleado):
        return jsonify({"error": "idEmpleado inválido"}), 400
    if not validar_text_field(nombre):
        return jsonify({"error": "nombre inválido"}), 400
    if not validar_text_field(apellido):
        return jsonify({"error": "apellido inválido"}), 400
    if not validar_id(idRol):
        return jsonify({"error": "idRol inválido"}), 400

    if buscar_empleado(int(idEmpleado)):
        return jsonify({"error": "Empleado ya existe"}), 409

    try:
        alta_empleado(int(idEmpleado), nombre.strip(), apellido.strip(), int(idRol), parse_id_maybe_int(idUsuario))
        return jsonify({"mensaje": "Empleado registrado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "No se pudo crear empleado", "detail": str(e)}), 500

@app.route("/empleados/<int:idEmpleado>", methods=["DELETE"])
def eliminar_empleado(idEmpleado):
    if buscar_empleado(idEmpleado):
        try:
            baja_empleado(idEmpleado)
            return jsonify({"mensaje": "Empleado eliminado exitosamente"}), 200
        except Exception as e:
            return jsonify({"error": "No se pudo eliminar empleado", "detail": str(e)}), 500
    return jsonify({"detail": "Empleado no encontrado"}), 404

@app.route("/empleados/<int:idEmpleado>", methods=["PUT"])
def modificar_datos_empleado(idEmpleado):
    empleado = buscar_empleado(idEmpleado)
    if not empleado:
        return jsonify({"detail": "Empleado no encontrado"}), 404

    data = request.get_json() or {}
    nombre = data.get("nombre", empleado.nombre)
    apellido = data.get("apellido", empleado.apellido)
    idRol = data.get("idRol", empleado.idRol)
    idUsuario = data.get("idUsuario", empleado.idUsuario)
    activo = data.get("activo", empleado.activo)

    if not validar_text_field(nombre):
        return jsonify({"error": "nombre inválido"}), 400
    if not validar_text_field(apellido):
        return jsonify({"error": "apellido inválido"}), 400
    if not validar_id(idRol):
        return jsonify({"error": "idRol inválido"}), 400

    try:
        modificar_empleado(idEmpleado, nombre.strip(), apellido.strip(), int(idRol),
            idUsuario)
        return jsonify({"mensaje": "Empleado modificado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo modificar empleado", "detail": str(e)}), 500

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