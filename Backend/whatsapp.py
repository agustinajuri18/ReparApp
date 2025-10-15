import requests
import json
import webbrowser
import time
from urllib.parse import quote


def enviar_mensaje_whatsapp_api(recipient_number, numero_orden, access_token, phone_number_id):
    """Mantengo la función original que usa la API de WhatsApp Business (Graph API).

    Esta función no abre navegador; la dejo con el nombre _api para compatibilidad.
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
        print("✅ Mensaje enviado correctamente (API)")
        return response.json()
    else:
        print("❌ Error al enviar mensaje (API):", response.status_code)
        try:
            return response.json()
        except Exception:
            return {"error": "Respuesta inválida del servidor"}


def enviar_mensaje_whatsapp_browser(recipient_number, numero_orden, auto_close=True, wait_seconds=3):
    """
    Abre WhatsApp Web en una pestaña nueva, prepara el mensaje para el número indicado
    y (opcionalmente) lo envía y cierra la pestaña automáticamente.

    - recipient_number: string con código de país y número sin signos (ej: '5493513538902')
    - numero_orden: número/identificador para incluir en el texto
    - auto_close: si True intentará cerrar la pestaña después de enviar
    - wait_seconds: segundos a esperar después de abrir/realizar acción

    Nota: el envío automático en WhatsApp Web requiere que el usuario esté logueado
    en web.whatsapp.com y que el navegador permita la interacción. Esta función
    intenta automatizar con la URL de wa.me/web.whatsapp; si necesitas un envío
    totalmente silencioso y fiable, usa la API oficial con `enviar_mensaje_whatsapp_api`.
    """
    message_text = f"Hola, su teléfono está listo para recoger con la orden de reparación #{numero_orden}"

    # Construir URL que pre-llena el mensaje
    encoded = quote(message_text)
    # Usamos web.whatsapp.com/send para mantener el contexto de WhatsApp Web
    url = f"https://web.whatsapp.com/send?phone={recipient_number}&text={encoded}"

    try:
        # Abrir en nueva pestaña
        webbrowser.open_new_tab(url)
        # Esperar carga inicial; tiempo suficiente para que el usuario ya esté logueado
        time.sleep(wait_seconds)

        # Intento limitado: abrir wa.me en navegador no permite enviar automáticamente
        # sin control del DOM (Selenium). Si el usuario quiere autocerrar, ofrecermos
        # la alternativa de usar Selenium; por ahora cerramos la pestaña manualmente
        if auto_close:
            # No podemos cerrar la pestaña desde Python sin controlar el navegador (Selenium).
            # Informamos al usuario que cierre la pestaña o instalemos Selenium.
            print("Nota: la pestaña se abrió. Para cerrarla automáticamente se requiere Selenium (ver función en el código).")

        return {"success": True, "info": "Apertura de WhatsApp Web realizada (wa.me/web.whatsapp)."}
    except Exception as e:
        return {"error": str(e)}


def enviar_mensaje_whatsapp_browser_selenium(recipient_number, numero_orden, driver_path=None, browser='chrome', wait_send=10, close_after=True):
    """
    Variante que usa Selenium para controlar el navegador, enviar el mensaje y cerrar la pestaña.

    Requisitos:
    - Instalar `selenium` (pip install selenium)
    - Tener el driver correspondiente (chromedriver/geckodriver) en PATH o indicar driver_path

    Esta función intentará abrir una ventana (o usar el perfil por defecto si el driver lo permite),
    navegar a web.whatsapp.com/send?phone=...&text=... y pulsar el botón enviar.
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.service import Service as ChromeService
        from selenium.webdriver.firefox.service import Service as FirefoxService
        from selenium.common.exceptions import TimeoutException, WebDriverException
        from urllib.parse import quote
    except Exception as e:
        return {"error": "selenium no está instalado. Instala con: pip install selenium"}

    message_text = f"Hola, su teléfono está listo para recoger con la orden de reparación #{numero_orden}"
    encoded = quote(message_text)
    url = f"https://web.whatsapp.com/send?phone={recipient_number}&text={encoded}"

    driver = None
    try:
        if browser.lower() == 'chrome':
            options = webdriver.ChromeOptions()
            # Mantener la ventana visible para manejar QR si es necesario
            if driver_path:
                service = ChromeService(driver_path)
                driver = webdriver.Chrome(service=service, options=options)
            else:
                driver = webdriver.Chrome(options=options)
        else:
            options = webdriver.FirefoxOptions()
            if driver_path:
                service = FirefoxService(driver_path)
                driver = webdriver.Firefox(service=service, options=options)
            else:
                driver = webdriver.Firefox(options=options)

        driver.get(url)

        wait = WebDriverWait(driver, wait_send)

        # Esperar que aparezca el textarea/composer o el botón de enviar
        try:
            # Composer textarea
            composer = wait.until(EC.presence_of_element_located((By.XPATH, "//div[@contenteditable='true' and @data-tab='10']")))
        except Exception:
            composer = None

        # Si detectamos el composer, intentamos enviar pulsando Enter
        if composer:
            composer.click()
            # Enter para enviar (en algunos casos se requiere un pequeño retraso)
            composer.send_keys('\n')
        else:
            # Fallback: intentar localizar botón enviar
            try:
                send_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='compose-btn-send']")))
                send_btn.click()
            except Exception:
                # Otra alternativa: span[data-icon='send']
                try:
                    send_span = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "span[data-icon='send']")))
                    send_span.click()
                except Exception:
                    # Si no encontramos nada, devolvemos error
                    return {"error": "No se pudo localizar el campo de mensaje ni el botón enviar. Asegúrate de estar logueado en web.whatsapp.com."}

        # Esperar un momento para que el mensaje sea enviado
        time.sleep(2)

        result = {"success": True, "info": "Mensaje enviado (intentado) via Selenium."}

        if close_after:
            try:
                driver.close()
            except Exception:
                pass
            try:
                driver.quit()
            except Exception:
                pass

        return result
    except WebDriverException as wde:
        return {"error": f"WebDriver error: {str(wde)}"}
    except Exception as e:
        return {"error": str(e)}


def abrir_tab_y_cerrar_al_enviar(recipient_number, driver_path=None, browser='chrome', timeout=180, poll_interval=1):
    """
    Abre el chat de `recipient_number` en web.whatsapp.com y espera a que el usuario
    escriba y envíe manualmente un mensaje. Cuando se detecta un nuevo mensaje saliente
    (mensaje enviado por el usuario) la pestaña se cerrará automáticamente.

    Parámetros:
    - recipient_number: número en formato internacional sin símbolos (ej: '5493513538902')
    - driver_path: ruta al driver (chromedriver/geckodriver) o None si está en PATH
    - browser: 'chrome' o 'firefox'
    - timeout: tiempo máximo a esperar en segundos
    - poll_interval: intervalo de sondeo en segundos para detectar nuevos mensajes

    Nota: Requiere Selenium instalado y que el usuario haga login en web.whatsapp.com en el perfil que se abra.
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.service import Service as ChromeService
        from selenium.webdriver.firefox.service import Service as FirefoxService
        from selenium.common.exceptions import WebDriverException
    except Exception:
        return {"error": "selenium no está instalado. Instala con: pip install selenium"}

    # Construir URL del chat
    url = f"https://web.whatsapp.com/send?phone={recipient_number}"

    driver = None
    try:
        if browser.lower() == 'chrome':
            options = webdriver.ChromeOptions()
            # Mantener perfil del usuario para evitar QR repetido puede requerir usar 'user-data-dir'
            # Pero por seguridad no forzamos perfil aquí.
            if driver_path:
                service = ChromeService(driver_path)
                driver = webdriver.Chrome(service=service, options=options)
            else:
                driver = webdriver.Chrome(options=options)
        else:
            options = webdriver.FirefoxOptions()
            if driver_path:
                service = FirefoxService(driver_path)
                driver = webdriver.Firefox(service=service, options=options)
            else:
                driver = webdriver.Firefox(options=options)

        driver.get(url)

        wait = WebDriverWait(driver, 60)
        # Esperar que el composer esté presente (usuario logueado y chat abierto)
        try:
            composer = wait.until(EC.presence_of_element_located((By.XPATH, "//div[@contenteditable='true' and @data-tab]")))
        except Exception:
            # Si no aparece en 60s, devolver instrucción
            return {"error": "No se detectó el composer. Asegúrate de estar logueado en web.whatsapp.com."}

        # Contar mensajes salientes actuales
        try:
            outgoing_msgs = driver.find_elements(By.XPATH, "//div[contains(@class, 'message-out')]")
            baseline = len(outgoing_msgs)
        except Exception:
            baseline = 0

        # Informar al usuario
        print(f"Esperando envío manual en chat {recipient_number}. Tiempo máximo: {timeout}s")

        # Esperar hasta que el número de mensajes salientes aumente
        elapsed = 0
        while elapsed < timeout:
            try:
                current_out = len(driver.find_elements(By.XPATH, "//div[contains(@class, 'message-out')]") )
            except Exception:
                current_out = baseline

            if current_out > baseline:
                # Detectado nuevo mensaje saliente, cerramos
                try:
                    driver.close()
                except Exception:
                    pass
                try:
                    driver.quit()
                except Exception:
                    pass
                return {"success": True, "info": "Mensaje detectado y pestaña cerrada."}

            time.sleep(poll_interval)
            elapsed += poll_interval

        # Timeout
        return {"error": "Tiempo de espera agotado sin detectar envío."}
    except WebDriverException as wde:
        return {"error": f"WebDriver error: {str(wde)}"}
    except Exception as e:
        return {"error": str(e)}
