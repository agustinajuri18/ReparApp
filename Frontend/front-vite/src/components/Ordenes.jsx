import React, { useState } from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    nroOrden: '',
    dispositivo: '',
    fecha: '',
    diagnostico: '',
    servicio: '',
    presupuesto: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Para consulta/edición
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' o 'editar'
  const [ordenActual, setOrdenActual] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setOrdenes([...ordenes, formData]);
    setFormData({ nroOrden: '', dispositivo: '', fecha: '', diagnostico: '', servicio: '', presupuesto: '' });
    setMostrarFormulario(false);
    setMensaje("Orden agregada correctamente.");
  };

  // CONSULTAR
  const handleConsultar = (idx) => {
    setOrdenActual(ordenes[idx]);
    setModalModo('consultar');
    setModalVisible(true);
  };

  // EDITAR
  const handleModificar = (idx) => {
    setOrdenActual({ ...ordenes[idx] });
    setModalModo('editar');
    setModalVisible(true);
  };

  const handleModalSave = (e) => {
    e.preventDefault();
    setOrdenes(ordenes.map((o, idx) =>
      idx === ordenes.findIndex(ord => ord.nroOrden === ordenActual.nroOrden) ? ordenActual : o
    ));
    setModalVisible(false);
    setMensaje("Orden modificada correctamente.");
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setOrdenActual(null);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0">Gestión de Órdenes</h4>
              <button
                className="btn"
                style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                onClick={() => setMostrarFormulario(true)}
              >
                <i className="bi bi-plus-lg"></i> Agregar
              </button>
            </div>
            <div className="card-body">
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>{mensaje}</div>
              )}
              {/* Modal para agregar orden */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Orden</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="nroOrden" value={formData.nroOrden} onChange={e => setFormData({ ...formData, nroOrden: e.target.value })} className="form-control" placeholder="Nro Orden" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="dispositivo" value={formData.dispositivo} onChange={e => setFormData({ ...formData, dispositivo: e.target.value })} className="form-control" placeholder="Dispositivo" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="date" name="fecha" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} className="form-control" placeholder="Fecha" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" name="diagnostico" value={formData.diagnostico} onChange={e => setFormData({ ...formData, diagnostico: e.target.value })} className="form-control" placeholder="Diagnóstico" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" name="servicio" value={formData.servicio} onChange={e => setFormData({ ...formData, servicio: e.target.value })} className="form-control" placeholder="Servicio" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="number" name="presupuesto" value={formData.presupuesto} onChange={e => setFormData({ ...formData, presupuesto: e.target.value })} className="form-control" placeholder="Presupuesto" required />
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
                        <h5 className="modal-title">{modalModo === 'consultar' ? 'Consultar Orden' : 'Modificar Orden'}</h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleModalSave}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" value={ordenActual?.nroOrden || ''} className="form-control" placeholder="Nro Orden" disabled />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" value={ordenActual?.dispositivo || ''} className="form-control" placeholder="Dispositivo"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setOrdenActual({ ...ordenActual, dispositivo: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="date" value={ordenActual?.fecha || ''} className="form-control" placeholder="Fecha"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setOrdenActual({ ...ordenActual, fecha: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" value={ordenActual?.diagnostico || ''} className="form-control" placeholder="Diagnóstico"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setOrdenActual({ ...ordenActual, diagnostico: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" value={ordenActual?.servicio || ''} className="form-control" placeholder="Servicio"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setOrdenActual({ ...ordenActual, servicio: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="number" value={ordenActual?.presupuesto || ''} className="form-control" placeholder="Presupuesto"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setOrdenActual({ ...ordenActual, presupuesto: e.target.value })} />
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
                      <th>Nro Orden</th>
                      <th>Dispositivo</th>
                      <th>Fecha</th>
                      <th>Diagnóstico</th>
                      <th>Servicio</th>
                      <th>Presupuesto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o, idx) => (
                      <tr key={idx}>
                        <td>{o.nroOrden}</td>
                        <td>{o.dispositivo}</td>
                        <td>{o.fecha}</td>
                        <td>{o.diagnostico}</td>
                        <td>{o.servicio}</td>
                        <td>{o.presupuesto}</td>
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Ordenes;
