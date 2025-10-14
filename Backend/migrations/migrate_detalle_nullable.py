"""
Small migration script for SQLite to allow DetalleOrden.repuesto_proveedor_id to be NULL.
It:
 - creates a backup copy of ProyectoV5.db
 - connects and recreates DetalleOrden table with repuesto_proveedor_id nullable
 - copies existing data
 - drops the old table and renames the new one

Run only when the app is stopped. This script is idempotent-safe for a single development DB.
"""
import shutil
import sqlite3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT.parent / 'BDD' / 'ProyectoV5.db'

if not DB_PATH.exists():
    print(f"Database not found at {DB_PATH}. Exiting.")
    sys.exit(1)

backup = DB_PATH.with_suffix('.db.bak')
print(f"Creating backup {backup}...")
shutil.copy2(DB_PATH, backup)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check if table already has nullable column by trying to create the new table and copying.
try:
    cur.execute('PRAGMA foreign_keys=OFF;')
    conn.commit()

    # Create new table with desired schema
    cur.execute('''
    CREATE TABLE IF NOT EXISTS DetalleOrden_new (
        idDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
        nroDeOrden INTEGER NOT NULL,
        idServicio INTEGER NOT NULL,
        repuesto_proveedor_id INTEGER,
        costoServicio FLOAT,
        costoRepuesto FLOAT,
        subtotal FLOAT,
        FOREIGN KEY(nroDeOrden) REFERENCES OrdenDeReparacion(nroDeOrden),
        FOREIGN KEY(idServicio) REFERENCES Servicio(idServicio),
        FOREIGN KEY(repuesto_proveedor_id) REFERENCES RepuestoxProveedor(id)
    );
    ''')

    # Copy data from old table if exists
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='DetalleOrden';")
    if cur.fetchone():
        print("Copying data from existing DetalleOrden to DetalleOrden_new...")
        cur.execute('''
            INSERT INTO DetalleOrden_new (idDetalle, nroDeOrden, idServicio, repuesto_proveedor_id, costoServicio, costoRepuesto, subtotal)
            SELECT idDetalle, nroDeOrden, idServicio, repuesto_proveedor_id, costoServicio, costoRepuesto, subtotal FROM DetalleOrden;
        ''')
        conn.commit()

        cur.execute('DROP TABLE DetalleOrden;')
        cur.execute('ALTER TABLE DetalleOrden_new RENAME TO DetalleOrden;')
        conn.commit()
        print("Migration completed: DetalleOrden column repuesto_proveedor_id is now nullable.")
    else:
        print("DetalleOrden table not found; nothing to migrate.")

finally:
    cur.execute('PRAGMA foreign_keys=ON;')
    conn.commit()
    conn.close()

print('Done.')
