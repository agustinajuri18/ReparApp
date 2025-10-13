from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_repuesto, modificar_repuesto, mostrar_repuestos, baja_repuesto,
    alta_repuestoxproveedor, baja_repuestoxproveedor, mostrar_repuestoxproveedor
)

bp = Blueprint('repuestos', __name__)

@bp.route('/repuestos', methods=['POST'])
def registrar_repuesto():
    data = request.json
    
    repuesto = alta_repuesto(
        marca=data.get('marca'),
        modelo=data.get('modelo')
    )
    return jsonify({
        'idRepuesto': repuesto.idRepuesto,
        'marca': repuesto.marca,
        'modelo': repuesto.modelo
    }), 201

@bp.route('/repuestos', methods=['GET'])
def listar_repuestos():
    activos = request.args.get('activos', 'false')
    if activos == 'true':
        repuestos = mostrar_repuestos(activos_only=True)
    else:
        repuestos = mostrar_repuestos(activos_only=False)
    return jsonify([
        {
            'idRepuesto': r.idRepuesto,
            'marca': r.marca,
            'modelo': r.modelo,
            'activo': r.activo
        } for r in repuestos
    ])

@bp.route('/repuestos/<int:idRepuesto>', methods=['PUT'])
def modificar_datos_repuesto(idRepuesto):
    data = request.json
    repuesto = modificar_repuesto(
        idRepuesto=idRepuesto,
        **data
    )
    if repuesto:
        return jsonify({'success': True})
    return jsonify({'error': 'Repuesto no encontrado'}), 404

@bp.route('/repuestos/<int:idRepuesto>', methods=['DELETE'])
def baja_logica_repuesto(idRepuesto):
    repuesto = baja_repuesto(idRepuesto)
    if repuesto:
        return jsonify({'success': True})
    return jsonify({'error': 'Repuesto no encontrado'}), 404

@bp.route('/repuestos-proveedores', methods=['POST'])
def agregar_repuestoxproveedor():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    id_repuesto = data.get('idRepuesto')
    id_proveedor = data.get('idProveedor')
    costo = data.get('costo')
    cantidad = data.get('cantidad')

    if id_repuesto is None or id_proveedor is None or costo is None or cantidad is None:
        return jsonify({"error": "Faltan datos requeridos (idRepuesto, idProveedor, costo, cantidad)"}), 400

    try:
        # La función alta_repuestoxproveedor se encarga de la lógica de la base de datos
        resultado = alta_repuestoxproveedor(
            idRepuesto=int(id_repuesto),
            idProveedor=int(id_proveedor),
            costo=float(costo),
            cantidad=int(cantidad)
        )
        if "error" in resultado:
             return jsonify(resultado), 409 # 409 Conflict si ya existe
        return jsonify(resultado), 201 # 201 Created
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Error en el tipo de dato: {str(e)}"}), 400
    except Exception as e:
        # Captura cualquier otro error de la base de datos
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

@bp.route('/repuestos-proveedores', methods=['GET'])
def listar_repuestoxproveedor():
    try:
        relaciones = mostrar_repuestoxproveedor()
        return jsonify([{
            'idRepuesto': r.idRepuesto,
            'idProveedor': r.idProveedor,
            'costo': r.costo,
            'cantidad': r.cantidad
        } for r in relaciones])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/repuestos-proveedores', methods=['DELETE'])
def eliminar_repuestoxproveedor():
    data = request.get_json()
    try:
        baja_repuestoxproveedor(int(data['idRepuesto']), int(data['idProveedor']))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/repuestos/<int:idRepuesto>', methods=['GET'])
def obtener_repuesto(idRepuesto):
    # Find repuesto by idRepuesto
    repuestos = mostrar_repuestos(activos_only=False)
    repuesto = next((r for r in repuestos if r.idRepuesto == idRepuesto), None)
    if not repuesto:
        return jsonify({'error': 'Repuesto no encontrado'}), 404
    # Find proveedores for this repuesto
    relaciones = mostrar_repuestoxproveedor()
    proveedores_rel = [r for r in relaciones if r.idRepuesto == idRepuesto]
    proveedores_data = [{'cuilProveedor': r.idProveedor, 'costo': r.costo, 'cantidad': r.cantidad} for r in proveedores_rel]
    return jsonify({
        'idRepuesto': repuesto.idRepuesto,
        'marca': repuesto.marca,
        'modelo': repuesto.modelo,
        'activo': repuesto.activo,
        'proveedores': proveedores_data
    })