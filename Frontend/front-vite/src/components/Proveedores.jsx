import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5', mentaSuave: '#c6e8e8' };
const API_URL = "http://localhost:5000/proveedores";

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
  const [formMode, setFormMode] = useState("alta"); // "alta" | "modificar"
  const [editId, setEditId] = useState(null);

  // Cargar proveedores
  useEffect(() => {
    fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, [mostrarInactivos]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors(validarProveedor({ ...form, [e.target.name]: e.target.value }));
  };

  function validarProveedor(obj) {
    const errors = {};
    if (!obj.cuil || !/^\d{11}$/.test(obj.cuil)) errors.cuil = "El CUIL/CUIT debe tener 11 dígitos numéricos.";
    if (!obj.razonSocial || obj.razonSocial.trim().length < 2) errors.razonSocial = "La razón social es obligatoria y debe tener al menos 2 caracteres.";
    if (!obj.telefono || obj.telefono.trim().length < 6 || !/^\d{6,}$/.test(obj.telefono.trim())) errors.telefono = "El teléfono es obligatorio, debe contener solo números y tener al menos 6 dígitos.";
    if (obj.activo !== 0 && obj.activo !== 1 && obj.activo !== "0" && obj.activo !== "1") errors.activo = "El estado es obligatorio.";
    return errors;
  }

  // Alta
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

  const handleAgregarClick = () => {
    setFormMode("alta");
    setProveedorActual(null);
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
    setFormErrors({});
    setForm({
      cuil: "",
      razonSocial: "",
      telefono: "",
      activo: 1,
    });
  };

  const handleModificar = (prov) => {
    setFormMode("modificar");
    setEditId(prov.cuil);
    setProveedorActual({
      ...prov,
      cuil: prov.cuil || "",
      razonSocial: prov.razonSocial || "",
      telefono: prov.telefono || "",
      activo: prov.activo ?? 1,
    });
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
    setModalErrors({});
    setForm({
      cuil: prov.cuil || "",
      razonSocial: prov.razonSocial || "",
      telefono: prov.telefono || "",
      activo: prov.activo ?? 1,
    });
  };

  const handleConsultar = (prov) => {
    setProveedorActual({
      ...prov,
      cuil: prov.cuil || "",
      razonSocial: prov.razonSocial || "",
      telefono: prov.telefono || "",
      activo: prov.activo ?? 1,
    });
    setModalModo('consultar');
    setModalVisible(true);
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

  const fetchProveedores = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar proveedores"));
  };

  const handleCancelar = () => {
    setModalVisible(false);
    setMensaje("");
    setForm({
      cuil: "",
      razonSocial: "",
      telefono: "",
      activo: 1,
    });
    setFormMode("alta");
    setFormErrors({});
  };

  const handleUpdate = async e => {
    e.preventDefault();
    const errors = validarProveedor(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const resultado = await res.json().catch(() => ({}));
      if (res.ok) {
        setModalVisible(false);
        setForm({
          cuil: "",
          razonSocial: "",
          telefono: "",
          activo: 1,
        });
        setEditId(null);
        if (form.activo === 1) {
          setMostrarInactivos(false);
        }
        fetchProveedores();
      } else {
        setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido del servidor");
      }
    } catch (err) {
      setMensaje("Error de red: " + (err.message || String(err)));
    }
  };

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
                      <tr key={prov.cuil}>
                        <td>{prov.cuil}</td>
                        <td>{prov.razonSocial}</td>
                        <td>{prov.telefono}</td>
                        <td>{prov.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(prov)}
                          >
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button
                            className="btn btn-sm btn-dorado fw-bold me-1"
                            onClick={() => handleModificar(prov)}
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
      {/* Modal para consultar, modificar o alta */}
      {modalVisible && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog" style={{ maxWidth: "100vw" }}>
            <div className="modal-content" style={{ width: "100vw", maxWidth: "100vw" }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalModo === 'consultar'
                    ? "Consultar proveedor"
                    : modalModo === 'modificar'
                    ? "Modificar proveedor"
                    : "Nuevo proveedor"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <form
                  className="form-container"
                  onSubmit={
                    modalModo === "modificar"
                      ? handleUpdate
                      : modalModo === "alta"
                      ? handleSubmit
                      : undefined
                  }
                >
                  <fieldset style={{ border: "none" }}>
                    <legend>
                      <i className="bi bi-person-badge me-2"></i>Datos del proveedor
                    </legend>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="row g-4">
                          <div className="col-12">
                            <div className="mb-3">
                              <label>
                                <i className="bi bi-credit-card-2-front me-2"></i>CUIL/CUIT
                              </label>
                              <input
                                type="text"
                                name="cuil"
                                value={
                                  modalModo === "consultar"
                                    ? proveedorActual?.cuil ?? ""
                                    : form.cuil
                                }
                                onChange={handleChange}
                                required
                                className="form-control"
                                disabled={modalModo === "consultar"}
                              />
                              {formErrors.cuil && <div className="input-error-message">{formErrors.cuil}</div>}
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="mb-3">
                              <label>
                                <i className="bi bi-building me-2"></i>Razón Social
                              </label>
                              <input
                                type="text"
                                name="razonSocial"
                                value={
                                  modalModo === "consultar"
                                    ? proveedorActual?.razonSocial ?? ""
                                    : form.razonSocial
                                }
                                onChange={handleChange}
                                required
                                className="form-control"
                                readOnly={modalModo === "consultar"}
                              />
                              {formErrors.razonSocial && <div className="input-error-message">{formErrors.razonSocial}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="row g-4">
                          <div className="col-12">
                            <div className="mb-3">
                              <label>
                                <i className="bi bi-telephone me-2"></i>Teléfono
                              </label>
                              <input
                                type="text"
                                name="telefono"
                                value={
                                  modalModo === "consultar"
                                    ? proveedorActual?.telefono ?? ""
                                    : form.telefono
                                }
                                onChange={handleChange}
                                required
                                className="form-control"
                                readOnly={modalModo === "consultar"}
                              />
                              {formErrors.telefono && <div className="input-error-message">{formErrors.telefono}</div>}
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="mb-3">
                              <label>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </label>
                              <select
                                name="activo"
                                value={
                                  modalModo === "consultar"
                                    ? proveedorActual?.activo ?? 1
                                    : form.activo
                                }
                                onChange={handleChange}
                                className="form-control"
                                disabled={modalModo === "consultar"}
                              >
                                <option value={1}>Activo</option>
                                <option value={0}>Inactivo</option>
                              </select>
                              {formErrors.activo && <div className="input-error-message">{formErrors.activo}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  {mensaje && (
                    <div className="alert alert-danger">{mensaje}</div>
                  )}
                  {(modalModo === "modificar" || modalModo === "alta") && (
                    <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                      <button type="submit" className="btn btn-azul fw-bold">
                        <i className="bi bi-save me-1"></i>
                        {modalModo === "modificar" ? "Guardar cambios" : "Guardar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-dorado fw-bold"
                        onClick={handleCancelar}
                      >
                        <i className="bi bi-x-circle me-1"></i>Cancelar
                      </button>
                    </div>
                  )}
                </form>
              </div>
              {modalModo === "consultar" && (
                <div className="modal-footer">
                  <button className="btn btn-dorado fw-bold" onClick={() => setModalVisible(false)}>
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Proveedores; Proveedores;
