import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    precio: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Para consulta/edición
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' o 'editar'
  const [servicioActual, setServicioActual] = useState(null);

  // Cargar servicios desde la API
  useEffect(() => {
    fetch('http://localhost:5000/servicios')
      .then(res => res.json())
      .then(data => setServicios(data))
      .catch(() => setMensaje("Error al cargar servicios"));
  }, []);

  // Filtro de servicios según activos/inactivos
  const serviciosFiltrados = servicios.filter(s => mostrarInactivos ? s.activo === 0 : s.activo === 1);

  // ---------- Registrar Servicio ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const datos = {...formData}
    const respuesta = await registrarServicio(datos);
    setServicios([...servicios, formData]);
    setFormData({ codigo: '', descripcion: '', precio: '', activo: 1 });
    setMostrarFormulario(false);
    setMensaje(respuesta.mensaje || respuesta.detail);
  };

  const registrarServicio = async (service) => {
    const response = await fetch('http://localhost:5000/servicios/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    return await response.json();
  };

  // CONSULTAR
  const handleConsultar = (idx) => {
    setServicioActual(serviciosFiltrados[idx]);
    setModalModo('consultar');
    setModalVisible(true);
  };

  // EDITAR
  const handleModificar = (idx) => {
    setServicioActual({ ...serviciosFiltrados[idx] });
    setModalModo('editar');
    setModalVisible(true);
  };

  const modificarServicio = async (service) => {
    const response = await fetch(`http://localhost:5000/servicios/${service.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    return await response.json();
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    const respuesta = await modificarServicio(servicioActual);
    setServicios(servicios.map((s) =>
      s.codigo === servicioActual.codigo ? servicioActual : s
    ));
    setModalVisible(false);
    setMensaje(respuesta.mensaje || respuesta.detail);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setServicioActual(null);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0">Gestión de Servicios</h4>
              <div className="d-flex gap-2">
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
              {/* Modal para agregar servicio */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Servicio</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <h4>Datos del Servicio</h4>
                          </div>
                            <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>Código</span>
                                <input type="number" name="codigo" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} className="form-control" placeholder="Código" required />
                              </div>
                            </div>
                            <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>Descripción</span>
                                <input type="text" name="descripcion" value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="form-control" placeholder="Descripción" required />
                              </div>
                            </div>
                            <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>$</span>
                                <input type="number" name="precio" value={formData.precio} onChange={e => setFormData({ ...formData, precio: e.target.value })} className="form-control" placeholder="Precio Base" required />
                              </div>
                            </div>
                            <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>Activo</span>
                                  <select name="activo" value={formData.activo} onChange={e => setFormData({ ...formData, activo: Number(e.target.value) })} className="form-select">
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                  </select>
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

              {/* Modal para consultar/editar */}
              {modalVisible && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">{modalModo === 'consultar' ? 'Consultar Servicio' : 'Modificar Servicio'}</h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleModalSave}>
                          <div className='row'>
                            <h3>Datos del Servicio</h3>
                          </div>
                          <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>Código</span>
                                  <input type="text" value={servicioActual?.codigo || ''} className="form-control" placeholder="Código" disabled />
                              </div>
                          </div>
                          <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>Descripción</span>
                                  <input type="text" value={servicioActual?.descripcion || ''} className="form-control" placeholder="Descripción"
                                    disabled={modalModo === 'consultar'}
                                    onChange={e => setServicioActual({ ...servicioActual, descripcion: e.target.value })} />
                              </div>
                          </div>
                          <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>$</span>
                                  <input type="number" value={servicioActual?.precio || ''} className="form-control" placeholder="Precio Base"
                                    disabled={modalModo === 'consultar'}
                                    onChange={e => setServicioActual({ ...servicioActual, precio: e.target.value })} />
                              </div>
                          </div>
                          <div className="row mt-3 mb-3">
                              <div className='input-group'>
                                <span className='input-group-text'>Activo</span>
                                  <select value={servicioActual?.activo ?? 1}
                                    disabled={modalModo === 'consultar'}
                                    className="form-select"
                                    onChange={e => setServicioActual({ ...servicioActual, activo: Number(e.target.value) })}>
                                      <option value={1}>Activo</option>
                                      <option value={0}>Inactivo</option>
                                  </select>
                              </div>
                          </div>
                          <div className="d-flex justify-content-end">
                            {modalModo === 'editar' && (
                              <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>Guardar</button>
                            )}
                            <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={handleModalClose}>Cerrar</button>
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
                      <th>Descripción</th>
                      <th>Precio Base</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosFiltrados.map((serv, idx) => (
                      <tr key={idx} style={serv.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{serv.codigo}</td>
                        <td>{serv.descripcion}</td>
                        <td>${serv.precio}</td>
                        <td>{serv.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(idx)}>
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button className="btn btn-sm me-1" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(idx)}>
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
                {serviciosFiltrados.length === 0 && (
                  <div className="text-center text-muted py-4">No hay servicios {mostrarInactivos ? "inactivos" : "activos"}.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Servicios;
