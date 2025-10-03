from flask import Blueprint, request, jsonify
from ABMC_db import *  # alta_servicio, modificar_servicio, mostrar_servicios, baja_servicio, buscar_servicio, SessionLocal, Servicio

app = Blueprint('servicios', __name__)

def validar_codigo(codigo):
    return isinstance(codigo, str) and codigo.strip() != "" and len(codigo.strip()) <= 50

def validar_text_field(v, min_len=1, max_len=255):
    return isinstance(v, str) and min_len <= len(v.strip()) <= max_len

def validar_precio(precio):
    try:
        p = float(precio)
        return p >= 0
    except Exception:
        return False

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

@app.route("/servicios/", methods=["POST"])
def registrar_servicio():
    data = request.get_json() or {}
    codigo = data.get("codigo")
    descripcion = data.get("descripcion")
    precioBase = data.get("precioBase")
    tiempoEstimado = data.get("tiempoEstimado") 
    activo = parse_activo(data.get("activo"))

    if not validar_codigo(codigo):
        return jsonify({"error": "codigo inválido"}), 400
    if not validar_text_field(descripcion):
        return jsonify({"error": "descripcion inválida"}), 400
    if not validar_precio(precioBase):
        return jsonify({"error": "precioBase inválido"}), 400

    session = SessionLocal()
    try:
        existing = session.query(Servicio).filter_by(codigo=codigo).first()
        if existing:
            return jsonify({"error": "Servicio con ese codigo ya existe"}), 409
    finally:
        session.close()

    try:
        alta_servicio(codigo.strip(), descripcion.strip(), float(precioBase), tiempoEstimado, activo)
        return jsonify({"mensaje": "Servicio creado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "No se pudo crear servicio", "detail": str(e)}), 500

@app.route("/servicios/<codigo>", methods=["PUT"])
def modificar_datos_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).filter_by(codigo=codigo).first()
    if not servicio:
        session.close()
        return jsonify({"detail": "Servicio no encontrado"}), 404

    data = request.get_json() or {}
    descripcion = data.get("descripcion", servicio.descripcion)
    precioBase = data.get("precioBase", servicio.precioBase)
    tiempoEstimado = data.get("tiempoEstimado", getattr(servicio, "tiempoEstimado", None))
    activo = parse_activo(data.get("activo", servicio.activo))

    if not validar_text_field(descripcion):
        session.close()
        return jsonify({"error": "descripcion inválida"}), 400
    if not validar_precio(precioBase):
        session.close()
        return jsonify({"error": "precioBase inválido"}), 400

    try:
        modificar_servicio(codigo, descripcion.strip(), float(precioBase), tiempoEstimado, activo)
        session.close()
        return jsonify({"mensaje": "Servicio modificado exitosamente"}), 200
    except Exception as e:
        session.close()
        return jsonify({"error": "No se pudo modificar servicio", "detail": str(e)}), 500

@app.route("/servicios/<codigo>", methods=["GET"])
def mostrar_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).filter_by(codigo=codigo).first()
    session.close()
    if servicio:
        servicio_dict = {
            "codigo": servicio.codigo,
            "descripcion": servicio.descripcion,
            "precioBase": servicio.precioBase,
            "tiempoEstimado": getattr(servicio, "tiempoEstimado", None),
            "activo": getattr(servicio, "activo", 1)
        }
        return jsonify(servicio_dict), 200
    return jsonify({"detail": "Servicio no encontrado"}), 404

@app.route("/servicios/<codigo>", methods=["DELETE"])
def baja_logica_servicio(codigo):
    session = SessionLocal()
    servicio = session.query(Servicio).filter_by(codigo=codigo).first()
    if not servicio:
        session.close()
        return jsonify({"detail": "Servicio no encontrado"}), 404
    try:
        baja_servicio(codigo)  # debe marcar activo=0 en ABMC_db
        session.close()
        return jsonify({"mensaje": "Servicio dado de baja"}), 200
    except Exception as e:
        session.close()
        return jsonify({"error": "No se pudo dar de baja", "detail": str(e)}), 500

@app.route("/servicios/", methods=["GET"])
def listar_servicios():
    activos = request.args.get("activos", "true").lower() == "true"
    try:
        servicios = mostrar_servicios()
        result = [
            {
                "codigo": s.codigo,
                "descripcion": s.descripcion,
                "precioBase": s.precioBase,
                "tiempoEstimado": getattr(s, "tiempoEstimado", None),
                "activo": getattr(s, "activo", 1)
            } for s in servicios if (not activos) or getattr(s, "activo", 1) == 1
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Error al listar servicios", "detail": str(e)}), 500

if __name__ == "__main__":
    from flask import Flask
    from flask_cors import CORS
    app_server = Flask(__name__)
    CORS(app_server)
    app_server.register_blueprint(app, url_prefix='/')
    app_server.run(debug=True)