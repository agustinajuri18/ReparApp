import re
from flask import Blueprint, request, jsonify
from ABMC_db import alta_empleado, baja_empleado, modificar_empleado, buscar_empleado, mostrar_empleados
from ABMC_db import Cargo, SessionLocal, Usuario

app = Blueprint('empleados', __name__)

def validar_id(value):
    try:
        v = int(value)
        return v > 0
    except Exception:
        return False

def validar_text_field(v, min_len=1, max_len=255):
    return isinstance(v, str) and min_len <= len(v.strip()) <= max_len

def existe_cargo(idCargo):
    session = SessionLocal()
    existe = session.query(Cargo).get(idCargo) is not None
    session.close()
    return existe

def existe_usuario(idUsuario):
    if idUsuario is None:
        return False
    session = SessionLocal()
    existe = session.query(Usuario).get(idUsuario) is not None
    session.close()
    return existe

@app.route("/empleados/", methods=["POST"])
def registrar_empleado():
    data = request.get_json() or {}
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    idCargo = data.get("idCargo")
    idUsuario = data.get("idUsuario")
    activo = data.get("activo", 1)

    # Validaciones
    if not validar_text_field(nombre, 2, 50):
        return jsonify({"error": "Nombre inválido (2-50 caracteres)"}), 400
    if not validar_text_field(apellido, 2, 50):
        return jsonify({"error": "Apellido inválido (2-50 caracteres)"}), 400
    if not validar_id(idCargo) or not existe_cargo(idCargo):
        return jsonify({"error": "Cargo inválido o inexistente"}), 400
    if not validar_id(idUsuario) or not existe_usuario(idUsuario):
        return jsonify({"error": "Usuario inválido o inexistente"}), 400
    if not (isinstance(activo, int) and activo in (0, 1)):
        return jsonify({"error": "El campo 'activo' debe ser 0 o 1"}), 400

    try:
        alta_empleado(nombre.strip(), apellido.strip(), int(idCargo), int(idUsuario))
        return jsonify({"mensaje": "Empleado registrado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "No se pudo crear empleado", "detail": str(e)}), 500

@app.route("/empleados/<int:idEmpleado>/", methods=["DELETE"])
def eliminar_empleado(idEmpleado):
    if buscar_empleado(idEmpleado):
        try:
            baja_empleado(idEmpleado)
            return jsonify({"mensaje": "Empleado eliminado exitosamente"}), 200
        except Exception as e:
            return jsonify({"error": "No se pudo eliminar empleado", "detail": str(e)}), 500
    return jsonify({"detail": "Empleado no encontrado"}), 404

def parse_activo(value):
    if value is None:
        return 1
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, int):
        return 1 if value != 0 else 0
    vs = str(value).lower()
    if vs in ("1", "true", "yes", "si"):
        return 1
    if vs in ("0", "false", "no"):
        return 0
    return 1

@app.route("/empleados/<int:idEmpleado>/", methods=["PUT"])
def modificar_empleado_endpoint(idEmpleado):
    empleado = buscar_empleado(idEmpleado)
    if not empleado:
        return jsonify({"detail": "Empleado no encontrado"}), 404

    data = request.get_json() or {}
    nombre = data.get("nombre", empleado.nombre)
    apellido = data.get("apellido", empleado.apellido)
    idCargo = data.get("idCargo", empleado.idCargo)
    idUsuario = data.get("idUsuario", empleado.idUsuario)
    activo = parse_activo(data.get("activo", empleado.activo))

    # Validaciones
    if not validar_text_field(nombre, 2, 50):
        return jsonify({"error": "Nombre inválido (2-50 caracteres)"}), 400
    if not validar_text_field(apellido, 2, 50):
        return jsonify({"error": "Apellido inválido (2-50 caracteres)"}), 400
    if not validar_id(idCargo) or not existe_cargo(idCargo):
        return jsonify({"error": "Cargo inválido o inexistente"}), 400
    if not validar_id(idUsuario) or not existe_usuario(idUsuario):
        return jsonify({"error": "Usuario inválido o inexistente"}), 400
    if activo not in (0, 1):
        return jsonify({"error": "El campo 'activo' debe ser 0 o 1"}), 400

    try:
        modificar_empleado(idEmpleado, nombre.strip(), apellido.strip(), int(idCargo), int(idUsuario), activo)
        return jsonify({"mensaje": "Empleado modificado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo modificar empleado", "detail": str(e)}), 500

@app.route("/empleados/<int:idEmpleado>/", methods=["GET"])
def mostrar_empleado(idEmpleado):
    empleado = buscar_empleado(idEmpleado)
    if empleado:
        empleado_dict = {
            "idEmpleado": empleado.idEmpleado,
            "nombre": empleado.nombre,
            "apellido": empleado.apellido,
            "idCargo": empleado.idCargo,
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
            "idCargo": e.idCargo,
            "idUsuario": e.idUsuario,
            "activo": e.activo
        }
        for e in empleados
    ]), 200

@app.route('/cargos/', methods=['GET'])
def obtener_cargos():
    session = SessionLocal()
    cargos = session.query(Cargo).all()
    resultado = [{"idCargo": c.idCargo, "nombreCargo": c.descripcion} for c in cargos]
    session.close()
    return jsonify(resultado)