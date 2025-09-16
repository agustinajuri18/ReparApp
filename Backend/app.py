from flask import Flask
from flask_cors import CORS

import Clientes
import Proveedores
import Usuarios

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(Clientes.app, url_prefix='/')
app.register_blueprint(Proveedores.app, url_prefix='/')
app.register_blueprint(Usuarios.app, url_prefix='/')

if __name__ == "__main__":
    app.run(debug=True)