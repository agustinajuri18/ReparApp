
import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

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
  <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div className="row">
        <MenuLateral />
  <main className="col-9 col-md-10 pt-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0" style={{ letterSpacing: 1 }}>Gestión de Órdenes de Reparación</h4>
              <button className="btn" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}><i className="bi bi-plus-lg"></i> Agregar</button>
            </div>
            <div className="card-body" style={{ background: colores.beige }}>
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
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}><span title="Consultar"><i className="bi bi-eye"></i></span> Consultar</button>
                          <button className="btn btn-sm me-1" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}><span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar</button>
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}><span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar</button>
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
