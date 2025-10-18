import sqlite3
from pathlib import Path

# Path to the DB used by the project
root = Path(__file__).resolve().parent.parent
db_path = root / 'BDD' / 'ProyectoV5.db'
print('DB path:', db_path)
if not db_path.exists():
    print('ERROR: DB file not found')
    raise SystemExit(1)

conn = sqlite3.connect(str(db_path))
cur = conn.cursor()

print('\n-- Cargo table --')
for row in cur.execute('SELECT idCargo, descripcion FROM Cargo ORDER BY idCargo'):
    print(row)

print('\n-- Permiso table --')
for row in cur.execute('SELECT idPermiso, descripcion FROM Permiso ORDER BY idPermiso'):
    print(row)

print('\n-- CargoxPermiso for idCargo=1 --')
rows = list(cur.execute('SELECT id, idCargo, idPermiso FROM CargoxPermiso WHERE idCargo = ?', (1,)))
if not rows:
    print('No entries for idCargo=1')
else:
    for r in rows:
        print(r)

conn.close()
