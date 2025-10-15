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
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
  const [clienteActual, setClienteActual] = useState(null);
  const [modalErrors, setModalErrors] = useState({});
  const [historialVisible, setHistorialVisible] = useState(false);
  const [historialOrdenes, setHistorialOrdenes] = useState([]);
  const [openMenuFor, setOpenMenuFor] = useState(null); // idCliente of open menu
  // Agregar estado para el ID en edición
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar clientes
  const fetchClientes = () => {
    const params = new URLSearchParams({
      activos: (!mostrarInactivos).toString(),
      ...(searchTerm && { search: searchTerm })
    });
    fetch(`${API_URL}?${params}`)
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
  }, [mostrarInactivos, searchTerm]);

  // Close dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e) => {
      setOpenMenuFor(null);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpenMenuFor(null);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFormErrors(validarCliente({ ...form, [name]: value }));
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
        });
        setEditId(null);
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

  // Agregar función handleReactivar
  const handleReactivar = async (idCliente) => {
    try {
      const res = await fetch(`${API_URL}/${idCliente}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: 1 })
      });
      if (res.ok) {
        setMensaje("Cliente reactivado exitosamente");
        fetchClientes();
      } else {
        setMensaje("Error al reactivar cliente");
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
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="table-responsive" style={{ overflow: 'visible' }}>
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
                        <td style={{ position: 'relative', overflow: 'visible' }}>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm btn-verdeAgua fw-bold"
                              onClick={() => handleConsultar(c)}
                            >
                              <i className="bi bi-search me-1"></i>Consultar
                            </button>
                            <button
                              className="btn btn-sm btn-primario fw-bold"
                              onClick={async () => {
                                // fetch historial for this cliente
                                try {
                                  const res = await fetch(`${API_URL}/${c.idCliente}/historial-ordenes`);
                                  const data = await res.json().catch(() => []);
                                  setHistorialOrdenes(Array.isArray(data) ? data : []);
                                  setHistorialVisible(true);
                                } catch (err) {
                                  setMensaje('Error al cargar historial');
                                }
                              }}
                            >
                              <i className="bi bi-clock-history me-1"></i>Historial
                            </button>

                            {/* three-dot dropdown for modify/delete */}
                            <div style={{ position: 'relative' }}>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === c.idCliente ? null : c.idCliente); }}
                                aria-expanded={openMenuFor === c.idCliente}
                              >
                                <i className="bi bi-three-dots-vertical"></i>
                              </button>
                              {openMenuFor === c.idCliente && (
                                <div className="card position-absolute" style={{ right: 0, top: '110%', zIndex: 9999, minWidth: 140 }}>
                                  <ul className="list-group list-group-flush p-2">
                                    <li className="list-group-item border-0 p-0 mb-1"><button className={`btn btn-sm w-100 ${c.activo ? 'btn-dorado' : 'btn-secondary'}`} onClick={() => { setOpenMenuFor(null); c.activo && handleModificar(c); }} disabled={!c.activo}>Modificar</button></li>
                                    {c.activo ? (
                                      <li className="list-group-item border-0 p-0"><button className="btn btn-sm btn-rojo w-100" onClick={() => { setOpenMenuFor(null); c.idCliente && handleEliminar(c.idCliente); }}>Eliminar</button></li>
                                    ) : (
                                      <li className="list-group-item border-0 p-0"><button className="btn btn-sm btn-verdeAgua w-100" onClick={() => { setOpenMenuFor(null); c.idCliente && handleReactivar(c.idCliente); }}>Reactivar</button></li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
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
      {historialVisible && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-clock-history me-2"></i>Historial de Órdenes</h5>
                <button className="btn-close" onClick={() => setHistorialVisible(false)}></button>
              </div>
              <div className="modal-body">
                {historialOrdenes.length === 0 ? (
                  <div className="text-muted">No se encontraron órdenes para este cliente.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Nro Orden</th>
                          <th>Fecha</th>
                          <th>Dispositivo</th>
                          <th>Diagnóstico</th>
                          <th>Precio Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialOrdenes.map(o => (
                          <tr key={o.nroDeOrden}>
                            <td>{o.nroDeOrden}</td>
                            <td>{o.fecha}</td>
                            <td>{o.dispositivo_info}</td>
                            <td>{o.diagnostico}</td>
                            <td>{o.precioTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-dorado" onClick={() => setHistorialVisible(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

