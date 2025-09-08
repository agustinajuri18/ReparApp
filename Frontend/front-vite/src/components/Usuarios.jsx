import React, { useState } from 'react';
import MenuLateral from './MenuLateral';

const Usuarios = () => {
  // Ejemplo de datos
  const [usuarios, setUsuarios] = useState([
    { id: 10, password: '1234' },
    { id: 11, password: 'abcd' }
  ]);

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestión de Usuarios</h4>
              <button className="btn btn-primary"><i className="bi bi-plus-lg"></i> Agregar</button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>ID Usuario</th>
                      <th>Password</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((user, idx) => (
                      <tr key={idx}>
                        <td>{user.id}</td>
                        <td>{user.password}</td>
                        <td>
                          <button className="btn btn-info btn-sm me-1"><i className="bi bi-eye"></i></button>
                          <button className="btn btn-warning btn-sm me-1"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-danger btn-sm"><i className="bi bi-trash"></i></button>
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

export default Usuarios;
