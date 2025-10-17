import React, { useEffect, useState, useCallback } from "react";
import MenuLateral from './MenuLateral';
import { usePermission } from '../auth/PermissionContext';
import { hasPermission } from '../utils/permissions';
import ConfirmModal from './ConfirmModal';

const API_URL = "http://localhost:5000/usuarios";

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

export default function Usuarios() {
  const permCtx = usePermission();
  const identity = permCtx ? permCtx.identity : null;
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    idUsuario: "",
    nombreUsuario: "",
    contraseña: ""
  });
  const [editId, setEditId] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState("alta"); // "alta" | "modificar" | "consultar"
  const [formErrors, setFormErrors] = useState({});

  const fetchUsuarios = useCallback(() => {
    fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(_err => { console.warn('Usuarios: fetch usuarios error', _err); setMensaje("Error al cargar usuarios"); });
  }, [mostrarInactivos]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors(validarUsuario({ ...form, [e.target.name]: e.target.value }));
  };

  function validarUsuario(form) {
    const errors = {};
    if (!form.nombreUsuario || form.nombreUsuario.trim().length < 3) errors.nombreUsuario = "El nombre de usuario es obligatorio y debe tener al menos 3 caracteres.";
    if (modalModo === "alta" && (!form.contraseña || form.contraseña.length < 6)) errors.contraseña = "La contraseña es obligatoria y debe tener al menos 6 caracteres.";
    if (modalModo === "modificar" && form.contraseña && form.contraseña.length < 6) errors.contraseña = "La contraseña debe tener al menos 6 caracteres si se modifica.";
    return errors;
  }

  function handleAgregar() {
    setForm({ idUsuario: "", nombreUsuario: "", contraseña: "" });
    setEditId(null);
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
  }

  function handleEdit(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ idUsuario: usuario.idUsuario, nombreUsuario: usuario.nombreUsuario, contraseña: "" });
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
  }

  function handleConsultar(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ idUsuario: usuario.idUsuario, nombreUsuario: usuario.nombreUsuario, contraseña: "" });
    setModalModo("consultar");
    setModalVisible(true);
    setMensaje("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validarUsuario(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar: " + Object.values(errors).join(", "));
      return;
    }
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreUsuario: form.nombreUsuario,
        contraseña: form.contraseña
      })
    })
      .then(async res => {
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (err) {
            throw new Error("Respuesta del servidor no es JSON válido: " + err.message);
        }
        if (!res.ok) {
          throw new Error(data.error || "Error al crear usuario");
        }
        return data;
      })
      .then(() => {
        setForm({ idUsuario: "", nombreUsuario: "", contraseña: "" });
        setModalVisible(false);
        setEditId(null);
        setModalModo("alta");
        fetchUsuarios();
        setMensaje("Usuario agregado correctamente.");
      })
        .catch(_error => {
          console.warn('Usuarios: handleSubmit error', _error);
          setMensaje(_error.message);
        });
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validarUsuario(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar: " + Object.values(errors).join(", "));
      return;
    }
    try {
      const body = {
        nombreUsuario: form.nombreUsuario,
        ...(form.contraseña && { contraseña: form.contraseña })
      };
      const res = await fetch(`${API_URL}/${form.idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setModalVisible(false);
        setForm({
          idUsuario: "",
          nombreUsuario: "",
          contraseña: ""
        });
        fetchUsuarios();
      } else {
        const resultado = await res.json();
        setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido");
      }
    } catch (error) {
      setMensaje("Error de conexión: " + error.message);
    }
  }

  function handleDelete(idUsuario) {
    setConfirmDeleteUsuario({ open: true, id: idUsuario });
  }

  const [confirmDeleteUsuario, setConfirmDeleteUsuario] = useState({ open: false, id: null });

  const confirmDeleteUsuarioCancel = () => setConfirmDeleteUsuario({ open: false, id: null });

  const confirmDeleteUsuarioConfirm = () => {
    const id = confirmDeleteUsuario.id;
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(() => {
        fetchUsuarios();
        setMensaje("Usuario dado de baja correctamente.");
      })
      .catch(err => {
        setMensaje("Error al dar de baja usuario: " + err.message);
      })
      .finally(() => setConfirmDeleteUsuario({ open: false, id: null }));
  };

  // Reactivar usuario (cuando está inactivo)
  function handleReactivar(idUsuario) {
    fetch(`${API_URL}/${idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: 1 })
    })
      .then(() => {
        fetchUsuarios();
        setMensaje("Usuario reactivado correctamente.");
      })
      .catch(err => setMensaje("Error al reactivar usuario: " + (err.message || String(err))));
  }

  function handleCancelar() {
    setModalVisible(false);
    setEditId(null);
    setModalModo("alta");
    setForm({ idUsuario: "", nombreUsuario: "", contraseña: "" });
    setMensaje("");
  }

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-person-badge me-2"></i>Gestión de Usuarios</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dorado"
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
                </button>
                {/* Only show add button if user has permiso 8 (Registrar usuario) */}
                {hasPermission(identity, 8) ? (
                  <button
                    className="btn btn-verdeAgua"
                    onClick={handleAgregar}
                  >
                    <i className="bi bi-plus-lg"></i> Agregar usuario
                  </button>
                ) : null}
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID Usuario</th>
                      <th>Nombre de usuario</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.idUsuario}>
                        <td>{u.idUsuario}</td>
                        <td>{u.nombreUsuario}</td>
                        <td>{u.activo === 1 || u.activo === true ? "Activo" : "Inactivo"}</td>
                        <td>
                          {/* Consultar: permiso 11 */}
                          {hasPermission(identity, 11) ? (
                            <button className="btn btn-sm btn-verdeAgua fw-bold me-1"
                              onClick={() => handleConsultar(u)}>
                              <i className="bi bi-search"></i> Consultar
                            </button>
                          ) : null}

                          {/* Modificar: permiso 10 */}
                          {hasPermission(identity, 10) ? (
                            <button className={`btn btn-sm fw-bold me-1 ${u.activo === 1 ? 'btn-dorado' : 'btn-secondary'}`}
                              onClick={() => u.activo === 1 && handleEdit(u)} disabled={u.activo !== 1}>
                              <i className="bi bi-pencil-square"></i> Modificar
                            </button>
                          ) : null}

                          {/* Eliminar (dar de baja): permiso 9 */}
                          {u.activo === 1 ? (
                            hasPermission(identity, 9) ? (
                              <button className="btn btn-sm btn-rojo fw-bold"
                                onClick={() => handleDelete(u.idUsuario)}>
                                  <i className="bi bi-trash me-1"></i>Eliminar
                              </button>
                            ) : null
                          ) : (
                            hasPermission(identity, 8) ? (
                              <button className="btn btn-sm btn-verdeAgua fw-bold"
                                onClick={() => handleReactivar(u.idUsuario)}>
                                  <i className="bi bi-arrow-clockwise me-1"></i>Reactivar
                              </button>
                            ) : null
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usuarios.length === 0 && (
                  <div className="text-center text-muted py-4">No hay usuarios {mostrarInactivos ? "inactivos" : "activos"}.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Modal para alta, modificar y consultar */}
      {modalVisible && (
        <div className="modal show" style={{ display: "block", backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {modalModo === 'consultar'
                    ? <><i className="bi bi-search me-2"></i>Consultar usuario</>
                    : modalModo === 'modificar'
                    ? <><i className="bi bi-pencil-square me-2"></i>Modificar usuario</>
                    : <><i className="bi bi-plus-lg me-2"></i>Nuevo usuario</>}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={handleCancelar}
                ></button>
              </div>
              <div className="modal-body">
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
                      <i className="bi bi-person-badge me-2"></i>Datos de usuario
                    </legend>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        {/* ID Usuario removed from consult/modify modal per request */}
                        {/* División: Credenciales de acceso */}
                        <h6 className="fw-bold mt-3 mb-2 border-bottom pb-1">
                          <i className="bi bi-shield-lock me-2"></i>Credenciales de acceso
                        </h6>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person-fill me-2"></i>Nombre de usuario</label>
                          <input
                            name="nombreUsuario"
                            placeholder="Nombre de usuario"
                            value={form.nombreUsuario}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-control"
                            required
                            readOnly={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                          />
                          {formErrors.nombreUsuario && (
                            <div className="input-error-message">{formErrors.nombreUsuario}</div>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-key me-2"></i>Contraseña</label>
                          <input
                            name="contraseña"
                            type="password"
                            placeholder="Contraseña"
                            value={form.contraseña}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-control"
                            required={modalModo === "alta"}
                            readOnly={modalModo === "consultar"}
                            style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                          />
                          {editId && modalModo !== "consultar" && (
                            <small className="text-muted">Dejar vacío para no cambiar la contraseña</small>
                          )}
                          {formErrors.contraseña && (
                            <div className="input-error-message">{formErrors.contraseña}</div>
                          )}
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
                  <button className="btn btn-dorado fw-bold" onClick={handleCancelar}>
                    <i className="bi bi-x-circle me-1"></i>Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmDeleteUsuario.open}
        title="Confirmar baja"
        message="Se realizará una baja lógica del usuario. ¿Desea continuar?"
        onCancel={confirmDeleteUsuarioCancel}
        onConfirm={confirmDeleteUsuarioConfirm}
      />
    </div>
  );
}
