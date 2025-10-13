from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime, date
from ABMC_db import (
    alta_orden_de_reparacion, alta_orden_por_nroSerie, modificar_orden, # <--- CORRECCIÓN AQUÍ
    mostrar_ordenes_de_reparacion, asignar_estado_orden, mostrar_estados,
    mostrar_repuestos_por_servicio, mostrar_repuestoxproveedor, mostrar_proveedores,
    alta_detalle_orden, modificar_detalle_orden, baja_detalle_orden
)

bp = Blueprint('ordenes', __name__)

@bp.route('/ordenes', methods=['POST'])
@cross_origin()
def registrar_orden():
    data = request.json or {}

    if 'idDispositivo' not in data:
        return jsonify({'error': 'Se requiere idDispositivo'}), 400

    orden = alta_orden_de_reparacion(
        idDispositivo=data['idDispositivo'],
        fecha=datetime.now().date(),
        descripcionDanos=data.get('descripcionDanos'),
        diagnostico=data.get('diagnostico'),
        presupuesto=data.get('presupuesto'),
        idEmpleado=data.get('idEmpleado')
    )

    if not orden:
        return jsonify({'error': 'No se pudo crear la orden'}), 400

    # Asignar estado inicial si se proporciona
    if 'idEstado' in data:
        asignar_estado_orden(
            nroDeOrden=orden.nroDeOrden,
            idEstado=data['idEstado'],
            fechaCambio=datetime.now(),
            observaciones=data.get('observaciones')
        )

    return jsonify({
        'nroDeOrden': orden.nroDeOrden,
        'idDispositivo': orden.idDispositivo,
        'fecha': orden.fecha.isoformat() if orden.fecha else None,
        'descripcionDanos': orden.descripcionDanos,
        'diagnostico': orden.diagnostico,
        'presupuesto': orden.presupuesto,
        'idEmpleado': orden.idEmpleado
    }), 201
    

@bp.route('/ordenes', methods=['GET'])
@cross_origin()
def listar_ordenes():
    ordenes = mostrar_ordenes_de_reparacion()
    resultado = []
    for o in ordenes:
        # Obtenemos el último estado de la orden
        ultimo_estado = None
        if getattr(o, 'historial_estados', None):
            ultimo_estado = sorted(o.historial_estados, key=lambda h: h.fechaCambio, reverse=True)[0]

        resultado.append({
            'nroDeOrden': o.nroDeOrden,
            'idDispositivo': o.idDispositivo,
            'fecha': o.fecha.isoformat() if o.fecha else None,
            'descripcionDanos': o.descripcionDanos,
            'diagnostico': o.diagnostico,
            'presupuesto': o.presupuesto,
            'idEmpleado': o.idEmpleado,
            'estado': getattr(ultimo_estado, 'estado', None).nombre if ultimo_estado and getattr(ultimo_estado, 'estado', None) else None,
            'fechaEstado': ultimo_estado.fechaCambio.isoformat() if ultimo_estado and getattr(ultimo_estado, 'fechaCambio', None) else None
        })
    return jsonify(resultado)

@bp.route('/ordenes/<int:nroDeOrden>', methods=['PUT'])
@cross_origin()
def modificar_orden_existente(nroDeOrden):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    # Extraer los detalles del payload
    detalles_data = data.get('detalles')
    print(f"Datos recibidos para modificar orden {nroDeOrden}: {data}") # Log para depurar
    print(f"Detalles recibidos: {detalles_data}") # Log para depurar

    resultado = modificar_orden( # <--- CORRECCIÓN AQUÍ
        nroDeOrden=nroDeOrden,
        idDispositivo=data.get('idDispositivo'),
        fecha=datetime.strptime(data.get('fecha'), '%Y-%m-%d').date() if data.get('fecha') else None,
        descripcionDanos=data.get('descripcionDanos'),
        diagnostico=data.get('diagnostico'),
        presupuesto=data.get('presupuesto'),
        idEmpleado=data.get('idEmpleado'),
        detalles=detalles_data  # <-- Pasar la lista de detalles
    )

    if "error" in resultado:
        return jsonify(resultado), 500
    return jsonify(resultado), 200


# Nuevo endpoint: repuestos + proveedores por servicio
@bp.route('/ordenes/servicios/<idServicio>/repuestos', methods=['GET'])
@cross_origin()
def api_repuestos_por_servicio(idServicio):
    try:
        idServicio = int(idServicio)
    except ValueError:
        return jsonify({'error': 'idServicio debe ser un entero'}), 400

    repuestos = mostrar_repuestos_por_servicio(idServicio) or []
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
            except Exception:
                continue
        resultado.append({
            'idRepuesto': r.get('idRepuesto'),
            'marca': r.get('marca'),
            'modelo': r.get('modelo'),
            'descripcion': f"{r.get('marca','')} {r.get('modelo','')}".strip(),
            'proveedores': provs
        })
    return jsonify(resultado)
