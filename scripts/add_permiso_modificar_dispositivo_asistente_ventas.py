# Script para dar permiso de modificar dispositivos (idPermiso=42) al asistente de ventas (idCargo=3)


import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from BDD.database import CargoxPermiso, SessionLocal

def main():
    session = SessionLocal()
    try:
        existe = session.query(CargoxPermiso).filter_by(idCargo=3, idPermiso=42).first()
        if existe:
            print("El permiso ya está asignado.")
            return
        nuevo = CargoxPermiso(idCargo=3, idPermiso=42)
        session.add(nuevo)
        session.commit()
        print("Permiso 42 asignado a idCargo 3 correctamente.")
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()
