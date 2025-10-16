from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ABMC_db import (
    alta_usuario, modificar_usuario as modificar_usuario_db, mostrar_usuarios, baja_usuario, 
    alta_sesion, cerrar_sesion, mostrar_usuario_por_id, mostrar_sesion_por_id
)
from datetime import datetime

bp = Blueprint('usuarios', __name__)

@bp.route('/usuarios', methods=['POST'])
def registrar_usuario():
    data = request.json
    
    # Validamos datos obligatorios
    if not all(k in data for k in ['nombreUsuario', 'contraseña']):
        return jsonify({'error': 'Falta información obligatoria (nombreUsuario, contraseña)'}), 400
    
    usuario = alta_usuario(
        nombreUsuario=data['nombreUsuario'],
        contraseña=data['contraseña'],
        activo=data.get('activo', 1)
    )
    return jsonify({
        'idUsuario': usuario.idUsuario,
        'nombreUsuario': usuario.nombreUsuario
    }), 201

@cross_origin()
@bp.route('/usuarios', methods=['GET'])
def listar_usuarios():
    activos = request.args.get('activos', 'true').lower() == 'true'
    no_asignados = request.args.get('no_asignados', 'false').lower() == 'true'
    usuarios = mostrar_usuarios(activos_only=activos, no_asignados_only=no_asignados)
    return jsonify([
        {
            'idUsuario': u.idUsuario,
            'nombreUsuario': u.nombreUsuario,
            'activo': u.activo
        } for u in usuarios
    ])

@bp.route('/usuarios/<int:idUsuario>', methods=['GET'])
def obtener_usuario(idUsuario):
    usuario = mostrar_usuario_por_id(idUsuario)
    if usuario:
        return jsonify({
            'idUsuario': usuario.idUsuario,
            'nombreUsuario': usuario.nombreUsuario,
            'activo': usuario.activo
        })
    return jsonify({'error': 'Usuario no encontrado'}), 404

@bp.route('/usuarios/<int:idUsuario>', methods=['PUT'])
def modificar_usuario_endpoint(idUsuario):
    data = request.json
    usuario = modificar_usuario_db(
        idUsuario=idUsuario,
        nueva_contraseña=data.get('contraseña'),
        nuevo_activo=data.get('activo'),
        nuevo_nombreUsuario=data.get('nombreUsuario')
    )
    if usuario:
        return jsonify({'success': True})
    return jsonify({'error': 'Usuario no encontrado'}), 404

@bp.route('/usuarios/<int:idUsuario>', methods=['DELETE'])
def eliminar_usuario(idUsuario):
    usuario = baja_usuario(idUsuario)
    if usuario:
        return jsonify({'success': True})
    return jsonify({'error': 'Usuario no encontrado'}), 404

@bp.route('/login', methods=['POST'])
def iniciar_sesion():
    data = request.json
    
    # Validamos datos obligatorios
    if not all(k in data for k in ['idUsuario']):
        return jsonify({'error': 'Falta información obligatoria (idUsuario)'}), 400
    
    sesion = alta_sesion(
        idUsuario=data['idUsuario'],
        horaInicio=datetime.now(),
        fecha=datetime.now().date()
    )
    return jsonify({
        'idSesion': sesion.idSesion,
        'idUsuario': sesion.idUsuario,
        'horaInicio': sesion.horaInicio.isoformat(),
        'fecha': sesion.fecha.isoformat()
    }), 201


@bp.route('/auth', methods=['POST'])
def auth_usuario():
    """Login with username + password, returns user id if ok"""
    data = request.json
    if not all(k in data for k in ['nombreUsuario', 'contraseña']):
        return jsonify({'error': 'Falta información (nombreUsuario, contraseña)'}), 400
    usuarios = mostrar_usuarios(activos_only=True)
    user = next((u for u in usuarios if u.nombreUsuario == data['nombreUsuario'] and u.contraseña == data['contraseña']), None)
    if not user:
        return jsonify({'error': 'Credenciales inválidas'}), 401
    # create a session
    sesion = alta_sesion(idUsuario=user.idUsuario, horaInicio=datetime.now(), fecha=datetime.now().date())
    return jsonify({'idSesion': sesion.idSesion, 'idUsuario': user.idUsuario}), 200


@bp.route('/session/<int:idSesion>', methods=['GET'])
def check_session(idSesion):
    ses = mostrar_sesion_por_id(idSesion)
    if not ses:
        return jsonify({'active': False}), 404
    # active if horaFin is null
    active = ses.horaFin is None
    return jsonify({'active': active, 'idUsuario': ses.idUsuario}), 200

@bp.route('/logout/<int:idSesion>', methods=['POST'])
def cerrar_sesion_usuario(idSesion):
    sesion = cerrar_sesion(
        idSesion=idSesion,
        horaFin=datetime.now()
    )
    if sesion:
        return jsonify({'success': True})
    return jsonify({'error': 'Sesión no encontrada'}), 404