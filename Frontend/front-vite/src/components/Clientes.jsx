import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000/clientes/";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formMode, setFormMode] = useState("alta"); // "alta" | "modificar"
  const [mensaje, setMensaje] = useState("");
  const [form, setForm] = useState({
    tipoDocumento: "",
    numeroDoc: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    activo: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
  const [clienteActual, setClienteActual] = useState(null);
  const [modalErrors, setModalErrors] = useState({});

  // Cargar clientes
  const fetchClientes = async () => {
    let url = API_URL + (mostrarInactivos ? "?activos=false" : "?activos=true");
    const res = await fetch(url);
    const data = await res.json();
    setClientes(Array.isArray(data) ? data : []);
  };

  // Cargar tipos de documento
  const fetchTiposDocumento = async () => {
    const res = await fetch("http://localhost:5000/tipos-documento/");
    const data = await res.json();
    setTiposDocumento(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchClientes();
    fetchTiposDocumento();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors(validarCliente({ ...form, [e.target.name]: e.target.value }));
  };

  // Mostrar modal para alta o modificación
  const handleAgregarClick = () => {
    setFormMode("alta");
    setClienteActual(null);
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
    setFormErrors({});
    setForm({
      tipoDocumento: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      activo: 1,
    });
  };

  const handleModificar = (cliente) => {
    setFormMode("modificar");
    setClienteActual({
      ...cliente,
      tipoDocumento: cliente.tipoDocumento || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      activo: cliente.activo ?? 1,
    });
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
    setModalErrors({});
    setForm({
      tipoDocumento: cliente.tipoDocumento || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      activo: cliente.activo ?? 1,
    });
  };

  function validarDocumento(tipo, numero) {
    if (tipo === "DNI") return /^\d{7,8}$/.test(numero);
    if (tipo === "CUIT" || tipo === "CUIL") return /^\d{11}$/.test(numero);
    if (tipo === "PASAPORTE") return /^[A-Z0-9]{6,9}$/.test(numero);
    return true;
  }

  function validarCliente(form) {
    const errors = {};
    if (!form.tipoDocumento) errors.tipoDocumento = "Debe seleccionar el tipo de documento.";
    if (!form.numeroDoc || !validarDocumento(form.tipoDocumento, form.numeroDoc)) errors.numeroDoc = "Número de documento inválido para el tipo seleccionado.";
    if (!form.nombre || form.nombre.trim().length < 2) errors.nombre = "El nombre es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.apellido || form.apellido.trim().length < 2) errors.apellido = "El apellido es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.telefono || form.telefono.trim().length < 6) errors.telefono = "El teléfono es obligatorio y debe tener al menos 6 caracteres.";
    if (!form.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) errors.email = "El email no es válido.";
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") errors.activo = "El estado es obligatorio.";
    return errors;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    const errors = validarCliente(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const resultado = await res.json();
    setMensaje(resultado.mensaje || resultado.detail || resultado.error || "");
    setModalVisible(false); // Cierra el modal al crear
    setForm({
      tipoDocumento: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      activo: 1,
    });
    fetchClientes();
  };

  // Guardar modificación
  const handleUpdate = async e => {
    e.preventDefault();
    const errors = validarCliente(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    const { tipoDocumento, numeroDoc } = form;
    await fetch(`${API_URL}${tipoDocumento}/${numeroDoc}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalVisible(false); // Cierra el modal al modificar
    setMensaje("");
    setForm({
      tipoDocumento: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      activo: 1,
    });
    fetchClientes();
  };

  // Consultar cliente
  const handleConsultar = (cliente) => {
    setClienteActual({
      ...cliente,
      tipoDocumento: cliente.tipoDocumento || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      activo: cliente.activo ?? 1,
    });
    setModalModo('consultar');
    setModalVisible(true);
    setMensaje("");
  };

  // Modal: guardar modificación
  const handleGuardarModificacion = async () => {
    const errors = validarCliente(clienteActual);
    setModalErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    if (!clienteActual || !clienteActual.idCliente) {
      setMensaje("Error: No se seleccionó cliente para modificar.");
      return;
    }
    const [tipoDocumento, numeroDoc] = clienteActual.idCliente.split("-");
    await fetch(`${API_URL}${tipoDocumento}/${numeroDoc}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clienteActual),
    });
    setModalVisible(false);
    setMensaje("");
    fetchClientes();
  };

  // Modal: actualizar campos
  const handleModalChange = e => {
    setClienteActual({ ...clienteActual, [e.target.name]: e.target.value });
    setModalErrors(validarCliente({ ...clienteActual, [e.target.name]: e.target.value }));
  };

  // Cancelar formulario
  const handleCancelar = () => {
    setMostrarFormulario(false);
    setMensaje("");
    setForm({
      tipoDocumento: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      activo: 1,
    });
    setFormMode("alta");
    setFormErrors({});
  };

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 #1f334522`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid #1f3345`, borderRadius: 16, background: "var(--color-beige)" }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: "#1f3345", color: "#f0ede5", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-person-badge me-2"></i>Gestión de Clientes</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dorado"
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
                </button>
                <button
                  className="btn btn-verdeAgua"
                  onClick={handleAgregarClick}
                >
                  <i className="bi bi-plus-lg"></i> Agregar cliente
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Tipo Doc</th>
                      <th>Número Doc</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.idCliente}>
                        <td>{tiposDocumento.find(td => (td.codigo || td.codTipoDoc) === c.tipoDocumento)?.nombre || c.tipoDocumento}</td>
                        <td>{c.numeroDoc}</td>
                        <td>{c.nombre}</td>
                        <td>{c.apellido}</td>
                        <td>{c.telefono}</td>
                        <td>{c.email}</td>
                        <td>{c.activo ? "Sí" : "No"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(c)}
                          >
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button
                            className="btn btn-sm btn-dorado fw-bold me-1"
                            onClick={() => handleModificar(c)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          <button
                            className="btn btn-sm btn-rojo fw-bold"
                            onClick={() => c.idCliente && handleEliminar(c.idCliente)}
                          >
                            <i className="bi bi-trash me-1"></i>Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {clientes.length === 0 && (
                  <div className="text-center text-muted py-4">No hay clientes registrados.</div>
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
                    ? "Consultar cliente"
                    : modalModo === 'modificar'
                    ? "Modificar cliente"
                    : "Nuevo cliente"}
                </h5>
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
                      <i className="bi bi-person-vcard me-2"></i>Datos del cliente
                    </legend>
                    {/* División: Datos personales */}
                    <h6 className="fw-bold mt-3 mb-2 border-bottom pb-1">
                      <i className="bi bi-person-lines-fill me-2"></i>Datos personales
                    </h6>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-card-list me-2"></i>Tipo de documento
                          </label>
                          <select
                            name="tipoDocumento"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.tipoDocumento ?? ""
                                : form.tipoDocumento
                            }
                            onChange={handleChange}
                            className="form-control"
                            required
                            disabled={modalModo === "modificar" || modalModo === "consultar"}
                          >
                            <option value="">Seleccione tipo de documento</option>
                            {tiposDocumento.map(td => (
                              <option key={td.codigo || td.codTipoDoc} value={td.codigo || td.codTipoDoc}>
                                {td.nombre}
                              </option>
                            ))}
                          </select>
                          {formErrors.tipoDocumento && <div className="input-error-message">{formErrors.tipoDocumento}</div>}
                        </div>
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-hash me-2"></i>Número de documento
                          </label>
                          <input
                            type="text"
                            name="numeroDoc"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.numeroDoc ?? ""
                                : form.numeroDoc
                            }
                            onChange={handleChange}
                            required
                            className="form-control"
                            disabled={modalModo === "modificar" || modalModo === "consultar"}
                          />
                          {formErrors.numeroDoc && <div className="input-error-message">{formErrors.numeroDoc}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-person me-2"></i>Nombre
                          </label>
                          <input
                            type="text"
                            name="nombre"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.nombre ?? ""
                                : form.nombre
                            }
                            onChange={handleChange}
                            required
                            className="form-control"
                            readOnly={modalModo === "consultar"}
                          />
                          {formErrors.nombre && <div className="input-error-message">{formErrors.nombre}</div>}
                        </div>
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-person me-2"></i>Apellido
                          </label>
                          <input
                            type="text"
                            name="apellido"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.apellido ?? ""
                                : form.apellido
                            }
                            onChange={handleChange}
                            required
                            className="form-control"
                            readOnly={modalModo === "consultar"}
                          />
                          {formErrors.apellido && <div className="input-error-message">{formErrors.apellido}</div>}
                        </div>
                      </div>
                    </div>
                    {/* División: Datos de contacto */}
                    <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1">
                      <i className="bi bi-telephone me-2"></i>Datos de contacto
                    </h6>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-telephone me-2"></i>Teléfono
                          </label>
                          <input
                            type="text"
                            name="telefono"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.telefono ?? ""
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
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-envelope me-2"></i>Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.email ?? ""
                                : form.email
                            }
                            onChange={handleChange}
                            required
                            className="form-control"
                            readOnly={modalModo === "consultar"}
                          />
                          {formErrors.email && <div className="input-error-message">{formErrors.email}</div>}
                        </div>
                      </div>
                    </div>
                    {/* División: Estado */}
                    <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1">
                      <i className="bi bi-check2-circle me-2"></i>Estado
                    </h6>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-check2-circle me-2"></i>Estado
                          </label>
                          <select
                            name="activo"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.activo ?? 1
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
                        onClick={() => setModalVisible(false)}
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

