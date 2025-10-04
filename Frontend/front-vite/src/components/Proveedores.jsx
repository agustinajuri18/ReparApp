import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5', mentaSuave: '#c6e8e8' };

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    cuil: "",
    razonSocial: "",
    telefono: "",
    mail: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Cargar proveedores
  useEffect(() => {
    fetch(`/proveedores/?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, [mostrarInactivos]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch("/proveedores/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ cuil: "", razonSocial: "", telefono: "", mail: "", activo: 1 });
        fetch(`/proveedores/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      });
  }

  function handleDelete(cuil) {
    fetch(`/proveedores/${cuil}`, { method: "DELETE" })
      .then(() => {
        fetch(`/proveedores/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      });
  }

  function handleEdit(proveedor) {
    setEditId(proveedor.cuil);
    setForm(proveedor);
  }

  function handleUpdate(e) {
    e.preventDefault();
    fetch(`/proveedores/${form.cuil}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setEditId(null);
        setForm({ cuil: "", razonSocial: "", telefono: "", mail: "", activo: 1 });
        fetch(`/proveedores/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      });
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0">Gestión de Proveedores</h4>
              <div>
                <button
                  className="btn btn-success me-2"
                  style={{ background: colores.mentaSuave, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => handleListarProveedores(proveedores)}
                >
                  Listar Proveedores
                </button>
                <button
                  className="btn me-2"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? 'Ver solo activos' : 'Ver también inactivos'}
                </button>
                {/* Botón Agregar */}
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
              {/* Modal para agregar proveedor */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Proveedor</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <div className="col-12 col-md-3 mb-2">
                              <input type="text" name="cuil" value={form.cuil} onChange={handleChange} className="form-control" placeholder="CUIL" required />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <input type="text" name="razonSocial" value={form.razonSocial} onChange={handleChange} className="form-control" placeholder="Razón Social" required />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className="form-control" placeholder="Teléfono" required />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <input type="email" name="mail" value={form.mail} onChange={handleChange} className="form-control" placeholder="Email" />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <select name="activo" value={form.activo} onChange={handleChange} className="form-select">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
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
              {/* Modal para consultar o modificar proveedor */}
              {modalVisible && proveedorActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Proveedor' : 'Modificar Proveedor'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {modalModo === 'consultar' ? (
                          <div className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-person-badge me-2"></i>Datos personales
                              </legend>
                              <div className="form-group mb-2">
                                <i className="bi bi-credit-card-2-front me-2"></i>
                                <b>CUIL:</b> {proveedorActual.cuil}
                              </div>
                              <div className="form-group mb-2">
                                <i className="bi bi-building me-2"></i>
                                <b>Razón Social:</b> {proveedorActual.razonSocial}
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-telephone me-2"></i>Datos de contacto
                              </legend>
                              <div className="form-group mb-2">
                                <i className="bi bi-telephone me-2"></i>
                                <b>Teléfono:</b> {proveedorActual.telefono}
                              </div>
                              <div className="form-group mb-2">
                                <i className="bi bi-envelope me-2"></i>
                                <b>Email:</b> {proveedorActual.mail}
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </legend>
                              <div className="form-group mb-2">
                                <i className="bi bi-check2-circle me-2"></i>
                                <b>Estado:</b> {Number(proveedorActual.activo) == 1 ? "Activo" : "Inactivo"}
                              </div>
                            </fieldset>
                          </div>
                        ) : (
                          <form onSubmit={handleModalSave} className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-person-badge me-2"></i>Datos personales
                              </legend>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-credit-card-2-front me-2"></i>CUIL
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={proveedorActual.cuil}
                                  onChange={e => setProveedorActual({ ...proveedorActual, cuil: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-building me-2"></i>Razón Social
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={proveedorActual.razonSocial}
                                  onChange={e => setProveedorActual({ ...proveedorActual, razonSocial: e.target.value })}
                                  required
                                />
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-telephone me-2"></i>Datos de contacto
                              </legend>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-telephone me-2"></i>Teléfono
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={proveedorActual.telefono}
                                  onChange={e => setProveedorActual({ ...proveedorActual, telefono: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-envelope me-2"></i>Email
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  value={proveedorActual.mail}
                                  onChange={e => setProveedorActual({ ...proveedorActual, mail: e.target.value })}
                                />
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </legend>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-check2-circle me-2"></i>Estado
                                </label>
                                <select
                                  className="form-select"
                                  value={Number(proveedorActual.activo) ?? 1}
                                  onChange={e => setProveedorActual({
                                    ...proveedorActual,
                                    activo: parseInt(e.target.value, 10)
                                  })}
                                >
                                  <option value={1}>Activo</option>
                                  <option value={0}>Inactivo</option>
                                </select>

                              </div>
                            </fieldset>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige }}>
                                <i className="bi bi-save me-1"></i>Guardar
                              </button>
                              <button type="button" className="btn" style={{ marginLeft: 8, background: colores.dorado, color: colores.azul }} onClick={handleModalClose}>
                                <i className="bi bi-x-circle me-1"></i>Cancelar
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>CUIL/CUIT</th>
                      <th>Razón Social</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov) => (
                      <tr key={prov.cuil} style={Number(prov.activo) == 0 ? { opacity: 0.5 } : {}}>
                        <td>{prov.cuil}</td><td>{prov.razonSocial}</td><td>{prov.telefono}</td><td>{prov.mail}</td><td>{prov.activo === 1 ? "Activo" : "Inactivo"}</td><td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(prov.cuil)}
                          >
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(prov.cuil)}
                          >
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          {prov.activo == true && (
                            <button
                              className="btn btn-sm"
                              style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                              onClick={() => handleEliminar(prov.cuil)}
                            >
                              <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
                            </button>
                          )}
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

export default Proveedores;
