from whatsapp import enviar_whatsapp_pdf_bytes
from Ordenes import _build_pdf_bytes


def main():
    nro = 77
    destinatario = '543513538902'  # recipient phone in international format without +
    print('Generating PDF bytes for order', nro)
    pdf_bytes = _build_pdf_bytes(nro)
    print('PDF bytes length:', len(pdf_bytes))
    print('Sending PDF via WhatsApp by uploading bytes...')
    resp = enviar_whatsapp_pdf_bytes(pdf_bytes, nro, destinatario)
    print('Send response:', resp)


if __name__ == '__main__':
    main()
