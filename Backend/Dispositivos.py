import traceback
from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_dispositivo, modificar_dispositivo, mostrar_dispositivos,
    baja_dispositivo, buscar_dispositivo_por_nroSerie, dispositivos_por_cliente
)
from ABMC_db import obtener_ordenes, buscar_cliente_por_id

bp = Blueprint('dispositivos', __name__)

@bp.route('/dispositivos', methods=['POST'])
def registrar_dispositivo():
    data = request.json
    if 'nroSerie' not in data:
        return jsonify({'error': 'Falta información obligatoria (nroSerie)'}), 400

    if buscar_dispositivo_por_nroSerie(data['nroSerie']):
        return jsonify({'error': 'Ya existe un dispositivo con ese número de serie'}), 409

    dispositivo = alta_dispositivo(
        nroSerie=data['nroSerie'],
        marca=data.get('marca'),
        modelo=data.get('modelo'),
        idCliente=data.get('idCliente')
    )
    return jsonify({
        'idDispositivo': dispositivo.idDispositivo,
        'nroSerie': dispositivo.nroSerie,
        'marca': dispositivo.marca,
        'modelo': dispositivo.modelo,
        'idCliente': dispositivo.idCliente,
        'activo': dispositivo.activo
    }), 201

@bp.route('/dispositivos', methods=['GET'])
def listar_dispositivos():
    id_cliente = request.args.get('idCliente')
    activos = request.args.get('activos', 'true').lower() == 'true'
    
    if id_cliente:
        dispositivos = dispositivos_por_cliente(int(id_cliente))
        if activos:
            dispositivos = [d for d in dispositivos if d.activo == 1]
    else:
        dispositivos = mostrar_dispositivos(activos_only=activos)
        
    return jsonify([
        {
            'idDispositivo': d.idDispositivo,
            'nroSerie': d.nroSerie,
            'marca': d.marca,
            'modelo': d.modelo,
            'idCliente': d.idCliente,
            'activo': d.activo
        } for d in dispositivos
    ])

@bp.route('/dispositivos/<int:idDispositivo>', methods=['PUT'])
def modificar_datos_dispositivo(idDispositivo):
    data = request.get_json()
    dispositivo = modificar_dispositivo(
        idDispositivo=idDispositivo,
        nroSerie=data.get('nroSerie'),
        marca=data.get('marca'),
        modelo=data.get('modelo'),
        idCliente=data.get('idCliente'),
        activo=data.get('activo')
    )
    if dispositivo:
        return jsonify({'success': True})
    return jsonify({'error': 'Dispositivo no encontrado'}), 404

@bp.route('/dispositivos/<int:idDispositivo>', methods=['DELETE'])
def baja_logica_dispositivo(idDispositivo):
    dispositivo = baja_dispositivo(idDispositivo)
    if dispositivo:
        return jsonify({'success': True})
    return jsonify({'error': 'Dispositivo no encontrado'}), 404


@bp.route('/dispositivos/<int:idDispositivo>/historial-ordenes', methods=['GET'])
def historial_ordenes_por_dispositivo(idDispositivo):
    """Devuelve el historial de órdenes de reparación para un dispositivo.

    Respuesta: lista de objetos con: nroDeOrden, fecha, diagnostico, tipoDocumento y numeroDocumento del cliente asociado.
    """
    try:
        # Obtener el dispositivo (entre los dispositivos existentes)
        dispositivos = mostrar_dispositivos(activos_only=False) or []
        dispositivo = next((d for d in dispositivos if getattr(d, 'idDispositivo', None) == idDispositivo), None)
        if not dispositivo:
            return jsonify({'error': 'Dispositivo no encontrado'}), 404
        # Obtener cliente asociado directamente
        cliente = buscar_cliente_por_id(getattr(dispositivo, 'idCliente', None))

        # Obtener órdenes ya serializadas desde la función central
        ordenes = obtener_ordenes(mode='summary', idDispositivo=idDispositivo) or []
        resultado = []
        tipo_doc = getattr(cliente, 'idTipoDoc', None) if cliente else None
        nro_doc = getattr(cliente, 'numeroDoc', None) if cliente else None

        for o in ordenes:
            resultado.append({
                'nroDeOrden': o.get('nroDeOrden'),
                'fecha': o.get('fecha'),
                'diagnostico': o.get('diagnostico'),
                'tipoDocumento': tipo_doc,
                'numeroDocumento': nro_doc,
                'importeFinal': float(o.get('precioTotal')) if o.get('precioTotal') is not None else None
            })

        return jsonify(resultado)
    except Exception as e:
        return jsonify({'error': 'No se pudo obtener el historial', 'detail': str(e)}), 500