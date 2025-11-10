"""Generate sample orders with full attributes for development/testing.

This script uses the helper functions in ABMC_db.py to create related
entities (TipoDocumento, Cliente, Dispositivo, Cargo, Empleado, Usuario,
Servicios, Repuestos, Proveedores) and then creates several OrdenDeReparacion
rows filling all available columns (idDispositivo, fecha, descripcionDanos,
diagnostico, presupuesto, idEmpleado, resultado, informacionAdicional,
fechaInicioRetiro) plus one or two DetalleOrden rows per order.

Run this from the repository root (where Backend resides):

    python Backend/generate_sample_orders.py

The script attempts to be tolerant of existing data (will reuse matching
entries when possible) so it can be run multiple times without creating many
duplicates.
"""

from datetime import datetime, date, timedelta
import random

from ABMC_db import (
    mostrar_tipos_documento, alta_tipo_documento, buscar_cliente_por_doc, alta_cliente,
    mostrar_dispositivos, alta_dispositivo, mostrar_cargos, alta_cargo,
    mostrar_empleados, alta_empleado, alta_usuario, alta_sesion,
    mostrar_servicios, alta_servicio, mostrar_repuestos, alta_repuesto,
    mostrar_proveedores, alta_proveedor, alta_repuestoxproveedor, alta_servicioxrepuesto,
    alta_orden_de_reparacion, alta_orden_por_nroSerie, alta_detalle_orden
)

from ABMC_db import mostrar_estados, asignar_estado_orden
import unicodedata


def get_or_create_tipo_doc(nombre='DNI'):
    tipos = mostrar_tipos_documento()
    for t in tipos:
        if getattr(t, 'nombre', '').lower() == nombre.lower():
            return t.idTipoDoc
    t = alta_tipo_documento(nombre)
    return t.idTipoDoc


def get_or_create_cliente(idTipoDoc, numeroDoc, nombre, apellido, mail=None, telefono=None):
    existente = buscar_cliente_por_doc(idTipoDoc, numeroDoc)
    if existente:
        return existente.idCliente
    c = alta_cliente(idTipoDoc, numeroDoc, nombre=nombre, apellido=apellido, telefono=telefono, mail=mail)
    return c.idCliente


def get_or_create_dispositivo(nroSerie, marca, modelo, idCliente):
    dispositivos = mostrar_dispositivos(activos_only=None)
    for d in dispositivos:
        if getattr(d, 'nroSerie', None) == nroSerie:
            return d.idDispositivo
    d = alta_dispositivo(nroSerie=nroSerie, marca=marca, modelo=modelo, idCliente=idCliente)
    return d.idDispositivo


def get_or_create_cargo(descripcion):
    cargos = mostrar_cargos()
    for c in cargos:
        if getattr(c, 'descripcion', '').lower() == descripcion.lower():
            return c.idCargo
    c = alta_cargo(descripcion)
    return c.idCargo


def get_or_create_empleado(nombre, apellido, idCargo, mail=None, telefono=None):
    empleados = mostrar_empleados(activos_only=None)
    for e in empleados:
        if (getattr(e, 'nombre', '').lower() == nombre.lower() and getattr(e, 'apellido','').lower() == apellido.lower()):
            return e.idEmpleado
    emp = alta_empleado(nombre=nombre, apellido=apellido, idCargo=idCargo, mail=mail, telefono=telefono)
    return emp.idEmpleado


def get_or_create_servicio(descripcion, precioBase=1000):
    servicios = mostrar_servicios(activos_only=None)
    for s in servicios:
        if getattr(s, 'descripcion', '').lower() == descripcion.lower():
            return s.idServicio
    sv = alta_servicio(descripcion=descripcion, precioBase=precioBase)
    return sv.idServicio


def get_or_create_repuesto(marca, modelo):
    repuestos = mostrar_repuestos(activos_only=None)
    for r in repuestos:
        if (getattr(r, 'marca','').lower() == marca.lower() and getattr(r,'modelo','').lower() == modelo.lower()):
            return r.idRepuesto
    rp = alta_repuesto(marca=marca, modelo=modelo)
    return rp.idRepuesto


def get_or_create_proveedor(cuil, razonSocial, telefono=None, mailResponsable=None):
    proveedores = mostrar_proveedores(activos_only=None)
    for p in proveedores:
        if getattr(p, 'cuil', None) == cuil or (getattr(p, 'razonSocial','').lower() == razonSocial.lower()):
            return p.idProveedor
    prov = alta_proveedor(cuil=cuil, razonSocial=razonSocial, telefono=telefono, mailResponsable=mailResponsable)
    return prov.idProveedor


def main():
    print('Generando datos de ejemplo...')

    # Tipo de documento
    idTipoDoc = get_or_create_tipo_doc('DNI')

    # Clientes y dispositivos
    clientes_info = [
        (11111111, 'Ana', 'Gomez', 'ana.gomez@example.com', '3511230001'),
        (22222222, 'Luis', 'Perez', 'luis.perez@example.com', '3511230002'),
        (33333333, 'María', 'Lopez', 'maria.lopez@example.com', '3511230003')
    ]

    cliente_ids = []
    dispositivo_ids = []
    for i, (doc, nombre, apellido, mail, tel) in enumerate(clientes_info, start=1):
        idC = get_or_create_cliente(idTipoDoc, doc, nombre, apellido, mail=mail, telefono=tel)
        cliente_ids.append(idC)
        serial = f"SN-SAMPLE-{1000 + i}"
        d_id = get_or_create_dispositivo(nroSerie=serial, marca=f"Marca{i}", modelo=f"Modelo{i}", idCliente=idC)
        dispositivo_ids.append(d_id)

    # Cargos y empleados
    tecnico_cargo = get_or_create_cargo('Tecnico')
    ventas_cargo = get_or_create_cargo('Asistente de ventas')

    tecnico_id = get_or_create_empleado('Carlos', 'Ramirez', tecnico_cargo, mail='carlos.ramirez@example.com', telefono='3515550100')
    ventas_id = get_or_create_empleado('Lucia', 'Martinez', ventas_cargo, mail='lucia.martinez@example.com', telefono='3515550200')

    # Servicios, repuestos y proveedores
    servicio_id = get_or_create_servicio('Reparacion de pantalla', precioBase=3500)
    repuesto_id = get_or_create_repuesto('Generic', 'Pantalla-1')
    proveedor_id = get_or_create_proveedor('30555500001', 'Proveedores S.A.', telefono='3519990001', mailResponsable='ventas@proveedor.com')

    # Ensure relation RepuestoxProveedor exists; alta_repuestoxproveedor returns dict
    rel = alta_repuestoxproveedor(idRepuesto=repuesto_id, idProveedor=proveedor_id, costo=1200)

    # Link servicio <-> repuesto
    try:
        # alta_servicioxrepuesto returns relation (no check for duplicates inside helper)
        alta_servicioxrepuesto(idServicio=servicio_id, idRepuesto=repuesto_id)
    except Exception:
        pass

    # Create several orders
    orders_to_create = []
    today = date.today()
    for i in range(1, 6):
        payload = {
            'nroSerie': None,
            'idDispositivo': dispositivo_ids[(i-1) % len(dispositivo_ids)],
            'fecha': today - timedelta(days=5*i),
            'descripcionDanos': f'Daño de ejemplo #{i}: pantalla agrietada y no enciende correctamente.',
            'diagnostico': f'Diagnóstico preliminar #{i}: falla en conector y vidrio roto.',
            'presupuesto': 5000 + i * 100,
            'idEmpleado': tecnico_id if i % 2 == 1 else ventas_id,
            'resultado': 'pendiente' if i % 3 != 0 else 'reparado',
            'informacionAdicional': f'Observación extra para la orden #{i}',
            'fechaInicioRetiro': (today - timedelta(days=2*i)) if i % 4 == 0 else None
        }
        orders_to_create.append(payload)

    created = []
    for p in orders_to_create:
        # alta_orden_de_reparacion expects fecha as date, but uses server default when None
        orden = alta_orden_de_reparacion(
            idDispositivo=p['idDispositivo'],
            fecha=p['fecha'],
            descripcionDanos=p['descripcionDanos'],
            diagnostico=p['diagnostico'],
            presupuesto=p['presupuesto'],
            idEmpleado=p['idEmpleado'],
            resultado=p['resultado'],
            informacionAdicional=p['informacionAdicional'],
            fechaInicioRetiro=p['fechaInicioRetiro']
        )

        # Add one detalle referencing servicio and repuesto_proveedor relation
        try:
            rp_id = rel.get('id') if isinstance(rel, dict) else None
        except Exception:
            rp_id = None
        # use alta_detalle_orden(nroDeOrden, idServicio, repuesto_proveedor_id, costoServicio, costoRepuesto, subtotal)
        alta_detalle_orden(nroDeOrden=orden.nroDeOrden, idServicio=servicio_id, repuesto_proveedor_id=rp_id, costoServicio=3000.0, costoRepuesto=1200.0, subtotal=4200.0)

        # Optionally add a second detail for variety
        if random.choice([True, False]):
            alta_detalle_orden(nroDeOrden=orden.nroDeOrden, idServicio=servicio_id, repuesto_proveedor_id=None, costoServicio=500.0, costoRepuesto=0.0, subtotal=500.0)

        # Asignar estado inicial "EnDiagnostico" para que la UI muestre el estado
        try:
            estados = mostrar_estados() or []
            id_en_diag = None
            for es in estados:
                nombre = getattr(es, 'nombre', '') or ''
                # normalizar / remover acentos para comparar robustamente
                nombre_norm = unicodedata.normalize('NFKD', nombre)
                nombre_norm = ''.join(ch for ch in nombre_norm if not unicodedata.combining(ch))
                nombre_norm = nombre_norm.replace(' ', '').lower()
                if 'diagnost' in nombre_norm:
                    id_en_diag = getattr(es, 'idEstado', None)
                    break
            if id_en_diag:
                asignar_estado_orden(nroDeOrden=orden.nroDeOrden, idEstado=id_en_diag, fechaCambio=datetime.now(), observaciones='Estado inicial asignado por generator')
        except Exception:
            # no crítico si falla asignar estado en el generador
            pass

        created.append(orden.nroDeOrden)
        print(f'Orden creada: nroDeOrden={orden.nroDeOrden}, idDispositivo={orden.idDispositivo}, idEmpleado={orden.idEmpleado}')

    print('\nCreación completa. Órdenes creadas:', created)


if __name__ == '__main__':
    main()
