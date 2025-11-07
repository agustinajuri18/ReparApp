from flask import Blueprint, request, jsonify
from ABMC_db import (
    alta_proveedor, modificar_proveedor, mostrar_proveedores, baja_proveedor,
    buscar_proveedor_por_cuil, reactivar_proveedor
)
from ABMC_db import buscar_proveedor_por_razon_social

import unicodedata
import re


def _normalize(text):
    if not text:
        return ''
    # Remove diacritics, lower, strip, collapse whitespace and remove punctuation except alphanumerics
    s = str(text)
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

bp = Blueprint('proveedores', __name__)

@bp.route('/proveedores', methods=['POST'])
def registrar_proveedor():
    data = request.json
    
    # Validamos datos obligatorios
    if 'cuil' not in data:
        return jsonify({'error': 'Falta información obligatoria (cuil)'}), 400
    
    # Verificar si ya existe
    proveedor_existente = buscar_proveedor_por_cuil(data['cuil'])
    if proveedor_existente:
        return jsonify({'error': 'Ya existe un proveedor con ese CUIL'}), 409
    # Verificar duplicación de razón social (comparación normalizada para evitar diferencias en mayúsculas, tildes o puntuación)
    if data.get('razonSocial'):
        nueva_rs_norm = _normalize(data.get('razonSocial'))
        proveedores_all = mostrar_proveedores(activos_only=None)
        for p in proveedores_all:
            if p.razonSocial and _normalize(p.razonSocial) == nueva_rs_norm:
                return jsonify({'error': 'Ya existe un proveedor con esa razón social'}), 409
        
    proveedor = alta_proveedor(
        cuil=data['cuil'],
        razonSocial=data.get('razonSocial'),
        telefono=data.get('telefonoResponsable'),
        direccion=data.get('direccion'),
        nombreResponsable=data.get('nombreResponsable'),
        mailResponsable=data.get('mailResponsable')
    )
    return jsonify({
        'idProveedor': proveedor.idProveedor,
        'cuil': proveedor.cuil,
        'razonSocial': proveedor.razonSocial,
        'telefonoResponsable': proveedor.telefonoResponsable,
        'direccion': proveedor.direccion,
        'nombreResponsable': proveedor.nombreResponsable,
        'mailResponsable': proveedor.mailResponsable
    }), 201

@bp.route('/proveedores', methods=['GET'])
def listar_proveedores():
    activos = request.args.get('activos', 'true')
    search = request.args.get('search', None)
    if activos == 'true':
        proveedores = mostrar_proveedores(activos_only=True, search=search)
    else:
        proveedores = mostrar_proveedores(activos_only=False, search=search)
    return jsonify([
        {
            'idProveedor': p.idProveedor,
            'cuil': p.cuil,
            'razonSocial': p.razonSocial,
            'telefonoResponsable': p.telefonoResponsable,
            'direccion': p.direccion,
            'nombreResponsable': p.nombreResponsable,
            'mailResponsable': p.mailResponsable,
            'activo': p.activo
        } for p in proveedores
    ])

@bp.route('/proveedores/<string:cuil>', methods=['PUT'])
def modificar_datos_proveedor(cuil):
    data = request.get_json()
    # Find the proveedor by cuil
    proveedor = buscar_proveedor_por_cuil(cuil)
    if not proveedor:
        return jsonify({'error': 'Proveedor no encontrado'}), 404
    # Si se intenta cambiar el CUIL, verificar duplicado
    new_cuil = data.get('cuil')
    if new_cuil and str(new_cuil) != str(proveedor.cuil):
        otro = buscar_proveedor_por_cuil(new_cuil)
        if otro:
            return jsonify({'error': 'Otro proveedor ya tiene ese CUIL'}), 400
    # Si se intenta cambiar la razón social, verificar duplicado
    new_rs = data.get('razonSocial')
    if new_rs and (str(new_rs).strip() != (proveedor.razonSocial or '').strip()):
        new_rs_norm = _normalize(new_rs)
        proveedores_all = mostrar_proveedores(activos_only=None)
        for p in proveedores_all:
            if p.idProveedor == proveedor.idProveedor:
                continue
            if p.razonSocial and _normalize(p.razonSocial) == new_rs_norm:
                return jsonify({'error': 'Otra razón social ya existe con ese nombre'}), 400
    # Modify using idProveedor
    proveedor_modificado = modificar_proveedor(
        idProveedor=proveedor.idProveedor,
        razonSocial=data.get('razonSocial'),
        telefono=data.get('telefonoResponsable'),
        activo=data.get('activo'),
        cuil=new_cuil or proveedor.cuil,
        direccion=data.get('direccion'),
        nombreResponsable=data.get('nombreResponsable'),
        mailResponsable=data.get('mailResponsable')
    )
    if proveedor_modificado:
        return jsonify({'success': True})
    return jsonify({'error': 'Error al modificar proveedor'}), 500

@bp.route('/proveedores/<string:cuil>', methods=['DELETE'])
def eliminar_proveedor(cuil):
    proveedor = buscar_proveedor_por_cuil(cuil)
    if not proveedor:
        return jsonify({'error': 'Proveedor no encontrado'}), 404
    baja_proveedor(proveedor.idProveedor)
    return jsonify({'success': True})

@bp.route('/proveedores/<string:cuil>/reactivar', methods=['PUT'])
def reactivar_proveedor_endpoint(cuil):
    proveedor = buscar_proveedor_por_cuil(cuil)
    if not proveedor:
        return jsonify({'error': 'Proveedor no encontrado'}), 404
    reactivar_proveedor(proveedor.idProveedor)
    return jsonify({'success': True})


@bp.route('/proveedores/existe', methods=['GET'])
def proveedor_existe():
    cuil = request.args.get('cuil')
    if not cuil:
        return jsonify({'error': 'Falta parámetro cuil'}), 400
    existe = True if buscar_proveedor_por_cuil(cuil) else False
    return jsonify({'exists': existe})