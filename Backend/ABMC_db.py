import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from BDD.database import SessionLocal, Usuario, Cliente, Dispositivo, Empleado

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

def modificar_clientes(numero_dni, modificacion, texto):
    session = SessionLocal()
    cliente = session.query(Usuario).get(numero_dni)
    if modificacion == "nombre":
        if cliente:
            cliente.nombre = texto
            session.commit()
    elif modificacion == "apellido":        
        if cliente:
            cliente.apellido = texto
            session.commit()
    elif modificacion == "telefono":
        if cliente:
            cliente.telefono = texto
            session.commit()
    elif modificacion == "mail":
        if cliente:
            cliente.mail = texto
            session.commit()
    session.close()

def consultar_clientes():
    session = SessionLocal()
    clientes = session.query(Cliente).all()
    session.close()
    return clientes


# ----------- ABMC para Dispositivo -----------
# Repite el patrón para alta_dispositivo, baja_dispositivo, modificar_dispositivo, consultar_dispositivos...

# ----------- ABMC para Empleado -----------
# Repite el patrón para alta_empleado, baja_empleado, modificar_empleado, consultar_empleados...

# Y así sucesivamente para las demás clases...
