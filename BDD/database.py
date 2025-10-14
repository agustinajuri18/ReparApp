from sqlalchemy import (
    Date, DateTime, create_engine, ForeignKeyConstraint,
    Column, Integer, String, Float, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

import os
from pathlib import Path

# --- Configuración de la Base de Datos ---

# Se prioriza una variable de entorno (debería ser una URL completa de SQLAlchemy).
# Si no está configurada, se construye una URL para un archivo sqlite local.
env_url = os.getenv("DATABASE_URL")
if env_url:
    DATABASE_URL = env_url
else:
    # Construye una URL de sqlite basada en un archivo.
    db_path = Path(__file__).resolve().parent / "ProyectoV5.db"
    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Definición de Modelos (Tablas) ---

class TipoDocumento(Base):
    __tablename__ = "TipoDocumento"
    idTipoDoc = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False, unique=True)
    
    clientes = relationship("Cliente", back_populates="tipo_documento")

    def __repr__(self):
        return f"<TipoDocumento(idTipoDoc={self.idTipoDoc}, nombre='{self.nombre}')>"

class Cliente(Base):
    __tablename__ = "Cliente"
    idCliente = Column(Integer, primary_key=True, autoincrement=True)
    idTipoDoc = Column(Integer, ForeignKey("TipoDocumento.idTipoDoc"), nullable=False)
    numeroDoc = Column(Integer, nullable=False)
    nombre = Column(String(50))
    apellido = Column(String(50))
    mail = Column(String(50), unique=True)
    telefono = Column(String(20))
    activo = Column(Integer, nullable=False, default=1)

    tipo_documento = relationship("TipoDocumento", back_populates="clientes")
    dispositivos = relationship("Dispositivo", back_populates="cliente")

    __table_args__ = (UniqueConstraint('idTipoDoc', 'numeroDoc', name='uq_cliente_tipoydoc'),)

    def __repr__(self):
        return f"<Cliente({self.idTipoDoc}-{self.numeroDoc}, {self.nombre} {self.apellido})>"

class Cargo(Base):
    __tablename__ = "Cargo"
    idCargo = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, unique=True)
    
    empleados = relationship("Empleado", back_populates="cargo")
    permisos = relationship("CargoxPermiso", back_populates="cargo")

    def __repr__(self):
        return f"<Cargo(idCargo={self.idCargo}, descripcion='{self.descripcion}')>"

class Empleado(Base):
    __tablename__ = "Empleado"
    idEmpleado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String)
    apellido = Column(String)
    idCargo = Column(Integer, ForeignKey("Cargo.idCargo"))
    idUsuario = Column(Integer, ForeignKey("Usuario.idUsuario"), unique=True)
    activo = Column(Integer, nullable=False, default=1)

    cargo = relationship("Cargo", back_populates="empleados")
    usuario = relationship("Usuario", back_populates="empleado", uselist=False)
    ordenes = relationship("OrdenDeReparacion", back_populates="empleado")

    def __repr__(self):
        return f"<Empleado(idEmpleado={self.idEmpleado}, nombre='{self.nombre}', apellido='{self.apellido}')>"

class Usuario(Base):
    __tablename__ = "Usuario"
    idUsuario = Column(Integer, primary_key=True, autoincrement=True)
    nombreUsuario = Column(String(50), nullable=False, unique=True)
    contraseña = Column(String(50), nullable=False)
    activo = Column(Integer, nullable=False, default=1)
    
    sesiones = relationship("Sesion", back_populates="usuario")
    empleado = relationship("Empleado", back_populates="usuario", uselist=False)

    def __repr__(self):
        return f"<Usuario(idUsuario={self.idUsuario}, nombreUsuario='{self.nombreUsuario}')>"

class Sesion(Base):
    __tablename__ = "Sesion"
    idSesion = Column(Integer, primary_key=True, autoincrement=True)
    idUsuario = Column(Integer, ForeignKey("Usuario.idUsuario"), nullable=False)
    horaInicio = Column(DateTime, nullable=False)
    horaFin = Column(DateTime)
    fecha = Column(Date, nullable=False)
    
    usuario = relationship("Usuario", back_populates="sesiones")

    def __repr__(self):
        return f"<Sesion(idSesion={self.idSesion}, idUsuario={self.idUsuario})>"

class Dispositivo(Base):
    __tablename__ = "Dispositivo"
    idDispositivo = Column(Integer, primary_key=True, autoincrement=True)
    nroSerie = Column(String, nullable=False, unique=True)
    marca = Column(String)
    modelo = Column(String)
    idCliente = Column(Integer, ForeignKey("Cliente.idCliente"), nullable=False)
    activo = Column(Integer, nullable=False, default=1)

    cliente = relationship("Cliente", back_populates="dispositivos")
    ordenes = relationship("OrdenDeReparacion", back_populates="dispositivo")
    historial_arreglos = relationship("HistorialArreglos", back_populates="dispositivo")

    def __repr__(self):
        return f"<Dispositivo(nroSerie='{self.nroSerie}', marca='{self.marca}', modelo='{self.modelo}')>"

class OrdenDeReparacion(Base):
    __tablename__ = "OrdenDeReparacion"
    nroDeOrden = Column(Integer, primary_key=True, autoincrement=True)
    idDispositivo = Column(Integer, ForeignKey("Dispositivo.idDispositivo"))
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
    idServicio = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, unique=True)
    precioBase = Column(Integer)
    activo = Column(Integer, nullable=False, default=1)
    
    detalles_orden = relationship("DetalleOrden", back_populates="servicio")
    repuestos_asociados = relationship("ServicioxRepuesto", back_populates="servicio")

    def __repr__(self):
        return f"<Servicio(idServicio={self.idServicio}, descripcion='{self.descripcion}')>"
        
class DetalleOrden(Base):
    __tablename__ = "DetalleOrden"
    idDetalle = Column(Integer, primary_key=True, autoincrement=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), nullable=False)
    idServicio = Column(Integer, ForeignKey("Servicio.idServicio"), nullable=False)
    # Allow NULL for repuesto_proveedor_id because some details may not include a repuesto
    repuesto_proveedor_id = Column(Integer, ForeignKey("RepuestoxProveedor.id"), nullable=True)
    costoServicio = Column(Float)
    costoRepuesto = Column(Float)
    subtotal = Column(Float)
    
    orden = relationship("OrdenDeReparacion", back_populates="detalles")
    servicio = relationship("Servicio", back_populates="detalles_orden")
    repuesto_proveedor = relationship("RepuestoxProveedor")

    def __repr__(self):
        return f"<DetalleOrden(idDetalle={self.idDetalle}, nroDeOrden={self.nroDeOrden})>"

class Repuesto(Base):
    __tablename__ = "Repuesto"
    idRepuesto = Column(Integer, primary_key=True, autoincrement=True)
    marca = Column(String)
    modelo = Column(String)
    activo = Column(Integer, nullable=False, default=1)
    
    proveedores = relationship("RepuestoxProveedor", back_populates="repuesto")
    servicios_asociados = relationship("ServicioxRepuesto", back_populates="repuesto")
    
    __table_args__ = (UniqueConstraint('marca', 'modelo', name='uq_repuesto_marca_modelo'),)

    def __repr__(self):
        return f"<Repuesto(idRepuesto={self.idRepuesto}, marca='{self.marca}', modelo='{self.modelo}')>"

class Proveedor(Base):
    __tablename__ = "Proveedor"
    idProveedor = Column(Integer, primary_key=True, autoincrement=True)
    cuil = Column(String, nullable=False, unique=True)
    telefono = Column(String)
    razonSocial = Column(String)
    activo = Column(Integer, nullable=False, default=1)
    
    repuestos = relationship("RepuestoxProveedor", back_populates="proveedor")

    def __repr__(self):
        return f"<Proveedor(cuil='{self.cuil}', razonSocial='{self.razonSocial}')>"

class RepuestoxProveedor(Base):
    __tablename__ = "RepuestoxProveedor"
    id = Column(Integer, primary_key=True, autoincrement=True)
    idRepuesto = Column(Integer, ForeignKey("Repuesto.idRepuesto"), nullable=False)
    idProveedor = Column(Integer, ForeignKey("Proveedor.idProveedor"), nullable=False)
    costo = Column(Integer)
    cantidad = Column(Integer)

    repuesto = relationship("Repuesto", back_populates="proveedores")
    proveedor = relationship("Proveedor", back_populates="repuestos")
    
    __table_args__ = (UniqueConstraint('idRepuesto', 'idProveedor', name='uq_repuesto_proveedor'),)

    def __repr__(self):
        return f"<RepuestoxProveedor(id={self.id}, idRepuesto={self.idRepuesto}, idProveedor={self.idProveedor})>"

class Permiso(Base):
    __tablename__ = "Permiso"
    idPermiso = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, unique=True)

    cargos = relationship("CargoxPermiso", back_populates="permiso")
    
    def __repr__(self):
        return f"<Permiso(idPermiso={self.idPermiso}, descripcion='{self.descripcion}')>"

class CargoxPermiso(Base):
    __tablename__ = "CargoxPermiso"
    id = Column(Integer, primary_key=True, autoincrement=True)
    idCargo = Column(Integer, ForeignKey("Cargo.idCargo"), nullable=False)
    idPermiso = Column(Integer, ForeignKey("Permiso.idPermiso"), nullable=False)

    cargo = relationship("Cargo", back_populates="permisos")
    permiso = relationship("Permiso", back_populates="cargos")
    
    __table_args__ = (UniqueConstraint('idCargo', 'idPermiso', name='uq_cargo_permiso'),)

    def __repr__(self):
        return f"<CargoxPermiso(id={self.id}, idCargo={self.idCargo}, idPermiso={self.idPermiso})>"

class Estado(Base):
    __tablename__ = "Estado"
    idEstado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, unique=True)

    historial_ordenes = relationship("HistorialEstadoOrden", back_populates="estado")

    def __repr__(self):
        return f"<Estado(idEstado={self.idEstado}, nombre='{self.nombre}')>"

class HistorialEstadoOrden(Base):
    __tablename__ = "HistorialEstadoOrden"
    idHistorialEs = Column(Integer, primary_key=True, autoincrement=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), nullable=False)
    idEstado = Column(Integer, ForeignKey("Estado.idEstado"), nullable=False)
    fechaCambio = Column(DateTime, nullable=False)
    observaciones = Column(String)

    orden = relationship("OrdenDeReparacion", back_populates="historial_estados")
    estado = relationship("Estado", back_populates="historial_ordenes")

    def __repr__(self):
        return f"<HistorialEstadoOrden(idHistorialEs={self.idHistorialEs}, nroDeOrden={self.nroDeOrden}, idEstado={self.idEstado})>"

class HistorialArreglos(Base):
    __tablename__ = "HistorialArreglos"
    idHistorialor = Column(Integer, primary_key=True, autoincrement=True)
    nroDeOrden = Column(Integer, ForeignKey("OrdenDeReparacion.nroDeOrden"), nullable=False)
    idDispositivo = Column(Integer, ForeignKey("Dispositivo.idDispositivo"), nullable=False)
    fechaArreglo = Column(DateTime, nullable=False)
    descripcion = Column(String)

    dispositivo = relationship("Dispositivo", back_populates="historial_arreglos")
    orden = relationship("OrdenDeReparacion", back_populates="historial_arreglos")

    def __repr__(self):
        return f"<HistorialArreglos(idHistorialor={self.idHistorialor}, nroDeOrden={self.nroDeOrden})>"

class ServicioxRepuesto(Base):
    __tablename__ = "ServicioxRepuesto"
    id = Column(Integer, primary_key=True, autoincrement=True)
    idServicio = Column(Integer, ForeignKey("Servicio.idServicio"), nullable=False)
    idRepuesto = Column(Integer, ForeignKey("Repuesto.idRepuesto"), nullable=False)
    cantidad = Column(Integer)

    servicio = relationship("Servicio", back_populates="repuestos_asociados")
    repuesto = relationship("Repuesto", back_populates="servicios_asociados")

    def __repr__(self):
        return f"<ServicioxRepuesto(idServicio={self.idServicio}, idRepuesto={self.idRepuesto})>"

if __name__ == "__main__":
    print("Creando todas las tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")
