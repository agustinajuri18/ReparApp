import os
import sys
from sqlalchemy import text

# agregar la raíz del proyecto al path para poder importar el paquete BDD (carpeta hermana)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Importa solo los modelos y clases que existen en el nuevo modelo
from BDD.database import (
    SessionLocal, Usuario, Cliente, Dispositivo, Empleado, Estado,
    HistorialArreglos, OrdenDeReparacion, Servicio, Repuesto,
    HistorialEstadoOrden, Proveedor, Permiso, CargoxPermiso, RepuestoxProveedor, Sesion, Cargo, DetalleOrden
)

# ----------- ABMC para Usuario -----------
def alta_usuario(idUsuario, nombreUsuario, contraseña, activo=1):
    session = SessionLocal()
    usuario = Usuario(idUsuario=idUsuario, nombreUsuario=nombreUsuario, contraseña=contraseña, activo=activo)
    session.add(usuario)
    session.commit()
    session.close()

def baja_usuario(idUsuario):
    session = SessionLocal()
    usuario = session.query(Usuario).get(idUsuario)
    if usuario:
        usuario.activo = 0
        session.commit()
    session.close()

def modificar_usuario(idUsuario, nueva_contraseña=None, nuevo_activo=None, nuevo_nombreUsuario=None):
    session = SessionLocal()
    usuario = session.query(Usuario).get(idUsuario)
    if usuario:
        if nueva_contraseña is not None and nueva_contraseña != "":
            usuario.contraseña = nueva_contraseña
        if nuevo_activo is not None:
            usuario.activo = nuevo_activo
        if nuevo_nombreUsuario is not None and nuevo_nombreUsuario != "":
            usuario.nombreUsuario = nuevo_nombreUsuario
        session.commit()
    session.close()

def mostrar_usuarios():
    session = SessionLocal()
    usuarios = session.query(Usuario).all()
    session.close()
    return usuarios

# ----------- ABMC para Cliente -----------
def alta_cliente(tipoDocumento, numeroDoc, nombre, apellido, telefono, mail):
    session = SessionLocal()
    cliente = Cliente(
        tipoDocumento=tipoDocumento,
        numeroDoc=numeroDoc,
        nombre=nombre,
        apellido=apellido,
        telefono=telefono,
        mail=mail,
        activo=1
    )
    session.add(cliente)
    session.commit()
    session.close()

def modificar_cliente(tipoDocumento, numeroDoc, nombre, apellido, telefono, mail, activo=1):
    session = SessionLocal()
    cliente = session.query(Cliente).get((tipoDocumento, numeroDoc))
    if cliente:
        cliente.nombre = nombre
        cliente.apellido = apellido
        cliente.telefono = telefono
        cliente.mail = mail
        cliente.activo = activo
        session.commit()
    session.close()

def mostrar_clientes(activos_only=True):
    session = SessionLocal()
    if activos_only:
        clientes = session.query(Cliente).filter_by(activo=1).all()
    else:
        clientes = session.query(Cliente).all()
    session.close()
    return clientes

def baja_cliente(tipoDocumento, numeroDoc):
    session = SessionLocal()
    cliente = session.query(Cliente).get((tipoDocumento, numeroDoc))
    if cliente:
        cliente.activo = 0
        session.commit()
    session.close()

# ----------- ABMC para Dispositivo -----------
def alta_dispositivo(nroSerie, marca, modelo, clienteTipoDocumento, clienteNumeroDoc, activo=1):
    session = SessionLocal()
    dispositivo = Dispositivo(
        nroSerie=nroSerie,
        marca=marca,
        modelo=modelo,
        clienteTipoDocumento=clienteTipoDocumento,
        clienteNumeroDoc=clienteNumeroDoc,
        activo=activo
    )
    session.add(dispositivo)
    session.commit()
    session.close()

def modificar_dispositivo(nroSerie, marca, modelo, clienteTipoDocumento, clienteNumeroDoc, activo=1):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).get(nroSerie)
    if dispositivo:
        dispositivo.marca = marca
        dispositivo.modelo = modelo
        dispositivo.clienteTipoDocumento = clienteTipoDocumento
        dispositivo.clienteNumeroDoc = clienteNumeroDoc
        dispositivo.activo = activo
        session.commit()
    session.close()

def baja_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).get(nroSerie)
    if dispositivo:
        dispositivo.activo = 0
        session.commit()
    session.close()

def mostrar_dispositivos(activos_only=True):
    session = SessionLocal()
    if activos_only:
        dispositivos = session.query(Dispositivo).filter_by(activo=1).all()
    else:
        dispositivos = session.query(Dispositivo).all()
    session.close()
    return dispositivos

def dispositivos_por_cliente(clienteTipoDocumento, clienteNumeroDoc):
    """
    Devuelve todos los dispositivos asociados a un cliente según el modelo.
    """
    session = SessionLocal()
    dispositivos = session.query(Dispositivo).filter_by(
        clienteTipoDocumento=clienteTipoDocumento,
        clienteNumeroDoc=clienteNumeroDoc
    ).all()
    session.close()
    return dispositivos

# ----------- ABMC para Proveedor -----------
def alta_proveedor(cuil, razonSocial, telefono, activo=1):
    session = SessionLocal()
    proveedor = Proveedor(
        cuil=cuil,
        razonSocial=razonSocial,
        telefono=telefono,
        activo=activo
    )
    session.add(proveedor)
    session.commit()
    session.close()

def modificar_proveedor(cuil, razonSocial, telefono, activo=1):
    session = SessionLocal()
    proveedor = session.query(Proveedor).get(cuil)
    if proveedor:
        proveedor.razonSocial = razonSocial
        proveedor.telefono = telefono
        proveedor.activo = activo
        session.commit()
    session.close()

def baja_proveedor(cuil):
    session = SessionLocal()
    proveedor = session.query(Proveedor).get(cuil)
    if proveedor:
        proveedor.activo = 0
        session.commit()
    session.close()

def mostrar_proveedores():
    session = SessionLocal()
    proveedores = session.query(Proveedor).all()
    session.close()
    return proveedores

def buscar_proveedor(cuil):
    session = SessionLocal()
    proveedor = session.query(Proveedor).get(cuil)
    session.close()
    return proveedor

# ----------- ABMC para Empleado -----------
def alta_empleado(nombre, apellido, idCargo, idUsuario):
    session = SessionLocal()
    empleado = Empleado(
        nombre=nombre,
        apellido=apellido,
        idCargo=idCargo,
        idUsuario=idUsuario,
        activo=1
    )
    session.add(empleado)
    session.commit()
    session.close()

def modificar_empleado(idEmpleado, nombre, apellido, idCargo, idUsuario, activo=1):
    session = SessionLocal()
    empleado = session.query(Empleado).get(idEmpleado)
    if empleado:
        empleado.nombre = nombre
        empleado.apellido = apellido
        empleado.idCargo = idCargo
        empleado.idUsuario = idUsuario
        empleado.activo = activo
        session.commit()
    session.close()

def baja_empleado(idEmpleado):
    session = SessionLocal()
    empleado = session.query(Empleado).get(idEmpleado)
    if empleado:
        empleado.activo = 0
        session.commit()
    session.close()

def mostrar_empleados():
    session = SessionLocal()
    empleados = session.query(Empleado).all()
    session.close()
    return empleados

def buscar_empleado(idEmpleado):
    session = SessionLocal()
    empleado = session.query(Empleado).get(idEmpleado)
    session.close()
    return empleado

# ----------- ABMC para Estado -----------
def mostrar_estados():
    session = SessionLocal()
    estados = session.query(Estado).all()
    session.close()
    return estados

# ----------- ABMC para HistorialArreglos -----------
def mostrar_historial_arreglos(nroSerieDispositivo):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).filter_by(nroSerieDispositivo=nroSerieDispositivo).all()
    session.close()
    return historial

def alta_historial_arreglos(nroSerieDispositivo, nroDeOrden, fechaArreglo, descripcion):
    session = SessionLocal()
    historial = HistorialArreglos(
        nroSerieDispositivo=nroSerieDispositivo,
        nroDeOrden=nroDeOrden,
        fechaArreglo=fechaArreglo,
        descripcion=descripcion
    )
    session.add(historial)
    session.commit()
    session.close()

def modificar_historial_arreglos(idHistorial, nuevo_nroSerieDispositivo, nuevo_nroDeOrden, nueva_fechaArreglo, nueva_descripcion):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).get(idHistorial)
    if historial:
        historial.nroSerieDispositivo = nuevo_nroSerieDispositivo
        historial.nroDeOrden = nuevo_nroDeOrden
        historial.fechaArreglo = nueva_fechaArreglo
        historial.descripcion = nueva_descripcion
        session.commit()
    session.close()

# ----------- ABMC para OrdenDeReparacion -----------

# #def alta_orden_de_reparacion(nroSerieDispositivo, fecha, descripcionDanos, diagnostico, presupuesto, idEmpleado):
#     # Nota: versión simple que crea solo la orden. Para crear con detalles,
#     # use alta_orden_de_reparacion_con_detalles (implementada abajo).
#    session = SessionLocal()
#     orden = OrdenDeReparacion(
#         nroSerieDispositivo=nroSerieDispositivo,
#         fecha=fecha,
#         descripcionDanos=descripcionDanos,
#        diagnostico=diagnostico,
#        presupuesto=presupuesto,
#        idEmpleado=idEmpleado
#     )
#     session.add(orden)
#     session.commit()
#     nro = orden.nroDeOrden
#     session.close()
#     return {"mensaje": "Orden creada", "nroDeOrden": nro}, 201

def modificar_orden_de_reparacion(nroDeOrden, nroSerieDispositivo, fecha, descripcionDanos, diagnostico, presupuesto, idEmpleado):
    session = SessionLocal()
    try:
        orden = session.query(OrdenDeReparacion).get(nroDeOrden)
        if not orden:
            session.close()
            return {"error": "Orden no encontrada"}, 404
        orden.nroSerieDispositivo = nroSerieDispositivo
        orden.fecha = fecha
        orden.descripcionDanos = descripcionDanos
        orden.diagnostico = diagnostico
        orden.presupuesto = presupuesto
        orden.idEmpleado = idEmpleado
        session.commit()
        return {"mensaje": "Orden modificada"}, 200
    except Exception as e:
        session.rollback()
        return {"error": "Error al modificar orden", "detail": str(e)}, 500
    finally:
        session.close()

def mostrar_ordenes_de_reparacion():
    # Retorna lista de dicts con información relacionada (dispositivo y empleado)
    session = SessionLocal()
    try:
        ordenes_con_datos = (
            session.query(OrdenDeReparacion, Dispositivo, Empleado)
            .outerjoin(Dispositivo, OrdenDeReparacion.nroSerieDispositivo == Dispositivo.nroSerie)
            .outerjoin(Empleado, OrdenDeReparacion.idEmpleado == Empleado.idEmpleado)
            .all()
        )
        result = []
        for o, d, e in ordenes_con_datos:
            dispositivo_info = f"{d.marca} {d.modelo}" if d else None
            empleado_info = f"{e.nombre} {e.apellido}" if e else None
            result.append({
                "nroDeOrden": o.nroDeOrden,
                "nroSerieDispositivo": o.nroSerieDispositivo,
                "dispositivo_info": dispositivo_info,
                "fecha": o.fecha.strftime("%Y-%m-%d") if o.fecha else None,
                "descripcionDanos": o.descripcionDanos,
                "diagnostico": o.diagnostico,
                "presupuesto": o.presupuesto,
                "idEmpleado": o.idEmpleado,
                "empleado_info": empleado_info,
            })
        return result
    finally:
        session.close()


def alta_orden_de_reparacion_con_detalles(nroSerieDispositivo, fecha, descripcionDanos, diagnostico, detalles, idEmpleado):
    """
    Crea una orden y sus detalles en una misma transacción.
    devuelve (dict, status)
    """
    session = SessionLocal()
    try:
        # Validación: no permitir crear una orden sin al menos un detalle
        if not detalles or (isinstance(detalles, list) and len(detalles) == 0):
            session.close()
            return {"error": "La orden debe contener al menos un detalle"}, 400

        # validar dispositivo y empleado
        dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerieDispositivo).first()
        empleado = session.query(Empleado).get(int(idEmpleado)) if idEmpleado is not None else None
        if not dispositivo:
            session.close()
            return {"error": "Dispositivo no encontrado"}, 400
        if not empleado:
            session.close()
            return {"error": "Empleado no encontrado"}, 400

        nueva_orden = OrdenDeReparacion(
            nroSerieDispositivo=nroSerieDispositivo,
            fecha=fecha,
            descripcionDanos=descripcionDanos,
            diagnostico=diagnostico,
            presupuesto=0.0,
            idEmpleado=int(idEmpleado)
        )
        session.add(nueva_orden)
        session.flush()

        # asignar ids a detalles y persistir
        max_det = session.query(DetalleOrden).order_by(DetalleOrden.idDetalle.desc()).first()
        next_id_base = (max_det.idDetalle + 1) if max_det and getattr(max_det, 'idDetalle', None) is not None else 1
        seen = set()
        presupuesto_calculado = 0.0
        for detalle_data in detalles or []:
            key = (
                str(detalle_data.get("codigoServicio")),
                str(detalle_data.get("codRepuestos")),
                str(detalle_data.get("cuitProveedor")),
                str(float(detalle_data.get("costoServicio", 0.0))),
                str(float(detalle_data.get("costoRepuesto", 0.0))),
                str(float(detalle_data.get("subtotal", 0.0)))
            )
            if key in seen:
                continue
            seen.add(key)

            id_detalle = next_id_base
            next_id_base += 1
            costo_serv = float(detalle_data.get("costoServicio", 0.0))
            costo_rep = float(detalle_data.get("costoRepuesto", 0.0))
            subtotal = float(detalle_data.get("subtotal", costo_serv + costo_rep))

            nuevo_detalle = DetalleOrden(
                idDetalle=id_detalle,
                nroDeOrden=nueva_orden.nroDeOrden,
                codigoServicio=detalle_data.get("codigoServicio"),
                codRepuestos=detalle_data.get("codRepuestos"),
                cuitProveedor=detalle_data.get("cuitProveedor"),
                costoServicio=costo_serv,
                costoRepuesto=costo_rep,
                subtotal=subtotal
            )
            session.add(nuevo_detalle)
            presupuesto_calculado += subtotal

        nueva_orden.presupuesto = presupuesto_calculado
        session.commit()
        return {"mensaje": "Orden y detalles creados exitosamente", "nroDeOrden": nueva_orden.nroDeOrden}, 201
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        return {"error": "Error al crear orden con detalles", "detail": str(e)}, 500
    finally:
        session.close()

def eliminar_orden_de_reparacion(nroDeOrden: int):
    """
    Elimina una orden de reparación y todos sus registros asociados:
    - HistorialEstadoOrden
    - HistorialArreglos
    - DetalleOrden
    - OrdenDeReparacion
    Todo dentro de una misma transacción.
    """
    session = SessionLocal()
    try:
        # Verificar si existe la orden
        existe = session.execute(
            text('SELECT 1 FROM "OrdenDeReparacion" WHERE nroDeOrden = :nro'),
            {"nro": nroDeOrden}
        ).fetchone()

        if not existe:
            session.close()
            return {"error": f"La orden {nroDeOrden} no existe."}, 404

        # Eliminar historial de estado
        #session.execute(
        #    text('DELETE FROM "HistorialEstadoOrden" WHERE nroDeOrden = :nro'),
        #    {"nro": nroDeOrden}
        #)

        # Eliminar historial de arreglos
        #session.execute(
        #    text('DELETE FROM "HistorialArreglos" WHERE nroDeOrden = :nro'),
        #    {"nro": nroDeOrden}
        #)

        # Eliminar detalles asociados
        session.execute(
            text('DELETE FROM "DetalleOrden" WHERE nroDeOrden = :nro'),
            {"nro": nroDeOrden}
        )

        # Eliminar la orden principal
        session.execute(
            text('DELETE FROM "OrdenDeReparacion" WHERE nroDeOrden = :nro'),
            {"nro": nroDeOrden}
        )

        session.commit()
        return {
            "mensaje": f"Orden {nroDeOrden} y sus registros asociados fueron eliminados correctamente."
        }, 200

    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        return {
            "error": "Error al eliminar la orden",
            "detalle": str(e),
            "tipo": type(e).__name__,
        }, 500
    finally:
        session.close()



# ----------- ABMC para HistorialEstadoOrden -----------
def asignar_estado_orden(nroDeOrden, codEstado, fechaCambio, observaciones=None):
    session = SessionLocal()
    historial_estado = HistorialEstadoOrden(
        nroDeOrden=nroDeOrden,
        codEstado=codEstado,
        fechaCambio=fechaCambio,
        observaciones=observaciones
    )
    session.add(historial_estado)
    session.commit()
    session.close()

def mostrar_por_estado(codEstado):
    session = SessionLocal()
    ordenes = session.query(OrdenDeReparacion).join(HistorialEstadoOrden, OrdenDeReparacion.nroDeOrden == HistorialEstadoOrden.nroDeOrden).filter(HistorialEstadoOrden.codEstado == codEstado).all()
    session.close()
    return ordenes

# ----------- ABMC para Servicio -----------
def alta_servicio(codigo, descripcion, precioBase, activo=1):
    session = SessionLocal()
    servicio = Servicio(
        codigo=codigo,
        descripcion=descripcion,
        precioBase=precioBase,
        activo=activo
    )
    session.add(servicio)
    session.commit()
    session.close()

def modificar_servicio(codigo, descripcion, precioBase, activo):
    session = SessionLocal()
    servicio = session.query(Servicio).get(codigo)
    if servicio:
        servicio.descripcion = descripcion
        servicio.precioBase = precioBase
        servicio.activo = activo
        session.commit()
    session.close()

def mostrar_servicios(activos_only=True):
    session = SessionLocal()
    query = session.query(Servicio)
    if activos_only:
        query = query.filter_by(activo=1)
    servicios = query.all()
    session.close()
    return servicios

def baja_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).get(codigo)
    if servicio:
        servicio.activo = 0
        session.commit()
    session.close()

# ----------- ABMC para RepuestoxProveedor -----------
def alta_repuestoxproveedor(codigoRepuesto, cuilProveedor, costo, cantidad):
    session = SessionLocal()
    repuestoxproveedor = RepuestoxProveedor(
        codigoRepuesto=codigoRepuesto,
        cuilProveedor=cuilProveedor,
        costo=costo,
        cantidad=cantidad
    )
    session.add(repuestoxproveedor)
    session.commit()
    session.close()

def baja_repuestoxproveedor(codigoRepuesto, cuilProveedor):
    session = SessionLocal()
    print("Eliminando:", codigoRepuesto, cuilProveedor)
    relacion = session.query(RepuestoxProveedor).filter_by(
        codigoRepuesto=codigoRepuesto,
        cuilProveedor=cuilProveedor
    ).first()
    print("Encontrado:", relacion)
    if relacion:
        session.delete(relacion)
        session.commit()
        print("Eliminado")
    session.close()

# ----------- ABMC para Repuesto -----------
def alta_repuesto(codigo, marca, modelo, activo=1):
    session = SessionLocal()
    repuesto = Repuesto(
        codigo=codigo,
        marca=marca,
        modelo=modelo,
        activo=activo
    )
    session.add(repuesto)
    session.commit()
    session.close()

def baja_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    if repuesto:
        repuesto.activo = 0
        session.commit()
    session.close()
    
def modificar_repuesto(codigo, marca, modelo, activo=1):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    if repuesto:
        repuesto.marca = marca
        repuesto.modelo = modelo
        repuesto.activo = activo
        session.commit()
    session.close()

def mostrar_repuestos(activos_only=True):
    session = SessionLocal()
    if activos_only:
        repuestos = session.query(Repuesto).filter_by(activo=1).all()
    else:
        repuestos = session.query(Repuesto).all()
    session.close()
    return repuestos

def buscar_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    session.close()
    return repuesto

def buscar_proveedores_por_repuesto(codigo):
    session = SessionLocal()
    proveedores = (
        session.query(Proveedor.razonSocial, RepuestoxProveedor.costo, RepuestoxProveedor.cantidad)
        .join(RepuestoxProveedor, Proveedor.cuil == RepuestoxProveedor.cuilProveedor)
        .filter(RepuestoxProveedor.codigoRepuesto == codigo)
        .all()
    )
    session.close()
    return proveedores

# ----------- ABMC para DetalleOrden -----------

def alta_detalle_orden(idDetalle, nroDeOrden, codigoServicio, codRepuestos, cuitProveedor, costoServicio, costoRepuesto, subtotal):
    session = SessionLocal()
    try:
        # Si no se recibe idDetalle, asignar secuencialmente desde la BD
        if idDetalle is None:
            max_det = session.query(DetalleOrden).order_by(DetalleOrden.idDetalle.desc()).first()
            idDetalle = (max_det.idDetalle + 1) if max_det and getattr(max_det, 'idDetalle', None) is not None else 1

        detalle = DetalleOrden(
            idDetalle=idDetalle,
            nroDeOrden=nroDeOrden,
            codigoServicio=codigoServicio,
            codRepuestos=codRepuestos,
            cuitProveedor=cuitProveedor,
            costoServicio=costoServicio,
            costoRepuesto=costoRepuesto,
            subtotal=subtotal
        )
        session.add(detalle)
        session.commit()
        return {"mensaje": "Detalle creado", "idDetalle": idDetalle}, 201
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def modificar_detalle_orden(idDetalle, nroDeOrden, codigoServicio, codRepuestos, cuitProveedor, costoServicio, costoRepuesto, subtotal):
    session = SessionLocal()
    detalle = session.query(DetalleOrden).get((idDetalle, nroDeOrden))
    if detalle:
        detalle.codigoServicio = codigoServicio
        detalle.codRepuestos = codRepuestos
        detalle.cuitProveedor = cuitProveedor
        detalle.costoServicio = costoServicio
        detalle.costoRepuesto = costoRepuesto
        detalle.subtotal = subtotal
        session.commit()
    session.close()

def mostrar_detalles_orden(nroDeOrden):
    session = SessionLocal()
    detalles = session.query(DetalleOrden).filter_by(nroDeOrden=nroDeOrden).all()
    session.close()
    return detalles

def baja_detalle_orden(idDetalle, nroDeOrden):
    session = SessionLocal()
    detalle = session.query(DetalleOrden).get((idDetalle, nroDeOrden))
    if detalle:
        session.delete(detalle)
        session.commit()
    session.close()
