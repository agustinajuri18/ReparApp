import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000/clientes";
const TIPOS_DOC_URL = "http://localhost:5000/tipos-documento";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formMode, setFormMode] = useState("alta"); // "alta" | "modificar"
  const [mensaje, setMensaje] = useState("");
  const [form, setForm] = useState({
    idTipoDoc: "",
    numeroDoc: "",
    nombre: "",
    apellido: "",
    telefono: "",
    mail: "",
    activo: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
  const [clienteActual, setClienteActual] = useState(null);
  const [modalErrors, setModalErrors] = useState({});
  // Agregar estado para el ID en edición
  const [editId, setEditId] = useState(null);

  // Cargar clientes
  const fetchClientes = () => {
    fetch(`${API_URL}?activos=${!mostrarInactivos}`)
      .then(res => res.json())
      .then(data => setClientes(Array.isArray(data) ? data.filter(c => c && typeof c === 'object' && 'idCliente' in c && c.idCliente != null) : []))
      .catch(() => setMensaje("Error al cargar clientes"));
  };

  // Cargar tipos de documento
  const fetchTiposDocumento = () => {
    fetch(TIPOS_DOC_URL)
      .then(res => res.json())
      .then(data => setTiposDocumento(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar tipos de documento"));
  };

  useEffect(() => {
    fetchClientes();
    fetchTiposDocumento();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  const handleChange = e => {
    const value = e.target.name === "activo" ? parseInt(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setFormErrors(validarCliente({ ...form, [e.target.name]: value }));
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
      idTipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      mail: "",
      activo: 1,
    });
  };

  const handleModificar = (cliente) => {
    setFormMode("modificar");
    setEditId(cliente.idCliente);  // Agregar esta línea
    setClienteActual({
      ...cliente,
      idTipoDoc: cliente.idTipoDoc || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      mail: cliente.mail || "",
      activo: cliente.activo ?? 1,
    });
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
    setModalErrors({});
    setForm({
      idTipoDoc: cliente.idTipoDoc || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      mail: cliente.mail || "",
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
    if (!form.idTipoDoc) errors.idTipoDoc = "Debe seleccionar el tipo de documento.";
    if (!form.numeroDoc || !validarDocumento(form.idTipoDoc, form.numeroDoc)) errors.numeroDoc = "Número de documento inválido para el tipo seleccionado.";
    if (!form.nombre || form.nombre.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(form.nombre.trim())) errors.nombre = "El nombre es obligatorio, debe contener solo letras y espacios, y tener al menos 2 caracteres.";
    if (!form.apellido || form.apellido.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(form.apellido.trim())) errors.apellido = "El apellido es obligatorio, debe contener solo letras y espacios, y tener al menos 2 caracteres.";
    if (!form.telefono || form.telefono.trim().length < 6 || !/^\d{6,}$/.test(form.telefono.trim())) errors.telefono = "El teléfono es obligatorio, debe contener solo números y tener al menos 6 dígitos.";
    if (!form.mail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.mail)) errors.mail = "El email no es válido.";
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
      idTipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      mail: "",
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
          idTipoDoc: "",
          numeroDoc: "",
          nombre: "",
          apellido: "",
          telefono: "",
          mail: "",
          activo: 1,
        });
        setEditId(null);
        if (form.activo === 1) {
          setMostrarInactivos(false);
        }
        fetchClientes();
      } else {
        setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido del servidor");
      }
    } catch (err) {
      setMensaje("Error de red: " + (err.message || String(err)));
    }
  };

  // Consultar cliente
  const handleConsultar = (cliente) => {
    setClienteActual({
      ...cliente,
      idTipoDoc: cliente.idTipoDoc || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      mail: cliente.mail || "",
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
      idTipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      mail: "",
      activo: 1,
    });
    setFormMode("alta");
    setFormErrors({});
  };

  // Agregar función handleEliminar
  const handleEliminar = async (idCliente) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      const res = await fetch(`${API_URL}/${idCliente}`, { method: 'DELETE' });
      if (res.ok) {
        setMensaje("Cliente eliminado");
        fetchClientes();
      } else {
        setMensaje("Error al eliminar cliente");
      }
    } catch (error) {
      setMensaje("Error de conexión");
    }
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
                        <td>{tiposDocumento.find(td => td.idTipoDoc === c.idTipoDoc)?.nombre || c.idTipoDoc}</td>
                        <td>{c.numeroDoc}</td>
                        <td>{c.nombre}</td>
                        <td>{c.apellido}</td>
                        <td>{c.telefono}</td>
                        <td>{c.mail}</td>
                        <td>{c.activo === 1 ? "Activo" : "Inactivo"}</td>
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
                          {c.activo === 1 && (
                            <button
                              className="btn btn-sm btn-rojo fw-bold"
                              onClick={() => c.idCliente && handleEliminar(c.idCliente)}
                            >
                              <i className="bi bi-trash me-1"></i>Eliminar
                            </button>
                          )}
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
                    ? <><i className="bi bi-search me-2"></i>Consultar cliente</>
                    : modalModo === 'modificar'
                    ? <><i className="bi bi-pencil-square me-2"></i>Modificar cliente</>
                    : <><i className="bi bi-plus-lg me-2"></i>Nuevo cliente</>}
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
                            name="idTipoDoc"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.idTipoDoc ?? ""
                                : form.idTipoDoc
                            }
                            onChange={handleChange}
                            className="form-control"
                            required
                            disabled={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                          >
                            <option key="default" value="">Seleccione tipo de documento</option>
                            {tiposDocumento.map(td => (
                              <option key={td.idTipoDoc} value={td.idTipoDoc}>
                                {td.nombre}
                              </option>
                            ))}
                          </select>
                          {formErrors.idTipoDoc && <div className="input-error-message">{formErrors.idTipoDoc}</div>}
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
                            disabled={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
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
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
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
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
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
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
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
                            name="mail"
                            value={
                              modalModo === "consultar"
                                ? clienteActual?.mail ?? ""
                                : form.mail
                            }
                            onChange={handleChange}
                            required
                            className="form-control"
                            readOnly={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                          />
                          {formErrors.mail && <div className="input-error-message">{formErrors.mail}</div>}
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
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
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
                    <i className="bi bi-x-circle me-1"></i>Cerrar
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

