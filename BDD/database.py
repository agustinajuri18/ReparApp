from sqlite3 import Date, Time
from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cambia la ruta y el motor según tu base de datos
DATABASE_URL = "sqlite:///C:/Users/LENOVO/Desktop/- FACU -/3er AÑO -/SEM -/DatabaseProyecto v.1/database.db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ...existing code...

from sqlalchemy import Column, Integer, String

class Usuario(Base):
    __tablename__ = "usuario"
    id_usuario = Column(String, primary_key=True, index=True)
    contrasena = Column(String, nullable=False)

class Cliente(Base):
    __tablename__ = "cliente"
    tipo_documento = Column(String, primary_key=True, index=True)
    numero_dni = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    telefono = Column(Integer, nullable = False)
    mail = Column(String, nullable=False)

class Dispositivo(Base):
    __tablename__ = "dispositivo"
    nroSerie = Column(String, primary_key=True, index=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    clienteTipoDni = Column(String, nullable=False)
    clienteDni = Column(Integer, nullable=False)

class Empleado(Base):
    __tablename__ = "empleado"
    id_empleado = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    id_rol = Column(Integer, nullable=False)
    id_usuario = Column(String, nullable=False)

class Estado(Base):
    __tablename__ = "estado"
    cod_estado = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)

class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    nroSerie_dispositivo = Column(String, primary_key=True, index=True)
    nroDeOrden = Column(Integer, primary_key=True, index=True)

class OrdenDeReparacion(Base):
    __tablename__ = "OrdenDeReparacion"
    nroDeOrden = Column(Integer, primary_key=True, index=True)
    nroSerie_dispositivo = Column(String, nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion_danos = Column(String, nullable=False)
    diagnostico = Column(String, nullable=False)
    codigo_servicio = Column(Integer, nullable=False)
    presupuesto = Column(Integer, nullable=False)
    id_empleado = Column(Integer, nullable=False)

class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    nroDeOrden = Column(Integer, primary_key=True, index=True)
    cod_estado = Column(Integer, primary_key=True, index=True)
    fechaInicio = Column(DateTime, nullable=False)
    fechaFin = Column(DateTime, nullable=True)

class Permiso(Base):
    __tablename__ = "permiso"
    id_permiso = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)

class Proveedor(Base):
    __tablename__ = "proveedor"
    cuil = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(Integer, nullable=False)
    razon_social = Column(String, nullable=False)

class Repuesto(Base):
    __tablename__ = "repuesto"
    codigo = Column(Integer, primary_key=True, index=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    cuil_proveedor = Column(Integer, nullable=False)
    costo = Column(Integer, nullable=False)

class RespuestoxServicio(Base):
    __tablename__ = "RespuestoxServicio"
    codigo_servicio = Column(Integer, primary_key=True, index=True)
    codigo_repuesto = Column(Integer, primary_key=True, index = True)
    cantidad = Column(Integer, nullable=False)

class Rol(Base):
    __tablename__ = "Rol"
    id_rol = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)

class RolxPermiso(Base):
    __tablename__ = "RolxPermiso"
    id_rol = Column(Integer, primary_key=True, index=True)
    id_permiso = Column(Integer, primary_key=True, index=True)

class Servicio(Base):
    __tablename__ = "Servicio"
    codigo = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)
    precioBase = Column(Integer, nullable=False)

class Sesion(Base):
    __tablename__ = "Sesion"
    cod_sesion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(String, nullable=False)
    fecha = Column(Date, nullable=False)
    horaInicio = Column(Time, nullable=False)
    horaFin = Column(Time, nullable=False)