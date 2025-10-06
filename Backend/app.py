from flask import Flask
from flask_cors import CORS

import Dispositivos
import Repuestos
import Clientes
import Proveedores
import Usuarios
import Empleados
import Servicios
import Ordenes
import DetallesOrden

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(Clientes.app, url_prefix='/')
app.register_blueprint(Proveedores.app, url_prefix='/')
app.register_blueprint(Usuarios.app, url_prefix='/')
app.register_blueprint(Repuestos.app, url_prefix='/')
app.register_blueprint(Empleados.app, url_prefix='/')
app.register_blueprint(Dispositivos.app, url_prefix='/')
app.register_blueprint(Servicios.app, url_prefix='/')
app.register_blueprint(Ordenes.app, url_prefix='/')
app.register_blueprint(DetallesOrden.app, url_prefix='/')

if __name__ == "__main__":
    app.run(debug=True)