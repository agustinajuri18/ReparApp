from flask import Blueprint, request, jsonify
from ABMC_db import *  
app = Blueprint('repuestos', __name__)

def validar_codigo(codigo):
    return isinstance(codigo, str) and codigo.strip() != "" and len(codigo.strip()) <= 50

def validar_text_field(v, min_len=1, max_len=255):
    return isinstance(v, str) and min_len <= len(v.strip()) <= max_len

def validar_cuit_cuil(cuit):
    s = str(cuit)
    return s.isdigit() and len(s) == 11


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

@app.route("/repuestos/", methods=["POST"])
def registrar_repuesto():
    data = request.get_json() or {}
    codigo = data.get("codigo")
    marca = data.get("marca")
    modelo = data.get("modelo")
    tipo = data.get("tipo")
    cuilProveedor = data.get("cuilProveedor")
    activo = parse_activo(data.get("activo"))

    if not validar_codigo(codigo):
        return jsonify({"error": "codigo inválido"}), 400
    if not validar_text_field(marca):
        return jsonify({"error": "marca inválida"}), 400
    if not validar_text_field(modelo):
        return jsonify({"error": "modelo inválido"}), 400
    if not validar_text_field(tipo):
        return jsonify({"error": "tipo inválido"}), 400
    if not validar_cuit_cuil(cuilProveedor):
        return jsonify({"error": "cuilProveedor inválido"}), 400

    # evita duplicados
    session = SessionLocal()
    try:
        existing = session.query(Repuesto).filter_by(codigo=codigo).first()
        if existing:
            return jsonify({"error": "Repuesto con ese codigo ya existe"}), 409
    finally:
        session.close()

    try:
        alta_repuesto(codigo.strip(), marca.strip(), modelo.strip(), tipo.strip(), int(cuilProveedor), activo)
        return jsonify({"mensaje": "Repuesto creado exitosamente"}), 201
    except Exception as e:
        return jsonify({"error": "No se pudo crear repuesto", "detail": str(e)}), 500

@app.route("/repuestos/<codigo>", methods=["PUT"])
def modificar_datos_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).filter_by(codigo=codigo).first()
    if not repuesto:
        session.close()
        return jsonify({"detail": "Repuesto no encontrado"}), 404

    data = request.get_json() or {}
    marca = data.get("marca", repuesto.marca)
    modelo = data.get("modelo", repuesto.modelo)
    tipo = data.get("tipo", repuesto.tipo)
    cuilProveedor = data.get("cuilProveedor", repuesto.cuilProveedor)
    costo = data.get("costo", repuesto.costo)
    activo = parse_activo(data.get("activo", repuesto.activo))

    if not validar_text_field(marca):
        session.close()
        return jsonify({"error": "marca inválida"}), 400
    if not validar_text_field(modelo):
        session.close()
        return jsonify({"error": "modelo inválido"}), 400
    if not validar_text_field(tipo):
        session.close()
        return jsonify({"error": "tipo inválido"}), 400
    if not validar_cuit_cuil(cuilProveedor):
        session.close()
        return jsonify({"error": "cuilProveedor inválido"}), 400

    try:
        modificar_repuesto(codigo, marca.strip(), modelo.strip(), tipo.strip(), int(cuilProveedor), float(costo), activo)
        session.close()
        return jsonify({"mensaje": "Repuesto modificado exitosamente"}), 200
    except Exception as e:
        session.close()
        return jsonify({"error": "No se pudo modificar repuesto", "detail": str(e)}), 500

@app.route("/repuestos/<codigo>", methods=["GET"])
def mostrar_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).filter_by(codigo=codigo).first()
    if not repuesto:
        session.close()
        return jsonify({"detail": "Repuesto no encontrado"}), 404

    try:
        # Obtener los datos de la tabla repuestoxproveedor asociados al repuesto
        repuestos_proveedores = session.query(RepuestoxProveedor).filter_by(codigoRepuesto=codigo).all()
        repuestos_proveedores_list = [{
            "codigoRepuesto": rp.codigoRepuesto,
            "cuilProveedor": rp.cuilProveedor,
            "precio": rp.precio,
            "stock": rp.stock,
            "fechaActualizacion": rp.fechaActualizacion
        } for rp in repuestos_proveedores]

        repuesto_dict = {
            "codigo": repuesto.codigo,
            "marca": repuesto.marca,
            "modelo": repuesto.modelo,
            "tipo": repuesto.tipo,
            "cuilProveedor": repuesto.cuilProveedor,
            "activo": repuesto.activo,
            "repuestosProveedores": repuestos_proveedores_list
        }
        session.close()
        return jsonify(repuesto_dict), 200
    except Exception as e:
        session.close()
        return jsonify({"error": "Error al obtener datos del repuesto", "detail": str(e)}), 500

@app.route("/repuestos/<codigo>", methods=["DELETE"])
def baja_logica_repuesto(codigo):
    session = SessionLocal()
    repuesto = session.query(Repuesto).filter_by(codigo=codigo).first()
    if not repuesto:
        session.close()
        return jsonify({"detail": "Repuesto no encontrado"}), 404
    try:
        baja_repuesto(codigo)  # debe marcar activo=0 en ABMC_db
        session.close()
        return jsonify({"mensaje": "Repuesto dado de baja"}), 200
    except Exception as e:
        session.close()
        return jsonify({"error": "No se pudo dar de baja", "detail": str(e)}), 500

@app.route("/repuestos/", methods=["GET"])
def listar_repuestos():
    activos = request.args.get("activos", "true").lower() == "true"
    try:
        repuestos = mostrar_repuestos(activos_only=activos)
        return jsonify([{
            "codigo": r.codigo,
            "marca": r.marca,
            "modelo": r.modelo,
            "tipo": r.tipo,
            "cuilProveedor": r.cuilProveedor,
            "activo": r.activo
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({"error": "Error al listar repuestos", "detail": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)