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
    password: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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


  function validarUsuario(form) {
  if (!form.idUsuario || form.idUsuario.trim().length < 4) 
    return "El usuario es obligatorio y debe tener al menos 4 caracteres.";
  if (!form.password && !editId) // solo obligatorio al crear
    return "La contraseña es obligatoria y debe tener al menos 6 caracteres.";
  if (form.password && form.password.trim().length < 6)
    return "La contraseña debe tener al menos 6 caracteres.";
  if (form.activo !== 0 && form.activo !== 1)
    return "El estado es obligatorio.";
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
        setForm({ idUsuario: "", password: "", activo: 1 });
        fetch(`/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario agregado correctamente.");
      })
      .catch(err => {
        setMensaje(err.message);
      });

  }

  function handleDelete(idUsuario) {
  // Pregunta de confirmación antes de eliminar
  const confirmar = window.confirm(
    "Se realizará una baja lógica del usuario. ¿Desea continuar?"
  );

  if (!confirmar) return; // Sale si el usuario cancela

  fetch(`${API_URL}/usuarios/${idUsuario}`, { method: "DELETE" })
    .then(() => {
      fetch(`${API_URL}/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
        .then(res => res.json())
        .then(data => setUsuarios(data));
      setMensaje("Usuario dado de baja correctamente.");
      setTipoMensaje("exito");
    })
    .catch(err => {
      setMensaje("Error al dar de baja usuario: " + err.message);
      setTipoMensaje("error");
    });
}


  function handleEdit(usuario) {
    setEditId(usuario.idUsuario);
    setMostrarFormulario(true);
    setForm({ idUsuario: usuario.idUsuario, password: "", activo: Number(usuario.activo)});
  }

function handleUpdate(e) {
  e.preventDefault();

  const payload = { activo: form.activo }; // ya es número
  if (form.password && form.password.trim() !== "") {
    payload.password = form.password; // opcional
  }

  fetch(`${API_URL}/usuarios/${form.idUsuario}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(() => {
      setEditId(null);
      setForm({ idUsuario: "", password: "", activo: 1 });
      fetch(`${API_URL}/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
        .then(res => res.json())
        .then(data => setUsuarios(data));
      setMensaje("Usuario modificado correctamente.");
    })
    .catch(err => setMensaje(err.message));
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
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
                </button>
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => {
                    setMostrarFormulario(true);
                    setEditId(null);
                    setForm({ idUsuario: "", password: "", activo: 1 });
                    setMensaje("");
                  }}
                >
                  <i className="bi bi-plus-lg"></i> Agregar usuario
                </button>
              </div>
            </div>
            <div className="card-body">
              {mostrarFormulario && (
                <form onSubmit={editId ? handleUpdate : handleSubmit} className="form-container mb-3">
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-badge me-2"></i>Datos de usuario
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>ID Usuario</label>
                          <input name="idUsuario" placeholder="ID Usuario" value={form.idUsuario} onChange={handleChange} className="form-control" required disabled={!!editId} />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-key me-2"></i>Contraseña</label>
                          <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className="form-control"/>
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
                          <select name="activo" value={Number(form.activo)} onChange={handleChange} className="form-select">
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
                    <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige, fontWeight: 600, borderRadius: "8px" }}>
                      <i className="bi bi-save me-1"></i>{editId ? "Actualizar" : "Agregar"}
                    </button>
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }}
                      onClick={() => { setMostrarFormulario(false); setEditId(null); setForm({ idUsuario: "", password: "", activo: 1 }); setMensaje(""); }}>
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
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.idUsuario}>
                        <td>{u.idUsuario}</td>
                        <td>{u.activo ? "Sí" : "No"}</td>
                        <td>
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleEdit(u)}>
                            <span title="Editar"><i className="bi bi-pencil-square"></i></span> Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                            onClick={() => handleDelete(u.idUsuario)}>
                            <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
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
