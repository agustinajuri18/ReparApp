import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    idCargo: "",
    idUsuario: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Cargar empleados
  useEffect(() => {
    fetch(`http://localhost:5000/empleados/${mostrarInactivos ? "?activos=false" : ""}`)
      .then(res => res.json())
      .then(data => setEmpleados(data))
      .catch(() => setMensaje("Error al cargar empleados"));
  }, [mostrarInactivos]);

  // Cargar cargos desde la base de datos
  useEffect(() => {
    fetch("http://localhost:5000/cargos/")
      .then(res => res.json())
      .then(data => setCargos(data))
      .catch(() => setMensaje("Error al cargar cargos"));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validarEmpleado(form) {
    if (!form.nombre || form.nombre.trim().length < 2)
      return "El nombre es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.apellido || form.apellido.trim().length < 2)
      return "El apellido es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.idCargo || form.idCargo.toString().trim() === "")
      return "El cargo es obligatorio.";  
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1")
      return "El estado es obligatorio.";
    return null;
  }


  function handleSubmit(e) {
    e.preventDefault();
    const error = validarEmpleado(form);
    if (error) {
      setMensaje(error);
      return;
    }
    fetch("http://localhost:5000/empleados/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "", activo: 1 });
        setMostrarFormulario(false);
        setMensaje("Empleado agregado correctamente.");
        fetch("http://localhost:5000/empleados/")
          .then(res => res.json())
          .then(data => setEmpleados(data))
          .catch(() => setMensaje("Error al cargar empleados"));
      });
  }

  function handleDelete(idEmpleado) {
    fetch(`http://localhost:5000/empleados/${idEmpleado}/`, { method: "DELETE" })
      .then(() => {
        fetch("http://localhost:5000/empleados/")
          .then(res => res.json())
          .then(data => setEmpleados(data))
          .catch(() => setMensaje("Error al cargar empleados"));
      });
  }

  function handleEdit(empleado) {
    setEditId(empleado.idEmpleado);
    setForm(empleado);
  }

  function handleUpdate(e) {
    e.preventDefault();
    fetch(`http://localhost:5000/empleados/${form.idEmpleado}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setEditId(null);
        setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "", activo: 1 });
        setMensaje("Empleado modificado correctamente.");
        fetch("http://localhost:5000/empleados/")
          .then(res => res.json())
          .then(data => setEmpleados(data))
          .catch(() => setMensaje("Error al cargar empleados"));
      });
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0">Gestión de Empleados</h4>
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
                  onClick={() => setMostrarFormulario(true)}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Modal para agregar empleado */}
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="form-container mb-3">
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-badge me-2"></i>Datos personales
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Nombre</label>
                          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required className="form-control" placeholder="Nombre" />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Apellido</label>
                          <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required className="form-control" placeholder="Apellido" />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-briefcase me-2"></i>Datos laborales
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-briefcase me-2"></i>Cargo</label>
                          <select name="idCargo" value={form.idCargo} onChange={handleChange} className="form-select" required>
                            <option value="">Seleccione cargo</option>
                            {cargos.map(c => (
                              <option key={c.idCargo} value={c.idCargo}>{c.nombreCargo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person-badge me-2"></i>ID Usuario</label>
                          <input type="text" name="idUsuario" value={form.idUsuario} onChange={handleChange} required className="form-control" placeholder="Usuario" />
                        </div>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select name="activo" value={form.activo} onChange={handleChange} className="form-select">
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
                      <i className="bi bi-save me-1"></i>Guardar
                    </button>
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }} onClick={() => setMostrarFormulario(false)}>
                      <i className="bi bi-x-circle me-1"></i>Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Modal para consultar/editar */}
              {editId && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Modificar Empleado</h5>
                        <button type="button" className="btn-close" onClick={() => { setEditId(null); setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "", activo: 1 }); }}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleUpdate}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="form-control" placeholder="Nombre"
                                disabled={editId === null}
                              />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="apellido" value={form.apellido} onChange={handleChange} className="form-control" placeholder="Apellido"
                                disabled={editId === null}
                              />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <select
                                name="idCargo"
                                value={form.idCargo}
                                onChange={handleChange}
                                className="form-select"
                                required
                                disabled={editId === null}
                              >
                                <option value="">Seleccione cargo</option>
                                {cargos.map(c => (
                                  <option key={c.idCargo} value={c.idCargo}>{c.nombreCargo}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="idUsuario" value={form.idUsuario} onChange={handleChange} className="form-control" placeholder="Usuario"
                                disabled={editId === null}
                              />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <select name="activo" value={form.activo} onChange={handleChange} className="form-select"
                                disabled={editId === null}
                              >
                                <option value={1}>Activo</option>
                                <option value={0}>Inactivo</option>
                              </select>
                            </div>
                          </div>
                          {mensaje && (
                            <div className="alert alert-danger" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}>
                              {mensaje}
                            </div>
                          )}
                          <div className="d-flex justify-content-end">
                            <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>Guardar</button>
                            <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={() => { setEditId(null); setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "", activo: 1 }); }}>Cancelar</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Cargo</th>
                      <th>ID Usuario</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map(e => (
                      <tr key={e.idEmpleado}>
                        <td>{e.idEmpleado}</td>
                        <td>{e.nombre}</td>
                        <td>{e.apellido}</td>
                        <td>
                          {cargos.find(c => c.idCargo === e.idCargo)?.nombreCargo || e.idCargo}
                        </td>
                        <td>{e.idUsuario}</td>
                        <td>{e.activo ? "Sí" : "No"}</td>
                        <td>
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleEdit(e)}>
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          {Number(e.activo) == 1 && (
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                            onClick={() => handleDelete(e.idEmpleado)}>
                            <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
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
    </div>
  );
}

export default Empleados;
