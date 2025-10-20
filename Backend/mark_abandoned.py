#!/usr/bin/env python3
"""
Script pequeño para marcar órdenes como 'Abandonada' cuando
han pasado más de 30 días desde `fechaInicioRetiro`.

Uso: ejecutar manualmente o programarlo con cron/Task Scheduler.
"""
from datetime import datetime, timedelta
from ABMC_db import session_scope, asignar_estado_orden
from BDD.database import OrdenDeReparacion, HistorialEstadoOrden, Estado


def find_estado_abandonada(session):
    st = session.query(Estado).filter(Estado.nombre.ilike('abandon%') | (Estado.nombre == 'Abandonada')).first()
    if st:
        return st.idEstado, st.nombre
    # fallback: buscar por contains normalizado
    st = session.query(Estado).all()
    for s in st:
        if s.nombre and 'abandon' in s.nombre.lower():
            return s.idEstado, s.nombre
    return None, None


def mark_abandoned(days=30):
    threshold = datetime.now().date() - timedelta(days=days)
    changed = 0
    with session_scope() as s:
        id_aband, nombre_aband = find_estado_abandonada(s)
        if not id_aband:
            print('No se encontró un estado "Abandonada" en la tabla Estado. No se procesará.')
            return

        # buscar órdenes con fechaInicioRetiro anterior al threshold y que no tengan historial con estado Abandonada
        ords = s.query(OrdenDeReparacion).filter(OrdenDeReparacion.fechaInicioRetiro != None).filter(OrdenDeReparacion.fechaInicioRetiro <= threshold).all()
        for o in ords:
            nro = o.nroDeOrden
            # comprobar si ya tiene historial con estado abandonada
            existe = s.query(HistorialEstadoOrden).filter(HistorialEstadoOrden.nroDeOrden == nro).filter(HistorialEstadoOrden.idEstado == id_aband).first()
            if existe:
                continue
            # Usar la función central para asignar estado (maneja side-effects y logging)
            try:
                asignar_estado_orden(nroDeOrden=nro, idEstado=id_aband, fechaCambio=datetime.now(), observaciones='Marcada automáticamente como Abandonada por tiempo de retiro excedido')
                changed += 1
                print(f'Orden {nro} marcada como Abandonada')
            except Exception as e:
                print(f'Error marcando orden {nro} como Abandonada: {e}')
    print(f'Total marcado: {changed}')


if __name__ == '__main__':
    mark_abandoned(30)
