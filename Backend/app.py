from flask import Flask
from flask_cors import CORS

# Importa todos los blueprints
from Usuarios import app as usuarios_blueprint
from Empleados import app as empleados_blueprint
from Clientes import app as clientes_blueprint
from Proveedores import app as proveedores_blueprint
from Repuestos import app as repuestos_blueprint
from Dispositivos import app as dispositivos_blueprint
from Servicios import app as servicios_blueprint
from Ordenes import app as ordenes_blueprint
from DetallesOrden import app as detallesorden_blueprint

app_server = Flask(__name__)

# Aplica CORS a toda la app y permite todos los métodos y orígenes
CORS(app_server, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Registra los blueprints
app_server.register_blueprint(usuarios_blueprint, url_prefix='/')
app_server.register_blueprint(empleados_blueprint, url_prefix='/')
app_server.register_blueprint(clientes_blueprint, url_prefix='/')
app_server.register_blueprint(proveedores_blueprint, url_prefix='/')
app_server.register_blueprint(repuestos_blueprint, url_prefix='/')
app_server.register_blueprint(dispositivos_blueprint, url_prefix='/')
app_server.register_blueprint(servicios_blueprint, url_prefix='/')
app_server.register_blueprint(ordenes_blueprint, url_prefix='/')
app_server.register_blueprint(detallesorden_blueprint, url_prefix='/')

if __name__ == "__main__":
    app_server.run(debug=True)