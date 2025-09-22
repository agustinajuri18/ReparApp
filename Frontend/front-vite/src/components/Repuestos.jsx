import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const Repuestos = () => {
  const [repuestos, setRepuestos] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    codigo: '',
    marca: '',
    modelo: '',
    tipo: '',
    proveedor: '',
    costo: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Cargar repuestos desde la API al montar el componente
  useEffect(() => {
    fetch('http://localhost:5000/repuestos') // Ajusta la URL según tu backend
      .then(res => res.json())
      .then(data => setRepuestos(data))
      .catch(() => setMensaje("Error al cargar repuestos"));
  }, []);

  // Filtro de repuestos según activos/inactivos
  const repuestosFiltrados = repuestos.filter(r => mostrarInactivos ? r.activo === 0 : r.activo === 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    setRepuestos([...repuestos, formData]);
    setFormData({ codigo: '', marca: '', modelo: '', tipo: '', proveedor: '', costo: '' });
    setMostrarFormulario(false);
    setMensaje("Repuesto agregado correctamente.");
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0">Gestión de Repuestos</h4>
              <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                <button
                  className="btn"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver también inactivos"}
                </button>
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarFormulario(true)}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>{mensaje}</div>
              )}
              {/* Modal para agregar repuesto */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Repuesto</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="codigo" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} className="form-control" placeholder="Código" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="marca" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} className="form-control" placeholder="Marca" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="modelo" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} className="form-control" placeholder="Modelo" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" name="tipo" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="form-control" placeholder="Tipo" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" name="proveedor" value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} className="form-control" placeholder="Proveedor" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="number" name="costo" value={formData.costo} onChange={e => setFormData({ ...formData, costo: e.target.value })} className="form-control" placeholder="Costo" required />
                            </div>
                          </div>
                          <div className="d-flex justify-content-end">
                            <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>Guardar</button>
                            <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Tipo</th>
                      <th>Proveedor</th>
                      <th>Costo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestosFiltrados.map((rep, idx) => (
                      <tr key={idx} style={rep.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{rep.codigo}</td>
                        <td>{rep.marca}</td>
                        <td>{rep.modelo}</td>
                        <td>{rep.tipo}</td>
                        <td>{rep.proveedor}</td>
                        <td>{rep.costo}</td>
                        <td>{rep.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}>
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button className="btn btn-sm me-1" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}>
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}>
                            <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {repuestosFiltrados.length === 0 && (
                  <div className="text-center text-muted py-4">No hay repuestos {mostrarInactivos ? "inactivos" : "activos"}.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Repuestos;
