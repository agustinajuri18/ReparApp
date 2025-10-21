from whatsapp import send_template

if __name__ == '__main__':
    destinatario = '543513538902'
    template_name = 'hello_world'
    try:
        print('Enviando template...')
        res = send_template(destinatario, template_name, language_code='en_US')
        print('Respuesta API:')
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print('Error:', e)
