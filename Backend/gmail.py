from email.message import EmailMessage
import ssl
import smtplib
import mimetypes
import os

email_sender = "utnmundocelular@gmail.com"
email_reciver = "bautistamelo2711@gmail.com"
password = "xzzi wmrm uyzs smbk"

def send_email(
    email_receiver: str,
    subject: str,
    body: str,
    attachments: list[str] = None
):
    """
    Envía un correo con o sin archivos adjuntos.
    attachments: lista de rutas a archivos (opcional)
    """

    em = EmailMessage()
    em["From"] = email_sender
    em["To"] = email_receiver
    em["Subject"] = subject

    # Añadir contenido del correo
    em.set_content(body or "")

    # Adjuntar archivos si hay
    if attachments:
        for path in attachments:
            if not os.path.isfile(path):
                print(f"[ADVERTENCIA] No se encontró el archivo: {path}")
                continue

            ctype, encoding = mimetypes.guess_type(path)
            if ctype is None:
                ctype = "application/octet-stream"
            maintype, subtype = ctype.split("/", 1)

            with open(path, "rb") as f:
                data = f.read()
                filename = os.path.basename(path)
                em.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    # Enviar correo
    _send_message(em)


def _send_message(em: EmailMessage):
    """Envía el EmailMessage usando SMTP_SSL autenticado."""
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as smtp:
            smtp.login(email_sender, password)
            smtp.send_message(em)
        print("✅ Correo enviado correctamente.")
    except Exception as e:
        print(f"❌ Error al enviar el correo: {e}")


def send_email_bytes(
    email_receiver: str,
    subject: str,
    body: str = "",
    attachments: list[str] = None,
    attachments_bytes: list[tuple[str, bytes, str]] = None,
):
    """
    Envía un correo permitiendo adjuntar archivos tanto por ruta como por bytes en memoria.
    attachments_bytes: lista de tuplas (filename, bytes, mime_type)
    """
    em = EmailMessage()
    em["From"] = email_sender
    em["To"] = email_receiver
    em["Subject"] = subject
    em.set_content(body or "")

    # Adjuntos por ruta (igual que antes)
    if attachments:
        for path in attachments:
            if not os.path.isfile(path):
                print(f"[ADVERTENCIA] No se encontró el archivo: {path}")
                continue

            ctype, encoding = mimetypes.guess_type(path)
            if ctype is None:
                ctype = "application/octet-stream"
            maintype, subtype = ctype.split("/", 1)

            with open(path, "rb") as f:
                data = f.read()
                filename = os.path.basename(path)
                em.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    # Adjuntos por bytes
    if attachments_bytes:
        for item in attachments_bytes:
            try:
                filename, data, mime = item
            except Exception:
                print(f"[ADVERTENCIA] attachments_bytes debe ser lista de (filename, bytes, mime_type)")
                continue

            if not mime:
                mime = "application/octet-stream"
            maintype, subtype = mime.split("/", 1)
            em.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    _send_message(em)


def send_pdf_bytes(email_receiver: str, nroDeOrden: int, pdf_bytes: bytes, filename: str | None = None, body: str | None = None):
    """Conveniencia: enviar un PDF (bytes) adjunto por correo."""
    if not filename:
        filename = f"Comprobante_Orden_{nroDeOrden}.pdf"
    subject = f"Comprobante - Orden {nroDeOrden} | El Mundo del Celular"
    # Mensaje formal por defecto. Intentar incluir el nombre del cliente si está disponible.
    if body is None:
        try:
            # Intentar obtener nombre del cliente desde la orden
            from ABMC_db import obtener_ordenes
            ordenes = obtener_ordenes(mode='detail', nroDeOrden=nroDeOrden)
            cliente = None
            if ordenes:
                orden = ordenes[0]
                cliente = orden.get('cliente') if isinstance(orden.get('cliente'), dict) else None
                if not cliente and isinstance(orden.get('dispositivo'), dict):
                    cliente = orden.get('dispositivo', {}).get('cliente') if isinstance(orden.get('dispositivo', {}).get('cliente'), dict) else None
            nombre_cliente = None
            if cliente:
                nombre = cliente.get('nombre') or ''
                apellido = cliente.get('apellido') or ''
                nombre_cliente = f"{nombre} {apellido}".strip() if (nombre or apellido) else None
        except Exception:
            nombre_cliente = None

        saludo = f"Estimado/a {nombre_cliente}," if nombre_cliente else "Estimado/a cliente,"
        body = (
            f"{saludo}\n\n"
            f"Le informamos que la orden número {nroDeOrden} ha sido actualizada. Encontrará adjunto el comprobante correspondiente.\n\n"
            f"Gracias por confiar en nosotros.\n\n"
            f"Atentamente,\n"
            f"El Mundo del Celular"
        )
    attachments_bytes = [(filename, pdf_bytes, "application/pdf")]
    send_email_bytes(email_receiver, subject, body, attachments_bytes=attachments_bytes)


def send_pdf(email_receiver: str, nroDeOrden: int, pdf_path: str, body: str | None = None):
    """Conveniencia: enviar un PDF por ruta de archivo."""
    subject = f"Comprobante - Orden {nroDeOrden} | El Mundo del Celular"
    if body is None:
        try:
            from ABMC_db import obtener_ordenes
            ordenes = obtener_ordenes(mode='detail', nroDeOrden=nroDeOrden)
            cliente = None
            if ordenes:
                orden = ordenes[0]
                cliente = orden.get('cliente') if isinstance(orden.get('cliente'), dict) else None
                if not cliente and isinstance(orden.get('dispositivo'), dict):
                    cliente = orden.get('dispositivo', {}).get('cliente') if isinstance(orden.get('dispositivo', {}).get('cliente'), dict) else None
            nombre_cliente = None
            if cliente:
                nombre = cliente.get('nombre') or ''
                apellido = cliente.get('apellido') or ''
                nombre_cliente = f"{nombre} {apellido}".strip() if (nombre or apellido) else None
        except Exception:
            nombre_cliente = None

        saludo = f"Estimado/a {nombre_cliente}," if nombre_cliente else "Estimado/a cliente,"
        body = (
            f"{saludo}\n\n"
            f"Adjuntamos el comprobante correspondiente a la orden número {nroDeOrden}.\n\n"
            f"Gracias por confiar en nosotros.\n\n"
            f"Atentamente,\n"
            f"El Mundo del Celular"
        )
    send_email(email_receiver, subject, body, attachments=[pdf_path])


def notify_status_change(email_receiver: str, nroDeOrden: int, old_state: str | None, new_state: str, pdf_bytes: bytes | None = None, pdf_path: str | None = None, deadline_date: str | None = None):
    """
    Notifica por email el cambio de estado de una orden.
    Si se proveen `pdf_bytes` se adjuntan los bytes; si se provee `pdf_path` se adjunta el archivo en disco.
    Prioriza `pdf_bytes` si ambos están presentes.
    """
    subject = f"Notificación - Orden {nroDeOrden} | El Mundo del Celular"
    # Mensaje formal y amistoso
    # Intentar incluir nombre del cliente en la salutación
    try:
        from ABMC_db import obtener_ordenes
        ordenes = obtener_ordenes(mode='detail', nroDeOrden=nroDeOrden)
        cliente = None
        if ordenes:
            orden = ordenes[0]
            cliente = orden.get('cliente') if isinstance(orden.get('cliente'), dict) else None
            if not cliente and isinstance(orden.get('dispositivo'), dict):
                cliente = orden.get('dispositivo', {}).get('cliente') if isinstance(orden.get('dispositivo', {}).get('cliente'), dict) else None
        nombre_cliente = None
        if cliente:
            nombre = cliente.get('nombre') or ''
            apellido = cliente.get('apellido') or ''
            nombre_cliente = f"{nombre} {apellido}".strip() if (nombre or apellido) else None
    except Exception:
        nombre_cliente = None

    salutation = f"Estimado/a {nombre_cliente}," if nombre_cliente else "Estimado/a cliente,"
    body_lines = [
        salutation,
        "",
        f"Le informamos que la orden número {nroDeOrden} ha sido actualizada.",
    ]
    if old_state:
        body_lines.append(f"Estado anterior: {old_state}")
    body_lines.append(f"Estado actual: {new_state}")
    if deadline_date:
        body_lines.append("")
        body_lines.append(f"Fecha límite para retiro: {deadline_date}")
    body_lines.append("")
    body_lines.append("Adjuntamos el comprobante cuando corresponda.")
    body_lines.append("")
    body_lines.append("Gracias por confiar en nosotros.")
    body_lines.append("")
    body_lines.append("Atentamente,")
    body_lines.append("El Mundo del Celular")
    body = "\n".join(body_lines)

    if pdf_bytes:
        send_pdf_bytes(email_receiver, nroDeOrden, pdf_bytes, filename=None, body=body)
    elif pdf_path:
        send_pdf(email_receiver, nroDeOrden, pdf_path, body=body)
    else:
        send_email(email_receiver, subject, body)


# ------------------ Ejemplo de uso ------------------

if __name__ == "__main__":
    email_receiver = "leoisleno01@gmail.com"
    subject = "Suscribite a mi canal 😎"
    body = """
    ¡Hola! Este es un correo de prueba enviado desde Python.
    """

    archivos = ["./archivo1.pdf", "./foto.png"]  # opcional: lista de archivos a enviar

    send_email(email_receiver, subject, body, archivos)
