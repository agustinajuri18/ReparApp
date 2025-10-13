from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ABMC_db import (
    alta_detalle_orden, modificar_detalle_orden, mostrar_detalles_orden,  # Corregido aquí
    baja_detalle_orden
)

# Crear el blueprint con un nombre único
bp = Blueprint('detalles', __name__)

@bp.route('/ordenes/<int:nroDeOrden>/detalles', methods=['GET'])
@cross_origin()
def obtener_detalles(nroDeOrden):
    try:
        detalles = mostrar_detalles_orden(nroDeOrden) or []
        resultado = []
        
        for detalle in detalles:
            servicio = detalle.servicio
            servicioDescripcion = servicio.descripcion if servicio else ''
            
            repuesto_proveedor = detalle.repuesto_proveedor
            repuestoDescripcion = ''
            proveedorRazonSocial = ''
            codRepuestos = None
            cuitProveedor = None
            if repuesto_proveedor:
                repuesto = repuesto_proveedor.repuesto
                if repuesto:
                    repuestoDescripcion = f"{repuesto.marca or ''} {repuesto.modelo or ''}".strip()
                    codRepuestos = repuesto.idRepuesto
                proveedor = repuesto_proveedor.proveedor
                if proveedor:
                    proveedorRazonSocial = proveedor.razonSocial or ''
                    cuitProveedor = proveedor.cuil
            
            resultado.append({
                'idDetalle': detalle.idDetalle,
                'nroDeOrden': detalle.nroDeOrden,
                'idServicio': detalle.idServicio,
                'codigoServicio': detalle.idServicio,
                'servicioDescripcion': servicioDescripcion,
                'repuesto_proveedor_id': detalle.repuesto_proveedor_id,
                'repuestoDescripcion': repuestoDescripcion,
                'proveedorRazonSocial': proveedorRazonSocial,
                'codRepuestos': codRepuestos,
                'cuitProveedor': cuitProveedor,
                'costoServicio': float(detalle.costoServicio or 0),
                'costoRepuesto': float(detalle.costoRepuesto or 0),
                'subtotal': float(detalle.subtotal or 0)
            })
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"Error obteniendo detalles: {e}")
        return jsonify([])

@bp.route('/detalles/<int:idDetalle>', methods=['PUT'])
@cross_origin()
def modificar_detalle(idDetalle):
    data = request.json
    try:
        modificar_detalle_orden(
            idDetalle=idDetalle,
            idServicio=data.get('idServicio'),
            repuesto_proveedor_id=data.get('repuesto_proveedor_id'),
            costoServicio=data.get('costoServicio'),
            costoRepuesto=data.get('costoRepuesto'),
            subtotal=data.get('subtotal')
        )
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error modificando detalle: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/detalles/<int:idDetalleOrden>', methods=['DELETE'])
@cross_origin()
def eliminar_detalle(idDetalleOrden):
    try:
        exito = baja_detalle_orden(idDetalleOrden)
        if exito:
            return jsonify({'success': True})
        return jsonify({'error': 'Detalle no encontrado o no pudo eliminarse'}), 404
    except Exception as e:
        print(f"Error eliminando detalle: {e}")
        return jsonify({'error': str(e)}), 500
