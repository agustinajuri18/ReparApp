import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from BDD.database import SessionLocal, Usuario, Cliente, Dispositivo, Empleado, Estado, HistorialArreglos, OrdenDeReparacion, Rol, Servicio, Repuesto, HistorialEstadoOrden, Proveedor, Permiso, RolxPermiso, RespuestoxServicio


# ----------- ABMC para Usuario -----------
def alta_usuario(id_usuario, password):
    session = SessionLocal()
    usuario = Usuario(id_usuario=id_usuario, password=password)
    session.add(usuario)
    session.commit()
    session.close()

def baja_usuario(id_usuario):
    session = SessionLocal()
    usuario = session.query(Usuario).get(id_usuario)
    if usuario:
        session.delete(usuario)
        session.commit()
    session.close()

def modificar_usuario(id_usuario, nuevo_password):
    session = SessionLocal()
    usuario = session.query(Usuario).get(id_usuario)
    if usuario:
        usuario.password = nuevo_password
        session.commit()
    session.close()

def mostrar_usuarios():
    session = SessionLocal()
    usuarios = session.query(Usuario).all()
    session.close()
    return usuarios

def asignar_rol_a_usuario(id_usuario, id_rol):
    session = SessionLocal()
    usuario = session.query(Usuario).get(id_usuario)
    rol = session.query(Rol).get(id_rol)
    if usuario and rol:
        empleado = Empleado(nombre="", apellido="", id_rol=id_rol, id_usuario=id_usuario)
        session.add(empleado)
        session.commit()
    session.close()


# ----------- ABMC para Cliente -----------
def alta_cliente(tipo_documento, numero_dni, nombre, apellido, telefono, mail):
    session = SessionLocal()
    cliente = Cliente(
        tipo_documento=tipo_documento,
        numero_dni=numero_dni,
        nombre=nombre,
        apellido=apellido,
        telefono=telefono,
        mail=mail
    )
    session.add(cliente)
    session.commit()
    session.close()

#NO ACLARA SI PUEDEN O NO ELIMNARSE CLIENTES

def modificar_clientes(numero_dni, tipo_documento, nombre, apellido, telefono, mail):
    session = SessionLocal()
    cliente = session.query(Usuario).get(numero_dni)
    if cliente:
        cliente.tipo_documento = tipo_documento
        cliente.nombre = nombre
        cliente.apellido = apellido
        cliente.telefono = telefono
        cliente.mail = mail
        session.commit()
    session.close()

def mostrar_clientes():
    session = SessionLocal()
    clientes = session.query(Cliente).all()
    session.close()
    return clientes

def mostrar_historial_arreglos_por_cliente(tipo_documento, numero_dni):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).join(Dispositivo).filter(
        Dispositivo.clienteTipoDni == tipo_documento,
        Dispositivo.clienteDni == numero_dni
    ).all()
    session.close()
    return historial

# ----------- ABMC para Dispositivo -----------

def alta_dispositivo(nroSerie, marca, modelo, clienteTipoDni, clienteDni):
    session = SessionLocal()
    dispositivo = Dispositivo(
        nroSerie=nroSerie,
        marca=marca,
        modelo=modelo,
        clienteTipoDni=clienteTipoDni,
        clienteDni=clienteDni
    )
    session.add(dispositivo)
    session.commit()
    session.close()

def baja_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).get(nroSerie)
    if dispositivo:
        session.delete(dispositivo)
        session.commit()
    session.close()

def modificar_dispositivo(nroSerie, marca, modelo, clienteTipoDni, clienteDni):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).get(nroSerie)
    if dispositivo:
        dispositivo.marca = marca
        dispositivo.modelo = modelo
        dispositivo.clienteTipoDni = clienteTipoDni
        dispositivo.clienteDni = clienteDni
        session.commit()
    session.close()

def mostrar_dispositivos():
    session = SessionLocal()
    dispositivos = session.query(Dispositivo).all()
    session.close()
    return dispositivos


# ----------- ABMC para Empleado -----------

def alta_empleado(id_empleado, nombre, apellido, id_rol, id_usuario):
    session = SessionLocal()
    empleado = Empleado(
        id_empleado=id_empleado,
        nombre=nombre,
        apellido=apellido,
        id_rol=id_rol,
        id_usuario=id_usuario
    )
    session.add(empleado)
    session.commit()
    session.close()

def baja_empleado(id_empleado):
    session = SessionLocal()
    empleado = session.query(Empleado).get(id_empleado)
    if empleado:
        session.delete(empleado)
        session.commit()
    session.close()

def modificar_empleado(id_empleado, nombre, apellido, id_rol, id_usuario):
    session = SessionLocal()
    empleado = session.query(Empleado).get(id_empleado)
    if empleado:
        empleado.nombre = nombre
        empleado.apellido = apellido
        empleado.id_rol = id_rol
        empleado.id_usuario = id_usuario
        session.commit()
    session.close()

def mostrar_empleados():
    session = SessionLocal()
    empleados = session.query(Empleado).all()
    session.close()
    return empleados


# ----------- ABMC para Estado -----------

def mostrar_estados():
    session = SessionLocal()
    estados = session.query(Estado).all()
    session.close()
    return estados


#----------- ABMC para HistorialArreglos -----------

def mostrar_historial_arreglos(dispositivo):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).filter(HistorialArreglos.nroSerie_dispositivo == dispositivo).all()
    session.close()
    return historial

def alta_historial_arreglos(nroSerie_dispositivo, nroDeOrden):
    session = SessionLocal()
    historial = HistorialArreglos(
        nroSerie_dispositivo=nroSerie_dispositivo,
        nroDeOrden=nroDeOrden
    )
    session.add(historial)
    session.commit()
    session.close()

def modificar_historial_arreglos(nroSerie_dispositivo, nroDeOrden, nuevo_nroSerie_dispositivo, nuevo_nroDeOrden):
    session = SessionLocal()
    historial = session.query(HistorialArreglos).get((nroSerie_dispositivo, nroDeOrden))
    if historial:
        historial.nroSerie_dispositivo = nuevo_nroSerie_dispositivo
        historial.nroDeOrden = nuevo_nroDeOrden
        session.commit()
    session.close()


#----------- ABMC para OrdenDeReparacion -----------

def alta_orden_de_reparacion(nroDeOrden, nroSerie_dispositivo, fecha, descripcion_danos, diagnostico, codigo_servicio, presupuesto, id_empleado):
    session = SessionLocal()
    orden = OrdenDeReparacion(
        nroDeOrden=nroDeOrden,
        nroSerie_dispositivo=nroSerie_dispositivo,
        fecha=fecha,
        descripcion_danos=descripcion_danos,
        diagnostico=diagnostico,
        codigo_servicio=codigo_servicio,
        presupuesto=presupuesto,
        id_empleado=id_empleado
    )
    session.add(orden)
    session.commit()
    session.close()

def modificar_orden_de_reparacion(nroDeOrden, nroSerie_dispositivo, fecha, descripcion_danos, diagnostico, codigo_servicio, presupuesto, id_empleado):
    session = SessionLocal()
    orden = session.query(OrdenDeReparacion).get(nroDeOrden)
    if orden:
        orden.nroSerie_dispositivo = nroSerie_dispositivo
        orden.fecha = fecha
        orden.descripcion_danos = descripcion_danos
        orden.diagnostico = diagnostico
        orden.codigo_servicio = codigo_servicio
        orden.presupuesto = presupuesto
        orden.id_empleado = id_empleado
        session.commit()
    session.close()

def mostrar_ordenes_de_reparacion():
    session = SessionLocal()
    ordenes = session.query(OrdenDeReparacion).all()
    session.close()
    return ordenes


#-----------Historial Estado Orden-----------

def asignar_estado_orden(nroDeOrden, cod_estado, fechaInicio, fechaFin=None):
    session = SessionLocal()
    historial_estado = HistorialEstadoOrden(
        nroDeOrden=nroDeOrden,
        cod_estado=cod_estado,
        fechaInicio=fechaInicio,
        fechaFin=fechaFin
    )
    session.add(historial_estado)
    session.commit()
    session.close()

def mostrar_por_estado(cod_estado):
    session = SessionLocal()
    ordenes = session.query(OrdenDeReparacion).join(HistorialEstadoOrden, OrdenDeReparacion.nroDeOrden == HistorialEstadoOrden.nroDeOrden).filter(HistorialEstadoOrden.cod_estado == cod_estado).all()
    session.close()
    return ordenes


#----------- ABMC para Servicios -----------

def alta_servicio(codigo_servicio, descripcion, costo):
    session = SessionLocal()
    servicio = Servicio(
        codigo_servicio=codigo_servicio,
        descripcion=descripcion,
        costo=costo
    )
    session.add(servicio)
    session.commit()
    session.close()

def modificar_servicio(codigo_servicio, descripcion, costo):
    session = SessionLocal()
    servicio = session.query(Servicio).get(codigo_servicio)
    if servicio:
        servicio.descripcion = descripcion
        servicio.costo = costo
        session.commit()
    session.close()

def mostrar_servicios():
    session = SessionLocal()
    servicios = session.query(Servicio).all()
    session.close()
    return servicios

def baja_servicio(codigo_servicio):
    session = SessionLocal()
    servicio = session.query(Servicio).get(codigo_servicio)
    if servicio:
        session.delete(servicio)
        session.commit()
    session.close()


# ----------- ABMC para Repuesto -----------

def alta_repuesto(codigo, marca, modelo, tipo, cuil_proveedor, costo):
    session = SessionLocal()
    repuesto = Repuesto(
        codigo=codigo,
        marca=marca,
        modelo=modelo,
        tipo=tipo,
        cuil_proveedor=cuil_proveedor,
        costo=costo
    )
    session.add(repuesto)
    session.commit()
    session.close()

def baja_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    if repuesto:
        session.delete(repuesto)
        session.commit()
    session.close()

def modificar_repuesto(codigo, marca, modelo, tipo, cuil_proveedor, costo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).get(codigo)
    if repuesto:
        repuesto.marca = marca
        repuesto.modelo = modelo
        repuesto.tipo = tipo
        repuesto.cuil_proveedor = cuil_proveedor
        repuesto.costo = costo
        session.commit()
    session.close()

def mostrar_repuestos():
    session = SessionLocal()
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
    if repuesto:
        proveedor = session.query(Proveedor).get(repuesto.cuil_proveedor).all()
        session.close()
        return proveedor
        
def buscar_repuesto_por_servicio(codigo_servicio):
    session = SessionLocal()
    repuestos = session.query(Repuesto).join(RespuestoxServicio, Repuesto.codigo == RespuestoxServicio.codigo_repuesto).filter(RespuestoxServicio.codigo_servicio == codigo_servicio).all()
    session.close()
    return repuestos


#----------- ABMC para Proveedor -----------

def alta_proveedor(cuil, nombre, telefono, razon_social):
    session = SessionLocal()
    proveedor = Proveedor(
        cuil=cuil,
        nombre=nombre,
        telefono=telefono,
        razon_social=razon_social
    )
    session.add(proveedor)
    session.commit()
    session.close()

def baja_proveedor(cuil):
    session = SessionLocal()
    proveedor = session.query(Proveedor).get(cuil)
    if proveedor:
        session.delete(proveedor)
        session.commit()
    session.close()

def modificar_proveedor(cuil, nombre, telefono, razon_social):
    session = SessionLocal()
    proveedor = session.query(Proveedor).get(cuil)
    if proveedor:
        proveedor.nombre = nombre
        proveedor.telefono = telefono
        proveedor.razon_social = razon_social
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


#----------- ABMC para Permiso -----------

def asignar_permiso_a_rol(id_rol, id_permiso):
    session = SessionLocal()
    rol = session.query(Rol).get(id_rol)
    permiso = session.query(Permiso).get(id_permiso)
    if rol and permiso:
        rolxpermiso = RolxPermiso(
            id_rol=id_rol,
            id_permiso=id_permiso
        )
        session.add(rolxpermiso)
        session.commit()
    session.close()

