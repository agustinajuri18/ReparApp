import requests
url='http://localhost:5000/ordenes/77/pdf'
resp = requests.get(url)
print('status', resp.status_code)
print(resp.headers.get('Content-Type'))
try:
    print(resp.text[:200])
except:
    print('no text')
