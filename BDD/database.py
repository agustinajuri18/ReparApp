from sqlalchemy import Date, Time, DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, Integer, String, ForeignKey

# Cambia la ruta y el motor según tu base de datos

DATABASE_URL = r"sqlite:///C:/Users/LENOVO/Desktop/- FACU -/3er AÑO -/SEM -/DatabaseProyecto v.1/ProyectoV3.db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Usuario(Base):
    __tablename__ = "Usuario"
    idUsuario = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    activo = Column(Integer, nullable=False)
    sesiones = relationship("Sesion", back_populates="usuario")
    empleados = relationship("Empleado", back_populates="usuario")


class Rol(Base):
    __tablename__ = "Rol"
    idRol = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)
    empleados = relationship("Empleado", back_populates="rol")
    permisos = relationship("RolxPermiso", back_populates="rol")


class Cliente(Base):
    __tablename__ = "Cliente"
    tipoDocumento = Column(String, primary_key=True)
    numeroDni = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    telefono = Column(String, nullable=False)   # cambiar a String para aceptar 0s y prefijos
    mail = Column(String, nullable=False)
    activo = Column(Integer, nullable=False)
    dispositivos = relationship("Dispositivo", back_populates="cliente")


class Dispositivo(Base):
    __tablename__ = "Dispositivo"
    nroSerie = Column(String, primary_key=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    clienteTipoDocumento = Column(String, ForeignKey("Cliente.tipoDocumento"), nullable=False)
    clienteNumeroDni = Column(Integer, ForeignKey("Cliente.numeroDni"), nullable=False)
    activo = Column(Integer, nullable=False)
    cliente = relationship("Cliente", back_populates="dispositivos")


class Empleado(Base):
    __tablename__ = "Empleado"
    idEmpleado = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    idRol = Column(Integer, ForeignKey("Rol.idRol"), nullable=False)
    idUsuario = Column(String, ForeignKey("Usuario.idUsuario"), nullable=False)
    activo = Column(Integer, nullable=False)
    rol = relationship("Rol", back_populates="empleados")
    usuario = relationship("Usuario", back_populates="empleados")


class Estado(Base):
    __tablename__ = "Estado"
    codEstado = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    historial = relationship("HistorialEstadoOrden", back_populates="estado")


class Servicio(Base):
    __tablename__ = "Servicio"
    codigo = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)
    precioBase = Column(Integer, nullable=False)
    tiempoEstimado = Column(Integer, nullable=True)  # minutos u horas según uso
    activo = Column(Integer, nullable=False)
    repuestos = relationship("RepuestoxServicio", back_populates="servicio")


class OrdenDeReparacion(Base):
    __tablename__ = "OrdenDeReparacion"
    nroDeOrden = Column(Integer, primary_key=True)
    nroSerieDispositivo = Column(String, ForeignKey("Dispositivo.nroSerie"), nullable=False)
    fecha = Column(Date, nullable=False)  # usar Date para consistencia
    descripcionDanios = Column(String, nullable=False)
    diagnostico = Column(String, nullable=False)
    codigoServicio = Column(Integer, ForeignKey("Servicio.codigo"), nullable=False)
    presupuesto = Column(Integer, nullable=False)
    idEmpleado = Column(Integer, ForeignKey("Empleado.idEmpleado"), nullable=False)
    historial_estados = relationship("HistorialEstadoOrden", back_populates="orden")


class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    nroSerieDispositivo = Column(String, primary_key=True)
    nroDeOrden = Column(Integer, primary_key=True)


class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    codEstado = Column(Integer, ForeignKey("Estado.codEstado"), primary_key=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), primary_key=True)
    fechaInicio = Column(DateTime, nullable=False)
    fechaFin = Column(DateTime, nullable=True)
    estado = relationship("Estado", back_populates="historial")
    orden = relationship("OrdenDeReparacion", back_populates="historial_estados")


class Permiso(Base):
    __tablename__ = "Permiso"
    idPermiso = Column(Integer, primary_key=True)
    descripcion = Column(String, nullable=False)


class Proveedor(Base):
    __tablename__ = 'Proveedor'
    cuil = Column(Integer, primary_key=True)
    razonSocial = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    mail = Column(String, nullable=True)
    activo = Column(Integer, default=1)
    repuestos = relationship("Repuesto", back_populates="proveedor")


class Repuesto(Base):
    __tablename__ = "Repuesto"
    codigo = Column(Integer, primary_key=True)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    cuilProveedor = Column(Integer, ForeignKey("Proveedor.cuil"), nullable=False)
    activo = Column(Integer, nullable=False)
    proveedor = relationship("Proveedor", back_populates="repuestos")
    servicios = relationship("RepuestoxServicio", back_populates="repuesto")

class RepuestoxProveedor(Base):
    __tablename__ = "RepuestoxProveedor"
    codigoRepuesto = Column(Integer, primary_key=True)
    cuilProveedor = Column(Integer, primary_key= True)
    costo = Column(Integer, nullable = False)
    cantidad = Column(Integer, nullable= False)


class RepuestoxServicio(Base):
    __tablename__ = "RepuestoxServicio"
    codigoServicio = Column(Integer, ForeignKey("Servicio.codigo"), primary_key=True)
    codigoRepuesto = Column(Integer, ForeignKey("Repuesto.codigo"), primary_key=True)
    cantidad = Column(Integer, nullable=False)
    servicio = relationship("Servicio", back_populates="repuestos")
    repuesto = relationship("Repuesto", back_populates="servicios")


class RolxPermiso(Base):
    __tablename__ = "RolxPermiso"
    idRol = Column(Integer, ForeignKey("Rol.idRol"), primary_key=True)
    idPermiso = Column(Integer, ForeignKey("Permiso.idPermiso"), primary_key=True)
    rol = relationship("Rol", back_populates="permisos")


class Sesion(Base):
    __tablename__ = "Sesion"
    codSesion = Column(Integer, primary_key=True)
    idUsuario = Column(String, ForeignKey("Usuario.idUsuario"), nullable=False)
    horaInicio = Column(DateTime, nullable=False)
    horaFin = Column(DateTime, nullable=True)
    fecha = Column(Date, nullable=False)
    usuario = relationship("Usuario", back_populates="sesiones")


if __name__ == "__main__":
    Base.metadata.create_all(engine)