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
    idUsuario: "",
    nombreUsuario: "",
    password: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [formMode, setFormMode] = useState(""); // "consultar" | "modificar" | "agregar" | ""
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/usuarios/?activos=${!mostrarInactivos}`)
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(() => setMensaje("Error al cargar usuarios"));
  }, [mostrarInactivos]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validarUsuario(form) {
    if (!form.idUsuario || String(form.idUsuario).trim().length < 1) return "El ID de usuario es obligatorio.";
    if (!form.nombreUsuario || form.nombreUsuario.trim().length < 3) return "El nombre de usuario es obligatorio y debe tener al menos 3 caracteres.";
    if (formMode !== "consultar" && (!form.password || form.password.trim().length < 6)) return "La contraseña es obligatoria y debe tener al menos 6 caracteres.";
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") return "El estado es obligatorio.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const error = validarUsuario(form);
    if (error) {
      setMensaje(error);
      return;
    }
    fetch(`${API_URL}/usuarios/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ idUsuario: "", nombreUsuario: "", password: "", activo: 1 });
        setMostrarFormulario(false);
        setFormMode("");
        fetch(`${API_URL}/usuarios/?activos=${!mostrarInactivos}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario agregado correctamente.");
      });
  }

  function handleDelete(idUsuario) {
    if (!window.confirm("¿Seguro que desea eliminar este usuario?")) return;
    fetch(`${API_URL}/usuarios/${idUsuario}`, { method: "DELETE" })
      .then(() => {
        fetch(`${API_URL}/usuarios/?activos=${!mostrarInactivos}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario eliminado correctamente.");
      });
  }

  function handleEdit(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ ...usuario, password: "" });
    setFormMode("modificar");
    setMostrarFormulario(true);
  }

  function handleConsultar(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ ...usuario, password: "" });
    setFormMode("consultar");
    setMostrarFormulario(true);
  }

  function handleAgregar() {
    setForm({ idUsuario: "", nombreUsuario: "", password: "", activo: 1 });
    setEditId(null);
    setFormMode("agregar");
    setMostrarFormulario(true);
    setMensaje("");
  }

  function handleCancelar() {
    setMostrarFormulario(false);
    setEditId(null);
    setFormMode("");
    setForm({ idUsuario: "", nombreUsuario: "", password: "", activo: 1 });
    setMensaje("");
  }

  function handleUpdate(e) {
    e.preventDefault();
    const error = validarUsuario(form);
    if (error) {
      setMensaje(error);
      return;
    }
    fetch(`${API_URL}/usuarios/${form.idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setEditId(null);
        setForm({ idUsuario: "", nombreUsuario: "", password: "", activo: 1 });
        setMostrarFormulario(false);
        setFormMode("");
        fetch(`${API_URL}/usuarios/?activos=${!mostrarInactivos}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario modificado correctamente.");
      });
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0">Gestión de Usuarios</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(v => !v)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
                </button>
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={handleAgregar}
                >
                  <i className="bi bi-plus-lg"></i> Agregar usuario
                </button>
              </div>
            </div>
            <div className="card-body">
              {mostrarFormulario && (
                <form onSubmit={formMode === "modificar" ? handleUpdate : handleSubmit} className="form-container mb-3">
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-badge me-2"></i>Datos de usuario
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>ID Usuario</label>
                          <input
                            name="idUsuario"
                            placeholder="ID Usuario"
                            value={form.idUsuario}
                            onChange={handleChange}
                            className="form-control"
                            required
                            disabled={formMode === "modificar" || formMode === "consultar"}
                            readOnly={formMode === "consultar"}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Nombre de usuario</label>
                          <input
                            name="nombreUsuario"
                            placeholder="Nombre de usuario"
                            value={form.nombreUsuario}
                            onChange={handleChange}
                            className="form-control"
                            required
                            readOnly={formMode === "consultar"}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-key me-2"></i>Contraseña</label>
                          <input
                            name="password"
                            type="password"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={handleChange}
                            className="form-control"
                            required={formMode !== "consultar"}
                            readOnly={formMode === "consultar"}
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select
                            name="activo"
                            value={form.activo}
                            onChange={handleChange}
                            className="form-select"
                            disabled={formMode === "consultar"}
                          >
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
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    {formMode !== "consultar" && (
                      <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige, fontWeight: 600, borderRadius: "8px" }}>
                        <i className="bi bi-save me-1"></i>{formMode === "modificar" ? "Actualizar" : "Agregar"}
                      </button>
                    )}
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }} onClick={handleCancelar}>
                      <i className="bi bi-x-circle me-1"></i>Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="table-responsive mt-4">
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
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(u)}>
                            <i className="bi bi-eye"></i> Consultar
                          </button>
                          <button className="btn btn-sm me-1" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleEdit(u)}>
                            <i className="bi bi-pencil-square"></i> Modificar
                          </button>
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                            onClick={() => handleDelete(u.idUsuario)}>
                            <i className="bi bi-x-circle"></i> Eliminar
                          </button>
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
    </div>
  );
}
