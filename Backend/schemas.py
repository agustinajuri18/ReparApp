# ReparApp/BDD/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, time

# --------- Usuario ---------
class UsuarioCreate(BaseModel):
    id_usuario: int
    password: str

# --------- Cliente ---------
class ClienteCreate(BaseModel):
    tipo_documento: str
    numero_dni: int
    nombre: str
    apellido: str
    telefono: int
    mail: str

# --------- Dispositivo ---------
class DispositivoCreate(BaseModel):
    nroSerie: str
    marca: str
    modelo: str
    clienteTipoDni: str
    clienteDni: int

# --------- Empleado ---------
class EmpleadoCreate(BaseModel):
    id_empleado: int
    nombre: str
    apellido: str
    id_rol: int
    id_usuario: int

# --------- Estado ---------
class EstadoCreate(BaseModel):
    cod_estado: int
    descripcion: str

# --------- HistorialArreglos ---------
class HistorialArreglosCreate(BaseModel):
    nroSerie_dispositivo: str
    nroDeOrden: int

# --------- OrdenDeReparacion ---------
class OrdenDeReparacionCreate(BaseModel):
    nroDeOrden: int
    nroSerie_dispositivo: str
    fecha: date
    descripcion_danos: str
    diagnostico: str
    codigo_servicio: int
    presupuesto: int
    id_empleado: int

# --------- HistorialEstadoOrden ---------
class HistorialEstadoOrdenCreate(BaseModel):
    nroDeOrden: int
    cod_estado: int
    fechaInicio: datetime
    fechaFin: Optional[datetime] = None

# --------- Permiso ---------
class PermisoCreate(BaseModel):
    id_permiso: int
    descripcion: str

# --------- Proveedor ---------
class ProveedorCreate(BaseModel):
    cuil: int
    nombre: str
    telefono: int
    razon_social: str

# --------- Repuesto ---------
class RepuestoCreate(BaseModel):
    codigo: int
    marca: str
    modelo: str
    tipo: str
    cuil_proveedor: int
    costo: int

# --------- RespuestoxServicio ---------
class RespuestoxServicioCreate(BaseModel):
    codigo_servicio: int
    codigo_repuesto: int
    cantidad: int

# --------- Rol ---------
class RolCreate(BaseModel):
    id_rol: int
    descripcion: str

# --------- RolxPermiso ---------
class RolxPermisoCreate(BaseModel):
    id_rol: int
    id_permiso: int

# --------- Servicio ---------
class ServicioCreate(BaseModel):
    codigo: int
    descripcion: str
    precioBase: int

# --------- Sesion ---------
class SesionCreate(BaseModel):
    cod_sesion: int
    id_usuario: int
    fecha: date
    horaInicio: time
    horaFin: time
