import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './SearchableSelect';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54545',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const API_URL = "http://localhost:5000/empleados";
const CARGOS_URL = "http://localhost:5000/cargos";
const USUARIOS_URL = "http://localhost:5000/usuarios";

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    idCargo: "",
    idUsuario: "",
    mail: "",
    telefono: "",
  });
  const [editId, setEditId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState(""); // "consultar" | "modificar" | "alta"
  const [mensaje, setMensaje] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [cargos, setCargos] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // To map ID to name
  const [usuariosParaDropdown, setUsuariosParaDropdown] = useState([]); // For the modal dropdown
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [clienteActual, setClienteActual] = useState(null);

  const fetchEmpleados = () => {
    const url = `${API_URL}?activos=${!mostrarInactivos}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setEmpleados(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar empleados"));
  };

  // Fetch data that changes based on filters
  useEffect(() => {
    fetchEmpleados();
  }, [mostrarInactivos]);

  // Fetch data that doesn't change often
  useEffect(() => {
    fetch(CARGOS_URL)
      .then(res => res.json())
      .then(data => setCargos(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar cargos"));
    
    fetch(USUARIOS_URL)
      .then(res => res.json())
      .then(data => setAllUsers(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar todos los usuarios"));
  }, []);


  const handleChange = e => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'idCargo' || name === 'idUsuario') {
      processedValue = Number(value);
    }
    setForm({ ...form, [name]: processedValue });
    setFormErrors(validarEmpleado({ ...form, [name]: processedValue }));
  };

  function validarEmpleado(form) {
    const errors = {};
    if (!form.nombre || form.nombre.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(form.nombre.trim())) errors.nombre = "El nombre es obligatorio, debe contener solo letras y espacios, y tener al menos 2 caracteres.";
    if (!form.apellido || form.apellido.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(form.apellido.trim())) errors.apellido = "El apellido es obligatorio, debe contener solo letras y espacios, y tener al menos 2 caracteres.";
    if (!form.idCargo) errors.idCargo = "Debe seleccionar un cargo.";
    if (!form.idUsuario) errors.idUsuario = "Debe seleccionar un usuario.";
    // mail opcional pero si se ingresa debe ser válido
    if (form.mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.mail)) errors.mail = "El email tiene un formato inválido.";
    // telefono opcional pero si se ingresa debe tener entre 6 y 20 caracteres y solo caracteres permitidos
    if (form.telefono && !/^[0-9\s+\-()]{6,20}$/.test(form.telefono)) errors.telefono = "El teléfono tiene un formato inválido.";
    return errors;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validarEmpleado(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalVisible(false);
        setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "" });
        fetchEmpleados();
      } else {
        const resultado = await res.json();
        setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido");
      }
    } catch (error) {
      setMensaje("Error de conexión");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validarEmpleado(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/${form.idEmpleado}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalVisible(false);
        setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "" });
        fetchEmpleados();
      } else {
        const resultado = await res.json();
        setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido");
      }
    } catch (error) {
      setMensaje("Error de conexión");
    }
  };

  const handleDelete = idEmpleado => {
    setConfirmDeleteEmpleado({ open: true, id: idEmpleado });
  };

  const [confirmDeleteEmpleado, setConfirmDeleteEmpleado] = useState({ open: false, id: null });

  const confirmDeleteEmpleadoCancel = () => setConfirmDeleteEmpleado({ open: false, id: null });

  const confirmDeleteEmpleadoConfirm = () => {
    const id = confirmDeleteEmpleado.id;
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(() => fetchEmpleados())
      .finally(() => setConfirmDeleteEmpleado({ open: false, id: null }));
  };

  const handleReactivar = idEmpleado => {
    fetch(`${API_URL}/${idEmpleado}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: 1 })
    })
      .then(() => {
        fetchEmpleados();
      });
  };

  function handleModificar(empleado) {
    setEditId(empleado.idEmpleado);
    setClienteActual(null);
    setForm(empleado);
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
    setFormErrors({});

    const currentUser = allUsers.find(u => u.idUsuario === empleado.idUsuario);
    fetch(`${USUARIOS_URL}?no_asignados=true`)
      .then(res => res.json())
      .then(unassignedUsers => {
        const finalUserList = [...unassignedUsers];
        if (currentUser && !unassignedUsers.some(u => u.idUsuario === currentUser.idUsuario)) {
          finalUserList.push(currentUser);
        }
        setUsuariosParaDropdown(finalUserList);
      });
  }

  function handleConsultar(empleado) {
    setClienteActual(empleado);
    setUsuariosParaDropdown(allUsers); // Ensure all users are available for display
    setModalModo('consultar');
    setModalVisible(true);
    setMensaje("");
  }

  function handleAgregar() {
    setClienteActual(null);
    setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "" });
    setEditId(null);
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
    setFormErrors({});
    fetch(`${USUARIOS_URL}?no_asignados=true`).then(res => res.json()).then(setUsuariosParaDropdown);
  }

  function handleCancelar() {
    setModalVisible(false);
    setClienteActual(null);
    setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "" });
    setMensaje("");
  }

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-people me-2"></i>Gestión de Empleados</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dorado"
                  onClick={() => setMostrarInactivos(v => !v)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
                </button>
                <button
                  className="btn btn-verdeAgua"
                  onClick={handleAgregar}
                >
                  <i className="bi bi-plus-lg"></i> Agregar empleado
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive" style={{ overflow: 'visible' }}>
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Cargo</th>
                      <th>Usuario</th>
                      <th>Mail</th>
                      <th>Teléfono</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map(e => (
                      <tr key={e.idEmpleado}>
                        <td>{e.nombre}</td>
                        <td>{e.apellido}</td>
                        <td>{cargos.find(c => c.idCargo === e.idCargo)?.descripcion || 'N/A'}</td>
                        <td>{allUsers.find(u => u.idUsuario === e.idUsuario)?.nombreUsuario || 'N/A'}</td>
                        <td>{e.mail || ''}</td>
                        <td>{e.telefono || ''}</td>
                        <td>{e.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(e)}
                          >
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button
                            className={`btn btn-sm fw-bold me-1 ${e.activo === 1 ? 'btn-dorado' : 'btn-secondary'}`}
                            onClick={() => e.activo === 1 && handleModificar(e)}
                            disabled={e.activo !== 1}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          {e.activo === 1 ? (
                            <button
                              className="btn btn-sm btn-rojo fw-bold"
                              onClick={() => handleDelete(e.idEmpleado)}
                            >
                              <i className="bi bi-trash me-1"></i>Eliminar
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-verdeAgua fw-bold"
                              onClick={() => handleReactivar(e.idEmpleado)}
                            >
                              <i className="bi bi-arrow-clockwise me-1"></i>Reactivar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {empleados.length === 0 && (
                  <div className="text-center text-muted py-4">No hay empleados registrados.</div>
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
                    ? "Consultar empleado"
                    : modalModo === 'modificar'
                    ? "Modificar empleado"
                    : "Nuevo empleado"}
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
                      <i className="bi bi-person-badge me-2"></i>Datos del empleado
                    </legend>
                    {/* División: Datos personales */}
                    <h6 className="fw-bold mt-3 mb-2 border-bottom pb-1">
                      <i className="bi bi-person-lines-fill me-2"></i>Datos personales
                    </h6>
                    <div className="row g-4">
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
                      </div>
                      <div className="col-12 col-md-6">
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
                    {/* División: Datos laborales */}
                    <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1">
                      <i className="bi bi-briefcase me-2"></i>Datos laborales
                    </h6>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-briefcase me-2"></i>Cargo
                          </label>
                          {modalModo === "consultar" ? (
                            <input
                              type="text"
                              className="form-control"
                              value={cargos.find(c => c.idCargo === clienteActual?.idCargo)?.descripcion || ""}
                              readOnly
                              style={{ backgroundColor: '#dee2e6' }}
                            />
                          ) : (
                            <SearchableSelect
                              options={cargos}
                              value={cargos.find(c => c.idCargo === form.idCargo) || ""}
                              onChange={(selected) => setForm(prev => ({ ...prev, idCargo: selected ? selected.idCargo : "" }))}
                              placeholder="Seleccione un cargo"
                              displayFormat={(c) => c.descripcion}
                              required
                            />
                          )}
                          {formErrors.idCargo && <div className="input-error-message">{formErrors.idCargo}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-person-badge me-2"></i>Usuario
                          </label>
                          {modalModo === "consultar" ? (
                            <input
                              type="text"
                              className="form-control"
                              value={usuariosParaDropdown.find(u => u.idUsuario === clienteActual?.idUsuario)?.nombreUsuario || ""}
                              readOnly
                              style={{ backgroundColor: '#dee2e6' }}
                            />
                          ) : (
                            <SearchableSelect
                              options={usuariosParaDropdown}
                              value={usuariosParaDropdown.find(u => u.idUsuario === form.idUsuario) || ""}
                              onChange={(selected) => setForm(prev => ({ ...prev, idUsuario: selected ? selected.idUsuario : "" }))}
                              placeholder="Seleccione un usuario"
                              displayFormat={(u) => u.nombreUsuario}
                              required
                            />
                          )}
                          {formErrors.idUsuario && <div className="input-error-message">{formErrors.idUsuario}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-envelope me-2"></i>Mail
                          </label>
                          <input
                            type="email"
                            name="mail"
                            value={modalModo === "consultar" ? clienteActual?.mail ?? "" : form.mail}
                            onChange={handleChange}
                            className="form-control"
                            readOnly={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                          />
                          {formErrors.mail && <div className="input-error-message">{formErrors.mail}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label>
                            <i className="bi bi-telephone me-2"></i>Teléfono
                          </label>
                          <input
                            type="text"
                            name="telefono"
                            value={modalModo === "consultar" ? clienteActual?.telefono ?? "" : form.telefono}
                            onChange={handleChange}
                            className="form-control"
                            readOnly={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                          />
                          {formErrors.telefono && <div className="input-error-message">{formErrors.telefono}</div>}
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
      <ConfirmModal
        open={confirmDeleteEmpleado.open}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este empleado?"
        onCancel={confirmDeleteEmpleadoCancel}
        onConfirm={confirmDeleteEmpleadoConfirm}
      />
    </div>
  );
}