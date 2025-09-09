import React, { useState } from 'react';
import MenuLateral from './MenuLateral';

const Ordenes = () => {
  // Ejemplo de datos
  const [ordenes, setOrdenes] = useState([
    { nroOrden: '001', nroSerie: 'A123', fecha: '2025-09-01', estado: 'Pendiente' },
    { nroOrden: '002', nroSerie: 'B456', fecha: '2025-09-02', estado: 'Finalizada' }
  ]);
  const [busqueda, setBusqueda] = useState('');

  const ordenesFiltradas = ordenes.filter(o =>
    o.nroOrden.includes(busqueda) || o.nroSerie.includes(busqueda)
  );

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestión de Órdenes de Reparación</h4>
              <button className="btn btn-primary"><i className="bi bi-plus-lg"></i> Agregar</button>
            </div>
            <div className="card-body">
              <div className="input-group mb-3">
                <input type="text" className="form-control" placeholder="Buscar por Nro. de Orden o Nro. de Serie del Dispositivo" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                <button className="btn btn-outline-secondary" type="button"><i className="bi bi-search"></i> Buscar</button>
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Nro. de Orden</th>
                      <th>Nro. de Serie</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map((orden, idx) => (
                      <tr key={idx}>
                        <td>{orden.nroOrden}</td>
                        <td>{orden.nroSerie}</td>
                        <td>{orden.fecha}</td>
                        <td>{orden.estado}</td>
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

export default Ordenes;
