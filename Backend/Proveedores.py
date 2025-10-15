from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_proveedor, modificar_proveedor, mostrar_proveedores, baja_proveedor,
    buscar_proveedor_por_cuil, reactivar_proveedor
)

bp = Blueprint('proveedores', __name__)

@bp.route('/proveedores', methods=['POST'])
def registrar_proveedor():
    data = request.json
    
    # Validamos datos obligatorios
    if 'cuil' not in data:
        return jsonify({'error': 'Falta información obligatoria (cuil)'}), 400
    
    # Verificar si ya existe
    proveedor_existente = buscar_proveedor_por_cuil(data['cuil'])
    if proveedor_existente:
        return jsonify({'error': 'Ya existe un proveedor con ese CUIL'}), 409
        
    proveedor = alta_proveedor(
        cuil=data['cuil'],
        razonSocial=data.get('razonSocial'),
        telefono=data.get('telefono')
    )
    return jsonify({
        'idProveedor': proveedor.idProveedor,
        'cuil': proveedor.cuil,
        'razonSocial': proveedor.razonSocial,
        'telefono': proveedor.telefono
    }), 201

@bp.route('/proveedores', methods=['GET'])
def listar_proveedores():
    activos = request.args.get('activos', 'true')
    search = request.args.get('search', None)
    if activos == 'true':
        proveedores = mostrar_proveedores(activos_only=True, search=search)
    else:
        proveedores = mostrar_proveedores(activos_only=False, search=search)
    return jsonify([
        {
            'idProveedor': p.idProveedor,
            'cuil': p.cuil,
            'razonSocial': p.razonSocial,
            'telefono': p.telefono,
            'activo': p.activo
        } for p in proveedores
    ])

@bp.route('/proveedores/<string:cuil>', methods=['PUT'])
def modificar_datos_proveedor(cuil):
    data = request.get_json()
    # Find the proveedor by cuil
    proveedor = buscar_proveedor_por_cuil(cuil)
    if not proveedor:
        return jsonify({'error': 'Proveedor no encontrado'}), 404
    # Modify using idProveedor
    proveedor_modificado = modificar_proveedor(
        idProveedor=proveedor.idProveedor,
        razonSocial=data.get('razonSocial'),
        telefono=data.get('telefono'),
        activo=data.get('activo'),
        cuil=data.get('cuil')  # Allow updating cuil
    )
    if proveedor_modificado:
        return jsonify({'success': True})
    return jsonify({'error': 'Error al modificar proveedor'}), 500

@bp.route('/proveedores/<string:cuil>', methods=['DELETE'])
def eliminar_proveedor(cuil):
    proveedor = buscar_proveedor_por_cuil(cuil)
    if not proveedor:
        return jsonify({'error': 'Proveedor no encontrado'}), 404
    baja_proveedor(proveedor.idProveedor)
    return jsonify({'success': True})

@bp.route('/proveedores/<string:cuil>/reactivar', methods=['PUT'])
def reactivar_proveedor_endpoint(cuil):
    proveedor = buscar_proveedor_por_cuil(cuil)
    if not proveedor:
        return jsonify({'error': 'Proveedor no encontrado'}), 404
    reactivar_proveedor(proveedor.idProveedor)
    return jsonify({'success': True})