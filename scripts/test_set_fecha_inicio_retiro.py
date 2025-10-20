import os
import sys

# Añadir la raíz del proyecto al path para poder importar Backend y BDD
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from Backend.ABMC_db import asignar_estado_orden, obtener_ordenes
from BDD.database import Estado, SessionLocal
from datetime import date

# Encuentra un nro de orden existente - asumo que la tabla tiene al menos una orden
ordenes = obtener_ordenes()
if not ordenes:
    print('No hay ordenes en la base para probar.')
else:
    o = ordenes[0]
    nro = o['nroDeOrden']
    print('Usando orden', nro)
    # Busco el id del estado PendienteDeRetiro en la tabla Estado
    with SessionLocal() as s:
        st = s.query(Estado).filter(Estado.nombre == 'PendienteDeRetiro').first()
        if not st:
            print('No existe el estado PendienteDeRetiro en la tabla Estado; no puedo continuar')
        else:
            print('Found estado id', st.idEstado)
            # Usar la fecha de hoy como fechaCambio para cumplir la restricción NOT NULL
            asignar_estado_orden(nro, st.idEstado, date.today(), observaciones='Test automated')
            print('Asignado, leyendo orden...')
            ordenes = obtener_ordenes()
            o2 = next((x for x in ordenes if x['nroDeOrden'] == nro), None)
            print('Orden after change:', o2)
