import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5', mentaSuave: '#c6e8e8' };
const API_URL = "http://localhost:5000/proveedores/";

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
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
  const [proveedorActual, setProveedorActual] = useState(null);

  // Cargar proveedores
  useEffect(() => {
    fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, [mostrarInactivos]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validarProveedor(form) {
    if (!form.cuil || !/^\d{11}$/.test(form.cuil)) return "El CUIL/CUIT debe tener 11 dígitos numéricos.";
    if (!form.razonSocial || form.razonSocial.trim().length < 2) return "La razón social es obligatoria y debe tener al menos 2 caracteres.";
    if (!form.telefono || String(form.telefono).trim().length < 10) return "El teléfono es obligatorio y debe tener al menos 10 caracteres.";
    if (form.mail && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.mail)) return "El email no es válido.";
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") return "El estado es obligatorio.";
    return null;
  }

  // Alta
  function handleSubmit(e) {
    e.preventDefault();
    const error = validarProveedor(form);
    if (error) {
      setMensaje(error);
      return;
    }
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ cuil: "", razonSocial: "", telefono: "", mail: "", activo: 1 });
        setMostrarFormulario(false);
        fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      });
  }

  function handleDelete(cuil) {
    fetch(`${API_URL}${cuil}`, { method: "DELETE" })
      .then(() => {
        fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      });
  }

  function handleConsultar(cuil) {
    const proveedor = proveedores.find(p => String(p.cuil) === String(cuil));
    setProveedorActual(proveedor);
    setModalModo('consultar');
    setModalVisible(true);
  }

  function handleModificar(cuil) {
    const proveedor = proveedores.find(p => String(p.cuil) === String(cuil));
    setProveedorActual(proveedor);
    setModalModo('modificar');
    setModalVisible(true);
  }

  function handleModalClose() {
    setModalVisible(false);
    setProveedorActual(null);
  }

  function handleModalSave(e) {
    e.preventDefault();
    const error = validarProveedor(proveedorActual);
    if (error) {
      setMensaje(error);
      return;
    }
    fetch(`${API_URL}${proveedorActual.cuil}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proveedorActual)
    })
      .then(res => res.json())
      .then(() => {
        setModalVisible(false);
        setProveedorActual(null);
        fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
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
              <h4 className="mb-2 mb-md-0"><i className="bi bi-truck me-2"></i>Gestión de Proveedores</h4>
              <div>
                <button
                  className="btn me-2"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? 'Ver activos' : 'Ver inactivos'}
                </button>
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarFormulario(true)}
                >
                  <i className="bi bi-plus-lg"></i> Agregar proveedor
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Formulario de alta estilizado */}
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="form-container mb-3">
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-badge me-2"></i>Datos personales
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-credit-card-2-front me-2"></i>CUIL/CUIT</label>
                          <input
                            type="text"
                            name="cuil"
                            value={form.cuil || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="CUIL/CUIT"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-building me-2"></i>Razón Social</label>
                          <input
                            type="text"
                            name="razonSocial"
                            value={form.razonSocial || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Razón Social"
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-telephone me-2"></i>Datos de contacto
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-telephone me-2"></i>Teléfono</label>
                          <input
                            type="text"
                            name="telefono"
                            value={form.telefono || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Teléfono"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-envelope me-2"></i>Email</label>
                          <input
                            type="email"
                            name="mail"
                            value={form.mail || ""}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Email"
                          />
                        </div>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select name="activo" value={form.activo} onChange={handleChange} className="form-control">
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
                        </div>
                      </fieldset>
                    </div>
                  </div>
                  {mensaje && (
                    <div className="alert alert-danger" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}>
                      {mensaje}
                    </div>
                  )}
                  <div className="row mt-3">
                    <div className="col-12 d-flex flex-column flex-md-row justify-content-end gap-2">
                      <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige, fontWeight: 600, borderRadius: "8px" }}>
                        <i className="bi bi-save me-1"></i>Guardar
                      </button>
                      <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }} onClick={() => setMostrarFormulario(false)}>
                        <i className="bi bi-x-circle me-1"></i>Cancelar
                      </button>
                    </div>
                  </div>
                </form>
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
                            <div className="row g-4">
                              <div className="col-12 col-md-6">
                                <fieldset style={{ border: "none" }}>
                                  <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                                    <i className="bi bi-person-badge me-2"></i>Datos personales
                                  </legend>
                                  <div className="mb-3">
                                    <i className="bi bi-credit-card-2-front me-2"></i>
                                    <b>CUIL/CUIT:</b> {proveedorActual.cuil}
                                  </div>
                                  <div className="mb-3">
                                    <i className="bi bi-building me-2"></i>
                                    <b>Razón Social:</b> {proveedorActual.razonSocial}
                                  </div>
                                </fieldset>
                              </div>
                              <div className="col-12 col-md-6">
                                <fieldset style={{ border: "none" }}>
                                  <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                                    <i className="bi bi-telephone me-2"></i>Datos de contacto
                                  </legend>
                                  <div className="mb-3">
                                    <i className="bi bi-telephone me-2"></i>
                                    <b>Teléfono:</b> {proveedorActual.telefono}
                                  </div>
                                  <div className="mb-3">
                                    <i className="bi bi-envelope me-2"></i>
                                    <b>Email:</b> {proveedorActual.mail}
                                  </div>
                                  <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                                    <i className="bi bi-check2-circle me-2"></i>Estado
                                  </legend>
                                  <div className="mb-3">
                                    <i className="bi bi-check2-circle me-2"></i>
                                    <b>Estado:</b> {Number(proveedorActual.activo) === 1 ? "Activo" : "Inactivo"}
                                  </div>
                                </fieldset>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleModalSave} className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <div className="row g-4">
                              <div className="col-12 col-md-6">
                                <fieldset style={{ border: "none" }}>
                                  <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                                    <i className="bi bi-person-badge me-2"></i>Datos personales
                                  </legend>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-credit-card-2-front me-2"></i>CUIL/CUIT</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={proveedorActual.cuil || ""}
                                      onChange={e => setProveedorActual({ ...proveedorActual, cuil: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-building me-2"></i>Razón Social</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={proveedorActual.razonSocial || ""}
                                      onChange={e => setProveedorActual({ ...proveedorActual, razonSocial: e.target.value })}
                                      required
                                    />
                                  </div>
                                </fieldset>
                              </div>
                              <div className="col-12 col-md-6">
                                <fieldset style={{ border: "none" }}>
                                  <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                                    <i className="bi bi-telephone me-2"></i>Datos de contacto
                                  </legend>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-telephone me-2"></i>Teléfono</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={proveedorActual.telefono || ""}
                                      onChange={e => setProveedorActual({ ...proveedorActual, telefono: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-envelope me-2"></i>Email</label>
                                    <input
                                      type="email"
                                      className="form-control"
                                      value={proveedorActual.mail || ""}
                                      onChange={e => setProveedorActual({ ...proveedorActual, mail: e.target.value })}
                                    />
                                  </div>
                                  <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                                    <i className="bi bi-check2-circle me-2"></i>Estado
                                  </legend>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                                    <select
                                      className="form-control"
                                      value={proveedorActual.activo}
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
                              </div>
                            </div>
                            <div className="row mt-3">
                              <div className="col-12 d-flex flex-column flex-md-row justify-content-end gap-2">
                                <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige, fontWeight: 600, borderRadius: "8px" }}>
                                  <i className="bi bi-save me-1"></i>Guardar
                                </button>
                                <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }} onClick={handleModalClose}>
                                  <i className="bi bi-x-circle me-1"></i>Cancelar
                                </button>
                              </div>
                            </div>
                            {mensaje && (
                              <div className="alert alert-danger" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}>
                                {mensaje}
                              </div>
                            )}
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
                      <tr key={prov.cuil} style={Number(prov.activo) === 0 ? { opacity: 0.5 } : {}}>
                        <td>{prov.cuil}</td>
                        <td>{prov.razonSocial}</td>
                        <td>{prov.telefono}</td>
                        <td>{prov.mail}</td>
                        <td>{prov.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
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
                          {prov.activo === 1 && (
                            <button
                              className="btn btn-sm"
                              style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                              onClick={() => handleDelete(prov.cuil)}
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
}

export default Proveedores;
