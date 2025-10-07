from sqlalchemy import (
    Date, Time, DateTime, create_engine, ForeignKeyConstraint,
    Column, Integer, String, Float, ForeignKey,
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# Cambia la ruta y el motor según tu base de datos

DATABASE_URL = r"sqlite:///C:/Users/Leonardo/Desktop/Seminario/ReparApp/BDD/ProyectoV3 con cambios.db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Tablas principales del esquema del PDF ---

class TipoDocumento(Base):
    __tablename__ = "TipoDocumento"
    codTipoDoc = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    clientes = relationship("Cliente", back_populates="tipo_documento_rel")
    def __repr__(self):
        return f"<TipoDocumento(codTipoDoc={self.codTipoDoc}, nombre={self.nombre})>"

class Cliente(Base):
    __tablename__ = "Cliente"
    tipoDocumento = Column(Integer, ForeignKey("TipoDocumento.codTipoDoc"), primary_key=True, nullable=False)
    numeroDoc = Column(Integer, primary_key=True, nullable=False)
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
    codSesion = Column(Integer, primary_key=True)
    idUsuario = Column(Integer, ForeignKey("Usuario.idUsuario"), nullable=False)
    horaInicio = Column(DateTime, nullable=False)
    horaFin = Column(DateTime)
    fecha = Column(Date, nullable=False)
    usuario = relationship("Usuario", back_populates="sesiones")
    def __repr__(self):
        return f"<Sesion(codSesion={self.codSesion}, idUsuario={self.idUsuario})>"

class Dispositivo(Base):
    __tablename__ = "Dispositivo"
    nroSerie = Column(String, primary_key=True)
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
    nroDeOrden = Column(Integer, primary_key=True, autoincrement=True)
    nroSerieDispositivo = Column(String, ForeignKey("Dispositivo.nroSerie"))
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
        return f"<OrdenDeReparacion(nroDeOrden={self.nroDeOrden}, fecha={self.fecha})>"

class Servicio(Base):
    __tablename__ = "Servicio"
    codigo = Column(Integer, primary_key=True)
    descripcion = Column(String)
    precioBase = Column(Integer)
    activo = Column(Integer, nullable=False, default=1)
    detalles = relationship("DetalleOrden", back_populates="servicio")
    def __repr__(self):
        return f"<Servicio(codigo={self.codigo}, descripcion={self.descripcion})>"

class DetalleOrden(Base):
    __tablename__ = "DetalleOrden"
    idDetalle = Column(Integer, primary_key=True, nullable=False)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), primary_key=True, nullable=False)
    codigoServicio = Column(Integer, ForeignKey("Servicio.codigo"), nullable=False)
    codRepuestos = Column(Integer, nullable=False)
    cuitProveedor = Column(String, nullable=False)  # Cambiado a String
    costoServicio = Column(Float)
    costoRepuesto = Column(Float)
    subtotal = Column(Float)
    __table_args__ = (
        ForeignKeyConstraint(
            ['codRepuestos', 'cuitProveedor'],
            ['RepuestoxProveedor.codigoRepuesto', 'RepuestoxProveedor.cuilProveedor']
        ),
    )
    orden = relationship("OrdenDeReparacion", back_populates="detalles")
    servicio = relationship("Servicio", back_populates="detalles")
    repuesto_proveedor = relationship("RepuestoxProveedor",
                                     primaryjoin="and_(DetalleOrden.codRepuestos == RepuestoxProveedor.codigoRepuesto, "
                                                 "DetalleOrden.cuitProveedor == RepuestoxProveedor.cuilProveedor)")
    def __repr__(self):
        return f"<DetalleOrden(idDetalle={self.idDetalle}, nroDeOrden={self.nroDeOrden})>"

class Repuesto(Base):
    __tablename__ = "Repuesto"
    codigo = Column(Integer, primary_key=True)
    marca = Column(String)
    modelo = Column(String)
    activo = Column(Integer, nullable=False, default=1)
    proveedores_rel = relationship("RepuestoxProveedor", back_populates="repuesto")
    def __repr__(self):
        return f"<Repuesto(codigo={self.codigo}, marca={self.marca}, modelo={self.modelo})>"

class Proveedor(Base):
    __tablename__ = "Proveedor"
    cuil = Column(String, primary_key=True)  # Cambiado a String
    telefono = Column(String)  # Cambiado a String
    razonSocial = Column(String)
    activo = Column(Integer, nullable=False, default=1)
    repuestos_rel = relationship("RepuestoxProveedor", back_populates="proveedor")
    def __repr__(self):
        return f"<Proveedor(cuil={self.cuil}, razonSocial={self.razonSocial})>"

class RepuestoxProveedor(Base):
    __tablename__ = "RepuestoxProveedor"
    codigoRepuesto = Column(Integer, ForeignKey("Repuesto.codigo"), primary_key=True, nullable=False)
    cuilProveedor = Column(String, ForeignKey("Proveedor.cuil"), primary_key=True, nullable=False)  # Cambiado a String
    costo = Column(Integer)
    cantidad = Column(Integer)
    repuesto = relationship("Repuesto", back_populates="proveedores_rel")
    proveedor = relationship("Proveedor", back_populates="repuestos_rel")
    def __repr__(self):
        return f"<RepuestoxProveedor(codigoRepuesto={self.codigoRepuesto}, cuilProveedor={self.cuilProveedor})>"

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
    codEstado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String)
    historial = relationship("HistorialEstadoOrden", back_populates="estado")
    def __repr__(self):
        return f"<Estado(codEstado={self.codEstado}, nombre={self.nombre})>"

class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    idHistorial = Column(Integer, primary_key=True, autoincrement=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), nullable=False)
    codEstado = Column(Integer, ForeignKey("Estado.codEstado"), nullable=False)
    fechaCambio = Column(DateTime, nullable=False)
    observaciones = Column(String)
    orden = relationship("OrdenDeReparacion", back_populates="historial_estados")
    estado = relationship("Estado", back_populates="historial")
    def __repr__(self):
        return f"<HistorialEstadoOrden(idHistorial={self.idHistorial}, nroDeOrden={self.nroDeOrden}, codEstado={self.codEstado})>"

class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    idHistorial = Column(Integer, primary_key=True, autoincrement=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), nullable=False)
    nroSerieDispositivo = Column(String, ForeignKey("Dispositivo.nroSerie"), nullable=False)
    fechaArreglo = Column(DateTime, nullable=False)
    descripcion = Column(String)
    dispositivo = relationship("Dispositivo", back_populates="historial_arreglos")
    orden = relationship("OrdenDeReparacion", back_populates="historial_arreglos")
    def __repr__(self):
        return f"<HistorialArreglos(idHistorial={self.idHistorial}, nroDeOrden={self.nroDeOrden}, nroSerieDispositivo={self.nroSerieDispositivo})>"


if __name__ == "__main__":
    Base.metadata.create_all(engine)