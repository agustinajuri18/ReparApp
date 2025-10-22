from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ABMC_db import (
    alta_servicio, modificar_servicio, mostrar_servicios, baja_servicio,
    alta_servicioxrepuesto, modificar_servicioxrepuesto, baja_servicioxrepuesto,
    mostrar_servicioxrepuesto, mostrar_repuestos_por_servicio
)

bp = Blueprint('servicios', __name__)

@bp.route('/servicios/', methods=['POST', 'OPTIONS'])
def registrar_servicio():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.json
    
    # Validamos datos obligatorios
    if 'descripcion' not in data:
        return jsonify({'error': 'Falta información obligatoria (descripcion)'}), 400
    
    servicio = alta_servicio(
        descripcion=data['descripcion'],
        precioBase=data.get('precioBase'),
        activo=data.get('activo', 1)
    )
    return jsonify({
        'idServicio': servicio.idServicio,
        'descripcion': servicio.descripcion,
        'precioBase': servicio.precioBase,
        'activo': servicio.activo
    }), 201

@bp.route('/servicios', methods=['GET'])
def listar_servicios():
    activos = request.args.get('activos', 'true').lower() == 'true'
    servicios = mostrar_servicios(activos_only=activos)
    return jsonify([
        {
            'idServicio': s.idServicio,
            'descripcion': s.descripcion,
            'precioBase': s.precioBase,
            'activo': s.activo
        } for s in servicios
    ])

@bp.route('/servicios/<int:idServicio>', methods=['PUT'])
def modificar_datos_servicio(idServicio):
    data = request.json
    servicio = modificar_servicio(
        idServicio=idServicio,
        descripcion=data.get('descripcion'),
        precioBase=data.get('precioBase'),
        activo=data.get('activo')
    )
    if servicio:
        return jsonify({'success': True})
    return jsonify({'error': 'Servicio no encontrado'}), 404

@bp.route('/servicios/<int:idServicio>', methods=['DELETE'])
def baja_logica_servicio(idServicio):
    servicio = baja_servicio(idServicio)
    if servicio:
        return jsonify({'success': True})
    return jsonify({'error': 'Servicio no encontrado'}), 404

@bp.route('/servicios/<int:idServicio>/reactivar', methods=['PUT'])
def reactivar_servicio(idServicio):
    from ABMC_db import reactivar_servicio
    servicio = reactivar_servicio(idServicio)
    if servicio:
        return jsonify({'success': True})
    return jsonify({'error': 'Servicio no encontrado'}), 404

@bp.route('/servicios-repuestos/', methods=['POST', 'OPTIONS'])
def agregar_servicioxrepuesto():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    # cantidad no se utiliza: asociamos repuesto al servicio sin stock local
    alta_servicioxrepuesto(int(data['idServicio']), int(data['idRepuesto']))
    return jsonify({'success': True})

@bp.route('/servicios-repuestos/', methods=['GET'])
def listar_servicioxrepuesto():
    relaciones = mostrar_servicioxrepuesto()
    return jsonify([
        {
            'id': r.id,
            'idServicio': r.idServicio,
            'idRepuesto': r.idRepuesto,
            # cantidad removed
        } for r in relaciones
    ])


@bp.route('/servicios-repuestos/<int:id>/', methods=['PUT'])
def actualizar_servicioxrepuesto(id):
    data = request.json
    relacion = modificar_servicioxrepuesto(
        id=id,
        # cantidad ignored
    )
    if relacion:
        return jsonify({'success': True})
    return jsonify({'error': 'Relación no encontrada'}), 404

@bp.route('/servicios-repuestos/<int:id>/', methods=['DELETE'])
def eliminar_relacion_servicioxrepuesto(id):
    relacion = baja_servicioxrepuesto(id)
    if relacion:
        return jsonify({'success': True})
    return jsonify({'error': 'Relación no encontrada'}), 404

@bp.route('/servicios-repuestos', methods=['DELETE', 'OPTIONS'])
def eliminar_servicioxrepuesto():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    baja_servicioxrepuesto(int(data['idServicio']), int(data['idRepuesto']))
    return jsonify({'success': True})

@bp.route('/servicios/<int:idServicio>/repuestos', methods=['GET'])
@cross_origin()
def repuestos_por_servicio(idServicio):
    # Importar función desde ABMC_db
    from ABMC_db import mostrar_repuestos_por_servicio, mostrar_repuestoxproveedor, mostrar_proveedores
    
    # Obtener repuestos por servicio
    repuestos = mostrar_repuestos_por_servicio(idServicio) or []
    
    # Obtener información de proveedores para cada repuesto
    relaciones = mostrar_repuestoxproveedor() or []
    proveedores = mostrar_proveedores() or []
    
    resultado = []
    for r in repuestos:
        provs = []
        for rel in relaciones:
            try:
                rel_id_repuesto = getattr(rel, 'idRepuesto', None)
                rel_id_proveedor = getattr(rel, 'idProveedor', None)
                if rel_id_repuesto == r.get('idRepuesto') or str(rel_id_repuesto) == str(r.get('idRepuesto')):
                    prov_obj = next((p for p in proveedores if getattr(p, 'idProveedor', None) == rel_id_proveedor), None)
                    if prov_obj:
                        provs.append({
                            'idProveedor': getattr(prov_obj, 'idProveedor', None),
                            'cuilProveedor': getattr(prov_obj, 'cuil', None) or getattr(prov_obj, 'cuilProveedor', None),
                            'razonSocial': getattr(prov_obj, 'razonSocial', None),
                            'costo': getattr(rel, 'costo', None)
                        })
            except Exception as e:
                print(f"Error al procesar relación repuesto-proveedor: {e}")
                continue
        resultado.append({
            'idRepuesto': r.get('idRepuesto'),
            'marca': r.get('marca'),
            'modelo': r.get('modelo'),
            'descripcion': f"{r.get('marca','')} {r.get('modelo','')}".strip(),
            'proveedores': provs
        })
    return jsonify(resultado)

@bp.route('/servicios/<int:idServicio>', methods=['GET'])
def obtener_servicio(idServicio):
    servicios = mostrar_servicios()
    servicio = next((s for s in servicios if s.idServicio == idServicio), None)
    if not servicio:
        return jsonify({'error': 'Servicio no encontrado'}), 404
    return jsonify({
        'idServicio': servicio.idServicio,
        'descripcion': servicio.descripcion,
        'precioBase': servicio.precioBase,
        'activo': servicio.activo
    })

