from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_repuesto, modificar_repuesto, mostrar_repuestos, baja_repuesto,
    buscar_repuesto,
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
    # Por defecto devolvemos repuestos activos
    activos = request.args.get('activos', 'true')
    search = request.args.get('search')
    if activos == 'true':
        repuestos = mostrar_repuestos(activos_only=True)
    else:
        repuestos = mostrar_repuestos(activos_only=False)
    # If search provided, mostrar_repuestos now supports it
    if search:
        # Call again with search to ensure filtering (preserves activos_only)
        repuestos = mostrar_repuestos(activos_only=(activos == 'true'), search=search)
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

@bp.route('/repuestos/<int:idRepuesto>/reactivar', methods=['PUT'])
def reactivar_repuesto(idRepuesto):
    from ABMC_db import reactivar_repuesto
    repuesto = reactivar_repuesto(idRepuesto)
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
        # Devolver información suficiente para que el frontend pueda resolver
        # la relación repuesto-proveedor (incluyendo el id de la relación y el CUIL)
        resultado = []
        for r in relaciones:
            proveedor_cuil = None
            codigo_repuesto = None
            try:
                proveedor_cuil = getattr(r.proveedor, 'cuil', None)
            except Exception:
                proveedor_cuil = None
            try:
                codigo_repuesto = getattr(r.repuesto, 'idRepuesto', None)
            except Exception:
                codigo_repuesto = None
            resultado.append({
                'id': getattr(r, 'id', None),
                'idRepuesto': getattr(r, 'idRepuesto', None),
                'codigoRepuesto': codigo_repuesto,
                'idProveedor': getattr(r, 'idProveedor', None),
                'cuilProveedor': proveedor_cuil,
                'razonSocial': getattr(getattr(r, 'proveedor', None), 'razonSocial', None),
                'cuil': proveedor_cuil,  # alias por compatibilidad
                'costo': getattr(r, 'costo', None),
                'cantidad': getattr(r, 'cantidad', None)
            })
        return jsonify(resultado)
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
    # Buscar repuesto directamente por id (independiente de activo)
    repuesto = buscar_repuesto(idRepuesto)
    if not repuesto:
        return jsonify({'error': 'Repuesto no encontrado'}), 404
    # Find proveedores for this repuesto
    relaciones = mostrar_repuestoxproveedor()
    proveedores_rel = [r for r in relaciones if r.idRepuesto == idRepuesto]
    proveedores_data = []
    for r in proveedores_rel:
        proveedores_data.append({
            'id': getattr(r, 'id', None),
            'idProveedor': getattr(r, 'idProveedor', None),
            'cuilProveedor': getattr(getattr(r, 'proveedor', None), 'cuil', None),
            'razonSocial': getattr(getattr(r, 'proveedor', None), 'razonSocial', None),
            'costo': getattr(r, 'costo', None),
            'cantidad': getattr(r, 'cantidad', None)
        })
    return jsonify({
        'idRepuesto': repuesto.idRepuesto,
        'marca': repuesto.marca,
        'modelo': repuesto.modelo,
        'activo': repuesto.activo,
        'proveedores': proveedores_data
    })