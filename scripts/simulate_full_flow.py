import os
import sys
from datetime import date, datetime

# asegurarse de que la raíz del proyecto está en sys.path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from Backend.ABMC_db import obtener_ordenes, modificar_orden, asignar_estado_orden
from BDD.database import SessionLocal, Estado


def find_order_without_fecha():
    ordenes = obtener_ordenes()
    for o in ordenes:
        if not o.get('fechaInicioRetiro'):
            return o['nroDeOrden']
    return None


if __name__ == '__main__':
    nro = find_order_without_fecha()
    if not nro:
        print('No se encontró ninguna orden sin fechaInicioRetiro para probar')
        sys.exit(0)
    print(f'Usando orden {nro} para la simulación')

    # 1) Simular PUT /ordenes/:nro  -> modificar_orden
    res = modificar_orden(nro, resultado='reparada', informacionAdicional='Simulación test')
    print('Resultado modificar_orden:', res)

    # 2) Buscar id del estado PendienteDeRetiro
    with SessionLocal() as s:
        st = s.query(Estado).filter(Estado.nombre == 'PendienteDeRetiro').first()
        if not st:
            print('Estado PendienteDeRetiro no existe en la tabla Estado')
            sys.exit(1)
        id_retiro = st.idEstado
        print('Found estado PendienteDeRetiro id:', id_retiro)

    # 3) Llamar a asignar_estado_orden como hace el endpoint
    historial = asignar_estado_orden(nroDeOrden=nro, idEstado=id_retiro, fechaCambio=datetime.now(), observaciones='Simulación flujo completo')
    print('Historial creado id:', getattr(historial, 'idHistorialEs', getattr(historial, 'id', None)))

    # 4) Leer orden desde DB para comprobar fechaInicioRetiro
    ordenes = obtener_ordenes()
    ord = next((o for o in ordenes if o['nroDeOrden'] == nro), None)
    print('Orden after full flow:', ord)
