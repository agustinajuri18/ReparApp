import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    idUsuario: "",
    password: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch(`/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(() => setMensaje("Error al cargar usuarios"));
  }, [mostrarInactivos]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch("/usuarios/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ idUsuario: "", password: "", activo: 1 });
        fetch(`/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario agregado correctamente.");
      });
  }

  function handleDelete(idUsuario) {
    fetch(`/usuarios/${idUsuario}`, { method: "DELETE" })
      .then(() => {
        fetch(`/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));
        setMensaje("Usuario eliminado correctamente.");
      });
  }

  function handleEdit(usuario) {
    setEditId(usuario.idUsuario);
    setForm({ idUsuario: usuario.idUsuario, password: "", activo: usuario.activo });
  }

  function handleUpdate(e) {
    e.preventDefault();
    fetch(`/usuarios/${form.idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setEditId(null);
        setForm({ idUsuario: "", password: "", activo: 1 });
        fetch(`/usuarios/?activos=${mostrarInactivos ? "false" : "true"}`)
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
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver también inactivos"}
                </button>
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setForm({ idUsuario: "", password: "", activo: 1 })}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>{mensaje}</div>
              )}
              <form onSubmit={editId ? handleUpdate : handleSubmit}>
                <div className="row">
                  <div className="col-12 col-md-4 mb-2">
                    <input name="idUsuario" placeholder="ID Usuario" value={form.idUsuario} onChange={handleChange} className="form-control" required disabled={!!editId} />
                  </div>
                  <div className="col-12 col-md-4 mb-2">
                    <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="col-12 col-md-4 mb-2">
                    <select name="activo" value={form.activo} onChange={handleChange} className="form-select">
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>{editId ? "Actualizar" : "Agregar"}</button>
                  {editId && <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={() => { setEditId(null); setForm({ idUsuario: "", password: "", activo: 1 }); }}>Cancelar</button>}
                </div>
              </form>
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

export default Usuarios;
