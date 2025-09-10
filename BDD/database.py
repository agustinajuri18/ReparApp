from sqlalchemy import Date, Time
from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey

# Cambia la ruta y el motor según tu base de datos
DATABASE_URL = "sqlite:///C:/Users/LENOVO/Desktop/- FACU -/3er AÑO -/SEM -/DatabaseProyecto v.1/ProyectoInt[v.1].db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Usuario(Base):
    __tablename__ = "Usuario"
    idUsuario = Column(String, primary_key=True, index=True)
    password = Column(String, nullable=False)


class Rol(Base):
    __tablename__ = "Rol"
    idRol = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)


class Cliente(Base):
    __tablename__ = "Cliente"
    tipoDocumento = Column(String, primary_key=True, index=True)
    numeroDni = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    telefono = Column(Integer, nullable = False)
    mail = Column(String, nullable=False)


class Dispositivo(Base):
    __tablename__ = "Dispositivo"
    nroSerie = Column(String, primary_key=True, index=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    clienteTipoDni = Column(String, ForeignKey(Cliente.tipoDoocumento), nullable=False)
    clienteDni = Column(Integer, ForeignKey(Cliente.numeroDni), nullable=False)


class Empleado(Base):
    __tablename__ = "Empleado"
    idEmpleado = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    idRol = Column(Integer, ForeignKey(Rol.idRol), nullable=False)
    idUsuario = Column(String, ForeignKey(Usuario.idUsuario), nullable=False)


class Estado(Base):
    __tablename__ = "Estado"
    codEstado = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)


class Servicio(Base):
    __tablename__ = "Servicio"
    codigo = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)
    precioBase = Column(Integer, nullable=False)


class OrdenDeReparacion(Base):
    __tablename__ = "OrdenDeReparacion"
    nroDeOrden = Column(Integer, primary_key=True, index=True)
    nroSerieDispositivo = Column(String, ForeignKey(Dispositivo.nroSerie), nullable=False)
    fecha = Column(Date, nullable=False)
    descripcionDanos = Column(String, nullable=False)
    diagnostico = Column(String, nullable=False)
    codigoServicio = Column(Integer, ForeignKey(Servicio.codigo), nullable=False)
    presupuesto = Column(Integer, nullable=False)
    idEmpleado = Column(Integer,ForeignKey(Empleado.idEmpleado), nullable=False)


class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    nroSerieDispositivo = Column(String, primary_key=True, index=True)
    nroDeOrden = Column(Integer, primary_key=True, index=True)


class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    nroDeOrden = Column(Integer, primary_key=True, index=True)
    codEstado = Column(Integer, primary_key=True, index=True)
    fechaInicio = Column(DateTime, nullable=False)
    fechaFin = Column(DateTime, nullable=True)


class Permiso(Base):
    __tablename__ = "Permiso"
    idPermiso = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)


class Proveedor(Base):
    __tablename__ = "Proveedor"
    cuil = Column(Integer, primary_key=True, index=True)
    razonSocial = Column(String, nullable=False)
    telefono = Column(Integer, nullable=False)


class Repuesto(Base):
    __tablename__ = "Repuesto"
    codigo = Column(Integer, primary_key=True, index=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    cuilProveedor = Column(Integer,ForeignKey(Proveedor.cuil), nullable=False)
    costo = Column(Integer, nullable=False)


class RespuestoxServicio(Base):
    __tablename__ = "RespuestoxServicio"
    codigoServicio = Column(Integer, primary_key=True, index=True)
    codigoRepuesto = Column(Integer, primary_key=True, index = True)
    cantidad = Column(Integer, nullable=False)


class RolxPermiso(Base):
    __tablename__ = "RolxPermiso"
    idRol = Column(Integer, primary_key=True, index=True)
    idPermiso = Column(Integer, primary_key=True, index=True)


class Sesion(Base):
    __tablename__ = "Sesion"
    codSesion = Column(Integer, primary_key=True, index=True)
    idUsuario = Column(String, ForeignKey(Usuario.idUsuario), nullable=False)
    fecha = Column(Date, nullable=False)
    horaInicio = Column(Time, nullable=False)
    horaFin = Column(Time, nullable=False)
