import re
from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_empleado, modificar_empleado as modificar_empleado_db, mostrar_empleados, baja_empleado,
    mostrar_cargos, mostrar_tecnicos, reactivar_empleado
)
from flask_cors import cross_origin

bp = Blueprint('empleados', __name__)

@cross_origin()
@bp.route('/empleados', methods=['POST', 'OPTIONS'])
def registrar_empleado():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.json
    
    # Validamos datos obligatorios
    if not data.get('nombre') or not data.get('apellido') or not data.get('idCargo') or not data.get('idUsuario'):
        return jsonify({'error': 'Falta información obligatoria'}), 400
    
    empleado = alta_empleado(
        nombre=data['nombre'],
        apellido=data['apellido'],
        idCargo=int(data['idCargo']),
        idUsuario=int(data['idUsuario']),
        activo=data.get('activo', 1)
    )
    return jsonify({
        'idEmpleado': empleado.idEmpleado,
        'nombre': empleado.nombre,
        'apellido': empleado.apellido,
        'idCargo': empleado.idCargo,
        'idUsuario': empleado.idUsuario,
        'activo': empleado.activo
    }), 201

@bp.route('/empleados', methods=['GET'])
def listar_empleados():
    activos = request.args.get('activos', 'true').lower() == 'true'
    empleados = mostrar_empleados(activos_only=activos)  # Cambiado de activos a activos_only
    return jsonify([
        {
            'idEmpleado': e.idEmpleado,
            'nombre': e.nombre,
            'apellido': e.apellido,
            'idCargo': e.idCargo,
            'idUsuario': e.idUsuario,
            'activo': e.activo
        } for e in empleados
    ])

@bp.route('/empleados/<int:idEmpleado>', methods=['PUT', 'OPTIONS'])
def modificar_empleado(idEmpleado):
    if request.method == 'OPTIONS':
        return '', 200
    data = request.json
    empleado = modificar_empleado_db(
        idEmpleado=idEmpleado,
        nombre=data.get('nombre'),
        apellido=data.get('apellido'),
        idCargo=int(data.get('idCargo')) if data.get('idCargo') is not None else None,
        idUsuario=int(data.get('idUsuario')) if data.get('idUsuario') is not None else None,
        activo=data.get('activo')
    )
    if empleado:
        return jsonify({'success': True})
    return jsonify({'error': 'Empleado no encontrado'}), 404

@bp.route('/empleados/<int:idEmpleado>', methods=['DELETE'])
def eliminar_empleado(idEmpleado):
    empleado = baja_empleado(idEmpleado)
    if empleado:
        return jsonify({'success': True})
    return jsonify({'error': 'Empleado no encontrado'}), 404

@bp.route('/empleados/<int:idEmpleado>/reactivar', methods=['PUT'])
def reactivar_empleado_endpoint(idEmpleado):
    empleado = reactivar_empleado(idEmpleado)
    if empleado:
        return jsonify({'success': True})
    return jsonify({'error': 'Empleado no encontrado'}), 404

@bp.route('/cargos', methods=['GET'])
def listar_cargos():
    cargos = mostrar_cargos()
    return jsonify([
        {
            'idCargo': c.idCargo,
            'descripcion': c.descripcion
        } for c in cargos
    ])

# ------ API Para obtener solamente tecnicos acivos, utilizado para asignar técnicos a una orden de reparacion ------
@bp.route('/empleadosTecnicos', methods=['GET'])
def listar_tecnicos():
    activos = request.args.get('activos', 'true').lower() == 'true'
    id_cargo_tecnico = 2
    empleados = mostrar_tecnicos(activos_only=activos, idCargo=id_cargo_tecnico)
    return jsonify([
        {
            'idEmpleado': e.idEmpleado,
            'nombre': e.nombre,
            'apellido': e.apellido,
            'idCargo': e.idCargo,
            'idUsuario': e.idUsuario,
            'activo': e.activo
        } for e in empleados
    ])