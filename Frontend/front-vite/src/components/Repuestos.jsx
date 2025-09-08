import React, { useState } from 'react';
import MenuLateral from './MenuLateral';

const Repuestos = () => {
  // Ejemplo de datos
  const [repuestos, setRepuestos] = useState([
    { codigo: 'R001', marca: 'Samsung', modelo: 'S20', tipo: 'Pantalla', costo: 12000 },
    { codigo: 'R002', marca: 'LG', modelo: 'G8', tipo: 'Batería', costo: 8000 }
  ]);

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestión de Repuestos</h4>
              <button className="btn btn-primary"><i className="bi bi-plus-lg"></i> Agregar</button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Tipo</th>
                      <th>Costo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestos.map((rep, idx) => (
                      <tr key={idx}>
                        <td>{rep.codigo}</td>
                        <td>{rep.marca}</td>
                        <td>{rep.modelo}</td>
                        <td>{rep.tipo}</td>
                        <td>${rep.costo}</td>
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

export default Repuestos;
