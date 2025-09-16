from sqlalchemy import Date, Time, DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, Integer, String, ForeignKey

# Cambia la ruta y el motor según tu base de datos
DATABASE_URL = "sqlite:///C:/Users/bauti/Desktop/UTN/SEMINARIO INTEGRADOR/ProyectoInt[v.1].db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Usuario(Base):
    __tablename__ = "Usuario"
    idUsuario = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    activo = Column(Integer, nullable=False)


class Rol(Base):
    __tablename__ = "Rol"
    idRol = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)


class Cliente(Base):
    __tablename__ = "Cliente"
    tipoDocumento = Column(String, primary_key=True)
    numeroDni = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    telefono = Column(Integer, nullable=False)
    mail = Column(String, nullable=False)
    activo = Column(Integer, nullable=False)


class Dispositivo(Base):
    __tablename__ = "Dispositivo"
    nroSerie = Column(String, primary_key=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    clienteTipoDni = Column(String, ForeignKey("Cliente.tipo_documento"), nullable=False)
    clienteDni = Column(Integer, ForeignKey("Cliente.numero_dni"), nullable=False)
    activo = Column(Integer, nullable=False)


class Empleado(Base):
    __tablename__ = "Empleado"
    idEmpleado = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    idRol = Column(Integer, ForeignKey("Rol.id_rol"), nullable=False)
    idUsuario = Column(String, ForeignKey("Usuario.id_usuario"), nullable=False)
    activo = Column(Integer, nullable=False)


class Estado(Base):
    __tablename__ = "Estado"
    codEstado = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)


class Servicio(Base):
    __tablename__ = "Servicio"
    codigo = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)
    precioBase = Column(Integer, nullable=False)
    activo = Column(Integer, nullable=False)


class OrdenDeReparacion(Base):
    __tablename__ = "OrdenDeReparacion"
    nroDeOrden = Column(Integer, primary_key=True)
    nroSerieDispositivo = Column(String, ForeignKey("Dispositivo.nroSerie"), nullable=False)
    fecha = Column(String, nullable=False)
    descripcionDaños = Column(String, nullable=False)
    diagnostico = Column(String, nullable=False)
    codigoServicio = Column(Integer, ForeignKey("Servicio.codigo"), nullable=False)
    presupuesto = Column(Integer, nullable=False)
    idEmpleado = Column(Integer, ForeignKey("Empleado.id_empleado"), nullable=False)


class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    dispositivo = Column(Integer, primary_key=True)
    nroDeOrden = Column(Integer, primary_key=True)


class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    codEstado = Column(Integer, ForeignKey("Estado.cod_estado"), primary_key=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"))
    fechaInicio = Column(String, nullable=False)
    fechaFin = Column(String, nullable=True)


class Permiso(Base):
    __tablename__ = "Permiso"
    idPermiso = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)


class Proveedor(Base):
    __tablename__ = "Proveedor"
    cuil = Column(Integer, primary_key=True)
    razonSocial = Column(String, nullable=False)
    telefono = Column(Integer, nullable=False)
    activo = Column(Integer, nullable=False)


class Repuesto(Base):
    __tablename__ = "Repuesto"
    codigo = Column(Integer, primary_key=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    cuilProveedor = Column(Integer, ForeignKey("Proveedor.cuil"), nullable=False)
    costo = Column(Integer, nullable=False)
    activo = Column(Integer, nullable=False)


class RepuestoxServicio(Base):
    __tablename__ = "RepuestoxServicio"
    codigoServicio = Column(Integer, ForeignKey("Servicio.codigo"), primary_key=True)
    codigoRepuesto = Column(Integer, ForeignKey("Repuesto.codigo"), primary_key=True)
    cantidad = Column(Integer, nullable=False)


class RolxPermiso(Base):
    __tablename__ = "RolxPermiso"
    idRol = Column(Integer, ForeignKey("Rol.id_rol"), primary_key=True)
    idPermiso = Column(Integer, ForeignKey("Permiso.id_permiso"), primary_key=True)


class Sesion(Base):
    __tablename__ = "Sesion"
    codSesion = Column(Integer, primary_key=True)
    idUsuario = Column(String, ForeignKey("Usuario.id_usuario"), nullable=False)
    horaInicio = Column(Integer, nullable=False)
    horaFin = Column(String, nullable=False)
    fecha = Column(String, nullable=False)