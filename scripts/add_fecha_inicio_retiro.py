from sqlalchemy import create_engine, text, inspect
from pathlib import Path
import sys

# Path relativo al proyecto
db_path = Path(__file__).resolve().parents[1] / 'BDD' / 'ProyectoV6.db'
if not db_path.exists():
    print('DB file not found at', db_path)
    sys.exit(1)

url = f"sqlite:///{db_path.as_posix()}"
engine = create_engine(url)
inspector = inspect(engine)

try:
    cols = [c['name'] for c in inspector.get_columns('OrdenDeReparacion')]
except Exception as e:
    print('Error inspeccionando la tabla OrdenDeReparacion:', e)
    sys.exit(1)

print('Columns in OrdenDeReparacion:', cols)
if 'fechaInicioRetiro' in cols:
    print('Column fechaInicioRetiro already exists — no action needed')
else:
    print('Adding column fechaInicioRetiro...')
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE OrdenDeReparacion ADD COLUMN fechaInicioRetiro DATE;'))
        conn.commit()
    print('Column added.')
