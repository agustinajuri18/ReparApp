#!/usr/bin/env python3
"""
Seed avanzado corregido para ReparApp - ProyectoV6.db
(Corregido error: 'Instance has been deleted, or its row is otherwise not present')

- Técnicos específicos: Matias Perez, Martin Pérez y Sofia Rodríguez
- Distribución controlada de estados:
  * "En Diagnóstico" (varios ejemplos)
  * "PendienteDeAprobacion" (muchos)
  * "En Reparación" (muchos)
  * "PendienteDeRetiro" (varios)
  * "Retirada" (varios)
  * "Abandonada" (solo 3)
- Diagnósticos variados y no repetitivos

Uso:
  # Prueba sin commitear:
  python .\Backend\seed_sample_data.py --dry-run

  # Ejecución normal:
  python .\Backend\seed_sample_data.py --clients 25 --devices 40 --orders 60
"""
from __future__ import annotations
import os
import sys
import argparse
from datetime import datetime, date, timedelta
from random import choice, randint, sample, shuffle, random
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import ObjectDeletedError

# Asegurar importación desde la raíz del repo
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from BDD.database import (
    SessionLocal, TipoDocumento, Cliente, Usuario, Cargo, Empleado,
    Proveedor, Repuesto, RepuestoxProveedor, Servicio, ServicioxRepuesto,
    Dispositivo, OrdenDeReparacion, DetalleOrden, Estado, HistorialEstadoOrden,
    HistorialArreglos
)

# ---------------- Helpers básicos ----------------
def get_or_create(session, model, lookup: dict, defaults: dict | None = None):
    defaults = defaults or {}
    inst = session.query(model).filter_by(**lookup).first()
    if inst:
        return inst, False
    params = dict(lookup)
    params.update(defaults)
    obj = model(**params)
    session.add(obj)
    try:
        session.flush()
        return obj, True
    except IntegrityError:
        session.rollback()
        inst = session.query(model).filter_by(**lookup).first()
        if inst:
            return inst, False
        inst = session.query(model).filter_by(**params).first()
        if inst:
            return inst, False
        raise

def ensure_unique_email(session, email: str) -> str:
    """Asegura un email único para Cliente, añadiendo +N si hace falta."""
    if not email:
        return email
    base, sep, domain = email.partition("@")
    if not sep:
        domain = "ejemplo.com"
        base = email
    candidate = f"{base}@{domain}"
    suffix = 1
    while session.query(Cliente).filter(Cliente.mail == candidate).first():
        candidate = f"{base}+{suffix}@{domain}"
        suffix += 1
    return candidate

def create_or_get_cliente(session, idTipoDoc, numeroDoc, nombre=None, apellido=None, telefono=None, mail=None, activo=1):
    lookup = {'idTipoDoc': idTipoDoc, 'numeroDoc': numeroDoc}
    inst = session.query(Cliente).filter_by(**lookup).first()
    if inst:
        return inst, False
    mail_to_use = None
    if mail:
        if session.query(Cliente).filter(Cliente.mail == mail).first():
            mail_to_use = ensure_unique_email(session, mail)
        else:
            mail_to_use = mail
    params = {
        'idTipoDoc': idTipoDoc,
        'numeroDoc': numeroDoc,
        'nombre': nombre,
        'apellido': apellido,
        'telefono': telefono,
        'mail': mail_to_use,
        'activo': activo
    }
    c = Cliente(**params)
    session.add(c)
    try:
        session.flush()
        return c, True
    except IntegrityError as e:
        session.rollback()
        if 'Cliente.mail' in str(e) or 'UNIQUE constraint failed: Cliente.mail' in str(e):
            mail_fix = ensure_unique_email(session, mail or f"{nombre}.{apellido}@ejemplo.com")
            c.mail = mail_fix
            session.add(c)
            session.flush()
            return c, True
        raise

def gen_phone():
    prefixes = ['351', '11', '221', '261', '341', '342']
    return choice(prefixes) + ''.join(str(randint(0,9)) for _ in range(7))

def gen_serial(existing:set|None = None):
    existing = existing or set()
    while True:
        s = f"SN{randint(1000000,9999999)}"
        if s not in existing:
            return s

# ---------------- Helpers para orden y estados ----------------
def create_order(session, idDispositivo, fecha=None, descripcionDanos=None, diagnostico=None, presupuesto=None, idEmpleado=None):
    """Crea una nueva orden si no existe con (idDispositivo,diagnostico,fecha) idénticos."""
    # Verificar si ya existe primero
    existing = session.query(OrdenDeReparacion).filter_by(
        idDispositivo=idDispositivo, 
        diagnostico=diagnostico, 
        fecha=fecha
    ).first()
    
    if existing:
        return existing, False
    
    orden = OrdenDeReparacion(
        idDispositivo=idDispositivo,
        fecha=fecha,
        descripcionDanos=descripcionDanos,
        diagnostico=diagnostico,
        presupuesto=presupuesto,
        idEmpleado=idEmpleado
    )
    session.add(orden)
    session.flush()
    return orden, True

def add_historial(session, nroDeOrden, estado_nombre, observaciones=None):
    """Añade un registro al historial de estados de la orden."""
    estado = session.query(Estado).filter(Estado.nombre == estado_nombre).first()
    if not estado:
        return None
    h = HistorialEstadoOrden(
        nroDeOrden=nroDeOrden, 
        idEstado=estado.idEstado, 
        fechaCambio=datetime.now(), 
        observaciones=observaciones
    )
    session.add(h)
    session.flush()
    return h

def find_repuestoxproveedor_for_repuesto(session, idRepuesto, prefer_stock=True):
    """Busca un RepuestoxProveedor disponible para el idRepuesto dado."""
    q = session.query(RepuestoxProveedor).filter(RepuestoxProveedor.idRepuesto == idRepuesto)
    # cantidad no existe: simplemente devolver el menor costo
    return q.order_by(RepuestoxProveedor.costo.asc()).first()

def get_repuestos_for_service(session, idServicio):
    """Obtiene los IDs de repuestos asociados a un servicio."""
    rels = session.query(ServicioxRepuesto).filter(ServicioxRepuesto.idServicio == idServicio).all()
    return [r.idRepuesto for r in rels] if rels else []

def create_detalle(session, nroDeOrden, idServicio, repuesto_proveedor_id=None, costoServicio=0, costoRepuesto=0):
    """Crea un detalle de orden con subtotal calculado."""
    subtotal = (float(costoServicio) or 0) + (float(costoRepuesto) or 0)
    detalle = DetalleOrden(
        nroDeOrden=nroDeOrden,
        idServicio=idServicio,
        repuesto_proveedor_id=repuesto_proveedor_id,
        costoServicio=costoServicio,
        costoRepuesto=costoRepuesto,
        subtotal=subtotal
    )
    session.add(detalle)
    session.flush()
    return detalle

# ---------------- Datos ampliados ----------------
PROVIDERS = [
    ("30712345678", "Repuestos Córdoba SRL", "Carlos Ruiz", "ventas@repuestoscordoba.com", "3514441122", "Av. Fuerza Aérea 123"),
    ("30787654321", "Componentes SA", "María López", "contacto@componentessa.com", "3513332244", "San Martín 45"),
    ("30755566778", "Pantallas y Más SRL", "Gonzalo Díaz", "info@pantallasyMas.com", "115556677", "Ituzaingó 200"),
    ("30799887766", "Baterías Express", "Alicia Fernández", "ventas@bateriasexpress.com", "115554433", "Belgrano 1234"),
    ("30722233344", "Electrónica Norte SRL", "Rogelio Pinto", "ventas@electronicanorte.com", "3511122334", "Av. Córdoba 800"),
    ("30744455566", "RepuestosWeb S.A.", "Beatriz Ramos", "ventas@repuestosweb.com", "115667788", "Corrientes 456"),
    ("30733322211", "Mayorista Componentes", "Raúl Herrera", "contacto@mayoristacomp.com", "3515566778", "Pueyrredón 99"),
    ("30711122334", "Cells & Parts SRL", "Florencia Gallo", "flo@cells-parts.com", "1133322211", "Dean Funes 220"),
    ("30766677788", "StockTech S.A.", "Diego Salas", "salas@stocktech.com", "115551122", "Laprida 50"),
    ("30777788899", "Accesorios Global", "Natalia Vega", "natalia@accesoriosglobal.com", "3519988112", "Ruta 20 km 3"),
    ("30788889999", "Tecno Parts", "Julio Mendez", "julio@tecnoparts.com", "3516622233", "Rondeau 778"),
    ("30722288844", "Mobile Repuestos", "Laura Viale", "lviale@mobilerepuestos.com", "113334456", "Mitre 562"),
    ("30733399922", "Service Total", "Ricardo Mendoza", "rmendoza@servicetotal.com.ar", "3416673321", "Urquiza 123")
]

REPUES = [
    ("Samsung", "Galaxy A52_pantalla"),
    ("Samsung", "Galaxy A52_bateria"),
    ("Samsung", "Galaxy S21_camara"),
    ("Samsung", "Galaxy S21_bateria"),
    ("Samsung", "Galaxy S21_placa_madre"),
    ("Samsung", "Galaxy A12_pantalla"),
    ("Samsung", "Galaxy A12_conector_carga"),
    ("Apple", "iPhone 11_pantalla"),
    ("Apple", "iPhone 11_bateria"),
    ("Apple", "iPhone 12_pantalla"),
    ("Apple", "iPhone 12_camara"),
    ("Apple", "iPhone SE_bateria"),
    ("Apple", "iPhone XR_placa_logica"),
    ("Xiaomi", "Redmi Note 9_bateria"),
    ("Xiaomi", "Redmi Note 9_pantalla"),
    ("Xiaomi", "Poco X3_pantalla"),
    ("Motorola", "Moto G8_pantalla"),
    ("Motorola", "Moto G8_conector_carga"),
    ("Motorola", "Edge_pantalla"),
    ("Huawei", "P30 Lite_pantalla"),
    ("Huawei", "P30 Lite_bateria"),
    ("LG", "K40_boton_encendido"),
    ("LG", "K40_pantalla"),
    ("Lenovo", "Tab M8_cable_flex"),
    ("Sony", "Xperia 10_pantalla"),
    ("Generic", "MotherboardX"),
    ("Generic", "Flex_cable"),
    ("Generic", "CargadorUSB"),
    ("Generic", "ConectorCarga"),
    ("Generic", "MicrofonoGenerico"),
    ("Generic", "AltavozGenerico")
]

SERVICES = [
    ("Diagnóstico básico", 1200),
    ("Diagnóstico avanzado", 2500),
    ("Reemplazo de pantalla", 4500),
    ("Reemplazo de pantalla OLED", 7800),
    ("Reemplazo de batería", 2200),
    ("Reparación de placa", 9000),
    ("Reparación de placa lógica", 12000),
    ("Cambio conector de carga", 1800),
    ("Reemplazo cámara frontal", 3000),
    ("Reemplazo cámara trasera", 3500),
    ("Limpieza interna", 1000),
    ("Recuperación de datos", 5000),
    ("Actualización software", 800),
    ("Reemplazo de micrófono", 1500),
    ("Reemplazo de altavoz", 1700),
    ("Reparación botones físicos", 1300),
    ("Sustitución placa wifi", 2800),
    ("Reparación tras daño por agua", 4500)
]

CLIENTS = [
    (1, 30123456, "Luis", "Fernández", "3512345678", "luis.fernandez@ejemplo.com"),
    (1, 30123457, "María", "García", "3512345566", "maria.garcia@ejemplo.com"),
    (1, 27344512, "Ana", "Sosa", "3519988776", "ana.sosa@ejemplo.com"),
    (1, 28900123, "Martín", "Pérez", "3516677889", "martin.perez@ejemplo.com"),
    (1, 34156789, "Julián", "Rodríguez", "3512233445", "julian.rodriguez@ejemplo.com"),
    (1, 27654321, "Laura", "González", "3515556677", "laura.gonzalez@ejemplo.com"),
    (1, 30765432, "Carlos", "Sánchez", "3514447788", "carlos.sanchez@ejemplo.com"),
    (1, 28765432, "Marina", "Torres", "3518887766", "marina.torres@ejemplo.com"),
    (1, 33445566, "Sergio", "Díaz", "3515554433", "sergio.diaz@ejemplo.com"),
    (1, 29876543, "Valeria", "Martínez", "3516665544", "valeria.martinez@ejemplo.com"),
    (2, 1234567, "John", "Doe", "1155555555", "john.doe@ejemplo.com"),
    (2, 7654321, "Emma", "Thompson", "1144556677", "emma.thompson@ejemplo.com"),
    (3, 30111222333, "Empresa SRL", "Comercial", "3514433221", "contacto@empresa.com"),
    (1, 31567890, "Francisco", "López", "3515556677", "francisco.lopez@ejemplo.com"),
    (1, 29123456, "Carolina", "Romero", "3516667788", "carolina.romero@ejemplo.com")
]

DEVICES = [
    ("SN1000001", "Samsung", "Galaxy A52", 0),
    ("SN1000002", "Apple", "iPhone 11", 1),
    ("SN1000003", "Xiaomi", "Redmi Note 9", 2),
    ("SN1000004", "Motorola", "Moto G8", 3),
    ("SN1000005", "Samsung", "Galaxy S21", 4),
    ("SN1000006", "Apple", "iPhone 12", 5),
    ("SN1000007", "Xiaomi", "Poco X3", 6),
    ("SN1000008", "Samsung", "Galaxy A12", 7),
    ("SN1000009", "Huawei", "P30 Lite", 8),
    ("SN1000010", "Motorola", "Edge", 9),
    ("SN1000011", "Apple", "iPhone SE", 10),
    ("SN1000012", "Lenovo", "Tab M8", 11),
    ("SN1000013", "LG", "K40", 12),
    ("SN1000014", "Sony", "Xperia 10", 13),
    ("SN1000015", "Samsung", "Galaxy Note 10", 14),
    ("SN1000016", "Apple", "iPhone XR", 0),
    ("SN1000017", "Xiaomi", "Mi 11", 1),
    ("SN1000018", "Motorola", "Moto G9", 2),
    ("SN1000019", "Samsung", "Galaxy M31", 3),
    ("SN1000020", "Nokia", "5.3", 4)
]

# Lista ampliada de diagnósticos
DIAGNOSTICS = [
    # Problemas de pantalla
    "Pantalla completamente rota con vidrio astillado",
    "Pantalla con líneas verticales multicolor",
    "Pantalla táctil que no responde en zona inferior",
    "Pantalla con manchas negras permanentes",
    "Display OLED con burn-in (imágenes remanentes)",
    "Pantalla que parpadea intermitentemente",
    
    # Problemas de batería
    "Batería que no retiene carga (dura menos de 1 hora)",
    "Batería hinchada que deformó la carcasa",
    "Terminal no carga la batería correctamente",
    "Batería que se sobrecalienta durante el uso normal",
    "Batería que se descarga incluso apagado",
    "Ciclo de carga irregular con porcentaje saltando",
    
    # Problemas de encendido/sistema
    "No enciende después de caída desde altura",
    "Bucle de inicio constante (bootloop)",
    "Sistema operativo corrupto tras actualización",
    "Equipo se reinicia aleatoriamente durante uso",
    "No responde a botón de encendido",
    "Bloqueo total con pantalla negra pero vibraciones",
    
    # Problemas de conectores/puertos
    "Puerto de carga dañado físicamente",
    "Conector USB suelto que interrumpe la carga",
    "Puerto de auriculares no reconoce conexión",
    "Puerto de carga con pin central doblado",
    "Conector de batería desprendido de placa",
    
    # Problemas de cámara
    "Cámara trasera produce fotos con tonos verdosos",
    "Lente de cámara frontal rayado con imágenes borrosas",
    "Flash LED no funciona en modo cámara",
    "Cámara no enfoca correctamente a ninguna distancia",
    "Aplicación de cámara se cierra al intentar grabar video",
    
    # Problemas de audio
    "Altavoz con sonido distorsionado",
    "Micrófono no capta audio en llamadas",
    "Audio entrecortado durante reproducción multimedia",
    "Sin sonido en absoluto aunque muestra reproducción",
    "Auriculares bluetooth no se conectan correctamente",
    
    # Problemas de sensores/hardware
    "Sensor de proximidad no funciona durante llamadas",
    "Brújula/giroscopio con lecturas incorrectas",
    "Huella digital no reconoce al usuario",
    "NFC no detecta tarjetas o dispositivos",
    "GPS con pérdida constante de señal",
    
    # Problemas de daño físico/agua
    "Humedad detectada en indicador interno",
    "Oxidación visible en placa madre",
    "Dispositivo sumergido en agua durante 5 minutos",
    "Corrosión en contactos de batería",
    "Daño por caída desde segundo piso"
]

DETAIL_COMMENTS = [
    "Ingreso por caída desde altura",
    "Cliente reporta humedad/exposición a agua",
    "No enciende tras última actualización",
    "Problemas recurrentes, ya fue reparado previamente",
    "Se apaga aleatoriamente durante uso",
    "Cliente necesita recuperar datos urgentes",
    "Daño reportado progresivo en últimas semanas",
    "Impacto directo en pantalla",
    "Equipo muy antiguo con múltiples problemas",
    "Síntomas aparecieron después de usar cargador no original",
    "Cliente informa sobre sobrecalentamiento durante carga",
    "Batería no dura más de 1 hora en uso normal",
    "Equipo bloqueado con cuenta que cliente no recuerda",
    "Lentitud extrema reportada por cliente"
]

# Distribución de estados para control preciso
ESTADOS_DISTRIBUTION = {
    "En Diagnóstico": 0.15,       # 15%
    "PendienteDeAprobacion": 0.30,  # 30% 
    "En Reparación": 0.30,        # 30%
    "PendienteDeRetiro": 0.10,    # 10%
    "Retirada": 0.10,             # 10%
    "Abandonada": 0.05            # 5% (máximo 3)
}

# Función para decidir estado final de una orden
def select_target_estado(abandonada_count=0, max_abandonada=3):
    """
    Selecciona un estado objetivo basado en la distribución de estados.
    Limita el número de órdenes Abandonadas a max_abandonada.
    """
    if abandonada_count >= max_abandonada:
        # Si ya tenemos el máximo de abandonadas, redistribuimos ese 5%
        # entre los otros estados proporcionalmente
        adjusted = {k: v / 0.95 if k != "Abandonada" else 0 
                   for k, v in ESTADOS_DISTRIBUTION.items()}
        r = random()
        cumulative = 0
        for estado, prob in adjusted.items():
            cumulative += prob
            if r <= cumulative:
                return estado
    else:
        # Distribución normal
        r = random()
        cumulative = 0
        for estado, prob in ESTADOS_DISTRIBUTION.items():
            cumulative += prob
            if r <= cumulative:
                return estado
    
    return "En Diagnóstico"  # Default fallback

# ---------------- Main ----------------
def seed(cli_args=None):
    parser = argparse.ArgumentParser(description="Seed avanzado con distribución de estados controlada")
    parser.add_argument("--clients", type=int, default=len(CLIENTS))
    parser.add_argument("--devices", type=int, default=len(DEVICES))
    parser.add_argument("--repuestos", type=int, default=len(REPUES))
    parser.add_argument("--proveedores", type=int, default=len(PROVIDERS))
    parser.add_argument("--servicios", type=int, default=len(SERVICES))
    parser.add_argument("--orders", type=int, default=50)
    parser.add_argument("--dry-run", action="store_true", help="Simula sin commitear")
    args = parser.parse_args(cli_args)

    session = SessionLocal()
    try:
        # --- Usuarios para los 3 técnicos específicos + admin ---
        admin_user, _ = get_or_create(session, Usuario, lookup={'nombreUsuario':'admin'}, defaults={'contraseña':'admin123','activo':1})
        martin_user, _ = get_or_create(session, Usuario, lookup={'nombreUsuario':'martin_tech'}, defaults={'contraseña':'mtech123','activo':1})
        matias_user, _ = get_or_create(session, Usuario, lookup={'nombreUsuario':'matias_tech'}, defaults={'contraseña':'mttech123','activo':1})
        sofia_user, _ = get_or_create(session, Usuario, lookup={'nombreUsuario':'sofia_tech'}, defaults={'contraseña':'stech123','activo':1})
        recep_user, _ = get_or_create(session, Usuario, lookup={'nombreUsuario':'recepcion'}, defaults={'contraseña':'recep123','activo':1})

        # --- Cargos ---
        admin_cargo, _ = get_or_create(session, Cargo, lookup={'descripcion':'Administrador'})
        tecnico_cargo, _ = get_or_create(session, Cargo, lookup={'descripcion':'Tecnico'})
        recepcion_cargo, _ = get_or_create(session, Cargo, lookup={'descripcion':'Recepción'})
        session.commit()

        # --- Empleados (los 3 técnicos específicos) ---
        get_or_create(session, Empleado, lookup={'idUsuario': admin_user.idUsuario}, 
                      defaults={'nombre':'Laura','apellido':'Gómez','idCargo':admin_cargo.idCargo,
                                'mail':'laura@taller.com','telefono':gen_phone(),'activo':1})
        
        # Los técnicos específicos solicitados
        martin, _ = get_or_create(session, Empleado, lookup={'idUsuario': martin_user.idUsuario}, 
                                 defaults={'nombre':'Martin','apellido':'Pérez','idCargo':tecnico_cargo.idCargo,
                                           'mail':'martin@taller.com','telefono':gen_phone(),'activo':1})
        
        matias, _ = get_or_create(session, Empleado, lookup={'idUsuario': matias_user.idUsuario}, 
                                 defaults={'nombre':'Matias','apellido':'Perez','idCargo':tecnico_cargo.idCargo,
                                           'mail':'matias@taller.com','telefono':gen_phone(),'activo':1})
        
        sofia, _ = get_or_create(session, Empleado, lookup={'idUsuario': sofia_user.idUsuario}, 
                                defaults={'nombre':'Sofia','apellido':'Rodríguez','idCargo':tecnico_cargo.idCargo,
                                          'mail':'sofia@taller.com','telefono':gen_phone(),'activo':1})
        
        get_or_create(session, Empleado, lookup={'idUsuario': recep_user.idUsuario}, 
                      defaults={'nombre':'Ana','apellido':'Martínez','idCargo':recepcion_cargo.idCargo,
                                'mail':'ana@taller.com','telefono':gen_phone(),'activo':1})
        session.commit()

        # --- Estados (exactamente los 6 solicitados) ---
        VALID_ESTADOS = ["En Diagnóstico", "PendienteDeAprobacion", "En Reparación", 
                          "PendienteDeRetiro", "Retirada", "Abandonada"]
        for st in VALID_ESTADOS:
            get_or_create(session, Estado, lookup={'nombre': st})
        session.commit()

        # --- Proveedores ---
        provs_created = 0
        for cuil, razon, nombreResp, mailResp, tel, direccion in PROVIDERS[:args.proveedores]:
            _, created = get_or_create(session, Proveedor, 
                                      lookup={'cuil': cuil}, 
                                      defaults={'razonSocial': razon,
                                                'telefonoResponsable': tel,
                                                'direccion':direccion,
                                                'nombreResponsable':nombreResp,
                                                'mailResponsable':mailResp,
                                                'activo':1})
            if created:
                provs_created += 1
        session.commit()

        # --- Repuestos ---
        reps_created = 0
        for marca, modelo in REPUES[:args.repuestos]:
            _, created = get_or_create(session, Repuesto, 
                                      lookup={'marca':marca,'modelo':modelo}, 
                                      defaults={'activo':1})
            if created:
                reps_created += 1
        session.commit()

        # --- Servicios ---
        sv_created = 0
        for desc, price in SERVICES[:args.servicios]:
            _, created = get_or_create(session, Servicio, 
                                      lookup={'descripcion':desc}, 
                                      defaults={'precioBase':price,'activo':1})
            if created:
                sv_created += 1
        session.commit()

        # --- RepuestoxProveedor: vincular repuestos con proveedores ---
        proveedores_list = session.query(Proveedor).all()
        repuestos_list = session.query(Repuesto).all()
        rels = 0
        for r in repuestos_list:
            chosen = sample(proveedores_list, k=min(len(proveedores_list), randint(1, 3)))
            for p in chosen:
                exists = session.query(RepuestoxProveedor).filter_by(
                    idRepuesto=r.idRepuesto, 
                    idProveedor=p.idProveedor
                ).first()
                if not exists:
                    session.add(RepuestoxProveedor(
                        idRepuesto=r.idRepuesto, 
                        idProveedor=p.idProveedor, 
                        costo=randint(500, 10000)
                    ))
                    rels += 1
            session.commit()

        # --- ServicioxRepuesto: relaciones inteligentes ---
        servicios_all = session.query(Servicio).all()
        repuestos_all = session.query(Repuesto).all()
        sxr = 0
        for s in servicios_all:
            candidates = []
            low_desc = (s.descripcion or "").lower()
            
            # Heurísticas mejoradas para relacionar servicios con repuestos
            if 'pantalla' in low_desc:
                candidates = [r for r in repuestos_all if 'pantalla' in (r.modelo or '').lower()]
            elif 'bater' in low_desc:
                candidates = [r for r in repuestos_all if 'bat' in (r.modelo or '').lower() 
                              or 'bateria' in (r.modelo or '').lower()]
            elif 'cámara' in low_desc or 'camara' in low_desc:
                candidates = [r for r in repuestos_all if 'cam' in (r.modelo or '').lower()]
            elif 'conector' in low_desc or 'carga' in low_desc:
                candidates = [r for r in repuestos_all if 'conector' in (r.modelo or '').lower() 
                              or 'carga' in (r.modelo or '').lower()]
            elif 'placa' in low_desc:
                candidates = [r for r in repuestos_all if 'placa' in (r.modelo or '').lower() 
                              or 'motherboard' in (r.modelo or '').lower()]
            elif 'microfono' in low_desc:
                candidates = [r for r in repuestos_all if 'micro' in (r.modelo or '').lower()]
            elif 'altavoz' in low_desc:
                candidates = [r for r in repuestos_all if 'altavoz' in (r.modelo or '').lower() 
                              or 'speaker' in (r.modelo or '').lower()]
            
            if not candidates and repuestos_all:
                # Asignar algún repuesto si no hay match específico
                candidates = [repuestos_all[(s.idServicio-1) % len(repuestos_all)]]
            
            # Tomar de 1 a 3 repuestos de los candidatos
            chosen_candidates = sample(candidates, k=min(len(candidates), randint(1, 3))) if candidates else []
            
            for candidate in chosen_candidates:
                exists = session.query(ServicioxRepuesto).filter_by(
                    idServicio=s.idServicio, 
                    idRepuesto=candidate.idRepuesto
                ).first()
                if not exists:
                    session.add(ServicioxRepuesto(
                        idServicio=s.idServicio, 
                        idRepuesto=candidate.idRepuesto
                    ))
                    sxr += 1
        session.commit()

        # --- Clientes ---
        clients_created = 0
        for td, nro, nombre, apellido, tel, mail in CLIENTS[:args.clients]:
            _, created = create_or_get_cliente(session, td, nro, 
                                              nombre=nombre, apellido=apellido, 
                                              telefono=tel, mail=mail, activo=1)
            if created:
                clients_created += 1
        session.commit()

        # --- Dispositivos ---
        clients = session.query(Cliente).all()
        if not clients:
            raise RuntimeError("No hay clientes para asignar dispositivos.")
        
        devs_created = 0
        for sn, marca, modelo, cidx in DEVICES[:args.devices]:
            owner = clients[cidx % len(clients)]
            _, created = get_or_create(session, Dispositivo, 
                                      lookup={'nroSerie':sn}, 
                                      defaults={'marca':marca,
                                                'modelo':modelo,
                                                'idCliente':owner.idCliente,
                                                'activo':1})
            if created:
                devs_created += 1
        
        # Añadir dispositivos adicionales si se pidieron más
        existing_serials = {d.nroSerie for d in session.query(Dispositivo).all()}
        while len(existing_serials) < args.devices:
            sn = gen_serial(existing_serials)
            marca = choice([r.marca for r in repuestos_list if r.marca not in ('Generic',)])
            modelo = f"{marca} Model {randint(100,999)}"
            owner = choice(clients)
            _, created = get_or_create(session, Dispositivo, 
                                      lookup={'nroSerie':sn}, 
                                      defaults={'marca':marca,
                                                'modelo':modelo,
                                                'idCliente':owner.idCliente,
                                                'activo':1})
            if created:
                devs_created += 1
                existing_serials.add(sn)
            session.commit()

        # --- Órdenes + Detalles con ESTADOS específicamente distribuidos ---
        # CORRECCIÓN: Obtener lista de IDs de dispositivos en lugar de objetos
        dispositivo_ids = [d.idDispositivo for d in session.query(Dispositivo).all()]
        if not dispositivo_ids:
            print("No hay dispositivos para crear órdenes")
            return

        # Lista especial de técnicos exactos que solicitaste
        tecnicos = [martin, matias, sofia]  # Solo los 3 técnicos específicos
        services_all = session.query(Servicio).all()
        
        orders_created = 0
        detalles_created = 0
        abandonada_count = 0
        attempts = 0
        max_attempts = args.orders * 6 + 100
        
        # Crear una copia de diagnósticos para no repetirlos
        diagnosticos_disponibles = DIAGNOSTICS.copy()
        shuffle(diagnosticos_disponibles)  # Mezclarlos para variedad
        
        while orders_created < args.orders and attempts < max_attempts:
            attempts += 1
            
            # CORRECCIÓN: Trabajar con IDs en lugar de objetos de dispositivo
            disp_id = choice(dispositivo_ids)
            
            # Obtener un diagnóstico único si quedan disponibles
            if diagnosticos_disponibles:
                diagnostico = diagnosticos_disponibles.pop()
            else:
                # Si se agotan, volver a llenar la lista
                diagnosticos_disponibles = DIAGNOSTICS.copy()
                shuffle(diagnosticos_disponibles)
                diagnostico = diagnosticos_disponibles.pop()
                
            descripcion = f"{diagnostico} - {choice(DETAIL_COMMENTS)}"
            # Distribuir fechas en los últimos 30 días
            fecha = date.today() - timedelta(days=randint(1, 30))

            # Decidir estado target (respetando límite de 3 abandonadas)
            target_estado = select_target_estado(abandonada_count, max_abandonada=3)
            if target_estado == "Abandonada":
                abandonada_count += 1
            
            # Inicialmente sin presupuesto ni técnico
            presupuesto = None
            assigned_tech = None
            
            # Configuración según estado target
            if target_estado in ("PendienteDeAprobacion", "En Reparación", "PendienteDeRetiro", "Retirada"):
                # Generar presupuesto coherente con diagnóstico
                base_presupuesto = 1000
                if 'pantalla' in diagnostico.lower():
                    base_presupuesto = 3500
                elif 'bater' in diagnostico.lower():
                    base_presupuesto = 1800
                elif 'placa' in diagnostico.lower():
                    base_presupuesto = 8000
                elif 'cámara' in diagnostico.lower() or 'camara' in diagnostico.lower():
                    base_presupuesto = 2800
                elif 'carga' in diagnostico.lower() or 'puerto' in diagnostico.lower():
                    base_presupuesto = 1500
                elif 'agua' in diagnostico.lower() or 'humedad' in diagnostico.lower():
                    base_presupuesto = 4500
                presupuesto = base_presupuesto + randint(0, base_presupuesto//2)
            
            # Asignar técnico según estado (asegurarnos que En Reparación tiene técnico)
            if target_estado in ("En Reparación", "PendienteDeRetiro", "Retirada"):
                assigned_tech = choice(tecnicos).idEmpleado

            try:
                # Crear la orden
                orden, created = create_order(
                    session, 
                    idDispositivo=disp_id,  # Usar ID directamente
                    fecha=fecha, 
                    descripcionDanos=descripcion, 
                    diagnostico=diagnostico, 
                    presupuesto=presupuesto, 
                    idEmpleado=assigned_tech
                )
                
                if not created:
                    continue

                # --- SECUENCIA DE ESTADOS LÓGICOS SEGÚN EL TARGET ---
                # Todas empiezan en diagnóstico
                add_historial(session, orden.nroDeOrden, "En Diagnóstico", 
                            observaciones=f"Ingreso para revisión: {descripcion[:30]}...")
                
                # Añadir historia de estados según target
                if target_estado == "En Diagnóstico":
                    # Se queda en diagnóstico (reciente o en progreso)
                    pass
                
                elif target_estado == "PendienteDeAprobacion":
                    # Pasó de diagnóstico a pendiente de aprobación (tiene presupuesto)
                    add_historial(session, orden.nroDeOrden, "PendienteDeAprobacion", 
                                observaciones=f"Presupuesto: ${presupuesto}, esperando confirmación")
                
                elif target_estado == "En Reparación":
                    # Si tiene presupuesto, pasó por aprobación primero
                    if presupuesto is not None:
                        add_historial(session, orden.nroDeOrden, "PendienteDeAprobacion", 
                                    observaciones=f"Presupuesto: ${presupuesto}, esperando confirmación")
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"Presupuesto aprobado, asignado a técnico {choice(['Martín','Matias','Sofia'])}")
                    else:
                        # Directo a reparación (sin presupuesto previo)
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"En proceso de reparación con técnico {choice(['Martín','Matias','Sofia'])}")
                
                elif target_estado == "PendienteDeRetiro":
                    # Pasó por todos los estados hasta pendiente de retiro
                    if presupuesto is not None:
                        add_historial(session, orden.nroDeOrden, "PendienteDeAprobacion", 
                                    observaciones=f"Presupuesto: ${presupuesto}, esperando confirmación")
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"Presupuesto aprobado, asignado a técnico {choice(['Martín','Matias','Sofia'])}")
                    else:
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"En proceso de reparación con técnico {choice(['Martín','Matias','Sofia'])}")
                    
                    add_historial(session, orden.nroDeOrden, "PendienteDeRetiro", 
                                observaciones="Reparación finalizada, listo para retiro por cliente")
                
                elif target_estado == "Retirada":
                    # Completó todo el ciclo hasta retirada
                    if presupuesto is not None:
                        add_historial(session, orden.nroDeOrden, "PendienteDeAprobacion", 
                                    observaciones=f"Presupuesto: ${presupuesto}, esperando confirmación")
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"Presupuesto aprobado, asignado a técnico {choice(['Martín','Matias','Sofia'])}")
                    else:
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"En proceso de reparación con técnico {choice(['Martín','Matias','Sofia'])}")
                    
                    add_historial(session, orden.nroDeOrden, "PendienteDeRetiro", 
                                observaciones="Reparación finalizada, listo para retiro por cliente")
                    add_historial(session, orden.nroDeOrden, "Retirada", 
                                observaciones="Cliente retiró el equipo")
                
                elif target_estado == "Abandonada":
                    # Completó ciclo pero quedó abandonado
                    if presupuesto is not None:
                        add_historial(session, orden.nroDeOrden, "PendienteDeAprobacion", 
                                    observaciones=f"Presupuesto: ${presupuesto}, esperando confirmación")
                        # Posiblemente rechazado o no contestado
                        if randint(0,1) == 0:
                            add_historial(session, orden.nroDeOrden, "PendienteDeRetiro", 
                                        observaciones="No se continuará con reparación, disponible para retiro")
                    else:
                        add_historial(session, orden.nroDeOrden, "En Reparación", 
                                    observaciones=f"En proceso con técnico {choice(['Martín','Matias','Sofia'])}")
                        add_historial(session, orden.nroDeOrden, "PendienteDeRetiro", 
                                    observaciones="Reparación finalizada, listo para retiro")
                    
                    add_historial(session, orden.nroDeOrden, "Abandonada", 
                                observaciones="Equipo no retirado en plazo estipulado")

                # -- Añadir detalles coherentes con el servicio prestado --
                # Cantidad de detalles según complejidad
                details_to_add = min(4, max(1, 2 if 'placa' in diagnostico.lower() else 1))
                service_pool = services_all.copy()
                shuffle(service_pool)
                
                for i in range(details_to_add):
                    if not service_pool:
                        break
                        
                    # Elegir servicio relacionado con diagnóstico
                    service = None
                    diag_low = diagnostico.lower()
                    
                    if i == 0:  # Primer servicio más relacionado con diagnóstico
                        if 'pantalla' in diag_low:
                            service = next((s for s in service_pool if 'pantalla' in s.descripcion.lower()), None)
                        elif 'bater' in diag_low:
                            service = next((s for s in service_pool if 'bater' in s.descripcion.lower()), None)
                        elif 'placa' in diag_low:
                            service = next((s for s in service_pool if 'placa' in s.descripcion.lower()), None)
                        elif 'cámara' in diag_low or 'camara' in diag_low:
                            service = next((s for s in service_pool if 'cámara' in s.descripcion.lower() or 'camara' in s.descripcion.lower()), None)
                        elif 'carga' in diag_low or 'puerto' in diag_low:
                            service = next((s for s in service_pool if 'conector' in s.descripcion.lower() or 'carga' in s.descripcion.lower()), None)
                        elif 'micro' in diag_low:
                            service = next((s for s in service_pool if 'micro' in s.descripcion.lower()), None)
                        elif 'altavoz' in diag_low or 'sonido' in diag_low or 'audio' in diag_low:
                            service = next((s for s in service_pool if 'altavoz' in s.descripcion.lower() or 'audio' in s.descripcion.lower()), None)
                        elif 'agua' in diag_low or 'humedad' in diag_low:
                            service = next((s for s in service_pool if 'agua' in s.descripcion.lower() or 'humedad' in s.descripcion.lower() or 'limpieza' in s.descripcion.lower()), None)
                    
                    # Si no encontró servicio específico o en iteraciones siguientes
                    if not service:
                        service = service_pool.pop() if service_pool else services_all[0]
                    elif service in service_pool:
                        service_pool.remove(service)
                    
                    # Buscar repuesto relacionado con servicio
                    rep_ids = get_repuestos_for_service(session, service.idServicio)
                    chosen_rp = None
                    costo_rep = 0
                    
                    if rep_ids:
                        for rid in rep_ids:
                            rp = find_repuestoxproveedor_for_repuesto(session, rid)
                            if rp:
                                chosen_rp = rp
                                break
                    else:
                        # Intentar con cualquier repuesto similar
                        rep_candidates = []
                        if 'pantalla' in service.descripcion.lower():
                            rep_candidates = [r for r in repuestos_all if 'pantalla' in r.modelo.lower()]
                        elif 'bater' in service.descripcion.lower():
                            rep_candidates = [r for r in repuestos_all if 'bat' in r.modelo.lower()]
                        
                        if rep_candidates:
                            rep = choice(rep_candidates)
                            chosen_rp = find_repuestoxproveedor_for_repuesto(session, rep.idRepuesto)
                    
                    costo_serv = service.precioBase or 0
                    if chosen_rp:
                        costo_rep = chosen_rp.costo or 0
                    
                    create_detalle(
                        session, 
                        orden.nroDeOrden, 
                        service.idServicio, 
                        repuesto_proveedor_id=getattr(chosen_rp, 'id', None), 
                        costoServicio=costo_serv, 
                        costoRepuesto=costo_rep
                    )
                    detalles_created += 1
                    
                    # Decrementar stock
                    # cantidad removed: no decrement needed
                
                if not args.dry_run:
                    session.commit()
                else:
                    session.rollback()
                    
                orders_created += 1
            except ObjectDeletedError:
                # Si el objeto ya fue eliminado o es inválido, hacemos rollback y continuamos
                session.rollback()
                continue
            except Exception as e:
                session.rollback()
                print(f"Error al procesar orden (intentando continuar): {str(e)}")
                continue

        # Resumen final
        print("Seed finalizado con éxito.")
        print(f"Proveedores creados: {provs_created if 'provs_created' in locals() else 0}")
        print(f"Repuestos creados: {reps_created if 'reps_created' in locals() else 0}")
        print(f"Servicios creados: {sv_created if 'sv_created' in locals() else 0}")
        print(f"Clientes creados: {clients_created if 'clients_created' in locals() else 0}")
        print(f"Dispositivos creados: {devs_created if 'devs_created' in locals() else 0}")
        print(f"Órdenes creadas: {orders_created}")
        print(f"Detalles creados: {detalles_created}")
        
        if args.dry_run:
            print("DRY-RUN: No se aplicaron cambios en la base de datos.")
            
    except Exception as e:
        session.rollback()
        print("Error durante seed:", e, file=sys.stderr)
        raise
    finally:
        session.close()

if __name__ == "__main__":
    seed()