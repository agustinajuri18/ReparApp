from fastapi import FastAPI, HTTPException
from ReparApp.BDD.database import SessionLocal, Usuario, Cliente
from ReparApp.Backend import ABMC_db
from ReparApp.Backend.schemas import UsuarioCreate, ClienteCreate

app = FastAPI(title="ReparApp API", version="1.0")

# Dependency para abrir/cerrar sesión
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Usuarios --------
@app.post("/usuarios/")
def crear_usuario(usuario: UsuarioCreate):
    try:
        ABMC_db.alta_usuario(usuario.id_usuario, usuario.password)
        return {"mensaje": "Usuario creado exitosamente"}
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="El id_usuario ya existe")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/usuarios/")
def listar_usuarios():
    usuarios = ABMC_db.mostrar_usuarios()
    return [{"id_usuario": u.id_usuario, "password": u.password} for u in usuarios]

@app.put("/usuarios/{id_usuario}")
def actualizar_usuario(id_usuario: int, usuario: UsuarioCreate):
    ABMC_db.modificar_usuario(id_usuario, usuario.password)
    return {"mensaje": "Usuario actualizado"}

@app.delete("/usuarios/{id_usuario}")
def eliminar_usuario(id_usuario: int):
    ABMC_db.baja_usuario(id_usuario)
    return {"mensaje": "Usuario eliminado"}

# -------- Clientes --------
@app.post("/clientes/")
def crear_cliente(cliente: ClienteCreate):
    try:
        ABMC_db.alta_cliente(
            cliente.tipo_documento,
            cliente.numero_dni,
            cliente.nombre,
            cliente.apellido,
            cliente.telefono,
            cliente.mail
        )
        return {"mensaje": "Cliente creado exitosamente"}
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="El cliente ya existe")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clientes/")
def listar_clientes():
    clientes = ABMC_db.mostrar_clientes()
    return [
        {
            "tipo_documento": c.tipo_documento,
            "numero_dni": c.numero_dni,
            "nombre": c.nombre,
            "apellido": c.apellido,
            "telefono": c.telefono,
            "mail": c.mail
        }
        for c in clientes
    ]

@app.get("/clientes/{tipo_documento}/{numero_dni}")
def obtener_cliente(tipo_documento: str, numero_dni: int):
    cliente = ABMC_db.obtener_cliente(tipo_documento, numero_dni)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {
        "tipo_documento": cliente.tipo_documento,
        "numero_dni": cliente.numero_dni,
        "nombre": cliente.nombre,
        "apellido": cliente.apellido,
        "telefono": cliente.telefono,
        "mail": cliente.mail
    }

@app.put("/clientes/{tipo_documento}/{numero_dni}")
def actualizar_cliente(tipo_documento: str, numero_dni: int, cliente: ClienteCreate):
    ABMC_db.modificar_cliente(
        tipo_documento,
        numero_dni,
        cliente.nombre,
        cliente.apellido,
        cliente.telefono,
        cliente.mail
    )
    return {"mensaje": "Cliente actualizado"}

@app.delete("/clientes/{tipo_documento}/{numero_dni}")
def eliminar_cliente(tipo_documento: str, numero_dni: int):
    ABMC_db.baja_cliente(tipo_documento, numero_dni)
    return {"mensaje": "Cliente eliminado"}