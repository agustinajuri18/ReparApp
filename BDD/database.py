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
    id_usuario = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    activo = Column(Integer, nullable=False)


class Rol(Base):
    __tablename__ = "Rol"
    id_rol = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)


class Cliente(Base):
    __tablename__ = "Cliente"
    tipo_documento = Column(String, primary_key=True)
    numero_dni = Column(Integer, primary_key=True)
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
    id_empleado = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    id_rol = Column(Integer, ForeignKey("Rol.id_rol"), nullable=False)
    id_usuario = Column(String, ForeignKey("Usuario.id_usuario"), nullable=False)
    activo = Column(Integer, nullable=False)


class Estado(Base):
    __tablename__ = "Estado"
    cod_estado = Column(Integer, primary_key=True)
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
    nroSerie_dispositivo = Column(String, ForeignKey("Dispositivo.nroSerie"), nullable=False)
    fecha = Column(String, nullable=False)
    descripcion_daños = Column(String, nullable=False)
    diagnostico = Column(String, nullable=False)
    codigo_servicio = Column(Integer, ForeignKey("Servicio.codigo"), nullable=False)
    presupuesto = Column(Integer, nullable=False)
    id_empleado = Column(Integer, ForeignKey("Empleado.id_empleado"), nullable=False)


class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    dispositivo = Column(Integer, primary_key=True)
    nroDeOrden = Column(Integer, primary_key=True)


class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    cod_estado = Column(Integer, ForeignKey("Estado.cod_estado"), primary_key=True)
    nro_orden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"))
    fecha_inicio = Column(String, nullable=False)
    fecha_fin = Column(String, nullable=True)


class Permiso(Base):
    __tablename__ = "Permiso"
    id_permiso = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)


class Proveedor(Base):
    __tablename__ = "Proveedor"
    cuil = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    telefono = Column(Integer, nullable=False)
    razon_social = Column(String, nullable=False)
    activo = Column(Integer, nullable=False)


class Repuesto(Base):
    __tablename__ = "Repuesto"
    codigo = Column(Integer, primary_key=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    cuil_proveedor = Column(Integer, ForeignKey("Proveedor.cuil"), nullable=False)
    costo = Column(Integer, nullable=False)
    activo = Column(Integer, nullable=False)


class RepuestoxServicio(Base):
    __tablename__ = "RepuestoxServicio"
    codigo_servicio = Column(Integer, ForeignKey("Servicio.codigo"), primary_key=True)
    codigo_repuesto = Column(Integer, ForeignKey("Repuesto.codigo"), primary_key=True)
    cantidad = Column(Integer, nullable=False)


class RolxPermiso(Base):
    __tablename__ = "RolxPermiso"
    id_rol = Column(Integer, ForeignKey("Rol.id_rol"), primary_key=True)
    id_permiso = Column(Integer, ForeignKey("Permiso.id_permiso"), primary_key=True)


class Sesion(Base):
    __tablename__ = "Sesion"
    cod_sesion = Column(Integer, primary_key=True)
    id_usuario = Column(String, ForeignKey("Usuario.id_usuario"), nullable=False)
    hora_inicio = Column(Integer, nullable=False)
    hora_fin = Column(String, nullable=False)
    fecha = Column(String, nullable=False)