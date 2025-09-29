import requests
import json

def enviar_mensaje_whatsapp(recipient_number, numero_orden, access_token, phone_number_id):
    """
    Función para enviar un mensaje de WhatsApp personalizado.
    
    Parameters:
    - recipient_number (str): Número de teléfono del destinatario en formato internacional.
    - numero_orden (str): Número de la orden que se incluirá en el mensaje.
    - access_token (str): Token de acceso de la API de WhatsApp.
    - phone_number_id (str): ID del número de teléfono de WhatsApp Business.
    
    Returns:
    - dict: Respuesta de la API de WhatsApp.
    """
    
    # Mensaje personalizado
    message_text = f"Hola, su teléfono está listo para recoger con la orden de reparación #{numero_orden}"

    # ----- CABECERAS HTTP -----
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # ----- DATOS DEL MENSAJE -----
    data = {
        "messaging_product": "whatsapp",
        "to": recipient_number,
        "type": "text",
        "text": {
            "body": message_text  # El mensaje personalizado que se enviará
        }
    }

    # ----- URL DE LA API -----
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"

    # ----- PETICIÓN POST -----
    response = requests.post(url, headers=headers, data=json.dumps(data))

    # ----- RESPUESTA -----
    if response.status_code == 200:
        print("✅ Mensaje enviado correctamente")
        print("📩 Respuesta:", response.json())
        return response.json()
    else:
        print("❌ Error al enviar mensaje:", response.status_code)
        print("📝 Detalles del error:", response.json())  # Para ver detalles del error
        return response.json()


# Ejemplo de cómo llamar la función:
if __name__ == "__main__":
    access_token = "EAAsacRZCNLH4BPmoDF3SnHo7jVbUaSgGS4azxCdQZBM3M4nqFSpZBZCIJhXXeAbM1mATMJpOjO3X31iEzeft0EpzN8DSBQbsBuYj5HwqiCwItcqTfdNiSoJZAhy1VQtZBD6EKjOAdCmPiPptU3GaWcdsJI41bXlTZCgQYpcR1SowRUF6C7pibvS0yuCwcOpsGA7pZCo7KAf08hU3WpXmCtk1sdmtnLONtdZARq2XXkfprOHmsYZAIZD"  # Token válido
    phone_number_id = "814465951747653"  # ID del número de teléfono
    recipient_number = "543513538902"    # Número de destino en formato internacional
    numero_orden = "12345"                # Número de orden

    # Llamada a la función
    respuesta = enviar_mensaje_whatsapp(recipient_number, numero_orden, access_token, phone_number_id)
