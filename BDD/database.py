from sqlalchemy import (
    Date, Time, DateTime, create_engine, ForeignKeyConstraint,
    Column, Integer, String, Float, ForeignKey,
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# Cambia la ruta y el motor según tu base de datos
import os
from pathlib import Path

# Prefer an environment variable (should be a full SQLAlchemy URL). If not set,
# construct a sqlite URL pointing at the included database file.
env_url = os.getenv("DATABASE_URL")
if env_url:
    DATABASE_URL = env_url
else:
    # Construct a file-based sqlite URL. Using absolute path to the provided DB.
    bundled_db = Path(__file__).resolve().parent / "ProyectoV5.db"
    # If the bundled DB doesn't exist, fall back to the original path (converted)
    if not bundled_db.exists():
        # Original location (user's desktop) converted to a path safe for sqlite
        original_path = Path(r"C:/Users/LENOVO/Desktop/- FACU -/3er AÑO -/SEM -/DatabaseProyecto v.1/ProyectoV5.db")
        db_path = original_path if original_path.exists() else bundled_db
    else:
        db_path = bundled_db
    # SQLite URL requires three slashes for absolute paths
    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Tablas principales del esquema del PDF ---

class TipoDocumento(Base):
    __tablename__ = "TipoDocumento"
    idTipoDoc = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    clientes = relationship("Cliente", back_populates="tipo_documento_rel")
    def __repr__(self):
        return f"<TipoDocumento(idTipoDoc={self.idTipoDoc}, nombre={self.nombre})>"

class Cliente(Base):
    __tablename__ = "Cliente"
    idCliente = Column(Integer, primary_key=True, nullable = False)
    tipoDocumento = Column(Integer, ForeignKey("TipoDocumento.idTipoDoc"), nullable=False)
    numeroDoc = Column(Integer, nullable=False)
    nombre = Column(String(50))
    apellido = Column(String(50))
    mail = Column(String(50))
    telefono = Column(String(20))
    activo = Column(Integer, nullable=False, default=1)
    tipo_documento_rel = relationship("TipoDocumento", back_populates="clientes")
    dispositivos = relationship("Dispositivo", back_populates="cliente")
    def __repr__(self):
        return f"<Cliente({self.tipoDocumento}-{self.numeroDoc}, {self.nombre} {self.apellido})>"

class Cargo(Base):
    __tablename__ = "Cargo"
    idCargo = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String)
    empleados = relationship("Empleado", back_populates="cargo")
    permisos = relationship("CargoxPermiso", back_populates="cargo")
    def __repr__(self):
        return f"<Cargo(idCargo={self.idCargo}, descripcion={self.descripcion})>"

class Empleado(Base):
    __tablename__ = "Empleado"
    idEmpleado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String)
    apellido = Column(String)
    idCargo = Column(Integer, ForeignKey("Cargo.idCargo"))
    idUsuario = Column(Integer, ForeignKey("Usuario.idUsuario"))
    activo = Column(Integer, nullable=False, default=1)
    cargo = relationship("Cargo", back_populates="empleados")
    usuario = relationship("Usuario", back_populates="empleados")
    ordenes = relationship("OrdenDeReparacion", back_populates="empleado")
    def __repr__(self):
        return f"<Empleado(idEmpleado={self.idEmpleado}, nombre={self.nombre}, apellido={self.apellido})>"

class Usuario(Base):
    __tablename__ = "Usuario"
    idUsuario = Column(Integer, primary_key=True, autoincrement=True)
    nombreUsuario = Column(String(50), nullable=False)
    contraseña = Column(String(50), nullable=False)
    activo = Column(Integer, nullable=False, default=1)
    sesiones = relationship("Sesion", back_populates="usuario")
    empleados = relationship("Empleado", back_populates="usuario")
    def __repr__(self):
        return f"<Usuario(idUsuario={self.idUsuario}, nombreUsuario={self.nombreUsuario})>"

class Sesion(Base):
    __tablename__ = "Sesion"
    idSesion = Column(Integer, primary_key=True)
    idUsuario = Column(Integer, ForeignKey("Usuario.idUsuario"), nullable=False)
    horaInicio = Column(DateTime, nullable=False)
    horaFin = Column(DateTime)
    fecha = Column(Date, nullable=False)
    usuario = relationship("Usuario", back_populates="sesiones")
    def __repr__(self):
        return f"<Sesion(idSesion={self.idSesion}, idUsuario={self.idUsuario})>"

class Dispositivo(Base):
    __tablename__ = "Dispositivo"
    idDispositivo = Column(Integer, primary_key = True)
    nroSerie = Column(String)
    marca = Column(String)
    modelo = Column(String)
    clienteTipoDocumento = Column(Integer, nullable=False)
    clienteNumeroDoc = Column(Integer, nullable=False)
    activo = Column(Integer, nullable=False, default=1)
    __table_args__ = (
        ForeignKeyConstraint(
            ['clienteNumeroDoc', 'clienteTipoDocumento'],
            ['Cliente.numeroDoc', 'Cliente.tipoDocumento']
        ),
    )
    cliente = relationship("Cliente", back_populates="dispositivos",
                           primaryjoin="and_(Cliente.numeroDoc == Dispositivo.clienteNumeroDoc, "
                                       "Cliente.tipoDocumento == Dispositivo.clienteTipoDocumento)")
    ordenes = relationship("OrdenDeReparacion", back_populates="dispositivo")
    historial_arreglos = relationship("HistorialArreglos", back_populates="dispositivo")
    def __repr__(self):
        return f"<Dispositivo(nroSerie={self.nroSerie}, marca={self.marca}, modelo={self.modelo})>"

class OrdenDeReparacion(Base):
    __tablename__ = "OrdenDeReparacion"
    idOrden = Column(Integer, primary_key=True, autoincrement=True)
    idDispositivo = Column(String, ForeignKey("Dispositivo.idDispositivo"))
    fecha = Column(Date)
    descripcionDanos = Column(String)
    diagnostico = Column(String)
    presupuesto = Column(Integer)
    idEmpleado = Column(Integer, ForeignKey("Empleado.idEmpleado"))
    dispositivo = relationship("Dispositivo", back_populates="ordenes")
    empleado = relationship("Empleado", back_populates="ordenes")
    detalles = relationship("DetalleOrden", back_populates="orden")
    historial_arreglos = relationship("HistorialArreglos", back_populates="orden")
    historial_estados = relationship("HistorialEstadoOrden", back_populates="orden")
    def __repr__(self):
        return f"<OrdenDeReparacion(idOrden={self.idOrden}, fecha={self.fecha})>"

class Servicio(Base):
    __tablename__ = "Servicio"
    idServicio = Column(Integer, primary_key=True)
    descripcion = Column(String)
    precioBase = Column(Integer)
    activo = Column(Integer, nullable=False, default=1)
    detalles = relationship("DetalleOrden", back_populates="servicio")
    def __repr__(self):
        return f"<Servicio(idServicio={self.idServicio}, descripcion={self.descripcion})>"

class DetalleOrden(Base):
    __tablename__ = "DetalleOrden"
    idDetalle = Column(Integer, primary_key=True, nullable=False)
    idOrden = Column(Integer, ForeignKey("OrdenDeReparacion.idOrden"), primary_key=True, nullable=False)
    idServicio = Column(Integer, ForeignKey("Servicio.idServicio"), nullable=False)
    idRepuestos = Column(Integer, nullable=False)
    idProveedor = Column(String, nullable=False)  # Cambiado a String
    costoServicio = Column(Float)
    costoRepuesto = Column(Float)
    subtotal = Column(Float)
    __table_args__ = (
        ForeignKeyConstraint(
            ['idRepuestos', 'idProveedor'],
            ['RepuestoxProveedor.idRepuesto', 'RepuestoxProveedor.idProveedor']
        ),
    )

    orden = relationship("OrdenDeReparacion", back_populates="detalles")
    servicio = relationship("Servicio", back_populates="detalles")
    repuesto_proveedor = relationship(
        "RepuestoxProveedor",
        primaryjoin=(
            "and_(DetalleOrden.idRepuestos == RepuestoxProveedor.idRepuesto, "
            "DetalleOrden.idProveedor == RepuestoxProveedor.idProveedor)"
        ),
    )

    def __repr__(self):
        return f"<DetalleOrden(idDetalle={self.idDetalle}, nroDeOrden={self.idOrden})>"

class Repuesto(Base):
    __tablename__ = "Repuesto"
    idRepuesto = Column(Integer, primary_key=True)
    marca = Column(String)
    modelo = Column(String)
    activo = Column(Integer, nullable=False, default=1)
    proveedores_rel = relationship("RepuestoxProveedor", back_populates="repuesto")
    def __repr__(self):
        return f"<Repuesto(idRepuesto={self.idRepuesto}, marca={self.marca}, modelo={self.modelo})>"

class Proveedor(Base):
    __tablename__ = "Proveedor"
    idProveedor = Column(Integer, primary_key=True, autoincrement=True)
    cuil = Column(String, primary_key=True)  # Cambiado a String
    telefono = Column(String)  # Cambiado a String
    razonSocial = Column(String)
    activo = Column(Integer, nullable=False, default=1)
    repuestos_rel = relationship("RepuestoxProveedor", back_populates="proveedor")
    def __repr__(self):
        return f"<Proveedor(cuil={self.cuil}, razonSocial={self.razonSocial})>"

class RepuestoxProveedor(Base):
    __tablename__ = "RepuestoxProveedor"
    idRepuesto = Column(Integer, ForeignKey("Repuesto.idRepuesto"), primary_key=True, nullable=False)
    idProveedor = Column(String, ForeignKey("Proveedor.idProveedor"), primary_key=True, nullable=False)  # Cambiado a String
    costo = Column(Integer)
    cantidad = Column(Integer)
    repuesto = relationship("Repuesto", back_populates="proveedores_rel")
    proveedor = relationship("Proveedor", back_populates="repuestos_rel")
    def __repr__(self):
        return f"<RepuestoxProveedor(idRepuesto={self.idRepuesto}, idProveedor={self.idProveedor})>"

class Permiso(Base):
    __tablename__ = "Permiso"
    idPermiso = Column(Integer, primary_key=True)
    descripcion = Column(String)
    cargos = relationship("CargoxPermiso", back_populates="permiso")
    def __repr__(self):
        return f"<Permiso(idPermiso={self.idPermiso}, descripcion={self.descripcion})>"

class CargoxPermiso(Base):
    __tablename__ = "CargoxPermiso"
    idCargo = Column(Integer, ForeignKey("Cargo.idCargo"), primary_key=True, nullable=False)
    idPermiso = Column(Integer, ForeignKey("Permiso.idPermiso"), primary_key=True, nullable=False)
    cargo = relationship("Cargo", back_populates="permisos")
    permiso = relationship("Permiso", back_populates="cargos")
    def __repr__(self):
        return f"<CargoxPermiso(idCargo={self.idCargo}, idPermiso={self.idPermiso})>"

class Estado(Base):
    __tablename__ = "Estado"
    idEstado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String)
    historial = relationship("HistorialEstadoOrden", back_populates="estado")
    def __repr__(self):
        return f"<Estado(idEstado={self.idEstado}, nombre={self.nombre})>"

class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    idHistorial = Column(Integer, primary_key=True, autoincrement=True)
    idOrden = Column(Integer, ForeignKey("OrdenDeReparacion.idOrden"), nullable=False)
    idEstado = Column(Integer, ForeignKey("Estado.idEstado"), nullable=False)
    fechaCambio = Column(DateTime, nullable=False)
    observaciones = Column(String)
    orden = relationship("OrdenDeReparacion", back_populates="historial_estados")
    estado = relationship("Estado", back_populates="historial")
    def __repr__(self):
        return f"<HistorialEstadoOrden(idHistorial={self.idHistorial}, nroDeOrden={self.nroDeOrden}, codEstado={self.codEstado})>"

class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    idHistorial = Column(Integer, primary_key=True, autoincrement=True)
    idOrden = Column(Integer, ForeignKey("OrdenDeReparacion.idOrden"), nullable=False)
    idDispositivo = Column(String, ForeignKey("Dispositivo.idDispositivo"), nullable=False)
    fechaArreglo = Column(DateTime, nullable=False)
    descripcion = Column(String)
    dispositivo = relationship("Dispositivo", back_populates="historial_arreglos")
    orden = relationship("OrdenDeReparacion", back_populates="historial_arreglos")
    def __repr__(self):
        return f"<HistorialArreglos(idHistorial={self.idHistorial}, nroDeOrden={self.nroDeOrden}, nroSerieDispositivo={self.nroSerieDispositivo})>"


class ServicioxRepuesto(Base):
    __tablename__ = "ServicioxRepuesto"
    idServicio = Column(Integer, ForeignKey("Servicio.idServicio"), primary_key=True, nullable=False)
    idRepuesto = Column(Integer, ForeignKey("Repuesto.idRepuesto"), primary_key=True, nullable=False)
    cantidad = Column(Integer)
    servicio = relationship("Servicio")
    repuesto = relationship("Repuesto")
    def __repr__(self):
        return f"<ServicioxRepuesto(idServicio={self.idServicio}, idRepuesto={self.idRepuesto})>"

if __name__ == "__main__":
    Base.metadata.create_all(engine)