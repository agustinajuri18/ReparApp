#!/usr/bin/env python3
"""
Script seguro para eliminar de los registros de `HistorialArreglos` el sufijo
"(Registrado por ... en YYYY-MM-DD HH:MM)" que se añadió anteriormente.

Uso: desde la raíz del proyecto y con el entorno virtual activado:

    python scripts/clean_historial_arreglos.py

El script hará un commit por cada registro modificado y mostrará un resumen.
"""
import re
import sys
from datetime import datetime

try:
    # importar la configuración de la DB
    from BDD.database import SessionLocal, HistorialArreglos
except Exception as e:
    print("No se pudo importar BDD.database. Asegurate de ejecutar este script desde la raíz del proyecto con el PYTHONPATH correcto y el entorno virtual activado.")
    print("Error:", e)
    sys.exit(2)

PATTERN = re.compile(r"(?:\n)?\s*\(Registrado por [^)]+\)$", flags=re.IGNORECASE)


def clean_description(desc: str) -> str:
    if not desc:
        return desc
    new = PATTERN.sub('', desc).strip()
    return new


def main():
    session = SessionLocal()
    try:
        rows = session.query(HistorialArreglos).all()
        total = len(rows)
        updated = 0
        for r in rows:
            orig = r.descripcion or ''
            cleaned = clean_description(orig)
            if cleaned != orig:
                print(f"[{r.idHistorialor}] Limpieza: '{orig[:80]}' -> '{cleaned[:80]}'")
                r.descripcion = cleaned
                session.add(r)
                updated += 1
        if updated > 0:
            session.commit()
        print(f"Procesados: {total}. Actualizados: {updated}.")
    except Exception as e:
        session.rollback()
        print("Error durante la limpieza:", e)
        raise
    finally:
        session.close()


if __name__ == '__main__':
    main()
