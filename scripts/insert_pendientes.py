#!/usr/bin/env python3
import sqlite3
import os
from pathlib import Path
from datetime import datetime, date, timedelta
import random

DB_PATH = Path(__file__).resolve().parent.parent / 'BDD' / 'ProyectoV6.db'

if not DB_PATH.exists():
    print('Database not found at', DB_PATH)
    raise SystemExit(1)

conn = sqlite3.connect(str(DB_PATH))
cur = conn.cursor()

# Ensure Estado 'PendienteDeAprobacion' exists (normalize name without spaces)
state_name = 'PendienteDeAprobacion'
cur.execute("SELECT idEstado, nombre FROM Estado")
rows = cur.fetchall()
found = None
for r in rows:
    if r[1] and ''.join(r[1].split()).lower() == state_name.lower():
        found = r[0]
        break

if not found:
    cur.execute('INSERT INTO Estado (nombre) VALUES (?)', (state_name,))
    found = cur.lastrowid
    print('Inserted Estado:', found, state_name)
else:
    print('Found existing Estado id:', found)

inserted = []
for i in range(5):
    descripcion = f'Prueba: orden pendiente de aprobacion {i+1}'
    presupuesto = random.randint(1000, 10000)
    # random fecha within last 30 days
    days_back = random.randint(0, 30)
    fecha = (date.today() - timedelta(days=days_back)).isoformat()
    diagnostico = ''
    # Insert into OrdenDeReparacion (idDispositivo NULL, idEmpleado NULL allowed)
    cur.execute(
        'INSERT INTO OrdenDeReparacion (idDispositivo, fecha, descripcionDanos, diagnostico, presupuesto, idEmpleado) VALUES (?, ?, ?, ?, ?, ?)',
        (None, fecha, descripcion, diagnostico, presupuesto, None)
    )
    nro = cur.lastrowid
    # Insert historial estado
    ahora = datetime.now().isoformat(sep=' ')
    cur.execute('INSERT INTO HistorialEstadoOrden (nroDeOrden, idEstado, fechaCambio, observaciones) VALUES (?, ?, ?, ?)',
                (nro, found, ahora, 'Estado inicial generado por script de pruebas'))
    inserted.append(nro)

conn.commit()
print('Inserted orders:', inserted)
conn.close()
