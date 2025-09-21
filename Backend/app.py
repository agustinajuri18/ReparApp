from flask import Flask
from flask_cors import CORS

import Repuestos
import Clientes
import Proveedores
import Usuarios
import Empleados

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(Clientes.app, url_prefix='/')
app.register_blueprint(Proveedores.app, url_prefix='/')
app.register_blueprint(Usuarios.app, url_prefix='/')
app.register_blueprint(Repuestos.app, url_prefix='/')
app.register_blueprint(Empleados.app, url_prefix='/')

if __name__ == "__main__":
    app.run(debug=True)