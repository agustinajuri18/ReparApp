import os
import sys
from contextlib import contextmanager

# agregar la raíz del proyecto al path para poder importar el paquete BDD (carpeta hermana)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from BDD.database import (
    SessionLocal, Usuario, Cliente, Dispositivo, Empleado, Estado,
    HistorialArreglos, OrdenDeReparacion, Servicio, Repuesto,
    HistorialEstadoOrden, Proveedor, Permiso, CargoxPermiso, RepuestoxProveedor, Sesion, Cargo, 
    DetalleOrden, ServicioxRepuesto
)


@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ----------- Usuarios -----------
def alta_usuario(nombreUsuario, contraseña, activo=1):
    with session_scope() as s:
        u = Usuario(nombreUsuario=nombreUsuario, contraseña=contraseña, activo=activo)
        s.add(u)
        s.commit()
        s.refresh(u)
        return u

def baja_usuario(idUsuario):
    with session_scope() as s:
        u = s.get(Usuario, idUsuario)
        if u:
            u.activo = 0
            s.commit()
        return u

def modificar_usuario(idUsuario, nueva_contraseña=None, nuevo_activo=None, nuevo_nombreUsuario=None):
    with session_scope() as s:
        u = s.get(Usuario, idUsuario)
        if not u:
            return None
        if nueva_contraseña:
            u.contraseña = nueva_contraseña
        if nuevo_activo is not None:
            u.activo = nuevo_activo
        if nuevo_nombreUsuario:
            u.nombreUsuario = nuevo_nombreUsuario
        s.commit()
        return u

def mostrar_usuarios():
    with session_scope() as s:
        return s.query(Usuario).all()

#----------- Sesiones -----------

def alta_sesion(idUsuario, horaInicio, fecha, horaFin=None):
    """Crea una nueva sesión (inicio de sesión)."""
    with session_scope() as s:
        ses = Sesion(idUsuario=idUsuario, horaInicio=horaInicio, fecha=fecha, horaFin=horaFin)
        s.add(ses)
        s.commit()
        s.refresh(ses)
        return ses


def cerrar_sesion(idSesion, horaFin):
    """Actualiza la hora de fin de una sesión existente (logout)."""
    with session_scope() as s:
        ses = s.get(Sesion, idSesion)
        if not ses:
            return None
        ses.horaFin = horaFin
        s.commit()
        return ses


# ----------- Cliente -----------
def alta_cliente(tipoDocumento, numeroDoc, nombre=None, apellido=None, telefono=None, mail=None, activo=1):
    with session_scope() as s:
        c = Cliente(tipoDocumento=tipoDocumento, numeroDoc=numeroDoc, nombre=nombre, apellido=apellido, telefono=telefono, mail=mail, activo=activo)
        s.add(c)
        s.commit()
        return c

def modificar_cliente(tipoDocumento, numeroDoc, nombre=None, apellido=None, telefono=None, mail=None, activo=None):
    with session_scope() as s:
        cliente = s.query(Cliente).filter_by(tipoDocumento=tipoDocumento, numeroDoc=numeroDoc).first()
        if not cliente:
            return None
        if nombre is not None:
            cliente.nombre = nombre
        if apellido is not None:
            cliente.apellido = apellido
        if telefono is not None:
            cliente.telefono = telefono
        if mail is not None:
            cliente.mail = mail
        if activo is not None:
            cliente.activo = activo
        s.commit()
        return cliente

def mostrar_clientes(activos_only=True):
    with session_scope() as s:
        q = s.query(Cliente)
        if activos_only:
            q = q.filter_by(activo=1)
        return q.all()

def baja_cliente(tipoDocumento, numeroDoc):
    with session_scope() as s:
        cliente = s.query(Cliente).filter_by(tipoDocumento=tipoDocumento, numeroDoc=numeroDoc).first()
        if cliente:
            cliente.activo = 0
            s.commit()
        return cliente


# ----------- Dispositivo -----------
def alta_dispositivo(nroSerie, marca=None, modelo=None, clienteTipoDocumento=None, clienteNumeroDoc=None, activo=1):
    with session_scope() as s:
        d = Dispositivo(nroSerie=nroSerie, marca=marca, modelo=modelo, clienteTipoDocumento=clienteTipoDocumento, clienteNumeroDoc=clienteNumeroDoc, activo=activo)
        s.add(d)
        s.commit()
        return d

def modificar_dispositivo(nroSerie, marca=None, modelo=None, clienteTipoDocumento=None, clienteNumeroDoc=None, activo=None):
    with session_scope() as s:
        d = s.get(Dispositivo, nroSerie)
        if not d:
            return None
        if marca is not None:
            d.marca = marca
        if modelo is not None:
            d.modelo = modelo
        if clienteTipoDocumento is not None:
            d.clienteTipoDocumento = clienteTipoDocumento
        if clienteNumeroDoc is not None:
            d.clienteNumeroDoc = clienteNumeroDoc
        if activo is not None:
            d.activo = activo
        s.commit()
        return d

def baja_dispositivo(nroSerie):
    with session_scope() as s:
        d = s.get(Dispositivo, nroSerie)
        if d:
            d.activo = 0
            s.commit()
        return d

def mostrar_dispositivos(activos_only=True):
    with session_scope() as s:
        q = s.query(Dispositivo)
        if activos_only:
            q = q.filter_by(activo=1)
        return q.all()

def dispositivos_por_cliente(clienteTipoDocumento, clienteNumeroDoc):
    with session_scope() as s:
        return s.query(Dispositivo).filter_by(clienteTipoDocumento=clienteTipoDocumento, clienteNumeroDoc=clienteNumeroDoc).all()


# ----------- Proveedor -----------
def alta_proveedor(cuil, razonSocial=None, telefono=None, activo=1):
    with session_scope() as s:
        p = Proveedor(cuil=cuil, razonSocial=razonSocial, telefono=telefono, activo=activo)
        s.add(p)
        s.commit()
        return p

def modificar_proveedor(cuil, razonSocial=None, telefono=None, activo=None):
    with session_scope() as s:
        p = s.query(Proveedor).filter_by(cuil=cuil).first()
        if not p:
            return None
        if razonSocial is not None:
            p.razonSocial = razonSocial
        if telefono is not None:
            p.telefono = telefono
        if activo is not None:
            p.activo = activo
        s.commit()
        return p

def baja_proveedor(cuil):
    with session_scope() as s:
        p = s.query(Proveedor).filter_by(cuil=cuil).first()
        if p:
            p.activo = 0
            s.commit()
        return p

def mostrar_proveedores():
    with session_scope() as s:
        return s.query(Proveedor).all()

def buscar_proveedor(cuil):
    with session_scope() as s:
        return s.query(Proveedor).filter_by(cuil=cuil).first()


# ----------- Empleado -----------
def alta_empleado(nombre, apellido, idCargo=None, idUsuario=None, activo=1):
    with session_scope() as s:
        e = Empleado(nombre=nombre, apellido=apellido, idCargo=idCargo, idUsuario=idUsuario, activo=activo)
        s.add(e)
        s.commit()
        return e

def modificar_empleado(idEmpleado, nombre=None, apellido=None, idCargo=None, idUsuario=None, activo=None):
    with session_scope() as s:
        e = s.get(Empleado, idEmpleado)
        if not e:
            return None
        if nombre is not None:
            e.nombre = nombre
        if apellido is not None:
            e.apellido = apellido
        if idCargo is not None:
            e.idCargo = idCargo
        if idUsuario is not None:
            e.idUsuario = idUsuario
        if activo is not None:
            e.activo = activo
        s.commit()
        return e

def baja_empleado(idEmpleado):
    with session_scope() as s:
        e = s.get(Empleado, idEmpleado)
        if e:
            e.activo = 0
            s.commit()
        return e

def mostrar_empleados():
    with session_scope() as s:
        return s.query(Empleado).all()

def buscar_empleado(idEmpleado):
    with session_scope() as s:
        return s.get(Empleado, idEmpleado)


# ----------- Estado & HistorialEstadoOrden -----------
def mostrar_estados():
    with session_scope() as s:
        return s.query(Estado).all()

def asignar_estado_orden(idOrden, idEstado, fechaCambio, observaciones=None):
    with session_scope() as s:
        h = HistorialEstadoOrden(idOrden=idOrden, idEstado=idEstado, fechaCambio=fechaCambio, observaciones=observaciones)
        s.add(h)
        s.commit()
        return h

def mostrar_por_estado(idEstado):
    with session_scope() as s:
        return s.query(OrdenDeReparacion).join(HistorialEstadoOrden, OrdenDeReparacion.idOrden == HistorialEstadoOrden.idOrden).filter(HistorialEstadoOrden.idEstado == idEstado).all()


# ----------- HistorialArreglos -----------
def mostrar_historial_arreglos(idDispositivo):
    with session_scope() as s:
        return s.query(HistorialArreglos).filter_by(idDispositivo=idDispositivo).all()

def alta_historial_arreglos(idOrden, idDispositivo, fechaArreglo, descripcion=None):
    with session_scope() as s:
        h = HistorialArreglos(idOrden=idOrden, idDispositivo=idDispositivo, fechaArreglo=fechaArreglo, descripcion=descripcion)
        s.add(h)
        s.commit()
        return h

def modificar_historial_arreglos(idHistorial, **kwargs):
    with session_scope() as s:
        h = s.get(HistorialArreglos, idHistorial)
        if not h:
            return None
        for k, v in kwargs.items():
            if hasattr(h, k) and v is not None:
                setattr(h, k, v)
        s.commit()
        return h


# ----------- Servicio -----------
def alta_servicio(idServicio, descripcion=None, precioBase=None, activo=1):
    with session_scope() as s:
        sv = Servicio(idServicio=idServicio, descripcion=descripcion, precioBase=precioBase, activo=activo)
        s.add(sv)
        s.commit()
        return sv

def modificar_servicio(idServicio, descripcion=None, precioBase=None, activo=None):
    with session_scope() as s:
        sv = s.get(Servicio, idServicio)
        if not sv:
            return None
        if descripcion is not None:
            sv.descripcion = descripcion
        if precioBase is not None:
            sv.precioBase = precioBase
        if activo is not None:
            sv.activo = activo
        s.commit()
        return sv

def mostrar_servicios(activos_only=True):
    with session_scope() as s:
        q = s.query(Servicio)
        if activos_only:
            q = q.filter_by(activo=1)
        return q.all()

def baja_servicio(idServicio):
    with session_scope() as s:
        sv = s.get(Servicio, idServicio)
        if sv:
            sv.activo = 0
            s.commit()
        return sv


# ----------- Repuesto & RepuestoxProveedor -----------
def alta_repuesto(idRepuesto, marca=None, modelo=None, activo=1):
    with session_scope() as s:
        r = Repuesto(idRepuesto=idRepuesto, marca=marca, modelo=modelo, activo=activo)
        s.add(r)
        s.commit()
        return r

def modificar_repuesto(idRepuesto, **kwargs):
    with session_scope() as s:
        r = s.get(Repuesto, idRepuesto)
        if not r:
            return None
        for k, v in kwargs.items():
            if hasattr(r, k) and v is not None:
                setattr(r, k, v)
        s.commit()
        return r

def baja_repuesto(idRepuesto):
    with session_scope() as s:
        r = s.get(Repuesto, idRepuesto)
        if r:
            r.activo = 0
            s.commit()
        return r

def mostrar_repuestos(activos_only=True):
    with session_scope() as s:
        q = s.query(Repuesto)
        if activos_only:
            q = q.filter_by(activo=1)
        return q.all()

def alta_repuestoxproveedor(idRepuesto, idProveedor, costo=None, cantidad=None):
    with session_scope() as s:
        rel = RepuestoxProveedor(idRepuesto=idRepuesto, idProveedor=idProveedor, costo=costo, cantidad=cantidad)
        s.add(rel)
        s.commit()
        return rel

def baja_repuestoxproveedor(idRepuesto, idProveedor):
    with session_scope() as s:
        rel = s.query(RepuestoxProveedor).filter_by(idRepuesto=idRepuesto, idProveedor=idProveedor).first()
        if rel:
            s.delete(rel)
            s.commit()
        return rel

def mostrar_repuestoxproveedor():
    with session_scope() as s:
        return s.query(RepuestoxProveedor).all()


# ----------- ServicioxRepuesto -----------
def alta_servicioxrepuesto(idServicio, idRepuesto, cantidad=None):
    with session_scope() as s:
        rel = ServicioxRepuesto(idServicio=idServicio, idRepuesto=idRepuesto, cantidad=cantidad)
        s.add(rel)
        s.commit()
        return rel

def modificar_servicioxrepuesto(idServicio, idRepuesto, cantidad=None):
    with session_scope() as s:
        rel = s.query(ServicioxRepuesto).filter_by(idServicio=idServicio, idRepuesto=idRepuesto).first()
        if not rel:
            return None
        if cantidad is not None:
            rel.cantidad = cantidad
        s.commit()
        return rel

def baja_servicioxrepuesto(idServicio, idRepuesto):
    with session_scope() as s:
        rel = s.query(ServicioxRepuesto).filter_by(idServicio=idServicio, idRepuesto=idRepuesto).first()
        if rel:
            s.delete(rel)
            s.commit()
        return rel

def mostrar_servicioxrepuesto():
    with session_scope() as s:
        return s.query(ServicioxRepuesto).all()

def mostrar_repuestos_por_servicio(idServicio):
    """Devuelve lista de Repuesto asociados a un Servicio (idServicio)."""
    with session_scope() as s:
        rows = (
            s.query(Repuesto, ServicioxRepuesto.cantidad)
            .join(ServicioxRepuesto, Repuesto.idRepuesto == ServicioxRepuesto.idRepuesto)
            .filter(ServicioxRepuesto.idServicio == idServicio)
            .all()
        )
        # convertir a dicts sencillos
        resultado = [
            {
                "idRepuesto": r.idRepuesto,
                "marca": r.marca,
                "modelo": r.modelo,
                "cantidad": cantidad
            }
            for r, cantidad in rows
        ]
        return resultado


# ----------- DetalleOrden -----------
def alta_detalle_orden(idDetalle, idOrden, idServicio, idRepuestos, idProveedor, costoServicio=None, costoRepuesto=None, subtotal=None):
    with session_scope() as s:
        d = DetalleOrden(idDetalle=idDetalle, idOrden=idOrden, idServicio=idServicio, idRepuestos=idRepuestos, idProveedor=idProveedor, costoServicio=costoServicio, costoRepuesto=costoRepuesto, subtotal=subtotal)
        s.add(d)
        s.commit()
        return d

def modificar_detalle_orden(idDetalle, idOrden, **kwargs):
    with session_scope() as s:
        d = s.get(DetalleOrden, (idDetalle, idOrden))
        if not d:
            return None
        for k, v in kwargs.items():
            if hasattr(d, k) and v is not None:
                setattr(d, k, v)
        s.commit()
        return d

def mostrar_detalles_orden(idOrden):
    with session_scope() as s:
        return s.query(DetalleOrden).filter_by(idOrden=idOrden).all()

def baja_detalle_orden(idDetalle, idOrden):
    with session_scope() as s:
        d = s.get(DetalleOrden, (idDetalle, idOrden))
        if d:
            s.delete(d)
            s.commit()
        return d


# ----------- OrdenDeReparacion -----------
def alta_orden_de_reparacion(nroSerieDispositivo, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None):
    with session_scope() as s:
        # find dispositivo id by nroSerie
        dispositivo = s.query(Dispositivo).filter_by(nroSerie=nroSerieDispositivo).first()
        idDispositivo = dispositivo.idDispositivo if dispositivo else None
        o = OrdenDeReparacion(idDispositivo=idDispositivo, fecha=fecha, descripcionDanos=descripcionDanos, diagnostico=diagnostico, presupuesto=presupuesto, idEmpleado=idEmpleado)
        s.add(o)
        s.commit()
        s.refresh(o)
        return o

def modificar_orden_de_reparacion(idOrden, **kwargs):
    with session_scope() as s:
        o = s.get(OrdenDeReparacion, idOrden)
        if not o:
            return None
        for k, v in kwargs.items():
            # allow passing nroSerieDispositivo to change idDispositivo
            if k == 'nroSerieDispositivo' and v is not None:
                dispositivo = s.query(Dispositivo).filter_by(nroSerie=v).first()
                o.idDispositivo = dispositivo.idDispositivo if dispositivo else None
                continue
            if hasattr(o, k) and v is not None:
                setattr(o, k, v)
        s.commit()
        return o

def mostrar_ordenes_de_reparacion():
    with session_scope() as s:
        return s.query(OrdenDeReparacion).all()


# ----------- Permisos / Cargos -----------
def alta_permiso(idPermiso, descripcion=None):
    with session_scope() as s:
        p = Permiso(idPermiso=idPermiso, descripcion=descripcion)
        s.add(p)
        s.commit()
        return p

def alta_cargo(descripcion):
    with session_scope() as s:
        c = Cargo(descripcion=descripcion)
        s.add(c)
        s.commit()
        return c

def asignar_permiso_a_cargo(idCargo, idPermiso):
    with session_scope() as s:
        rel = CargoxPermiso(idCargo=idCargo, idPermiso=idPermiso)
        s.add(rel)
        s.commit()
        return rel


# Utilidad genérica
def buscar_por_id(model, pk):
    with session_scope() as s:
        return s.get(model, pk)

