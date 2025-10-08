from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_orden_de_reparacion,
    modificar_orden_de_reparacion,
    mostrar_ordenes_de_reparacion,
    alta_detalle_orden # Importamos la función para dar de alta detalles
)
from BDD.database import SessionLocal, OrdenDeReparacion, Dispositivo, Empleado
from datetime import datetime

app = Blueprint("ordenes", __name__)

@app.route("/ordenes/", methods=["POST"])
def registrar_orden():
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        # Validaciones básicas
        if not data.get("nroSerieDispositivo") or not data.get("idEmpleado") or not data.get("fecha"):
            return jsonify({"error": "Datos incompletos: Nro. de Serie, Empleado y Fecha son obligatorios"}), 400

        detalles_recibidos = data.get("detalles", [])
        
        # Calculamos el presupuesto desde el backend
        presupuesto_calculado = sum(float(d.get("subtotal", 0.0)) for d in detalles_recibidos)

        # Creamos la orden principal
        nueva_orden = OrdenDeReparacion(
            nroSerieDispositivo=data["nroSerieDispositivo"],
            fecha=datetime.strptime(data["fecha"], "%Y-%m-%d").date(),
            descripcionDanos=data.get("descripcionDanos", ""),
            diagnostico=data.get("diagnostico", ""),
            presupuesto=presupuesto_calculado,
            idEmpleado=int(data["idEmpleado"])
        )
        session.add(nueva_orden)
        session.flush()  # Para obtener el nroDeOrden autoincremental

        # Creamos los detalles asociados
        for detalle_data in detalles_recibidos:
            nuevo_detalle = DetalleOrden(
                nroDeOrden=nueva_orden.nroDeOrden,
                codigoServicio=detalle_data.get("codigoServicio"),
                codRepuestos=detalle_data.get("codRepuestos"),
                cuitProveedor=detalle_data.get("cuitProveedor"),
                costoServicio=float(detalle_data.get("costoServicio", 0.0)),
                costoRepuesto=float(detalle_data.get("costoRepuesto", 0.0)),
                subtotal=float(detalle_data.get("subtotal", 0.0))
            )
            session.add(nuevo_detalle)
        
        session.commit()
        return jsonify({"mensaje": "Orden y detalles creados exitosamente", "nroDeOrden": nueva_orden.nroDeOrden}), 201
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error al crear la orden", "detail": str(e)}), 500
    finally:
        session.close()


@app.route("/ordenes/<int:nroDeOrden>", methods=["PUT"])
def modificar_orden(nroDeOrden):
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        orden = session.query(OrdenDeReparacion).get(nroDeOrden)
        if not orden:
            return jsonify({"error": "Orden no encontrada"}), 404

        # Actualizar campos
        orden.nroSerieDispositivo = data.get("nroSerieDispositivo", orden.nroSerieDispositivo)
        orden.fecha = datetime.strptime(data["fecha"], "%Y-%m-%d").date() if data.get("fecha") else orden.fecha
        orden.descripcionDanos = data.get("descripcionDanos", orden.descripcionDanos)
        orden.diagnostico = data.get("diagnostico", orden.diagnostico)
        orden.idEmpleado = int(data.get("idEmpleado", orden.idEmpleado))

        # Recalcular presupuesto si se modifican detalles (lógica en frontend/otra ruta)
        # Aquí solo actualizamos el valor que nos llega si se recalcula en el front
        detalles_actuales = session.query(DetalleOrden).filter_by(nroDeOrden=nroDeOrden).all()
        orden.presupuesto = sum(d.subtotal for d in detalles_actuales)

        session.commit()
        return jsonify({"mensaje": "Orden modificada exitosamente"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": "No se pudo modificar la orden", "detail": str(e)}), 500
    finally:
        session.close()


@app.route("/ordenes/", methods=["GET"])
def listar_ordenes():
    session = SessionLocal()
    try:
        ordenes_con_datos = (
            session.query(OrdenDeReparacion, Dispositivo, Empleado)
            .join(Dispositivo, OrdenDeReparacion.nroSerieDispositivo == Dispositivo.nroSerie)
            .join(Empleado, OrdenDeReparacion.idEmpleado == Empleado.idEmpleado)
            .all()
        )
        
        result = [
            {
                "nroDeOrden": o.nroDeOrden,
                "nroSerieDispositivo": o.nroSerieDispositivo,
                "dispositivo_info": f"{d.marca} {d.modelo}",
                "fecha": o.fecha.strftime("%Y-%m-%d") if o.fecha else None,
                "descripcionDanos": o.descripcionDanos,
                "diagnostico": o.diagnostico,
                "presupuesto": o.presupuesto,
                "idEmpleado": o.idEmpleado,
                "empleado_info": f"{e.nombre} {e.apellido}",
            }
            for o, d, e in ordenes_con_datos
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Error al listar órdenes", "detail": str(e)}), 500
    finally:
        session.close()