import requests
url='http://localhost:5000/ordenes/77/pdf/send'
payload={'destinatario':'543513538902','caption':'Comprobante prueba desde modal'}
resp = requests.post(url, json=payload)
print('status', resp.status_code)
try:
    print(resp.json())
except Exception as e:
    print(resp.text)
