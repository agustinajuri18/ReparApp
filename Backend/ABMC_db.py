import os
import sys
import time
from datetime import datetime, date
from contextlib import contextmanager
from sqlalchemy.orm import joinedload, aliased  # Agregar esta importación al inicio
from sqlalchemy.exc import OperationalError
from sqlalchemy import inspect as sa_inspect

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
        elif activos_only is False:
            q = q.filter(Usuario.activo == 0)
        if no_asignados_only:
            # Filter users not associated with any employee
            subq = s.query(Empleado.idUsuario).distinct()
            q = q.filter(~Usuario.idUsuario.in_(subq))
        return q.all()

def mostrar_usuario_por_id(idUsuario):
    with session_scope() as s:
        return s.get(Usuario, idUsuario)

# duplicate alta_usuario removed


#----------- Sesiones -----------

def alta_sesion(idUsuario, horaInicio, fecha, horaFin=None):
    """Crea una nueva sesión (inicio de sesión)."""
    # Try a few times if the DB is locked (sqlite can be briefly locked under concurrency)
    attempts = 6
    delay = 0.05
    for attempt in range(1, attempts + 1):
        try:
            with session_scope() as s:
                ses = Sesion(idUsuario=idUsuario, horaInicio=horaInicio, fecha=fecha, horaFin=horaFin)
                s.add(ses)
                s.commit()
                s.refresh(ses)
                return ses
        except OperationalError as e:
            # If sqlite reports 'database is locked', retry a few times
            msg = str(e).lower()
            if 'database is locked' in msg and attempt < attempts:
                time.sleep(delay * (attempt ** 1.5))
                continue
            raise


def cerrar_sesion(idSesion, horaFin):
    """Actualiza la hora de fin de una sesión existente (logout)."""
    with session_scope() as s:
        ses = s.get(Sesion, idSesion)
        if not ses:
            return None
        ses.horaFin = horaFin
        s.commit()
        return ses

def mostrar_sesion_por_id(idSesion):
    with session_scope() as s:
        return s.get(Sesion, idSesion)


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

def mostrar_clientes(activos_only=True, search=None):
    with session_scope() as s:
        q = s.query(Cliente)
        if activos_only is True:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        if search:
            # Search by name or DNI
            q = q.filter(
                (Cliente.nombre.ilike(f'%{search}%')) |
                (Cliente.apellido.ilike(f'%{search}%')) |
                (Cliente.numeroDoc.ilike(f'%{search}%'))
            )
        return q.all()

def baja_cliente(idCliente):
    with session_scope() as s:
        cliente = s.get(Cliente, idCliente)
        if cliente:
            cliente.activo = 0
            s.commit()
        return cliente

def reactivar_cliente(idCliente):
    with session_scope() as s:
        c = s.get(Cliente, idCliente)
        if c:
            c.activo = 1
            s.commit()
        return c

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

def reactivar_dispositivo(idDispositivo):
    with session_scope() as s:
        d = s.get(Dispositivo, idDispositivo)
        if d:
            d.activo = 1
            s.commit()
        return d

def mostrar_dispositivos(activos_only=True):
    with session_scope() as s:
        q = s.query(Dispositivo)
        if activos_only is True:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        return q.all()

def dispositivos_por_cliente(idCliente):
    with session_scope() as s:
        return s.query(Dispositivo).filter_by(idCliente=idCliente).all()

def buscar_dispositivo_por_nroSerie(nroSerie):
    with session_scope() as s:
        return s.query(Dispositivo).filter_by(nroSerie=nroSerie).first()


# ----------- Proveedor -----------
def alta_proveedor(cuil, razonSocial=None, telefono=None, activo=1, direccion=None, nombreResponsable=None, mailResponsable=None):
    with session_scope() as s:
        p = Proveedor(
            cuil=cuil,
            razonSocial=razonSocial,
            telefonoResponsable=telefono,
            activo=activo,
            direccion=direccion,
            nombreResponsable=nombreResponsable,
            mailResponsable=mailResponsable
        )
        s.add(p)
        s.commit()
        s.refresh(p)
        return p

def modificar_proveedor(idProveedor, cuil=None, razonSocial=None, telefono=None, activo=None, direccion=None, nombreResponsable=None, mailResponsable=None):
    with session_scope() as s:
        p = s.get(Proveedor, idProveedor)
        if not p:
            return None
        if cuil is not None:
            p.cuil = cuil
        if razonSocial is not None:
            p.razonSocial = razonSocial
        if telefono is not None:
            p.telefonoResponsable = telefono
        if direccion is not None:
            p.direccion = direccion
        if nombreResponsable is not None:
            p.nombreResponsable = nombreResponsable
        if mailResponsable is not None:
            p.mailResponsable = mailResponsable
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

def reactivar_proveedor(idProveedor):
    with session_scope() as s:
        p = s.get(Proveedor, idProveedor)
        if p:
            p.activo = 1
            s.commit()
        return p

def mostrar_proveedores(activos_only=True, search=None):
    with session_scope() as s:
        q = s.query(Proveedor)
        if activos_only is True:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        if search:
            # Search by razon social or CUIT
            q = q.filter(
                (Proveedor.razonSocial.ilike(f'%{search}%')) |
                (Proveedor.cuil.ilike(f'%{search}%'))
            )
        return q.all()

def buscar_proveedor_por_cuil(cuil):
    with session_scope() as s:
        return s.query(Proveedor).filter_by(cuil=cuil).first()


# ----------- Empleado -----------
def alta_empleado(nombre, apellido, idCargo=None, idUsuario=None, activo=1, mail=None, telefono=None):
    with session_scope() as s:
        e = Empleado(nombre=nombre, apellido=apellido, idCargo=idCargo, idUsuario=idUsuario, activo=activo, mail=mail, telefono=telefono)
        s.add(e)
        s.commit()
        s.refresh(e)
        return e

def modificar_empleado(idEmpleado, nombre=None, apellido=None, idCargo=None, idUsuario=None, activo=None, mail=None, telefono=None):
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
            if mail is not None:
                e.mail = mail
            if telefono is not None:
                e.telefono = telefono
            s.commit()
        return e

def baja_empleado(idEmpleado):
    with session_scope() as s:
        e = s.get(Empleado, idEmpleado)
        if e:
            e.activo = 0
            s.commit()
        return e

def reactivar_empleado(idEmpleado):
    with session_scope() as s:
        e = s.get(Empleado, idEmpleado)
        if e:
            e.activo = 1
            s.commit()
        return e

def mostrar_empleados(activos_only=True):
    with session_scope() as s:
        q = s.query(Empleado)
        if activos_only is True:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        return q.all()

def buscar_empleado(idEmpleado):
    with session_scope() as s:
        return s.get(Empleado, idEmpleado)

def mostrar_tecnicos(activos_only=True, idCargo=None):
    with session_scope() as s:
        q = s.query(Empleado)
        if activos_only:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        if idCargo is not None:
            q = q.filter_by(idCargo=idCargo)
        return q.all()
        

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

        # Si el nuevo estado es 'PendienteDeRetiro' (tolerante a espacios/acentos),
        # registrar la fecha de inicio de retiro en la orden si no está ya presente.
        try:
            estado_obj = s.get(Estado, idEstado)
            nombre_estado = (getattr(estado_obj, 'nombre', None) or '').lower()
            # Normalizar eliminando caracteres no alfanuméricos para comparar robustamente
            nombre_norm = ''.join(ch for ch in nombre_estado if ch.isalnum())
            if ('pendientederetiro' in nombre_norm) or ('pendiente' in nombre_norm and 'retiro' in nombre_norm):
                # Usar una segunda sesión para actualizar la orden, así si falla no se revierte el historial insertado
                try:
                    with session_scope() as s2:
                        try:
                            cols = [c['name'] for c in sa_inspect(s2.bind).get_columns('OrdenDeReparacion')]
                        except Exception:
                            cols = []

                        if 'fechaInicioRetiro' in cols:
                            orden = s2.get(OrdenDeReparacion, nroDeOrden)
                            if orden and getattr(orden, 'fechaInicioRetiro', None) is None:
                                orden.fechaInicioRetiro = datetime.now().date()
                                s2.commit()
                                print(f"[ABMC_db] fechaInicioRetiro set for orden {nroDeOrden}")
                            else:
                                print(f"[ABMC_db] fechaInicioRetiro already set or orden not found for {nroDeOrden}")
                        else:
                            print(f"[ABMC_db] columna fechaInicioRetiro no existe en la tabla OrdenDeReparacion")
                except Exception as e:
                    # No queremos que esto rompa la asignación de estado principal
                    import traceback
                    traceback.print_exc()
                    print(f"[ABMC_db] Error al intentar setear fechaInicioRetiro para orden {nroDeOrden}: {e}")
        except Exception:
            # No queremos romper la asignación de estado por un fallo secundario al intentar setear la fecha
            pass
        return h

def mostrar_por_estado(idEstado):
    with session_scope() as s:
        return s.query(OrdenDeReparacion)\
            .join(HistorialEstadoOrden, OrdenDeReparacion.nroDeOrden == HistorialEstadoOrden.nroDeOrden)\
            .filter(HistorialEstadoOrden.idEstado == idEstado)\
            .all()


# ----------- HistorialArreglos -----------
# Versión corregida
def mostrar_historial_arreglos(nroDeOrden):
    with session_scope() as session:
        return session.query(HistorialArreglos).filter_by(nroDeOrden=nroDeOrden).all()

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
        if activos_only is True:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        return q.all()

def baja_servicio(idServicio):
    with session_scope() as s:
        sv = s.get(Servicio, idServicio)
        if sv:
            sv.activo = 0
            s.commit()
        return sv

def reactivar_servicio(idServicio):
    with session_scope() as s:
        sv = s.get(Servicio, idServicio)
        if sv:
            sv.activo = 1
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

def reactivar_repuesto(idRepuesto):
    with session_scope() as s:
        r = s.get(Repuesto, idRepuesto)
        if r:
            r.activo = 1
            s.commit()
        return r

def mostrar_repuestos(activos_only=True, search=None):
    """
    Devuelve la lista de repuestos. Si `activos_only` es True devuelve activos,
    si es False devuelve inactivos. Si `search` está presente, filtra por marca
    o modelo (case-insensitive, partial match).
    """
    with session_scope() as s:
        q = s.query(Repuesto)
        if activos_only is True:
            q = q.filter_by(activo=1)
        elif activos_only is False:
            q = q.filter_by(activo=0)
        if search:
            q = q.filter(
                (Repuesto.marca.ilike(f'%{search}%')) |
                (Repuesto.modelo.ilike(f'%{search}%'))
            )
        return q.all()


def buscar_repuesto(idRepuesto):
    """Busca un Repuesto por su identificador."""
    with session_scope() as s:
        return s.get(Repuesto, idRepuesto)

def alta_repuestoxproveedor(idRepuesto, idProveedor, costo, cantidad):
    with session_scope() as session:  # <--- CORRECCIÓN: Cambiar get_session por session_scope
        try:
            # Buscar si la relación ya existe
            existente = session.query(RepuestoxProveedor).filter_by(
                idRepuesto=idRepuesto,
                idProveedor=idProveedor
            ).first()

            if existente:
                # Si existe, actualizar costo y cantidad
                existente.costo = costo
                existente.cantidad = cantidad
                session.commit()
                return {
                    "id": existente.id,
                    "idRepuesto": existente.idRepuesto,
                    "idProveedor": existente.idProveedor,
                    "costo": existente.costo,
                    "cantidad": existente.cantidad,
                    "message": "Relación actualizada"
                }
            else:
                # Si no existe, crear una nueva relación
                nueva_relacion = RepuestoxProveedor(
                    idRepuesto=idRepuesto,
                    idProveedor=idProveedor,
                    costo=costo,
                    cantidad=cantidad
                )
                session.add(nueva_relacion)
                session.commit()
                # Refrescar para obtener el ID autogenerado
                session.refresh(nueva_relacion)
                return {
                    "id": nueva_relacion.id,
                    "idRepuesto": nueva_relacion.idRepuesto,
                    "idProveedor": nueva_relacion.idProveedor,
                    "costo": nueva_relacion.costo,
                    "cantidad": nueva_relacion.cantidad,
                    "message": "Relación creada"
                }
        except Exception as e:
            session.rollback()
            # Devuelve un diccionario de error en lugar de lanzar una excepción
            return {"error": f"Error en la base de datos: {str(e)}"}

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

# ----------------- Helpers -----------------
def calcular_precio_total_orden_obj(orden):
    """Calcula el precio total a partir de los detalles de una orden ORM (objeto OrdenDeReparacion).

    Acepta un objeto `orden` con atributo `detalles` (lista de DetalleOrden) y devuelve float.
    """
    try:
        if not orden:
            return 0.0
        detalles = getattr(orden, 'detalles', None)
        if not detalles:
            return 0.0
        return float(sum((float(getattr(d, 'subtotal', 0) or 0) for d in detalles)))
    except Exception:
        return 0.0


def calcular_precio_total_orden(nroDeOrden):
    """Calcula el precio total de una orden consultando los detalles en BD por nroDeOrden.

    Retorna float (0.0 si no existe o error).
    """
    with session_scope() as s:
        orden = s.query(OrdenDeReparacion).options(joinedload(OrdenDeReparacion.detalles)).filter_by(nroDeOrden=nroDeOrden).first()
        return calcular_precio_total_orden_obj(orden)


def buscar_cliente_por_id(idCliente):
    """Busca y devuelve un objeto Cliente por su id o None."""
    with session_scope() as s:
        return s.get(Cliente, idCliente)


# ----------- DetalleOrden -----------
def alta_detalle_orden(nroDeOrden, idServicio, repuesto_proveedor_id=None, costoServicio=0, costoRepuesto=0, subtotal=0):
    """
    Crea un nuevo detalle de orden
    """
    with session_scope() as s:  # Corregido: usar session_scope() en lugar de get_db_session()
        detalle = DetalleOrden(  # Ya importado al inicio, no necesita from Models
            nroDeOrden=nroDeOrden,
            idServicio=idServicio,
            repuesto_proveedor_id=repuesto_proveedor_id,
            costoServicio=costoServicio,
            costoRepuesto=costoRepuesto,
            subtotal=subtotal
        )
        s.add(detalle)
        s.commit()
        return detalle

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
        return s.query(DetalleOrden).options(
            joinedload(DetalleOrden.servicio),
            joinedload(DetalleOrden.repuesto_proveedor).joinedload(RepuestoxProveedor.repuesto),
            joinedload(DetalleOrden.repuesto_proveedor).joinedload(RepuestoxProveedor.proveedor)
        ).filter_by(nroDeOrden=nroDeOrden).all()

def baja_detalle_orden(idDetalle):
    with session_scope() as s:
        d = s.get(DetalleOrden, idDetalle)
        if d:
            s.delete(d)
            s.commit()
        return d


# ----------- OrdenDeReparacion -----------
def alta_orden_de_reparacion(idDispositivo, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None, resultado=None, informacionAdicional=None, fechaInicioRetiro=None):
    with session_scope() as s:
        # Asegurar que si no se pasa fecha, se use la fecha actual en el servidor
        fecha_val = fecha or datetime.now().date()
        o = OrdenDeReparacion(
            idDispositivo=idDispositivo,
            fecha=fecha_val,
            descripcionDanos=descripcionDanos,
            diagnostico=diagnostico,
            presupuesto=presupuesto,
            idEmpleado=idEmpleado,
            resultado=resultado,
            informacionAdicional=informacionAdicional
        )
        s.add(o)
        s.commit()
        s.refresh(o)
        return o

def alta_orden_por_nroSerie(nroSerie, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None, resultado =None, informacionAdicional=None, fechaInicioRetiro=None):
    """Crea una orden buscando el dispositivo por su número de serie."""
    with session_scope() as s:
        dispositivo = s.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
        if not dispositivo:
            return None
        # Pasar la fecha tal cual; alta_orden_de_reparacion se encargará de usar la fecha actual si es None
        return alta_orden_de_reparacion(dispositivo.idDispositivo, fecha, descripcionDanos, diagnostico, presupuesto, idEmpleado, resultado, informacionAdicional, fechaInicioRetiro)


def mostrar_ordenes_de_reparacion():
    """Devuelve lista de OrdenDeReparacion con relaciones cargadas (dispositivo, empleado, historial_estados, historial_arreglos, detalles)."""
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

def modificar_orden(nroDeOrden, idDispositivo=None, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None, detalles=None, resultado=None, informacionAdicional=None):
    with session_scope() as session:
        try:
            orden = session.query(OrdenDeReparacion).filter_by(nroDeOrden=nroDeOrden).first()
            if not orden:
                return {"error": "Orden no encontrada"}

            # Actualizar campos principales de la orden
            if idDispositivo is not None:
                orden.idDispositivo = idDispositivo
            # No permitir modificación de la fecha de la orden vía API: siempre conservar la fecha original
            # (Ignoramos el parámetro `fecha` si viene)
            if descripcionDanos is not None:
                orden.descripcionDanos = descripcionDanos
            if diagnostico is not None:
                orden.diagnostico = diagnostico
            if presupuesto is not None:
                orden.presupuesto = presupuesto
            if idEmpleado is not None:
                orden.idEmpleado = idEmpleado
            # Nuevos campos añadidos a la tabla OrdenDeReparacion
            if resultado is not None:
                orden.resultado = resultado
            if informacionAdicional is not None:
                orden.informacionAdicional = informacionAdicional

            # --- Lógica para sincronizar detalles ---
            if detalles is not None:
                # Obtener los IDs de los detalles existentes en la BD para esta orden
                detalles_actuales_ids = {d.idDetalle for d in orden.detalles}
                # Obtener los IDs de los detalles que vienen del frontend
                detalles_recibidos_ids = {d.get('idDetalle') for d in detalles if d.get('idDetalle') is not None}

                # 1. Eliminar detalles que ya no están en la lista del frontend
                ids_para_eliminar = detalles_actuales_ids - detalles_recibidos_ids
                if ids_para_eliminar:
                    session.query(DetalleOrden).filter(
                        DetalleOrden.idDetalle.in_(ids_para_eliminar)
                    ).delete(synchronize_session=False)

                # 2. Actualizar detalles existentes y crear nuevos
                for detalle_data in detalles:
                    id_detalle = detalle_data.get('idDetalle')
                    if id_detalle and id_detalle in detalles_actuales_ids:
                        # Actualizar detalle existente
                        detalle_obj = session.query(DetalleOrden).get(id_detalle)
                        if detalle_obj:
                            # safe casts/conversions
                            try:
                                detalle_obj.idServicio = int(detalle_data.get('idServicio')) if detalle_data.get('idServicio') is not None else None
                            except (ValueError, TypeError):
                                detalle_obj.idServicio = detalle_data.get('idServicio')
                            # repuesto_proveedor_id may be None
                            try:
                                rp = detalle_data.get('repuesto_proveedor_id')
                                detalle_obj.repuesto_proveedor_id = int(rp) if rp is not None else None
                            except (ValueError, TypeError):
                                detalle_obj.repuesto_proveedor_id = detalle_data.get('repuesto_proveedor_id')

                            try:
                                detalle_obj.costoServicio = float(detalle_data.get('costoServicio')) if detalle_data.get('costoServicio') is not None else None
                            except (ValueError, TypeError):
                                detalle_obj.costoServicio = detalle_data.get('costoServicio')
                            try:
                                detalle_obj.costoRepuesto = float(detalle_data.get('costoRepuesto')) if detalle_data.get('costoRepuesto') is not None else None
                            except (ValueError, TypeError):
                                detalle_obj.costoRepuesto = detalle_data.get('costoRepuesto')
                            try:
                                detalle_obj.subtotal = float(detalle_data.get('subtotal')) if detalle_data.get('subtotal') is not None else None
                            except (ValueError, TypeError):
                                detalle_obj.subtotal = detalle_data.get('subtotal')
                    elif id_detalle is None:
                        # Crear nuevo detalle
                        # prepare safe values and casts
                        try:
                            idServicio_new = int(detalle_data.get('idServicio')) if detalle_data.get('idServicio') is not None else None
                        except (ValueError, TypeError):
                            idServicio_new = detalle_data.get('idServicio')

                        try:
                            rp_new = detalle_data.get('repuesto_proveedor_id')
                            repuesto_proveedor_id_new = int(rp_new) if rp_new is not None else None
                        except (ValueError, TypeError):
                            repuesto_proveedor_id_new = detalle_data.get('repuesto_proveedor_id')

                        try:
                            costoServicio_new = float(detalle_data.get('costoServicio')) if detalle_data.get('costoServicio') is not None else None
                        except (ValueError, TypeError):
                            costoServicio_new = detalle_data.get('costoServicio')

                        try:
                            costoRepuesto_new = float(detalle_data.get('costoRepuesto')) if detalle_data.get('costoRepuesto') is not None else None
                        except (ValueError, TypeError):
                            costoRepuesto_new = detalle_data.get('costoRepuesto')

                        try:
                            subtotal_new = float(detalle_data.get('subtotal')) if detalle_data.get('subtotal') is not None else None
                        except (ValueError, TypeError):
                            subtotal_new = detalle_data.get('subtotal')

                        nuevo_detalle = DetalleOrden(
                            nroDeOrden=nroDeOrden,
                            idServicio=idServicio_new,
                            repuesto_proveedor_id=repuesto_proveedor_id_new,
                            costoServicio=costoServicio_new,
                            costoRepuesto=costoRepuesto_new,
                            subtotal=subtotal_new
                        )
                        session.add(nuevo_detalle)

            session.commit()
            return {"message": "Orden actualizada correctamente"}
        except Exception as e:
            session.rollback()
            return {"error": f"Error en la base de datos: {str(e)}"}


def mostrar_ordenes():
    # Delegar a la función central obtener_ordenes en modo 'summary'
    return obtener_ordenes(mode='summary')


def obtener_ordenes(mode='summary', idCliente=None, idDispositivo=None, nroDeOrden=None):
    """Devuelve una lista de órdenes serializadas.

    - mode: 'summary' (por defecto) o 'detail'.
    - idCliente: si se pasa, filtra órdenes de dispositivos de ese cliente.
    - idDispositivo: filtra por dispositivo.
    - nroDeOrden: filtra por número de orden.

    Siempre devuelve una lista de diccionarios con claves consistentes. En 'detail' agrega 'detalles' y 'historial_estados'.
    """
    with session_scope() as s:
        q = s.query(OrdenDeReparacion).options(
            joinedload(OrdenDeReparacion.dispositivo),
            joinedload(OrdenDeReparacion.empleado),
            joinedload(OrdenDeReparacion.historial_estados).joinedload(HistorialEstadoOrden.estado),
            joinedload(OrdenDeReparacion.historial_arreglos),
            joinedload(OrdenDeReparacion.detalles).joinedload(DetalleOrden.servicio),
            joinedload(OrdenDeReparacion.detalles).joinedload(DetalleOrden.repuesto_proveedor)
        )

        # Aplicar filtros
        if nroDeOrden is not None:
            q = q.filter(OrdenDeReparacion.nroDeOrden == nroDeOrden)
        if idDispositivo is not None:
            q = q.filter(OrdenDeReparacion.idDispositivo == idDispositivo)
        if idCliente is not None:
            # join con Dispositivo para filtrar por cliente
            q = q.join(Dispositivo, OrdenDeReparacion.idDispositivo == Dispositivo.idDispositivo).filter(Dispositivo.idCliente == idCliente)

        # Ordenar por fecha descendente (más recientes primero)
        q = q.order_by(OrdenDeReparacion.fecha.desc())

        ordenes = q.all()
        resultado = []

        for o in ordenes:
            d = getattr(o, 'dispositivo', None)
            e = getattr(o, 'empleado', None)
            c = getattr(d, 'cliente', None) if d else None
            dispositivo_info = f"{getattr(d,'marca','') or ''} {getattr(d,'modelo','') or ''} ({getattr(d,'nroSerie','') or ''})".strip() if d else None

            # calcular total consistente
            precio_total = calcular_precio_total_orden_obj(o)

            # último estado y fecha
            ultimo_estado = None
            if getattr(o, 'historial_estados', None):
                ultimo_estado = sorted(o.historial_estados, key=lambda h: getattr(h, 'fechaCambio', None) or 0, reverse=True)[0]

            base = {
                'nroDeOrden': getattr(o, 'nroDeOrden', None),
                'idDispositivo': getattr(o, 'idDispositivo', None),
                'fecha': getattr(o, 'fecha', None).isoformat() if getattr(o, 'fecha', None) else None,
                'fechaInicioRetiro': getattr(o, 'fechaInicioRetiro', None).isoformat() if getattr(o, 'fechaInicioRetiro', None) else None,
                'descripcionDanos': getattr(o, 'descripcionDanos', None),
                'resultado': getattr(o, 'resultado', None),
                'informacionAdicional': getattr(o, 'informacionAdicional', None),
                'diagnostico': getattr(o, 'diagnostico', None),
                'precioTotal': float(precio_total),
                'idEmpleado': getattr(o, 'idEmpleado', None),
                'dispositivo_info': dispositivo_info,
                'idCliente': getattr(c, 'idCliente', None) if c else None,
                'cliente_info': f"{getattr(c,'nombre','') or ''} {getattr(c,'apellido','') or ''} ({getattr(c,'numeroDoc','') or ''})".strip() if c else None,
                # incluir cliente serializado para facilitar acceso a teléfono / mail en los consumidores (PDFs, previews)
                'cliente': {
                    'nombre': getattr(c, 'nombre', None) if c else None,
                    'apellido': getattr(c, 'apellido', None) if c else None,
                    'numeroDoc': getattr(c, 'numeroDoc', None) if c else None,
                    'telefono': getattr(c, 'telefono', None) if c else None,
                    'mail': getattr(c, 'mail', None) if c else None,
                    'direccion': getattr(c, 'direccion', None) if c else None,
                } if c else None,
                'empleado_info': f"{getattr(e,'nombre','') or ''} {getattr(e,'apellido','') or ''}".strip() if e else None,
                'estado': getattr(getattr(ultimo_estado, 'estado', None), 'nombre', None) if ultimo_estado else None,
                'fechaEstado': getattr(ultimo_estado, 'fechaCambio', None).isoformat() if ultimo_estado and getattr(ultimo_estado, 'fechaCambio', None) else None
            }

            if mode == 'detail':
                # agregar detalles y otras relaciones serializadas
                detalles_serializados = []
                for det in getattr(o, 'detalles', []) or []:
                    rep = getattr(det, 'repuesto_proveedor', None)
                    rep_desc = None
                    proveedor = None
                    if rep:
                        rep_obj = getattr(rep, 'repuesto', None)
                        proveedor = getattr(rep, 'proveedor', None)
                        if rep_obj:
                            rep_desc = f"{getattr(rep_obj,'marca','') or ''} {getattr(rep_obj,'modelo','') or ''}".strip()
                    # Build nested repuesto and proveedor objects when available
                    repuesto_obj = None
                    proveedor_obj = None
                    if rep:
                        if rep_obj:
                            repuesto_obj = {
                                'idRepuesto': getattr(rep_obj, 'idRepuesto', None),
                                'marca': getattr(rep_obj, 'marca', None),
                                'modelo': getattr(rep_obj, 'modelo', None)
                            }
                        if proveedor:
                            proveedor_obj = {
                                'idProveedor': getattr(proveedor, 'idProveedor', None),
                                'razonSocial': getattr(proveedor, 'razonSocial', None),
                                'cuil': getattr(proveedor, 'cuil', None)
                            }

                    detalles_serializados.append({
                        'idDetalle': getattr(det, 'idDetalle', None),
                        'idServicio': getattr(det, 'idServicio', None),
                        'servicioDescripcion': getattr(getattr(det, 'servicio', None), 'descripcion', None),
                        'repuestoDescripcion': rep_desc,
                        'repuesto': repuesto_obj,
                        'proveedorRazonSocial': getattr(proveedor, 'razonSocial', None) if proveedor else None,
                        'proveedor': proveedor_obj,
                        'costoServicio': float(getattr(det, 'costoServicio', 0) or 0),
                        'costoRepuesto': float(getattr(det, 'costoRepuesto', 0) or 0),
                        'subtotal': float(getattr(det, 'subtotal', 0) or 0)
                    })

                base['detalles'] = detalles_serializados
                # historial de arreglos y estados ya están cargados si se necesitan
                base['historial_estados'] = [
                    {
                        'idHistorial': getattr(h, 'id', None),
                        'idEstado': getattr(h, 'idEstado', None),
                        'fechaCambio': getattr(h, 'fechaCambio', None).isoformat() if getattr(h, 'fechaCambio', None) else None,
                        'observaciones': getattr(h, 'observaciones', None)
                    } for h in getattr(o, 'historial_estados', []) or []
                ]

            resultado.append(base)

        return resultado


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

def buscar_repuesto_proveedor_id(idRepuesto, cuilProveedor):
    """
    Busca el ID de la relación RepuestoxProveedor basado en idRepuesto y cuilProveedor
    """
    with session_scope() as s:
        # Primero, buscar el proveedor por CUIL
        proveedor = s.query(Proveedor).filter(Proveedor.cuil == cuilProveedor).first()
        if not proveedor:
            print(f"Proveedor con CUIL {cuilProveedor} no encontrado")
            return None


# --------- Helpers for permisos and cargos ----------
def obtener_empleado_por_usuario(idUsuario):
    """Retorna el empleado asociado a un idUsuario, o None."""
    with session_scope() as s:
        return s.query(Empleado).filter(Empleado.idUsuario == idUsuario).first()


def obtener_permisos_por_cargo(idCargo):
    """Retorna una lista de idPermiso asociados al cargo (puede estar vacía)."""
    with session_scope() as s:
        rels = s.query(CargoxPermiso).filter(CargoxPermiso.idCargo == idCargo).all()
        return [r.idPermiso for r in rels]
        relacion = s.query(RepuestoxProveedor).filter(
            RepuestoxProveedor.idRepuesto == idRepuesto,
            RepuestoxProveedor.idProveedor == proveedor.idProveedor
        ).first()
        
        if relacion:
            return relacion.id
        else:
            print(f"Relación RepuestoxProveedor no encontrada para idRepuesto={idRepuesto}, idProveedor={proveedor.idProveedor}")
            return None

