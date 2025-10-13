from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_detalle_orden, modificar_detalle_orden, mostrar_detalles_orden, 
    baja_detalle_orden
)

bp = Blueprint('detalles', __name__)

@bp.route('/ordenes/<int:nroDeOrden>/detalles', methods=['POST'])
def crear_detalle(nroDeOrden):
    data = request.json
    
    # Validamos datos obligatorios
    if not all(k in data for k in ['idServicio', 'repuesto_proveedor_id']):
        return jsonify({'error': 'Faltan campos requeridos (idServicio, repuesto_proveedor_id)'}), 400
    
    detalle = alta_detalle_orden(
        nroDeOrden=nroDeOrden,
        idServicio=data['idServicio'],
        repuesto_proveedor_id=data['repuesto_proveedor_id'],
        costoServicio=data.get('costoServicio'),
        costoRepuesto=data.get('costoRepuesto'),
        subtotal=data.get('subtotal')
    )
    return jsonify({
        'idDetalle': detalle.idDetalle,
        'nroDeOrden': detalle.nroDeOrden,
        'idServicio': detalle.idServicio,
        'repuesto_proveedor_id': detalle.repuesto_proveedor_id,
        'costoServicio': detalle.costoServicio,
        'costoRepuesto': detalle.costoRepuesto,
        'subtotal': detalle.subtotal
    }), 201

@bp.route('/ordenes/<int:nroDeOrden>/detalles', methods=['GET'])
def listar_detalles_orden(nroDeOrden):
    detalles = mostrar_detalles_orden(nroDeOrden)
    resultado = []
    for d in detalles:
        resultado.append({
            'idDetalle': d.idDetalle,
            'nroDeOrden': d.nroDeOrden,
            'idServicio': d.idServicio,
            'repuesto_proveedor_id': d.repuesto_proveedor_id,
            'costoServicio': d.costoServicio,
            'costoRepuesto': d.costoRepuesto,
            'subtotal': d.subtotal
        })
    return jsonify(resultado)

@bp.route('/detalles/<int:idDetalle>', methods=['PUT'])
def modificar_detalle(idDetalle):
    data = request.json
    detalle = modificar_detalle_orden(
        idDetalle=idDetalle,
        **data
    )
    if detalle:
        return jsonify({'success': True})
    return jsonify({'error': 'Detalle no encontrado'}), 404

@bp.route('/detalles/<int:idDetalle>', methods=['DELETE'])
def eliminar_detalle(idDetalle):
    detalle = baja_detalle_orden(idDetalle)
    if detalle:
        return jsonify({'success': True})
    return jsonify({'error': 'Detalle no encontrado'}), 404
