import traceback
from flask import Blueprint, request, jsonify    
from ABMC_db import alta_dispositivo, modificar_dispositivo, mostrar_dispositivos, baja_dispositivo, dispositivos_por_cliente
from BDD.database import SessionLocal, Dispositivo  # importa el modelo

app = Blueprint('dispositivos', __name__)

def validar_nroSerie(nro):
    return isinstance(nro, str) and nro.strip() != ""

def validar_text_field(v, min_len=1, max_len=255):
    return isinstance(v, str) and min_len <= len(v.strip()) <= max_len

def validar_dni_like(dni):
    s = str(dni)
    return s.isdigit() and 7 <= len(s) <= 8

def parse_activo(value):
    if value is None:
        return 1
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, int):
        return 1 if value != 0 else 0
    vs = str(value).lower()
    if vs in ("1", "true", "yes", "si"):
        return 1
    if vs in ("0", "false", "no"):
        return 0
    return 1

@app.route("/dispositivos/", methods=["POST"])
def registrar_dispositivo():
    data = request.get_json() or {}
    nroSerie = data.get("nroSerie")
    marca = data.get("marca")
    modelo = data.get("modelo")
    clienteTipoDocumento = data.get("clienteTipoDocumento")
    clienteNumeroDoc = data.get("clienteNumeroDoc")
    activo = parse_activo(data.get("activo"))

    # --- validaciones previas ---
    if not validar_nroSerie(nroSerie):
        return jsonify({"error": "nroSerie inválido"}), 400
    if not validar_text_field(marca):
        return jsonify({"error": "marca inválida"}), 400
    if not validar_text_field(modelo):
        return jsonify({"error": "modelo inválido"}), 400
    if not validar_text_field(clienteTipoDocumento):
        return jsonify({"error": "clienteTipoDocumento inválido"}), 400
    if not validar_dni_like(clienteNumeroDoc):
        return jsonify({"error": "clienteNumeroDoc inválido"}), 400

    # --- 🔍 Verificar si el nroSerie ya existe ---
    session = SessionLocal()
    if session.query(Dispositivo).filter_by(nroSerie=nroSerie).first():
        session.close()
        return jsonify({"error": f"El dispositivo con número de serie {nroSerie} ya existe."}), 400
    session.close()

    try:
        alta_dispositivo(nroSerie.strip(), marca.strip(), modelo.strip(),
                         clienteTipoDocumento.strip(), int(clienteNumeroDoc), activo)
        return jsonify({"mensaje": "Dispositivo creado exitosamente"}), 201
    except Exception as e:
        import traceback
        print("❌ ERROR al crear dispositivo:")
        traceback.print_exc()
        return jsonify({"error": "No se pudo crear dispositivo", "detail": str(e)}), 500



@app.route("/dispositivos/<nroSerie>", methods=["PUT"])
def modificar_datos_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
    if not dispositivo:
        session.close()
        return jsonify({"detail": "Dispositivo no encontrado"}), 404

    data = request.get_json() or {}
    new_nroSerie = data.get("nroSerie", nroSerie)
    marca = data.get("marca", dispositivo.marca)
    modelo = data.get("modelo", dispositivo.modelo)
    clienteTipoDocumento = data.get("clienteTipoDocumento", dispositivo.clienteTipoDocumento)
    clienteNumeroDoc = data.get("clienteNumeroDoc", dispositivo.clienteNumeroDoc)  # CAMBIO: nombre según modelo
    activo = parse_activo(data.get("activo", dispositivo.activo))

    # validaciones
    if not validar_nroSerie(new_nroSerie):
        session.close()
        return jsonify({"error": "nroSerie inválido"}), 400
    if not validar_text_field(marca):
        session.close()
        return jsonify({"error": "marca inválida"}), 400
    if not validar_text_field(modelo):
        session.close()
        return jsonify({"error": "modelo inválido"}), 400
    if not validar_text_field(clienteTipoDocumento):
        session.close()
        return jsonify({"error": "clienteTipoDocumento inválido"}), 400
    if not validar_dni_like(clienteNumeroDoc):
        session.close()
        return jsonify({"error": "clienteNumeroDoc inválido"}), 400

    try:
        modificar_dispositivo(new_nroSerie.strip(), marca.strip(), modelo.strip(), clienteTipoDocumento.strip(), int(clienteNumeroDoc), activo)
        session.close()
        return jsonify({"mensaje": "Dispositivo modificado exitosamente"}), 200
    except Exception as e:
        session.close()
        return jsonify({"error": "No se pudo modificar dispositivo", "detail": str(e)}), 500

@app.route("/dispositivos/<nroSerie>", methods=["GET"])
def mostrar_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
    session.close()
    if dispositivo:
        dispositivo_dict = {
            "nroSerie": dispositivo.nroSerie,
            "marca": dispositivo.marca,
            "modelo": dispositivo.modelo,
            "clienteTipoDocumento": dispositivo.clienteTipoDocumento,
            "clienteNumeroDoc": dispositivo.clienteNumeroDoc,  # CAMBIO: nombre según modelo
            "activo": dispositivo.activo
        }
        return jsonify(dispositivo_dict), 200
    return jsonify({"detail": "Dispositivo no encontrado"}), 404

@app.route("/dispositivos/<nroSerie>", methods=["DELETE"])
def baja_logica_dispositivo(nroSerie):
    session = SessionLocal()
    dispositivo = session.query(Dispositivo).filter_by(nroSerie=nroSerie).first()
    if dispositivo:
        try:
            baja_dispositivo(nroSerie)
            session.close()
            return jsonify({"mensaje": "Dispositivo dado de baja"}), 200
        except Exception as e:
            session.close()
            return jsonify({"error": "No se pudo dar de baja", "detail": str(e)}), 500
    session.close()
    return jsonify({"detail": "Dispositivo no encontrado"}), 404

@app.route("/dispositivos/", methods=["GET"])
def listar_dispositivos():
    activos = request.args.get("activos", "true").lower() == "true"
    dispositivos = mostrar_dispositivos(activos_only=activos)
    result = [{
        "nroSerie": d.nroSerie,
        "marca": d.marca,
        "modelo": d.modelo,
        "clienteTipoDocumento": d.clienteTipoDocumento,
        "clienteNumeroDoc": d.clienteNumeroDoc,  # CAMBIO: nombre según modelo
        "activo": d.activo
    } for d in dispositivos]
    return jsonify(result), 200

# El endpoint dispositivos_por_cliente debe ajustarse al modelo también
@app.route("/dispositivos/cliente", methods=["GET"])
def dispositivos_por_cliente_endpoint():
    clienteTipoDocumento = request.args.get("clienteTipoDocumento")
    clienteNumeroDoc = request.args.get("clienteNumeroDoc")  # CAMBIO: nombre según modelo
    if not clienteTipoDocumento or not clienteNumeroDoc:
        return jsonify({"detail": "Faltan parámetros clienteTipoDocumento o clienteNumeroDoc"}), 400
    if not validar_dni_like(clienteNumeroDoc):
        return jsonify({"detail": "clienteNumeroDoc inválido"}), 400
    try:
        dispositivos = dispositivos_por_cliente(clienteTipoDocumento, int(clienteNumeroDoc))
        return jsonify([{
            "nroSerie": d.nroSerie,
            "marca": d.marca,
            "modelo": d.modelo,
            "clienteTipoDocumento": d.clienteTipoDocumento,
            "clienteNumeroDoc": d.clienteNumeroDoc,  # CAMBIO: nombre según modelo
            "activo": d.activo
        } for d in dispositivos]), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener dispositivos", "detail": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)