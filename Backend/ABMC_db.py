import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from BDD.database import SessionLocal, Usuario, Cliente, Dispositivo, Empleado, Estado, HistorialArreglos, OrdenDeReparacion, Rol, Servicio, Repuesto, HistorialEstadoOrden, Proveedor, Permiso, RolxPermiso, RepuestoxServicio

# ----------- ABMC para Usuario -----------
def alta_usuario(idUsuario, password):
    session = SessionLocal()
    usuario = Usuario(idUsuario=idUsuario, password=password, activo=1)
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

def modificar_usuario(idUsuario, nuevo_password):
    session = SessionLocal()
    usuario = session.query(Usuario).get(idUsuario)
    if usuario:
        usuario.password = nuevo_password
        session.commit()
    session.close()

def mostrar_usuarios():
    session = SessionLocal()
    usuarios = session.query(Usuario).all()
    session.close()
    return usuarios

def asignar_rol_a_usuario(idUsuario, idRol):
    session = SessionLocal()
    usuario = session.query(Usuario).get(idUsuario)
    rol = session.query(Rol).get(idRol)
    if usuario and rol:
        empleado = Empleado(nombre="", apellido="", idRol=idRol, idUsuario=idUsuario, activo=1)
        session.add(empleado)
        session.commit()
    session.close()

# ----------- ABMC para Cliente -----------
def alta_cliente(tipoDocumento, numeroDni, nombre, apellido, telefono, mail):
    session = SessionLocal()
    cliente = Cliente(
        tipoDocumento=tipoDocumento,
        numeroDni=numeroDni,
        nombre=nombre,
        apellido=apellido,
        telefono=telefono,
        mail=mail,
        activo=1
    )
    session.add(cliente)
    session.commit()
    session.close()

def modificar_cliente(tipoDocumento, numeroDni, nombre, apellido, telefono, mail, activo=1):
    session = SessionLocal()
    cliente = session.query(Cliente).get((tipoDocumento, numeroDni))
    if cliente:
        cliente.nombre = nombre
        cliente.apellido = apellido
        cliente.telefono = telefono
        cliente.mail = mail
        cliente.activo = activo  # <-- guarda el estado
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

def baja_cliente(tipoDocumento, numeroDni):
    session = SessionLocal()
    cliente = session.query(Cliente).get((tipoDocumento, numeroDni))
    if cliente:
        cliente.activo = 0
        session.commit()
    session.close()

# ----------- ABMC para Dispositivo -----------
def alta_dispositivo(nroSerie, marca, modelo, clienteTipoDocumento, clienteNumeroDni):
    session = SessionLocal()
    dispositivo = Dispositivo(
        nroSerie=nroSerie,
        marca=marca,
        modelo=modelo,
        clienteTipoDocumento=clienteTipoDocumento,
        clienteNumeroDni=clienteNumeroDni,
        activo=1
    )
    session.add(dispositivo)
    session.commit()
    session.close()

def modificar_dispositivo(nroSerie, marca, modelo, clienteTipoDocumento, clienteNumeroDni):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).get(nroSerie)
    if dispositivo:
        dispositivo.marca = marca
        dispositivo.modelo = modelo
        dispositivo.clienteTipoDocumento = clienteTipoDocumento
        dispositivo.clienteNumeroDni = clienteNumeroDni
        session.commit()
    session.close()

def baja_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).get(nroSerie)
    if dispositivo:
        dispositivo.activo = 0
        session.commit()
    session.close()

def mostrar_dispositivos():
    session = SessionLocal()
    dispositivos = session.query(Dispositivo).all()
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
        proveedor.activo = activo  # <--- Guarda el estado
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
def alta_empleado(idEmpleado, nombre, apellido, idRol, idUsuario):
    session = SessionLocal()
    empleado = Empleado(
        idEmpleado=idEmpleado,
        nombre=nombre,
        apellido=apellido,
        idRol=idRol,
        idUsuario=idUsuario,
        activo=1
    )
    session.add(empleado)
    session.commit()
    session.close()

def modificar_empleado(idEmpleado, nombre, apellido, idRol, idUsuario):
    session = SessionLocal()
    empleado = session.query(Empleado).get(idEmpleado)
    if empleado:
        empleado.nombre = nombre
        empleado.apellido = apellido
        empleado.idRol = idRol
        empleado.idUsuario = idUsuario
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
def mostrar_historial_arreglos(dispositivo):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).filter(HistorialArreglos.dispositivo == dispositivo).all()
    session.close()
    return historial

def alta_historial_arreglos(dispositivo, nroDeOrden):
    session = SessionLocal()
    historial = HistorialArreglos(
        dispositivo=dispositivo,
        nroDeOrden=nroDeOrden
    )
    session.add(historial)
    session.commit()
    session.close()

def modificar_historial_arreglos(dispositivo, nroDeOrden, nuevo_dispositivo, nuevo_nroDeOrden):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).get((dispositivo, nroDeOrden))
    if historial:
        historial.dispositivo = nuevo_dispositivo
        historial.nroDeOrden = nuevo_nroDeOrden
        session.commit()
    session.close()

# ----------- ABMC para OrdenDeReparacion -----------
def alta_orden_de_reparacion(nroDeOrden, nroSerieDispositivo, fecha, descripcionDanios, diagnostico, codigoServicio, presupuesto, idEmpleado):
    session = SessionLocal()
    orden = OrdenDeReparacion(
        nroDeOrden=nroDeOrden,
        nroSerieDispositivo=nroSerieDispositivo,
        fecha=fecha,
        descripcionDanios=descripcionDanios,
        diagnostico=diagnostico,
        codigoServicio=codigoServicio,
        presupuesto=presupuesto,
        idEmpleado=idEmpleado
    )
    session.add(orden)
    session.commit()
    session.close()

def modificar_orden_de_reparacion(nroDeOrden, nroSerieDispositivo, fecha, descripcionDanios, diagnostico, codigoServicio, presupuesto, idEmpleado):
    session = SessionLocal()
    orden = session.query(OrdenDeReparacion).get(nroDeOrden)
    if orden:
        orden.nroSerieDispositivo = nroSerieDispositivo
        orden.fecha = fecha
        orden.descripcionDanios = descripcionDanios
        orden.diagnostico = diagnostico
        orden.codigoServicio = codigoServicio
        orden.presupuesto = presupuesto
        orden.idEmpleado = idEmpleado
        session.commit()
    session.close()

def mostrar_ordenes_de_reparacion():
    session = SessionLocal()
    ordenes = session.query(OrdenDeReparacion).all()
    session.close()
    return ordenes

# ----------- ABMC para HistorialEstadoOrden -----------
def asignar_estado_orden(nroDeOrden, codEstado, fechaInicio, fechaFin=None):
    session = SessionLocal()
    historial_estado = HistorialEstadoOrden(
        nroDeOrden=nroDeOrden,
        codEstado=codEstado,
        fechaInicio=fechaInicio,
        fechaFin=fechaFin
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

# ----------- ABMC para Repuesto -----------
def alta_repuesto(codigo, marca, modelo, tipo, cuilProveedor, costo, activo=1):
    session = SessionLocal()
    repuesto = Repuesto(
        codigo=codigo,
        marca=marca,
        modelo=modelo,
        tipo=tipo,
        cuilProveedor=cuilProveedor,
        costo=costo,
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
    
def modificar_repuesto(codigo, marca, modelo, tipo, cuilProveedor, costo, activo=1):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    if repuesto:
        repuesto.marca = marca
        repuesto.modelo = modelo
        repuesto.tipo = tipo
        repuesto.cuilProveedor = cuilProveedor
        repuesto.costo = costo
        repuesto.activo = activo  # <--- Guarda el estado
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

def buscar_proveedor_por_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    proveedor = None
    if repuesto:
        proveedor = session.query(Proveedor).get(repuesto.cuilProveedor)
    session.close()
    return proveedor

def buscar_repuesto_por_servicio(codigoServicio):
    session = SessionLocal()
    repuestos = session.query(Repuesto).join(RepuestoxServicio, Repuesto.codigo == RepuestoxServicio.codigoRepuesto).filter(RepuestoxServicio.codigoServicio == codigoServicio).all()
    session.close()
    return repuestos
# ----------- ABMC para Permiso y relaciones -----------
def asignar_permiso_a_rol(idRol, idPermiso):
    session = SessionLocal()
    rol = session.query(Rol).get(idRol)
    permiso = session.query(Permiso).get(idPermiso)
    if rol and permiso:
        rolxpermiso = RolxPermiso(
            idRol=idRol,
            idPermiso=idPermiso
        )
        session.add(rolxpermiso)
        session.commit()
    session.close()
