import sqlite3
from pathlib import Path
p = Path(r'c:\Users\LENOVO\Desktop\- FACU -\3er AÑO -\SEM -\ReparApp\BDD\ProyectoV6.db')
if not p.exists():
    print('DB not found at', p)
    raise SystemExit(1)
conn = sqlite3.connect(str(p))
cur = conn.cursor()
cur.execute('PRAGMA foreign_keys=ON;')
print('Existing permissions for idCargo=3:')
cur.execute('SELECT id, idCargo, idPermiso FROM CargoxPermiso WHERE idCargo = ?', (3,))
rows = cur.fetchall()
for r in rows:
    print(r)
existing = {r[2] for r in rows}
need = []
for permiso in (29, 30):
    if permiso not in existing:
        need.append(permiso)
if not need:
    print('No changes required — permisos 29 y 30 ya presentes for cargo 3')
else:
    print('Will insert permisos for cargo 3:', need)
    cur.execute('SELECT MAX(id) FROM CargoxPermiso')
    mx = cur.fetchone()[0] or 0
    for pval in need:
        mx += 1
        cur.execute('INSERT INTO CargoxPermiso (id, idCargo, idPermiso) VALUES (?, ?, ?)', (mx, 3, pval))
        print('Inserted', (mx,3,pval))
    conn.commit()
    print('Committed changes.')
# show final state
cur.execute('SELECT id, idCargo, idPermiso FROM CargoxPermiso WHERE idCargo = ? ORDER BY id', (3,))
for r in cur.fetchall():
    print(r)
conn.close()
