"""Script de seed para poblar la base de datos con registros adicionales.
No crea Usuarios ni Empleados: respeta los técnicos ya existentes y los utiliza si están presentes.
Ejecutar: python BDD/seed_data.py
"""
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import datetime, date
from BDD.database import SessionLocal, TipoDocumento, Cliente, Dispositivo, Servicio, Repuesto, Proveedor, RepuestoxProveedor, ServicioxRepuesto, OrdenDeReparacion, DetalleOrden, Empleado, Estado, HistorialEstadoOrden

import random

def get_or_create(session, model, defaults=None, **kwargs):
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    params = dict(**kwargs)
    if defaults:
        params.update(defaults)
    instance = model(**params)
    session.add(instance)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        instance = session.query(model).filter_by(**kwargs).first()
        return instance, False
    return instance, True


def main():
    session = SessionLocal()
    try:
        # Detectar técnicos existentes (idCargo == 2 por convención en la app frontend)
        tecnicos = session.query(Empleado).filter(Empleado.idCargo == 2).all()
        print(f"Técnicos encontrados en la base de datos: {len(tecnicos)}")

        # --- Tipos de documento ---
        tipos = ["DNI", "CUIT", "PASAPORTE"]
        for t in tipos:
            td, created = get_or_create(session, TipoDocumento, nombre=t)
            if created:
                print(f"Creado TipoDocumento: {t}")

        # --- Clientes y Dispositivos ---
        # Preferir clientes existentes; si no hay ninguno, crear ejemplos mínimos.
        existing_clients = session.query(Cliente).limit(50).all()
        clientes_created = []
        if existing_clients and len(existing_clients) > 0:
            clientes_created = existing_clients
            print(f"Usando {len(clientes_created)} clientes existentes de la base de datos.")
        else:
            sample_clients = [
                {"idTipoDoc": session.query(TipoDocumento).filter_by(nombre="DNI").first().idTipoDoc, "numeroDoc": 20123456, "nombre": "María", "apellido": "González", "mail": "maria.gonzalez@example.com", "telefono": "5493511111111"},
                {"idTipoDoc": session.query(TipoDocumento).filter_by(nombre="DNI").first().idTipoDoc, "numeroDoc": 30123456, "nombre": "Carlos", "apellido": "Pérez", "mail": "carlos.perez@example.com", "telefono": "5493512222222"},
                {"idTipoDoc": session.query(TipoDocumento).filter_by(nombre="CUIT").first().idTipoDoc, "numeroDoc": 20304050607, "nombre": "Tienda", "apellido": "S.A.", "mail": "ventas@tienda-example.com", "telefono": "5493513333333"},
            ]
            for c in sample_clients:
                try:
                    cliente = session.query(Cliente).filter(Cliente.idTipoDoc==c['idTipoDoc'], Cliente.numeroDoc==c['numeroDoc']).first()
                    if not cliente:
                        cliente = Cliente(**c)
                        session.add(cliente)
                        session.commit()
                        print(f"Cliente creado: {cliente.nombre} {cliente.apellido}")
                    else:
                        print(f"Cliente existente: {cliente.nombre} {cliente.apellido}")
                    clientes_created.append(cliente)
                except IntegrityError:
                    session.rollback()

        # Obtener dispositivos existentes; si hay, los usamos. Si no, creamos algunos vinculados a los clientes disponibles.
        existing_devices = session.query(Dispositivo).limit(50).all()
        dispositivos_created = []
        if existing_devices and len(existing_devices) > 0:
            dispositivos_created = existing_devices
            print(f"Usando {len(dispositivos_created)} dispositivos existentes de la base de datos.")
        else:
            # Si no hay clientes creados, abortar creación de dispositivos (no tenemos a quién asignar)
            if not clientes_created:
                print("No hay clientes en la base de datos para asignar dispositivos. Saltando creación de dispositivos.")
            else:
                devs = [
                    {"nroSerie": "SN-ABC-001", "marca": "Samsung", "modelo": "A10", "idCliente": clientes_created[0].idCliente},
                    {"nroSerie": "SN-ABC-002", "marca": "Apple", "modelo": "iPhone X", "idCliente": clientes_created[1 % len(clientes_created)].idCliente},
                    {"nroSerie": "SN-ABC-003", "marca": "Lenovo", "modelo": "ThinkPad", "idCliente": clientes_created[2 % len(clientes_created)].idCliente},
                ]
                for d in devs:
                    existing = session.query(Dispositivo).filter_by(nroSerie=d['nroSerie']).first()
                    if not existing:
                        dispo = Dispositivo(**d)
                        session.add(dispo)
                        session.commit()
                        dispositivos_created.append(dispo)
                        print(f"Dispositivo creado: {dispo.nroSerie} -> cliente {dispo.idCliente}")
                    else:
                        dispositivos_created.append(existing)
                        print(f"Dispositivo existente: {existing.nroSerie}")

        # --- Servicios ---
        servicios_samples = [
            {"descripcion": "Diagnóstico", "precioBase": 500},
            {"descripcion": "Reparación básica", "precioBase": 1200},
            {"descripcion": "Cambio de pantalla", "precioBase": 3500},
        ]
        servicios_created = []
        for s in servicios_samples:
            serv = session.query(Servicio).filter(func.lower(Servicio.descripcion) == s['descripcion'].lower()).first()
            if not serv:
                serv = Servicio(**s)
                session.add(serv)
                session.commit()
                print(f"Servicio creado: {serv.descripcion}")
            else:
                print(f"Servicio existente: {serv.descripcion}")
            servicios_created.append(serv)

        # --- Repuestos y Proveedores ---
        repuestos_samples = [
            {"marca": "Samsung", "modelo": "A10 Screen"},
            {"marca": "Apple", "modelo": "iPhoneX Battery"},
            {"marca": "Lenovo", "modelo": "ThinkPad SSD"},
        ]
        proveedores_samples = [
            {"cuil": "20304050607", "razonSocial": "Proveedor Uno", "telefonoResponsable": "5493514444444", "mailResponsable": "contacto@prov1.com"},
            {"cuil": "30111222333", "razonSocial": "Proveedor Dos", "telefonoResponsable": "5493515555555", "mailResponsable": "ventas@prov2.com"},
        ]

        proveedores_created = []
        for p in proveedores_samples:
            pr = session.query(Proveedor).filter_by(cuil=p['cuil']).first()
            if not pr:
                pr = Proveedor(**p)
                session.add(pr)
                session.commit()
                print(f"Proveedor creado: {pr.razonSocial}")
            else:
                print(f"Proveedor existente: {pr.razonSocial}")
            proveedores_created.append(pr)

        repuestos_created = []
        for r in repuestos_samples:
            rep = session.query(Repuesto).filter(func.lower(Repuesto.marca)==r['marca'].lower(), func.lower(Repuesto.modelo)==r['modelo'].lower()).first()
            if not rep:
                rep = Repuesto(**r)
                session.add(rep)
                session.commit()
                print(f"Repuesto creado: {rep.marca} {rep.modelo}")
            else:
                print(f"Repuesto existente: {rep.marca} {rep.modelo}")
            repuestos_created.append(rep)

        # Asociar repuestos a proveedores (RepuestoxProveedor)
        for i, rep in enumerate(repuestos_created):
            prov = proveedores_created[i % len(proveedores_created)]
            existing = session.query(RepuestoxProveedor).filter_by(idRepuesto=rep.idRepuesto, idProveedor=prov.idProveedor).first()
            if not existing:
                rpp = RepuestoxProveedor(idRepuesto=rep.idRepuesto, idProveedor=prov.idProveedor, costo=1000 + (i * 500))
                session.add(rpp)
                session.commit()
                print(f"Repuesto {rep.idRepuesto} vinculado a proveedor {prov.idProveedor}")

        # Asociar servicios con repuestos (ServicioxRepuesto) para algunos
        for s in servicios_created[:2]:
            for rep in repuestos_created[:2]:
                existing = session.query(ServicioxRepuesto).filter_by(idServicio=s.idServicio, idRepuesto=rep.idRepuesto).first()
                if not existing:
                    sr = ServicioxRepuesto(idServicio=s.idServicio, idRepuesto=rep.idRepuesto)
                    session.add(sr)
                    session.commit()
                    print(f"Asociado servicio {s.descripcion} con repuesto {rep.marca} {rep.modelo}")

        # --- Ordenes de reparación de ejemplo ---
        # Usar técnicos existentes si hay; si no, crear órdenes sin técnico (idEmpleado=None)
        technician_ids = [t.idEmpleado for t in tecnicos]

        # Buscar el estado inicial "En Diagnóstico" pero NO crearlo si no existe
        estado_diag = session.query(Estado).filter_by(nombre="En Diagnóstico").first()
        if estado_diag:
            print(f"Estado existente: {estado_diag.nombre}")
        else:
            print("Estado 'En Diagnóstico' no encontrado; no se creará ni se asignará historial de estado.")
        # Crear más órdenes de ejemplo; NO establecer campo `diagnostico` (dejar en None)
        today = date.today()
        sample_orders = [
            {"idDispositivo": dispositivos_created[0].idDispositivo, "fecha": today, "descripcionDanos": "No enciende, pantalla negra", "diagnostico": None, "presupuesto": None, "idEmpleado": (random.choice(technician_ids) if technician_ids else None), "resultado": None},
            {"idDispositivo": dispositivos_created[1].idDispositivo, "fecha": today, "descripcionDanos": "Batería se descarga rápido", "diagnostico": None, "presupuesto": None, "idEmpleado": (random.choice(technician_ids) if technician_ids else None), "resultado": None},
            {"idDispositivo": dispositivos_created[2].idDispositivo, "fecha": today, "descripcionDanos": "Disco lento y mensajes de error", "diagnostico": None, "presupuesto": None, "idEmpleado": (random.choice(technician_ids) if technician_ids else None), "resultado": None},
            # Añadimos un par más para que la tabla se vea poblada
            {"idDispositivo": dispositivos_created[0].idDispositivo, "fecha": today, "descripcionDanos": "Pantalla con rayones", "diagnostico": None, "presupuesto": None, "idEmpleado": (random.choice(technician_ids) if technician_ids else None), "resultado": None},
            {"idDispositivo": dispositivos_created[1].idDispositivo, "fecha": today, "descripcionDanos": "Altavoz sin sonido", "diagnostico": None, "presupuesto": None, "idEmpleado": (random.choice(technician_ids) if technician_ids else None), "resultado": None},
        ]

        orders_created = []
        for o in sample_orders:
            # avoid duplicating by looking for same dispositivo + descripcionDanos
            existing = session.query(OrdenDeReparacion).filter(OrdenDeReparacion.idDispositivo==o['idDispositivo'], OrdenDeReparacion.descripcionDanos==o['descripcionDanos']).first()
            if not existing:
                ordn = OrdenDeReparacion(idDispositivo=o['idDispositivo'], fecha=o['fecha'], descripcionDanos=o['descripcionDanos'], diagnostico=None, presupuesto=o['presupuesto'], idEmpleado=o['idEmpleado'], resultado=o['resultado'])
                session.add(ordn)
                session.commit()
                print(f"Orden creada: #{ordn.nroDeOrden} para dispositivo {ordn.idDispositivo}")
                # Si existe el estado 'En Diagnóstico' en la BD, añadir un historial; si no, no hacer nada
                if estado_diag:
                    he = HistorialEstadoOrden(nroDeOrden=ordn.nroDeOrden, idEstado=estado_diag.idEstado, fechaCambio=datetime.now(), observaciones=None)
                    session.add(he)
                    session.commit()
                    print(f"Estado inicial asignado para orden #{ordn.nroDeOrden}: {estado_diag.nombre}")
                else:
                    print(f"No se asignó estado inicial para orden #{ordn.nroDeOrden} porque no existe el Estado 'En Diagnóstico'.")
                orders_created.append(ordn)
            else:
                orders_created.append(existing)
                print(f"Orden existente: #{existing.nroDeOrden}")

        # Crear detalles para las órdenes usando servicios y relaciones existentes
        for idx, ordn in enumerate(orders_created):
            # take a service and a repuesto_proveedor relation if available
            serv = servicios_created[idx % len(servicios_created)]
            rp = session.query(RepuestoxProveedor).first()
            existing_det = session.query(DetalleOrden).filter(DetalleOrden.nroDeOrden==ordn.nroDeOrden, DetalleOrden.idServicio==serv.idServicio).first()
            if not existing_det:
                det = DetalleOrden(nroDeOrden=ordn.nroDeOrden, idServicio=serv.idServicio, repuesto_proveedor_id=(rp.id if rp else None), costoServicio=serv.precioBase or 0, costoRepuesto=(rp.costo if rp else 0), subtotal=(serv.precioBase or 0) + (rp.costo if rp else 0))
                session.add(det)
                session.commit()
                print(f"Detalle creado para orden #{ordn.nroDeOrden}: servicio {serv.descripcion}")

        print("Seed completado.")

    finally:
        session.close()

if __name__ == '__main__':
    main()
