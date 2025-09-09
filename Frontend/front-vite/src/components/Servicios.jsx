import React, { useState } from 'react';
import MenuLateral from './MenuLateral';

const Servicios = () => {
  const [servicios, setServicios] = useState([
    { codigo: 'S001', descripcion: 'Cambio de pantalla', precio: 15000 },
    { codigo: 'S002', descripcion: 'Reemplazo de batería', precio: 9000 }
  ]);

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestión de Servicios</h4>
              <button className="btn btn-primary"><i className="bi bi-plus-lg"></i> Agregar</button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Precio Base</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map((serv, idx) => (
                      <tr key={idx}>
                        <td>{serv.codigo}</td>
                        <td>{serv.descripcion}</td>
                        <td>${serv.precio}</td>
                        <td>
                          <button className="btn btn-info btn-sm me-1">
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button className="btn btn-warning btn-sm me-1">
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          <button className="btn btn-danger btn-sm">
                            <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
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

export default Servicios;
