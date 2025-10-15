from flask import Blueprint, request, jsonify, make_response, send_file
from flask_cors import cross_origin
from datetime import datetime, date
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
import os
from ABMC_db import (
    alta_orden_de_reparacion, alta_orden_por_nroSerie, modificar_orden, # <--- CORRECCIÓN AQUÍ
    mostrar_ordenes, asignar_estado_orden, mostrar_estados,
    mostrar_repuestos_por_servicio, mostrar_repuestoxproveedor, mostrar_proveedores,
    alta_detalle_orden, modificar_detalle_orden, baja_detalle_orden,
    mostrar_historial_arreglos, alta_historial_arreglos, buscar_por_id
)

bp = Blueprint('ordenes', __name__)

@bp.route('/ordenes', methods=['POST'])
@cross_origin()
def registrar_orden():
    data = request.get_json() or {}

    nroSerie = data.get('nroSerie')
    idDispositivo = data.get('idDispositivo')

    # Necesitamos al menos nroSerie o idDispositivo
    if not nroSerie and not idDispositivo:
        return jsonify({'error': 'Se requiere nroSerie o idDispositivo'}), 400

    fecha_hoy = datetime.now().date()

    try:
        if nroSerie:
            orden = alta_orden_por_nroSerie(
                nroSerie=nroSerie,
                fecha=fecha_hoy,
                descripcionDanos=data.get('descripcionDanos'),
                diagnostico=data.get('diagnostico'),
                presupuesto=data.get('presupuesto'),
                idEmpleado=data.get('idEmpleado')
            )
            if not orden:
                return jsonify({'error': 'No se encontró dispositivo con ese número de serie'}), 404
        else:
            orden = alta_orden_de_reparacion(
                idDispositivo=idDispositivo,
                fecha=fecha_hoy,
                descripcionDanos=data.get('descripcionDanos'),
                diagnostico=data.get('diagnostico'),
                presupuesto=data.get('presupuesto'),
                idEmpleado=data.get('idEmpleado')
            )

        # Asignar estado inicial "EnDiagnostico" si existe en la tabla Estado
        estados = {e.nombre: e.idEstado for e in mostrar_estados()}
        id_estado_diagnostico = estados.get('EnDiagnostico')
        if id_estado_diagnostico:
            asignar_estado_orden(
                nroDeOrden=orden.nroDeOrden,
                idEstado=id_estado_diagnostico,
                fechaCambio=datetime.now(),
                observaciones="Estado inicial: En Diagnóstico"
            )

        return jsonify({
            'nroDeOrden': orden.nroDeOrden,
            'idDispositivo': getattr(orden, 'idDispositivo', None),
            'fecha': orden.fecha.isoformat() if getattr(orden, 'fecha', None) else None,
            'descripcionDanos': getattr(orden, 'descripcionDanos', None),
            'diagnostico': getattr(orden, 'diagnostico', None),
            'presupuesto': getattr(orden, 'presupuesto', None),
            'idEmpleado': getattr(orden, 'idEmpleado', None),
            'estado': 'EnDiagnostico' if id_estado_diagnostico else None
        }), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error al crear la orden: {str(e)}'}), 500
    

@bp.route('/ordenes', methods=['GET'])
@cross_origin()
def listar_ordenes():
    # `mostrar_ordenes` (o la función central) ya devuelve una lista de dicts serializados.
    ordenes = mostrar_ordenes()
    return jsonify(ordenes)

@bp.route('/ordenes/<int:nroDeOrden>', methods=['PUT'])
@cross_origin()
def modificar_orden_existente(nroDeOrden):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    # Extraer los detalles del payload
    detalles_data = data.get('detalles')
    print(f"Datos recibidos para modificar orden {nroDeOrden}: {data}") # Log para depurar
    print(f"Detalles recibidos: {detalles_data}") # Log para depurar

    resultado = modificar_orden( # <--- CORRECCIÓN AQUÍ
        nroDeOrden=nroDeOrden,
        idDispositivo=data.get('idDispositivo'),
        fecha=datetime.strptime(data.get('fecha'), '%Y-%m-%d').date() if data.get('fecha') else None,
        descripcionDanos=data.get('descripcionDanos'),
        diagnostico=data.get('diagnostico'),
        presupuesto=data.get('presupuesto'),
        idEmpleado=data.get('idEmpleado'),
        detalles=detalles_data  # <-- Pasar la lista de detalles
    )

    if "error" in resultado:
        return jsonify(resultado), 500
    return jsonify(resultado), 200


@bp.route('/ordenes/<int:nroDeOrden>', methods=['GET'])
@cross_origin()
def obtener_orden_detalle(nroDeOrden):
    ordenes = mostrar_ordenes()  # mostrar_ordenes delega a obtener_ordenes
    # Try to get detail mode via helper directly if available
    try:
        from ABMC_db import obtener_ordenes
        detalle = obtener_ordenes(mode='detail', nroDeOrden=nroDeOrden)
        if not detalle:
            return jsonify({'error': 'Orden no encontrada'}), 404
        return jsonify(detalle[0]), 200
    except Exception:
        # Fallback: buscar en la lista genérica
        ord_list = [o for o in ordenes if o.get('nroDeOrden') == nroDeOrden]
        if not ord_list:
            return jsonify({'error': 'Orden no encontrada'}), 404
        return jsonify(ord_list[0]), 200


# Nuevo endpoint: repuestos + proveedores por servicio
@bp.route('/ordenes/servicios/<idServicio>/repuestos', methods=['GET'])
@cross_origin()
def api_repuestos_por_servicio(idServicio):
    try:
        idServicio = int(idServicio)
    except ValueError:
        return jsonify({'error': 'idServicio debe ser un entero'}), 400

    repuestos = mostrar_repuestos_por_servicio(idServicio) or []
    relaciones = mostrar_repuestoxproveedor() or []
    proveedores = mostrar_proveedores() or []

    resultado = []
    for r in repuestos:
        provs = []
        for rel in relaciones:
            try:
                rel_id_repuesto = getattr(rel, 'idRepuesto', None)
                rel_id_proveedor = getattr(rel, 'idProveedor', None)
                if rel_id_repuesto == r.get('idRepuesto') or str(rel_id_repuesto) == str(r.get('idRepuesto')):
                    prov_obj = next((p for p in proveedores if getattr(p, 'idProveedor', None) == rel_id_proveedor), None)
                    if prov_obj:
                        provs.append({
                            'idProveedor': getattr(prov_obj, 'idProveedor', None),
                            'cuilProveedor': getattr(prov_obj, 'cuil', None) or getattr(prov_obj, 'cuilProveedor', None),
                            'razonSocial': getattr(prov_obj, 'razonSocial', None),
                            'costo': getattr(rel, 'costo', None)
                        })
            except Exception:
                continue
        resultado.append({
            'idRepuesto': r.get('idRepuesto'),
            'marca': r.get('marca'),
            'modelo': r.get('modelo'),
            'descripcion': f"{r.get('marca','')} {r.get('modelo','')}".strip(),
            'proveedores': provs
        })
    return jsonify(resultado)
    return jsonify({'success': True})

@bp.route('/ordenes/<int:nroDeOrden>/confirmacion-presupuesto', methods=['POST'])
def confirmar_presupuesto(nroDeOrden):
    data = request.json
    if 'aceptado' not in data:
        return jsonify({'error': 'Campo "aceptado" requerido'}), 400
    aceptado = bool(data['aceptado'])
    usuario = data.get('usuario', 'SinUsuario')
    fecha = datetime.now()

    estados = {e.nombre: e.idEstado for e in mostrar_estados()}
    if aceptado:
        nuevo_estado = estados.get('EnReparacion')
    else:
        nuevo_estado = estados.get('Desestimada')
    if not nuevo_estado:
        return jsonify({'error': 'Estados no configurados correctamente'}), 500

    historial = asignar_estado_orden(
        nroDeOrden=nroDeOrden,
        idEstado=nuevo_estado,
        fechaCambio=fecha,
        observaciones=f"Presupuesto {'aceptado' if aceptado else 'rechazado'} por {usuario} en {fecha.strftime('%Y-%m-%d %H:%M')}"
    )

    return jsonify({'success': True, 'nuevoEstado': 'EnReparacion' if aceptado else 'Desestimada'})

@bp.route('/ordenes/<int:nroDeOrden>/actualizaciones', methods=['POST'])
def registrar_actualizacion_orden(nroDeOrden):
    """
    Registra un avance técnico en la orden.
    Request JSON: { "descripcion": "...", "usuario": "nombre" }
    """
    from BDD.database import OrdenDeReparacion
    
    data = request.json
    descripcion = data.get('descripcion')
    usuario = data.get('usuario', 'SinUsuario')
    fechaArreglo = datetime.now()

    if not descripcion:
        return jsonify({'error': 'Campo descripción requerido'}), 400

    # Corregir pasando la clase en lugar del string
    orden = buscar_por_id(OrdenDeReparacion, nroDeOrden)
    if not orden:
        return jsonify({'error': 'Orden no encontrada'}), 404

    historial = alta_historial_arreglos(
        nroDeOrden=nroDeOrden,
        idDispositivo=orden.idDispositivo,
        fechaArreglo=fechaArreglo,
        descripcion=f"{descripcion}\n(Registrado por {usuario} en {fechaArreglo.strftime('%Y-%m-%d %H:%M')})"
    )

    return jsonify({'success': True})

@bp.route('/ordenes/<int:nroDeOrden>/actualizaciones', methods=['GET'])
def listar_actualizaciones_orden(nroDeOrden):
    """
    Devuelve el historial de actualizaciones técnicas de una orden.
    """
    historial = mostrar_historial_arreglos(nroDeOrden)
    result = []
    for h in historial:
        result.append({
            'idHistorialor': h.idHistorialor,
            'fechaArreglo': h.fechaArreglo.isoformat(),
            'descripcion': h.descripcion,
        })
    return jsonify(result)

@bp.route('/ordenes/<int:nroDeOrden>/pdf', methods=['GET'])
@cross_origin()
def generar_pdf_orden(nroDeOrden):
    """
    Genera un PDF con los detalles de la orden de reparación.
    """
    try:
        from ABMC_db import obtener_ordenes
        ordenes = obtener_ordenes(mode='detail', nroDeOrden=nroDeOrden)
        if not ordenes:
            return jsonify({'error': 'Orden no encontrada'}), 404
        
        orden = ordenes[0]
        
        # Crear buffer para el PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=36, leftMargin=36,
                              topMargin=36, bottomMargin=36)
        
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=15,
            alignment=1,
            fontName='Helvetica-Bold'
        )
        
        company_style = ParagraphStyle(
            'Company',
            parent=styles['Normal'],
            fontSize=10,
            alignment=1,
            fontName='Helvetica-Bold'
        )
        
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading2'],
            fontSize=11,
            spaceAfter=8,
            fontName='Helvetica-Bold',
            textColor=colors.black
        )
        
        normal_style = styles['Normal']
        normal_style.fontSize = 9
        
        small_style = ParagraphStyle(
            'Small',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.gray
        )
        
        # Contenido del PDF
        elements = []
        
        # Encabezado con logo y datos de empresa
        header_table = Table([
            [Image(os.path.join(os.path.dirname(__file__), 'static', 'logo.png'), 1.5*inch, 0.8*inch) if os.path.exists(os.path.join(os.path.dirname(__file__), 'static', 'logo.png')) else '',
             [
                 Paragraph("REPARAPP", company_style),
                 Paragraph("Servicio Técnico Especializado", ParagraphStyle('Sub', parent=company_style, fontSize=8)),
                 Paragraph("Calle Ficticia 123, Ciudad - Tel: +54 11 1234-5678", small_style),
                 Paragraph("Email: info@reparapp.com", small_style)
             ]]
        ], colWidths=[1.5*inch, 4*inch])
        
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 15))
        
        # Línea divisoria
        elements.append(Table([['']], colWidths=[7.5*inch], rowHeights=[1]))
        elements.append(Spacer(1, 10))
        
        # Título principal
        elements.append(Paragraph("ORDEN DE REPARACIÓN", title_style))
        elements.append(Spacer(1, 10))
        
        # Información de la orden en 2 columnas
        order_info = [
            ['N° Orden:', str(orden.get('nroDeOrden', '')), 'Fecha:', orden.get('fecha', '')],
            ['Estado:', orden.get('estado', '') or 'Pendiente', 'Técnico:', orden.get('empleado_info', 'No asignado')]
        ]
        
        order_table = Table(order_info, colWidths=[1*inch, 1.5*inch, 1*inch, 1.5*inch])
        order_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ]))
        elements.append(order_table)
        elements.append(Spacer(1, 15))
        
        # Información del cliente y dispositivo en 2 columnas
        client_device_info = [
            [
                Paragraph("<b>CLIENTE</b><br/>" + (orden.get('cliente_info', 'No disponible')), normal_style),
                Paragraph("<b>DISPOSITIVO</b><br/>" + (orden.get('dispositivo_info', 'No disponible')), normal_style)
            ]
        ]
        
        client_device_table = Table(client_device_info, colWidths=[3.5*inch, 3.5*inch])
        client_device_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(client_device_table)
        elements.append(Spacer(1, 15))
        
        # Descripción de daños y diagnóstico en 2 columnas
        description_diagnosis = [
            [
                Paragraph("<b>DESCRIPCIÓN DE DAÑOS</b><br/>" + (orden.get('descripcionDanos', 'No especificado')), normal_style),
                Paragraph("<b>DIAGNÓSTICO</b><br/>" + (orden.get('diagnostico', 'Pendiente')), normal_style)
            ]
        ]
        
        desc_diag_table = Table(description_diagnosis, colWidths=[3.5*inch, 3.5*inch])
        desc_diag_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(desc_diag_table)
        elements.append(Spacer(1, 15))
        
        # Detalles de reparación
        detalles = orden.get('detalles', [])
        if detalles:
            elements.append(Paragraph("DETALLES DE LA REPARACIÓN", section_style))
            
            data_detalles = [['Servicio', 'Repuesto', 'Costo Serv.', 'Costo Rep.', 'Subtotal']]
            
            for det in detalles:
                servicio_desc = str(det.get('servicioDescripcion', '')) or ''
                servicio = servicio_desc[:25] + '...' if len(servicio_desc) > 25 else servicio_desc
                
                repuesto_desc = str(det.get('repuestoDescripcion', '')) or ''
                repuesto = repuesto_desc[:25] + '...' if len(repuesto_desc) > 25 else repuesto_desc
                
                costo_serv = f"${det.get('costoServicio', 0):.2f}"
                costo_rep = f"${det.get('costoRepuesto', 0):.2f}"
                subtotal = f"${det.get('subtotal', 0):.2f}"
                data_detalles.append([servicio, repuesto, costo_serv, costo_rep, subtotal])
            
            table_detalles = Table(data_detalles, colWidths=[1.5*inch, 1.5*inch, 0.8*inch, 0.8*inch, 0.9*inch])
            table_detalles.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.gray),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('ALIGN', (2, 1), (4, -1), 'RIGHT'),
            ]))
            elements.append(table_detalles)
            elements.append(Spacer(1, 10))
        
        # Total
        precio_total = orden.get('precioTotal', 0)
        total_table = Table([['TOTAL: $' + f"{precio_total:.2f}"]], colWidths=[7.5*inch])
        total_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.black),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (0, 0), 12),
            ('BOTTOMPADDING', (0, 0), (0, 0), 8),
        ]))
        elements.append(total_table)
        elements.append(Spacer(1, 20))
        
        # Pie de página
        footer_table = Table([
            [
                Paragraph("Gracias por confiar en nuestros servicios técnicos especializados.", small_style),
                Paragraph(f"Fecha de emisión: {datetime.now().strftime('%d/%m/%Y %H:%M')}<br/>Comprobante generado electrónicamente", small_style)
            ]
        ], colWidths=[3.5*inch, 3.5*inch])
        
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(footer_table)
        
        # Generar PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Preparar respuesta SIN attachment para que se pueda visualizar
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'inline; filename=orden_reparacion_{nroDeOrden}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': f'Error al generar PDF: {str(e)}'}), 500

@bp.route('/ordenes/<int:nroDeOrden>/preview', methods=['GET'])
@cross_origin()
def preview_pdf_orden(nroDeOrden):
    """
    Muestra una página HTML con el PDF embebido para previsualización.
    """
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Previsualización - Orden de Reparación #{nroDeOrden}</title>
        <style>
            body {{
                margin: 0;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8f9fa;
                color: #333;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                color: white;
                padding: 25px;
                text-align: center;
                position: relative;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 300;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }}
            .header p {{
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }}
            .pdf-container {{
                background: #f8f9fa;
                padding: 20px;
                min-height: 600px;
                display: flex;
                justify-content: center;
                align-items: flex-start;
            }}
            .pdf-viewer {{
                width: 100%;
                max-width: 800px;
                height: 600px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                background: white;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }}
            .actions {{
                background: #f8f9fa;
                padding: 20px;
                border-top: 1px solid #dee2e6;
                display: flex;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }}
            .btn {{
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
            }}
            .btn:hover {{
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
            }}
            .btn:active {{
                transform: translateY(0);
            }}
            .btn-secondary {{
                background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
                box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
            }}
            .btn-secondary:hover {{
                box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
            }}
            .btn i {{
                font-size: 18px;
            }}
            .print-notice {{
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 6px;
                padding: 12px 16px;
                margin: 15px 20px;
                font-size: 14px;
                color: #1976d2;
                text-align: center;
            }}
            .print-notice i {{
                margin-right: 8px;
            }}
            @media print {{
                .header, .actions, .print-notice {{
                    display: none !important;
                }}
                .pdf-container {{
                    padding: 0;
                    background: white;
                }}
                .pdf-viewer {{
                    border: none;
                    box-shadow: none;
                    height: auto;
                }}
            }}
            @media (max-width: 768px) {{
                .pdf-viewer {{
                    height: 500px;
                }}
                .actions {{
                    flex-direction: column;
                    align-items: center;
                }}
                .btn {{
                    width: 200px;
                    justify-content: center;
                }}
            }}
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-file-pdf"></i> Orden de Reparación #{nroDeOrden}</h1>
                <p>Previsualización del comprobante</p>
            </div>
            
            <div class="print-notice">
                <i class="fas fa-info-circle"></i>
                Este documento está optimizado para impresión en blanco y negro
            </div>
            
            <div class="pdf-container">
                <object 
                    class="pdf-viewer" 
                    data="/ordenes/{nroDeOrden}/pdf" 
                    type="application/pdf">
                    <p>Tu navegador no puede mostrar PDFs. 
                       <a href="/ordenes/{nroDeOrden}/pdf" class="btn">
                           <i class="fas fa-download"></i> Descargar PDF
                       </a>
                    </p>
                </object>
            </div>
            
            <div class="actions">
                <a href="/ordenes/{nroDeOrden}/pdf" class="btn" download>
                    <i class="fas fa-download"></i> Descargar PDF
                </a>
                <button class="btn btn-secondary" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                <button class="btn btn-secondary" onclick="window.close()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content
