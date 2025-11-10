"""Asignar estado inicial a órdenes que no tengan historial de estados.

Ejecutar desde la raíz del repo (o desde Backend) con el venv activado:

  python Backend/fix_order_states.py

El script buscará órdenes cuya clave `estado` sea nula en la serialización de
`mostrar_ordenes()` y les asignará el estado identificado como 'EnDiagnostico'
si existe en la tabla `Estado`.
"""
from datetime import datetime
from ABMC_db import mostrar_ordenes, mostrar_estados, asignar_estado_orden
import unicodedata


def find_en_diagnostico_id():
    estados = mostrar_estados() or []
    for e in estados:
        nombre = getattr(e, 'nombre', '') or ''
        # quitar acentos y normalizar para comparación robusta
        nombre_norm = unicodedata.normalize('NFKD', nombre)
        nombre_norm = ''.join(ch for ch in nombre_norm if not unicodedata.combining(ch))
        nombre_norm = nombre_norm.replace(' ', '').lower()
        if 'diagnost' in nombre_norm:
            return getattr(e, 'idEstado', None)
    return None


def main():
    print('Buscando órdenes sin estado y asignando EnDiagnostico si es posible...')
    ordenes = mostrar_ordenes() or []
    id_diag = find_en_diagnostico_id()
    if not id_diag:
        print('No se encontró un estado que contenga "diagnost" en la tabla Estados. Abortando.')
        return

    asignadas = []
    for o in ordenes:
        try:
            if not o.get('estado'):
                nro = o.get('nroDeOrden')
                asignar_estado_orden(nroDeOrden=nro, idEstado=id_diag, fechaCambio=datetime.now(), observaciones='Estado inicial asignado por fix_order_states')
                asignadas.append(nro)
        except Exception as e:
            print(f'Error asignando estado a orden {o.get("nroDeOrden")}: {e}')
            continue

    print('Asignación completa. Órdenes actualizadas:', asignadas)


if __name__ == '__main__':
    main()
