from flask import Flask, request, jsonify

from flask_cors import CORS
from ABMC_db import *


app = Flask(__name__)
CORS(app)


@app.route("/usuarios/", methods=["POST"])
def registrar_usuario():
    data = request.get_json()
    id_usuario = data.get("id_usuario")
    password = data.get("password")
    alta_usuario(id_usuario, password)
    return jsonify({"mensaje": "Usuario creado exitosamente"}), 201


@app.route("/usuarios/<id_usuario>", methods=["DELETE"])
def eliminar_usuario(id_usuario):
    usuario = next((u for u in mostrar_usuarios() if str(u.id_usuario) == str(id_usuario)), None)
    if usuario:
        baja_usuario(id_usuario)
        return jsonify({"mensaje": "Usuario eliminado exitosamente"}), 200
    return jsonify({"detail": "Usuario no encontrado"}), 404

if __name__ == "__main__":
    app.run(debug=True)