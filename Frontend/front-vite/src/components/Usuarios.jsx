import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000";

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombreUsuario: "",
    password: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState("alta"); // "alta" | "modificar" | "consultar"

  useEffect(() => {
    fetch(`${API_URL}/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(() => setMensaje("Error al cargar usuarios"));
  }, [mostrarInactivos]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "activo" ? Number(value) : value
    });
  }

  function validarUsuario(form, esEdicion = false) {
    if (!form.nombreUsuario || !/^[A-Za-z0-9_]{3,30}$/.test(form.nombreUsuario.trim()))
      return "El nombre de usuario es obligatorio (3-30 letras, números o guión bajo).";
    if (!esEdicion && (!form.password || form.password.trim().length < 6 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)))
      return "La contraseña es obligatoria, mínimo 6 caracteres, debe contener letras y números.";
    if (esEdicion && form.password && (form.password.trim().length < 6 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)))
      return "La contraseña debe tener mínimo 6 caracteres, letras y números.";
    if (form.activo !== 0 && form.activo !== 1)
      return "El estado es obligatorio.";
    return null;
  }

  function handleAgregar() {
    setForm({ nombreUsuario: "", password: "", activo: 1 });
    setEditId(null);
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
  }

  function handleEdit(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ nombreUsuario: usuario.nombreUsuario, password: "", activo: Number(usuario.activo) });
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
  }

  function handleConsultar(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ nombreUsuario: usuario.nombreUsuario, password: "", activo: Number(usuario.activo) });
    setModalModo("consultar");
    setModalVisible(true);
    setMensaje("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const error = validarUsuario(form, false);
    if (error) {
      setMensaje(error);
      return;
    }
    fetch(`${API_URL}/usuarios/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(async res => {
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (err) {
          throw new Error("Respuesta del servidor no es JSON válido");
        }
        if (!res.ok) {
          throw new Error(data.error || "Error al crear usuario");
        }
        return data;
      })
      .then(() => {
        setForm({ nombreUsuario: "", password: "", activo: 1 });
        setModalVisible(false);
        setEditId(null);
        setModalModo("alta");
        fetch(`${API_URL}/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario agregado correctamente.");
      })
      .catch(err => {
        setMensaje(err.message);
      });
  }

  function handleUpdate(e) {
    e.preventDefault();
    const error = validarUsuario(form, true);
    if (error) {
      setMensaje(error);
      return;
    }
    const payload = {
      nombreUsuario: form.nombreUsuario,
      activo: form.activo
    };
    if (form.password && form.password.trim() !== "") {
      payload.password = form.password;
    }
    fetch(`${API_URL}/usuarios/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        setEditId(null);
        setForm({ nombreUsuario: "", password: "", activo: 1 });
        setModalVisible(false);
        setModalModo("alta");
        fetch(`${API_URL}/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario modificado correctamente.");
      })
      .catch(err => setMensaje(err.message));
  }

  function handleDelete(idUsuario) {
    const confirmar = window.confirm(
      "Se realizará una baja lógica del usuario. ¿Desea continuar?"
    );
    if (!confirmar) return;
    fetch(`${API_URL}/usuarios/${idUsuario}`, { method: "DELETE" })
      .then(() => {
        fetch(`${API_URL}/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario dado de baja correctamente.");
      })
      .catch(err => {
        setMensaje("Error al dar de baja usuario: " + err.message);
      });
  }

  function handleCancelar() {
    setModalVisible(false);
    setEditId(null);
    setModalModo("alta");
    setForm({ nombreUsuario: "", password: "", activo: 1 });
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
                <button
                  className="btn btn-verdeAgua"
                  onClick={handleAgregar}
                >
                  <i className="bi bi-plus-lg"></i> Agregar usuario
                </button>
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
                        <td>{u.activo ? "Sí" : "No"}</td>
                        <td>
                          <button className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(u)}>
                            <i className="bi bi-search"></i> Consultar
                          </button>
                          <button className="btn btn-sm btn-dorado fw-bold me-1"
                            onClick={() => handleEdit(u)}>
                            <i className="bi bi-pencil-square"></i> Modificar
                          </button>
                          {u.activo === 1 && (
                            <button className="btn btn-sm btn-rojo fw-bold"
                              onClick={() => handleDelete(u.idUsuario)}>
                              <i className="bi bi-x-circle"></i> Eliminar
                            </button>
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
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog" style={{ maxWidth: "100vw" }}>
            <div className="modal-content" style={{ width: "100vw", maxWidth: "100vw" }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {modalModo === 'consultar'
                    ? "Consultar usuario"
                    : modalModo === 'modificar'
                    ? "Modificar usuario"
                    : "Nuevo usuario"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={handleCancelar}
                ></button>
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
                      <i className="bi bi-person-badge me-2"></i>Datos de usuario
                    </legend>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        {editId && (
                          <div className="mb-3">
                            <label className="fw-semibold"><i className="bi bi-person me-2"></i>ID Usuario</label>
                            <input value={editId} className="form-control" disabled readOnly />
                          </div>
                        )}
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
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-key me-2"></i>Contraseña</label>
                          <input
                            name="password"
                            type="password"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-control"
                            required={modalModo === "alta"}
                            readOnly={modalModo === "consultar"}
                          />
                          {editId && modalModo !== "consultar" && (
                            <small className="text-muted">Dejar vacío para no cambiar la contraseña</small>
                          )}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select
                            name="activo"
                            value={Number(form.activo)}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-select"
                            disabled={modalModo === "consultar"}
                          >
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
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
