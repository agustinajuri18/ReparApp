import React, { useState } from 'react';
import MenuLateral from './MenuLateral';


const registrarCliente = async (cliente) => {
  const response = await fetch('http://localhost:5000/clientes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente)
  });
  const data = await response.json();
  return data;
};

const Clientes = () => {
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero_dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    mail: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAgregarClick = () => {
    setMostrarFormulario(!mostrarFormulario);
    setMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultado = await registrarCliente(formData);
    setMensaje(resultado.mensaje || resultado.detail);
    setMostrarFormulario(false);
    setFormData({
      tipo_documento: '',
      numero_dni: '',
      nombre: '',
      apellido: '',
      telefono: '',
      mail: ''
    });
  };
  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestión de Clientes</h4>
              <button className="btn btn-primary" onClick={handleAgregarClick}><i className="bi bi-plus-lg"></i> Agregar</button>
            </div>
            <div className="card-body">
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="mb-3">
                  <div className="row">
                    <div className="col-md-2">
                      <input type="text" name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="form-control" placeholder="Tipo Documento" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="numero_dni" value={formData.numero_dni} onChange={handleChange} className="form-control" placeholder="DNI" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-control" placeholder="Nombre" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="form-control" placeholder="Apellido" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="form-control" placeholder="Teléfono" required />
                    </div>
                    <div className="col-md-2">
                      <input type="email" name="mail" value={formData.mail} onChange={handleChange} className="form-control" placeholder="Correo" required />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button type="submit" className="btn btn-success me-2">Guardar</button>
                    <button type="button" className="btn btn-secondary" onClick={handleAgregarClick}>Cancelar</button>
                  </div>
                </form>
              )}
              {mensaje && (
                <div className="alert alert-info" role="alert">
                  {mensaje}
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>12345678</td>
                      <td>Juan</td>
                      <td>Pérez</td>
                      <td>113000-1111</td>
                      <td>juan.perez@example.com</td>
                      <td>
                        <button className="btn btn-info btn-sm me-1"><i className="bi bi-eye"></i></button>
                        <button className="btn btn-warning btn-sm me-1"><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-danger btn-sm"><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Clientes;
