from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime, date
from ABMC_db import (
    alta_orden_de_reparacion, alta_orden_por_nroSerie, modificar_orden, # <--- CORRECCIÓN AQUÍ
    mostrar_ordenes, asignar_estado_orden, mostrar_estados,
    mostrar_repuestos_por_servicio, mostrar_repuestoxproveedor, mostrar_proveedores,
    alta_detalle_orden, modificar_detalle_orden, baja_detalle_orden,
    mostrar_historial_arreglos, alta_historial_arreglos, buscar_por_id
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
@cross_origin()
def listar_ordenes():
    # `mostrar_ordenes` (o la función central) ya devuelve una lista de dicts serializados.
    ordenes = mostrar_ordenes()
    return jsonify(ordenes)

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


@bp.route('/ordenes/<int:nroDeOrden>', methods=['GET'])
@cross_origin()
def obtener_orden_detalle(nroDeOrden):
    ordenes = mostrar_ordenes()  # mostrar_ordenes delega a obtener_ordenes
    # Try to get detail mode via helper directly if available
    try:
        from ABMC_db import obtener_ordenes
        detalle = obtener_ordenes(mode='detail', nroDeOrden=nroDeOrden)
        if not detalle:
            return jsonify({'error': 'Orden no encontrada'}), 404
        return jsonify(detalle[0]), 200
    except Exception:
        # Fallback: buscar en la lista genérica
        ord_list = [o for o in ordenes if o.get('nroDeOrden') == nroDeOrden]
        if not ord_list:
            return jsonify({'error': 'Orden no encontrada'}), 404
        return jsonify(ord_list[0]), 200


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
