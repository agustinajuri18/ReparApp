from flask import Flask, jsonify
from flask_cors import CORS

# Importa todos los blueprints
from Usuarios import bp as usuarios_blueprint
from Empleados import bp as empleados_blueprint
from Clientes import bp as clientes_blueprint
from Proveedores import bp as proveedores_blueprint
from Repuestos import bp as repuestos_blueprint
from Dispositivos import bp as dispositivos_blueprint
from Servicios import bp as servicios_blueprint
from Ordenes import bp as ordenes_blueprint
from DetallesOrden import bp as detallesorden_blueprint

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

# Ruta para verificación de estado/health check
@app_server.route('/ping')
def ping():
    return jsonify({"message": "pong"})

if __name__ == "__main__":
    # Run without the auto-reloader and without the debugger to avoid the interactive
    # Werkzeug console holding the sqlite file open.
    app_server.run(debug=False, use_reloader=False)