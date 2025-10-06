from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_repuestoxproveedor,
    baja_repuestoxproveedor,
    alta_repuesto, modificar_repuesto, mostrar_repuestos, baja_repuesto, buscar_repuesto
)
from BDD.database import SessionLocal, Repuesto, RepuestoxProveedor, Proveedor

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
    activo = parse_activo(data.get("activo"))

    if not validar_codigo(codigo):
        return jsonify({"error": "codigo inválido"}), 400
    if not validar_text_field(marca):
        return jsonify({"error": "marca inválida"}), 400
    if not validar_text_field(modelo):
        return jsonify({"error": "modelo inválido"}), 400

    session = SessionLocal()
    try:
        existing = session.query(Repuesto).filter_by(codigo=codigo).first()
        if existing:
            return jsonify({"error": "Repuesto con ese codigo ya existe"}), 409
    finally:
        session.close()

    try:
        alta_repuesto(codigo.strip(), marca.strip(), modelo.strip(), activo)
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
    activo = parse_activo(data.get("activo", repuesto.activo))

    if not validar_text_field(marca):
        session.close()
        return jsonify({"error": "marca inválida"}), 400
    if not validar_text_field(modelo):
        session.close()
        return jsonify({"error": "modelo inválido"}), 400

    try:
        modificar_repuesto(codigo, marca.strip(), modelo.strip(), activo)
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
        repuestos_proveedores = session.query(RepuestoxProveedor).filter_by(codigoRepuesto=codigo).all()
        repuestos_proveedores_list = [{
            "codigoRepuesto": rp.codigoRepuesto,
            "cuilProveedor": rp.cuilProveedor,
            "costo": rp.costo,
            "cantidad": rp.cantidad
        } for rp in repuestos_proveedores]

        repuesto_dict = {
            "codigo": repuesto.codigo,
            "marca": repuesto.marca,
            "modelo": repuesto.modelo,
            "activo": repuesto.activo,
            "proveedores": repuestos_proveedores_list
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
        baja_repuesto(codigo)
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
            "activo": r.activo
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({"error": "Error al listar repuestos", "detail": str(e)}), 500

@app.route("/repuestoxproveedor/", methods=["POST", "OPTIONS"])
def agregar_repuestoxproveedor():
    if request.method == "OPTIONS":
        return '', 204

    data = request.get_json() or {}
    codigoRepuesto = data.get("codigoRepuesto")
    cuilProveedor = data.get("cuilProveedor")
    costo = data.get("costo")
    cantidad = data.get("cantidad")

    if not codigoRepuesto or not cuilProveedor or costo is None or cantidad is None:
        return jsonify({"error": "Datos incompletos"}), 400

    session = SessionLocal()
    try:
        repuesto = session.query(Repuesto).filter_by(codigo=codigoRepuesto).first()
        if not repuesto:
            session.close()
            return jsonify({"error": "Repuesto no encontrado"}), 404

        # VERIFICAR SI YA EXISTE LA RELACIÓN
        existe = session.query(RepuestoxProveedor).filter_by(
            codigoRepuesto=codigoRepuesto,
            cuilProveedor=cuilProveedor
        ).first()
        if existe:
            session.close()
            return jsonify({"error": "La relación repuesto-proveedor ya existe"}), 409

        session.close()
        alta_repuestoxproveedor(codigoRepuesto, cuilProveedor, costo, cantidad)
        return jsonify({"mensaje": "Relación repuesto-proveedor creada"}), 201
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": "No se pudo crear la relación", "detail": str(e)}), 500

@app.route("/repuestoxproveedor/", methods=["DELETE", "OPTIONS"])
def eliminar_repuestoxproveedor():
    if request.method == "OPTIONS":
        return '', 204

    data = request.get_json() or {}
    codigoRepuesto = data.get("codigoRepuesto")
    cuilProveedor = data.get("cuilProveedor")

    if not codigoRepuesto or not cuilProveedor:
        return jsonify({"error": "Datos incompletos"}), 400

    try:
        baja_repuestoxproveedor(codigoRepuesto, cuilProveedor)
        return jsonify({"mensaje": "Proveedor eliminado del repuesto"}), 200
    except Exception as e:
        return jsonify({"error": "No se pudo eliminar", "detail": str(e)}), 500

@app.route("/repuestos_con_proveedores", methods=["GET"])
def listar_repuestos_con_proveedores():
    session = SessionLocal()
    try:

        # Hacemos un JOIN entre Repuesto, RepuestoxProveedor y Proveedor
        datos = (
            session.query(Repuesto, RepuestoxProveedor, Proveedor)
            .join(RepuestoxProveedor, RepuestoxProveedor.codigoRepuesto == Repuesto.codigo)
            .join(Proveedor, RepuestoxProveedor.cuilProveedor == Proveedor.cuil)
            .all()
        )

        repuestos_dict = {}
        for r, rxp, p in datos:
            if r.codigo not in repuestos_dict:
                repuestos_dict[r.codigo] = {
                    "codigo": r.codigo,
                    "marca": r.marca,
                    "modelo": r.modelo,
                    "activo": r.activo,
                    "proveedores": []
                }
            repuestos_dict[r.codigo]["proveedores"].append({
                "cuilProveedor": p.cuil,
                "razonSocial": p.razonSocial,
                "telefono": p.telefono,
                "costo": rxp.costo,
                "cantidad": rxp.cantidad
            })

        session.close()
        return jsonify(list(repuestos_dict.values())), 200
    except Exception as e:
        session.close()
        import traceback; traceback.print_exc()
        return jsonify({"error": "Error al listar repuestos con proveedores", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)