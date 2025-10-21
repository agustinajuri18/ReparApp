from Ordenes import _build_pdf_bytes
from whatsapp import upload_to_transfersh, enviar_whatsapp_pdf

if __name__ == '__main__':
    nro = 77
    destinatario = '543513538902'
    try:
        print('Generando PDF...')
        pdf_bytes = _build_pdf_bytes(nro)
        print('Tamaño PDF bytes:', len(pdf_bytes))

        print('Subiendo a transfer.sh...')
        url = upload_to_transfersh(pdf_bytes, f'Comprobante_Orden_{nro}.pdf')
        print('URL pública:', url)

        print('Enviando por WhatsApp...')
        res = enviar_whatsapp_pdf(pdf_url=url, nroDeOrden=nro, destinatario=destinatario, caption=f'Comprobante Orden {nro}', filename=f'Comprobante_Orden_{nro}.pdf')
        print('Resultado envío:', res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print('Error:', e)
