from flask import Blueprint, request, jsonify
from datetime import datetime
from ABMC_db import (
    alta_orden_de_reparacion, alta_orden_por_nroSerie, modificar_orden_de_reparacion, 
    mostrar_ordenes_de_reparacion, asignar_estado_orden, mostrar_estados,
    alta_historial_arreglos, mostrar_historial_arreglos, buscar_por_id
)

bp = Blueprint('ordenes', __name__)

@bp.route('/ordenes', methods=['POST'])
def registrar_orden():
    data = request.json
    
    # Verificamos si se envía un nroSerie o un idDispositivo
    if 'nroSerie' in data:
        # Crear orden por número de serie
        orden = alta_orden_por_nroSerie(
            nroSerie=data['nroSerie'],
            fecha=datetime.now().date(),
            descripcionDanos=data.get('descripcionDanos'),
            diagnostico=data.get('diagnostico'),
            presupuesto=data.get('presupuesto'),
            idEmpleado=data.get('idEmpleado')
        )
        if not orden:
            return jsonify({'error': 'No se encontró dispositivo con ese número de serie'}), 404
    elif 'idDispositivo' in data:
        # Crear orden con ID de dispositivo
        orden = alta_orden_de_reparacion(
            idDispositivo=data['idDispositivo'],
            fecha=datetime.now().date(),
            descripcionDanos=data.get('descripcionDanos'),
            diagnostico=data.get('diagnostico'),
            presupuesto=data.get('presupuesto'),
            idEmpleado=data.get('idEmpleado')
        )
    else:
        return jsonify({'error': 'Se requiere nroSerie o idDispositivo'}), 400
        
    # Si llegamos aquí, la orden se creó exitosamente
    # Buscamos el ID del estado "EnDiagnostico"
    estados = {e.nombre: e.idEstado for e in mostrar_estados()}
    id_estado_diagnostico = estados.get('EnDiagnostico')
    
    if not id_estado_diagnostico:
        return jsonify({'error': 'No se encontró el estado EnDiagnostico'}), 500
    
    # Creamos el primer registro en el historial de estados con EnDiagnostico
    historial = asignar_estado_orden(
        nroDeOrden=orden.nroDeOrden,
        idEstado=id_estado_diagnostico,
        fechaCambio=datetime.now(),
        observaciones="Estado inicial: En Diagnóstico"
    )
    
    return jsonify({
        'nroDeOrden': orden.nroDeOrden,
        'idDispositivo': orden.idDispositivo,
        'fecha': orden.fecha.isoformat() if orden.fecha else None,
        'descripcionDanos': orden.descripcionDanos,
        'diagnostico': orden.diagnostico,
        'presupuesto': orden.presupuesto,
        'idEmpleado': orden.idEmpleado,
        'estado': 'EnDiagnostico'  # Indicamos explícitamente el estado inicial
    }), 201

@bp.route('/ordenes', methods=['GET'])
def listar_ordenes():
    ordenes = mostrar_ordenes_de_reparacion()
    resultado = []
    for o in ordenes:
        # Obtenemos el último estado de la orden
        ultimo_estado = None
        if o.historial_estados:
            ultimo_estado = sorted(o.historial_estados, key=lambda h: h.fechaCambio, reverse=True)[0]
        
        resultado.append({
            'nroDeOrden': o.nroDeOrden,
            'idDispositivo': o.idDispositivo,
            'fecha': o.fecha.isoformat() if o.fecha else None,
            'descripcionDanos': o.descripcionDanos,
            'diagnostico': o.diagnostico,
            'presupuesto': o.presupuesto,
            'idEmpleado': o.idEmpleado,
            'estado': ultimo_estado.estado.nombre if ultimo_estado else None,
            'fechaEstado': ultimo_estado.fechaCambio.isoformat() if ultimo_estado else None
        })
    return jsonify(resultado)

@bp.route('/ordenes/<int:nroDeOrden>', methods=['PUT'])
def modificar_orden(nroDeOrden):
    data = request.json
    orden = modificar_orden_de_reparacion(
        nroDeOrden=nroDeOrden,
        **data
    )
    if orden:
        return jsonify({'success': True})
    return jsonify({'error': 'Orden no encontrada'}), 404

@bp.route('/estados', methods=['GET'])
def listar_estados():
    estados = mostrar_estados()
    return jsonify([
        {
            'idEstado': e.idEstado,
            'nombre': e.nombre
        } for e in estados
    ])

@bp.route('/ordenes/<int:nroDeOrden>/estado', methods=['POST'])
def cambiar_estado_orden(nroDeOrden):
    data = request.json
    if 'idEstado' not in data:
        return jsonify({'error': 'Se requiere idEstado'}), 400
        
    historial = asignar_estado_orden(
        nroDeOrden=nroDeOrden,
        idEstado=data['idEstado'],
        fechaCambio=datetime.now(),
        observaciones=data.get('observaciones')
    )
    return jsonify({'success': True})

@bp.route('/ordenes/<int:nroDeOrden>/confirmacion-presupuesto', methods=['POST'])
def confirmar_presupuesto(nroDeOrden):
    data = request.json
    if 'aceptado' not in data:
        return jsonify({'error': 'Campo "aceptado" requerido'}), 400
    aceptado = bool(data['aceptado'])
    usuario = data.get('usuario', 'SinUsuario')
    fecha = datetime.now()

    estados = {e.nombre: e.idEstado for e in mostrar_estados()}
    if aceptado:
        nuevo_estado = estados.get('EnReparacion')
    else:
        nuevo_estado = estados.get('Desestimada')
    if not nuevo_estado:
        return jsonify({'error': 'Estados no configurados correctamente'}), 500

    historial = asignar_estado_orden(
        nroDeOrden=nroDeOrden,
        idEstado=nuevo_estado,
        fechaCambio=fecha,
        observaciones=f"Presupuesto {'aceptado' if aceptado else 'rechazado'} por {usuario} en {fecha.strftime('%Y-%m-%d %H:%M')}"
    )

    return jsonify({'success': True, 'nuevoEstado': 'EnReparacion' if aceptado else 'Desestimada'})

@bp.route('/ordenes/<int:nroDeOrden>/actualizaciones', methods=['POST'])
def registrar_actualizacion_orden(nroDeOrden):
    """
    Registra un avance técnico en la orden.
    Request JSON: { "descripcion": "...", "usuario": "nombre" }
    """
    from BDD.database import OrdenDeReparacion
    
    data = request.json
    descripcion = data.get('descripcion')
    usuario = data.get('usuario', 'SinUsuario')
    fechaArreglo = datetime.now()

    if not descripcion:
        return jsonify({'error': 'Campo descripción requerido'}), 400

    # Corregir pasando la clase en lugar del string
    orden = buscar_por_id(OrdenDeReparacion, nroDeOrden)
    if not orden:
        return jsonify({'error': 'Orden no encontrada'}), 404

    historial = alta_historial_arreglos(
        nroDeOrden=nroDeOrden,
        idDispositivo=orden.idDispositivo,
        fechaArreglo=fechaArreglo,
        descripcion=f"{descripcion}\n(Registrado por {usuario} en {fechaArreglo.strftime('%Y-%m-%d %H:%M')})"
    )

    return jsonify({'success': True})

@bp.route('/ordenes/<int:nroDeOrden>/actualizaciones', methods=['GET'])
def listar_actualizaciones_orden(nroDeOrden):
    """
    Devuelve el historial de actualizaciones técnicas de una orden.
    """
    historial = mostrar_historial_arreglos(nroDeOrden)
    result = []
    for h in historial:
        result.append({
            'idHistorialor': h.idHistorialor,
            'fechaArreglo': h.fechaArreglo.isoformat(),
            'descripcion': h.descripcion,
        })
    return jsonify(result)