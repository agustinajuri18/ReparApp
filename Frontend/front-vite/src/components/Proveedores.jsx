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
    activo: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
  const [proveedorActual, setProveedorActual] = useState(null);
  const [modalErrors, setModalErrors] = useState({});

  // Cargar proveedores
  useEffect(() => {
    fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, [mostrarInactivos]);

  function validarProveedor(obj) {
    const errors = {};
    if (!obj.cuil || !/^\d{11}$/.test(obj.cuil)) errors.cuil = "El CUIL/CUIT debe tener 11 dígitos numéricos.";
    if (!obj.razonSocial || obj.razonSocial.trim().length < 2) errors.razonSocial = "La razón social es obligatoria y debe tener al menos 2 caracteres.";
    if (!obj.telefono || String(obj.telefono).trim().length < 10) errors.telefono = "El teléfono es obligatorio y debe tener al menos 10 caracteres.";
    if (obj.activo !== 0 && obj.activo !== 1 && obj.activo !== "0" && obj.activo !== "1") errors.activo = "El estado es obligatorio.";
    return errors;
  }

  // Alta
  function handleChange(e) {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: name === "activo" ? Number(value) : value };
    setForm(newForm);
    setFormErrors(validarProveedor(newForm));
    setMensaje("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validarProveedor(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear proveedor");
        return data;
      })
      .then(() => {
        setForm({ cuil: "", razonSocial: "", telefono: "", activo: 1 });
        setMostrarFormulario(false);
        setMensaje("");
        fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      })
      .catch(err => setMensaje(err.message));
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
    setModalErrors({});
    setMensaje("");
  }

  function handleModificar(cuil) {
    const proveedor = proveedores.find(p => String(p.cuil) === String(cuil));
    setProveedorActual(proveedor);
    setModalModo('modificar');
    setModalVisible(true);
    setModalErrors({});
    setMensaje("");
  }

  function handleModalClose() {
    setModalVisible(false);
    setProveedorActual(null);
    setModalErrors({});
    setMensaje("");
  }

  function handleModalFieldChange(e) {
    const { name, value } = e.target;
    const nuevo = { ...proveedorActual, [name]: name === "activo" ? Number(value) : value };
    setProveedorActual(nuevo);
    setModalErrors(validarProveedor({ ...nuevo, cuil: proveedorActual.cuil }));
    setMensaje("");
  }

  function handleModalSave(e) {
    e.preventDefault();
    // No enviar cuil en el body, solo los campos editables
    const { cuil, ...rest } = proveedorActual;
    const proveedorParaEnviar = {
      ...rest,
      activo: Number(proveedorActual.activo)
    };
    const errors = validarProveedor({ ...proveedorActual, cuil: proveedorActual.cuil });
    setModalErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    fetch(`${API_URL}${proveedorActual.cuil}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proveedorParaEnviar)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al modificar proveedor");
        return data;
      })
      .then(() => {
        setModalVisible(false);
        setProveedorActual(null);
        setMensaje("");
        fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setProveedores(data));
      })
      .catch(err => setMensaje(err.message));
  }

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: "var(--color-beige)" }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-truck me-2"></i>Gestión de Proveedores</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dorado"
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? 'Ver activos' : 'Ver inactivos'}
                </button>
                <button
                  className="btn btn-verdeAgua"
                  onClick={() => { setMostrarFormulario(true); setFormErrors({}); setMensaje(""); }}
                >
                  <i className="bi bi-plus-lg"></i> Agregar proveedor
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Formulario de alta estilizado */}
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="form-container mb-3">
                  <fieldset style={{ border: "none" }}>
                    <legend>
                      <i className="bi bi-person-badge me-2"></i>Datos del proveedor
                    </legend>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-credit-card-2-front me-2"></i>CUIL/CUIT</label>
                          <input
                            type="text"
                            name="cuil"
                            value={form.cuil || ""}
                            onChange={handleChange}
                            required
                            className={`form-control ${formErrors.cuil ? "is-invalid" : ""}`}
                            placeholder="CUIL/CUIT"
                          />
                          {formErrors.cuil && <div className="invalid-feedback">{formErrors.cuil}</div>}
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-building me-2"></i>Razón Social</label>
                          <input
                            type="text"
                            name="razonSocial"
                            value={form.razonSocial || ""}
                            onChange={handleChange}
                            required
                            className={`form-control ${formErrors.razonSocial ? "is-invalid" : ""}`}
                            placeholder="Razón Social"
                          />
                          {formErrors.razonSocial && <div className="invalid-feedback">{formErrors.razonSocial}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-telephone me-2"></i>Teléfono</label>
                          <input
                            type="text"
                            name="telefono"
                            value={form.telefono || ""}
                            onChange={handleChange}
                            required
                            className={`form-control ${formErrors.telefono ? "is-invalid" : ""}`}
                            placeholder="Teléfono"
                          />
                          {formErrors.telefono && <div className="invalid-feedback">{formErrors.telefono}</div>}
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select name="activo" value={form.activo} onChange={handleChange} className={`form-control ${formErrors.activo ? "is-invalid" : ""}`}>
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
                          {formErrors.activo && <div className="invalid-feedback">{formErrors.activo}</div>}
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  {mensaje && (
                    <div className="alert alert-danger">{mensaje}</div>
                  )}
                  <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                    <button type="submit" className="btn btn-azul fw-bold">
                      <i className="bi bi-save me-1"></i>Guardar
                    </button>
                    <button type="button" className="btn btn-dorado fw-bold" onClick={() => setMostrarFormulario(false)}>
                      <i className="bi bi-x-circle me-1"></i>Cancelar
                    </button>
                  </div>
                </form>
              )}
              {/* Modal para consultar o modificar proveedor */}
              {modalVisible && proveedorActual && (
                <div className="modal" style={{ display: "block" }}>
                  <div className="modal-dialog" style={{ maxWidth: "100vw" }}>
                    <div className="modal-content" style={{ width: "100vw", maxWidth: "100vw" }}>
                      <div className="modal-header">
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Proveedor' : 'Modificar Proveedor'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body" style={{ padding: 0 }}>
                        {modalModo === 'consultar' ? (
                          <div className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none" }}>
                              <legend>
                                <i className="bi bi-person-badge me-2"></i>Datos del proveedor
                              </legend>
                              <div className="row g-4">
                                <div className="col-12 col-md-6">
                                  <div className="mb-3">
                                    <i className="bi bi-credit-card-2-front me-2"></i>
                                    <b>CUIL/CUIT:</b> {proveedorActual.cuil}
                                  </div>
                                  <div className="mb-3">
                                    <i className="bi bi-building me-2"></i>
                                    <b>Razón Social:</b> {proveedorActual.razonSocial}
                                  </div>
                                </div>
                                <div className="col-12 col-md-6">
                                  <div className="mb-3">
                                    <i className="bi bi-telephone me-2"></i>
                                    <b>Teléfono:</b> {proveedorActual.telefono}
                                  </div>
                                  <div className="mb-3">
                                    <i className="bi bi-check2-circle me-2"></i>
                                    <b>Estado:</b> {Number(proveedorActual.activo) === 1 ? "Activo" : "Inactivo"}
                                  </div>
                                </div>
                              </div>
                            </fieldset>
                          </div>
                        ) : (
                          <form onSubmit={handleModalSave} className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none" }}>
                              <legend>
                                <i className="bi bi-person-badge me-2"></i>Datos del proveedor
                              </legend>
                              <div className="row g-4">
                                <div className="col-12 col-md-6">
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-credit-card-2-front me-2"></i>CUIL/CUIT</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={proveedorActual.cuil || ""}
                                      readOnly
                                      disabled
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-building me-2"></i>Razón Social</label>
                                    <input
                                      type="text"
                                      className={`form-control ${modalErrors.razonSocial ? "is-invalid" : ""}`}
                                      value={proveedorActual.razonSocial || ""}
                                      onChange={handleModalFieldChange}
                                      name="razonSocial"
                                      required
                                    />
                                    {modalErrors.razonSocial && <div className="invalid-feedback">{modalErrors.razonSocial}</div>}
                                  </div>
                                </div>
                                <div className="col-12 col-md-6">
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-telephone me-2"></i>Teléfono</label>
                                    <input
                                      type="text"
                                      className={`form-control ${modalErrors.telefono ? "is-invalid" : ""}`}
                                      value={proveedorActual.telefono || ""}
                                      onChange={handleModalFieldChange}
                                      name="telefono"
                                      required
                                    />
                                    {modalErrors.telefono && <div className="invalid-feedback">{modalErrors.telefono}</div>}
                                  </div>
                                  <div className="mb-3">
                                    <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                                    <select
                                      className={`form-control ${modalErrors.activo ? "is-invalid" : ""}`}
                                      value={proveedorActual.activo}
                                      onChange={handleModalFieldChange}
                                      name="activo"
                                    >
                                      <option value={1}>Activo</option>
                                      <option value={0}>Inactivo</option>
                                    </select>
                                    {modalErrors.activo && <div className="invalid-feedback">{modalErrors.activo}</div>}
                                  </div>
                                </div>
                              </div>
                            </fieldset>
                            {mensaje && (
                              <div className="alert alert-danger">{mensaje}</div>
                            )}
                            <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                              <button type="submit" className="btn btn-azul fw-bold">
                                <i className="bi bi-save me-1"></i>Guardar
                              </button>
                              <button type="button" className="btn btn-dorado fw-bold" onClick={handleModalClose}>
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
                        <td>{prov.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(prov.cuil)}
                          >
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button
                            className="btn btn-sm btn-dorado fw-bold me-1"
                            onClick={() => handleModificar(prov.cuil)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          {prov.activo === 1 && (
                            <button
                              className="btn btn-sm btn-rojo fw-bold"
                              onClick={() => handleDelete(prov.cuil)}
                            >
                              <i className="bi bi-trash me-1"></i>Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {proveedores.length === 0 && (
                  <div className="text-center text-muted py-4">No hay proveedores registrados.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Proveedores;
