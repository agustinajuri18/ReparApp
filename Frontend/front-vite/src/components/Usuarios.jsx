import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Para consulta/edición
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' o 'editar'
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Cargar usuarios desde la API
  useEffect(() => {
    fetch('http://localhost:5000/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(() => setMensaje("Error al cargar usuarios"));
  }, []);

  // Filtro de usuarios según activos/inactivos
  const usuariosFiltrados = usuarios.filter(u => mostrarInactivos ? u.activo === 0 : u.activo === 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    setUsuarios([...usuarios, formData]);
    setFormData({ usuario: '', password: '', activo: 1 });
    setMostrarFormulario(false);
    setMensaje("Usuario agregado correctamente.");
  };

  // CONSULTAR
  const handleConsultar = (idx) => {
    setUsuarioActual(usuariosFiltrados[idx]);
    setModalModo('consultar');
    setModalVisible(true);
  };

  // EDITAR
  const handleModificar = (idx) => {
    setUsuarioActual({ ...usuariosFiltrados[idx] });
    setModalModo('editar');
    setModalVisible(true);
  };

  const handleModalSave = (e) => {
    e.preventDefault();
    setUsuarios(usuarios.map((u) =>
      u.usuario === usuarioActual.usuario ? usuarioActual : u
    ));
    setModalVisible(false);
    setMensaje("Usuario modificado correctamente.");
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setUsuarioActual(null);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0">Gestión de Usuarios</h4>
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
              {/* Modal para agregar usuario */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Usuario</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="usuario" value={formData.usuario} onChange={e => setFormData({ ...formData, usuario: e.target.value })} className="form-control" placeholder="Usuario" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="password" name="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="form-control" placeholder="Contraseña" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
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
                        <h5 className="modal-title">{modalModo === 'consultar' ? 'Consultar Usuario' : 'Modificar Usuario'}</h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {/* Formulario de consulta igual a Proveedores */}
                        <form onSubmit={handleModalSave}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <label className="form-label fw-bold">Usuario</label>
                              <input type="text" value={usuarioActual?.usuario || ''} className="form-control" disabled />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <label className="form-label fw-bold">Contraseña</label>
                              <input type="password" value={usuarioActual?.password || ''} className="form-control"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setUsuarioActual({ ...usuarioActual, password: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <label className="form-label fw-bold">Estado</label>
                              <select value={usuarioActual?.activo ?? 1}
                                disabled={modalModo === 'consultar'}
                                className="form-select"
                                onChange={e => setUsuarioActual({ ...usuarioActual, activo: Number(e.target.value) })}>
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
                      <th>Usuario</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u, idx) => (
                      <tr key={idx} style={u.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{u.usuario}</td>
                        <td>{u.activo === 1 ? "Activo" : "Inactivo"}</td>
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
                {usuariosFiltrados.length === 0 && (
                  <div className="text-center text-muted py-4">No hay usuarios {mostrarInactivos ? "inactivos" : "activos"}.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Usuarios;
