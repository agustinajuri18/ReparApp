import os
import sys
from contextlib import contextmanager
from sqlalchemy.orm import joinedload  # Agregar esta importación al inicio

# agregar la raíz del proyecto al path para poder importar el paquete BDD (carpeta hermana)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from BDD.database import (
    SessionLocal, Usuario, Cliente, Dispositivo, Empleado, Estado,
    HistorialArreglos, OrdenDeReparacion, Servicio, Repuesto,
    HistorialEstadoOrden, Proveedor, Permiso, CargoxPermiso, RepuestoxProveedor, Sesion, Cargo, 
    DetalleOrden, ServicioxRepuesto, TipoDocumento
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

def mostrar_usuarios(activos_only=True, no_asignados_only=False):
    with session_scope() as s:
        q = s.query(Usuario)
        if activos_only:
            q = q.filter(Usuario.activo == 1)
        if no_asignados_only:
            # Filter users not associated with any employee
            subq = s.query(Empleado.idUsuario).distinct()
            q = q.filter(Usuario.idUsuario.not_in(subq))
        return q.all()

def mostrar_usuario_por_id(idUsuario):
    with session_scope() as s:
        return s.get(Usuario, idUsuario)

def alta_usuario(nombreUsuario, contraseña, activo=1):
    with session_scope() as s:
        u = Usuario(nombreUsuario=nombreUsuario, contraseña=contraseña, activo=activo)
        s.add(u)
        s.commit()
        s.refresh(u)
        return u


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
def alta_cliente(idTipoDoc, numeroDoc, nombre=None, apellido=None, telefono=None, mail=None, activo=1):
    with session_scope() as s:
        c = Cliente(idTipoDoc=idTipoDoc, numeroDoc=numeroDoc, nombre=nombre, apellido=apellido, telefono=telefono, mail=mail, activo=activo)
        s.add(c)
        s.commit()
        s.refresh(c)
        return c

def modificar_cliente(idCliente, idTipoDoc=None, numeroDoc=None, nombre=None, apellido=None, telefono=None, mail=None, activo=None):
    with session_scope() as s:
        cliente = s.get(Cliente, idCliente)
        if not cliente:
            return None
        if idTipoDoc is not None:
            cliente.idTipoDoc = idTipoDoc
        if numeroDoc is not None:
            cliente.numeroDoc = numeroDoc
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

def baja_cliente(idCliente):
    with session_scope() as s:
        cliente = s.get(Cliente, idCliente)
        if cliente:
            cliente.activo = 0
            s.commit()
        return cliente

def buscar_cliente_por_doc(idTipoDoc, numeroDoc):
    with session_scope() as s:
        return s.query(Cliente).filter_by(idTipoDoc=idTipoDoc, numeroDoc=numeroDoc).first()


# ----------- TipoDocumento -----------
def mostrar_tipos_documento():
    with session_scope() as s:
        return s.query(TipoDocumento).all()

def alta_tipo_documento(nombre):
    with session_scope() as s:
        td = TipoDocumento(nombre=nombre)
        s.add(td)
        s.commit()
        s.refresh(td)
        return td


# ----------- Dispositivo -----------
def alta_dispositivo(nroSerie, marca=None, modelo=None, idCliente=None, activo=1):
    with session_scope() as s:
        d = Dispositivo(nroSerie=nroSerie, marca=marca, modelo=modelo, idCliente=idCliente, activo=activo)
        s.add(d)
        s.commit()
        s.refresh(d)
        return d

def modificar_dispositivo(idDispositivo, nroSerie=None, marca=None, modelo=None, idCliente=None, activo=None):
    with session_scope() as s:
        d = s.get(Dispositivo, idDispositivo)
        if not d:
            return None
        if nroSerie is not None:
            d.nroSerie = nroSerie
        if marca is not None:
            d.marca = marca
        if modelo is not None:
            d.modelo = modelo
        if idCliente is not None:
            d.idCliente = idCliente
        if activo is not None:
            d.activo = activo
        s.commit()
        return d

def baja_dispositivo(idDispositivo):
    with session_scope() as s:
        d = s.get(Dispositivo, idDispositivo)
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

def dispositivos_por_cliente(idCliente):
    with session_scope() as s:
        return s.query(Dispositivo).filter_by(idCliente=idCliente).all()

def buscar_dispositivo_por_nroSerie(nroSerie):
    with session_scope() as s:
        return s.query(Dispositivo).filter_by(nroSerie=nroSerie).first()


# ----------- Proveedor -----------
def alta_proveedor(cuil, razonSocial=None, telefono=None, activo=1):
    with session_scope() as s:
        p = Proveedor(cuil=cuil, razonSocial=razonSocial, telefono=telefono, activo=activo)
        s.add(p)
        s.commit()
        s.refresh(p)
        return p

def modificar_proveedor(idProveedor, cuil=None, razonSocial=None, telefono=None, activo=None):
    with session_scope() as s:
        p = s.get(Proveedor, idProveedor)
        if not p:
            return None
        if cuil is not None:
            p.cuil = cuil
        if razonSocial is not None:
            p.razonSocial = razonSocial
        if telefono is not None:
            p.telefono = telefono
        if activo is not None:
            p.activo = activo
        s.commit()
        return p

def baja_proveedor(idProveedor):
    with session_scope() as s:
        p = s.get(Proveedor, idProveedor)
        if p:
            p.activo = 0
            s.commit()
        return p

def mostrar_proveedores(activos_only=True):
    with session_scope() as s:
        q = s.query(Proveedor)
        if activos_only:
            q = q.filter_by(activo=1)
        return q.all()

def buscar_proveedor_por_cuil(cuil):
    with session_scope() as s:
        return s.query(Proveedor).filter_by(cuil=cuil).first()


# ----------- Empleado -----------
def alta_empleado(nombre, apellido, idCargo=None, idUsuario=None, activo=1):
    with session_scope() as s:
        e = Empleado(nombre=nombre, apellido=apellido, idCargo=idCargo, idUsuario=idUsuario, activo=activo)
        s.add(e)
        s.commit()
        s.refresh(e)
        return e

def modificar_empleado(idEmpleado, nombre=None, apellido=None, idCargo=None, idUsuario=None, activo=None):
    with session_scope() as s:
        e = s.get(Empleado, idEmpleado)
        if e:
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

def mostrar_empleados(activos_only=True):
    with session_scope() as s:
        q = s.query(Empleado)
        if activos_only:
            q = q.filter_by(activo=1)
        return q.all()

def buscar_empleado(idEmpleado):
    with session_scope() as s:
        return s.get(Empleado, idEmpleado)


# ----------- Estado & HistorialEstadoOrden -----------
def mostrar_estados():
    with session_scope() as s:
        return s.query(Estado).all()

def asignar_estado_orden(nroDeOrden, idEstado, fechaCambio, observaciones=None):
    with session_scope() as s:
        h = HistorialEstadoOrden(nroDeOrden=nroDeOrden, idEstado=idEstado, fechaCambio=fechaCambio, observaciones=observaciones)
        s.add(h)
        s.commit()
        s.refresh(h)
        return h

def mostrar_por_estado(idEstado):
    with session_scope() as s:
        return s.query(OrdenDeReparacion)\
            .join(HistorialEstadoOrden, OrdenDeReparacion.nroDeOrden == HistorialEstadoOrden.nroDeOrden)\
            .filter(HistorialEstadoOrden.idEstado == idEstado)\
            .all()


# ----------- HistorialArreglos -----------
def mostrar_historial_arreglos(idDispositivo):
    with session_scope() as s:
        return s.query(HistorialArreglos).filter_by(idDispositivo=idDispositivo).all()

def alta_historial_arreglos(nroDeOrden, idDispositivo, fechaArreglo, descripcion=None):
    with session_scope() as s:
        h = HistorialArreglos(nroDeOrden=nroDeOrden, idDispositivo=idDispositivo, fechaArreglo=fechaArreglo, descripcion=descripcion)
        s.add(h)
        s.commit()
        s.refresh(h)
        return h

def modificar_historial_arreglos(idHistorialor, **kwargs):
    with session_scope() as s:
        h = s.get(HistorialArreglos, idHistorialor)
        if not h:
            return None
        for k, v in kwargs.items():
            if hasattr(h, k) and v is not None:
                setattr(h, k, v)
        s.commit()
        return h


# ----------- Servicio -----------
def alta_servicio(descripcion, precioBase=None, activo=1):
    with session_scope() as s:
        sv = Servicio(descripcion=descripcion, precioBase=precioBase, activo=activo)
        s.add(sv)
        s.commit()
        s.refresh(sv)
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
def alta_repuesto(marca=None, modelo=None, activo=1):
    with session_scope() as s:
        r = Repuesto(marca=marca, modelo=modelo, activo=activo)
        s.add(r)
        s.commit()
        s.refresh(r)
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


def buscar_repuesto(idRepuesto):
    """Busca un Repuesto por su identificador."""
    with session_scope() as s:
        return s.get(Repuesto, idRepuesto)

def alta_repuestoxproveedor(idRepuesto, idProveedor, costo=None, cantidad=None):
    with session_scope() as s:
        rel = RepuestoxProveedor(idRepuesto=idRepuesto, idProveedor=idProveedor, costo=costo, cantidad=cantidad)
        s.add(rel)
        s.commit()
        s.refresh(rel)
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
        s.refresh(rel)
        return rel

def modificar_servicioxrepuesto(id, cantidad=None):
    with session_scope() as s:
        rel = s.get(ServicioxRepuesto, id)
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
def alta_detalle_orden(nroDeOrden, idServicio, repuesto_proveedor_id, costoServicio=None, costoRepuesto=None, subtotal=None):
    with session_scope() as s:
        d = DetalleOrden(nroDeOrden=nroDeOrden, idServicio=idServicio, repuesto_proveedor_id=repuesto_proveedor_id, 
                         costoServicio=costoServicio, costoRepuesto=costoRepuesto, subtotal=subtotal)
        s.add(d)
        s.commit()
        s.refresh(d)
        return d

def modificar_detalle_orden(idDetalle, **kwargs):
    with session_scope() as s:
        d = s.get(DetalleOrden, idDetalle)
        if not d:
            return None
        for k, v in kwargs.items():
            if hasattr(d, k) and v is not None:
                setattr(d, k, v)
        s.commit()
        return d

def mostrar_detalles_orden(nroDeOrden):
    with session_scope() as s:
        return s.query(DetalleOrden).filter_by(nroDeOrden=nroDeOrden).all()

def baja_detalle_orden(idDetalle):
    with session_scope() as s:
        d = s.get(DetalleOrden, idDetalle)
        if d:
            s.delete(d)
            s.commit()
        return d


# ----------- OrdenDeReparacion -----------
def alta_orden_de_reparacion(idDispositivo, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None):
    with session_scope() as s:
        o = OrdenDeReparacion(idDispositivo=idDispositivo, fecha=fecha, descripcionDanos=descripcionDanos, 
                             diagnostico=diagnostico, presupuesto=presupuesto, idEmpleado=idEmpleado)
        s.add(o)
        s.commit()
        s.refresh(o)
        return o

def alta_orden_por_nroSerie(nroSerie, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None):
    """Crea una orden buscando el dispositivo por su número de serie."""
    with session_scope() as s:
        dispositivo = s.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
        if not dispositivo:
            return None
        return alta_orden_de_reparacion(dispositivo.idDispositivo, fecha, descripcionDanos, diagnostico, presupuesto, idEmpleado)

def modificar_orden_de_reparacion(nroDeOrden, **kwargs):
    with session_scope() as s:
        o = s.get(OrdenDeReparacion, nroDeOrden)
        if not o:
            return None
        # Manejar caso especial para nroSerie
        if 'nroSerie' in kwargs and kwargs['nroSerie'] is not None:
            dispositivo = s.query(Dispositivo).filter_by(nroSerie=kwargs.pop('nroSerie')).first()
            if dispositivo:
                o.idDispositivo = dispositivo.idDispositivo
        
        for k, v in kwargs.items():
            if hasattr(o, k) and v is not None:
                setattr(o, k, v)
        s.commit()
        return o

def mostrar_ordenes_de_reparacion(activos_only=True):
    with session_scope() as s:
        q = s.query(OrdenDeReparacion).options(
            joinedload(OrdenDeReparacion.dispositivo),
            joinedload(OrdenDeReparacion.empleado),
            joinedload(OrdenDeReparacion.historial_estados).joinedload(HistorialEstadoOrden.estado),
            joinedload(OrdenDeReparacion.historial_arreglos),
            joinedload(OrdenDeReparacion.detalles).joinedload(DetalleOrden.servicio),
            joinedload(OrdenDeReparacion.detalles).joinedload(DetalleOrden.repuesto_proveedor)
        )
        return q.all()


# ----------- Permisos / Cargos -----------
def alta_permiso(descripcion):
    with session_scope() as s:
        p = Permiso(descripcion=descripcion)
        s.add(p)
        s.commit()
        s.refresh(p)
        return p

def alta_cargo(descripcion):
    with session_scope() as s:
        c = Cargo(descripcion=descripcion)
        s.add(c)
        s.commit()
        s.refresh(c)
        return c

def asignar_permiso_a_cargo(idCargo, idPermiso):
    with session_scope() as s:
        rel = CargoxPermiso(idCargo=idCargo, idPermiso=idPermiso)
        s.add(rel)
        s.commit()
        s.refresh(rel)
        return rel

def mostrar_cargos(activos_only=True):
    with session_scope() as s:
        q = s.query(Cargo)
        # Removido filtro por activo, ya que la tabla no lo tiene
        return q.all()


# Utilidad genérica
def buscar_por_id(model, pk):
    with session_scope() as s:
        return s.get(model, pk)

