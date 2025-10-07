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
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    idCargo: "",
    idUsuario: "",
    activo: 1
  });
  const [editId, setEditId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState(""); // "consultar" | "modificar" | "alta"
  const [mensaje, setMensaje] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Cargar empleados según activos/inactivos
  useEffect(() => {
    fetch(`http://localhost:5000/empleados/${mostrarInactivos ? "?activos=false" : ""}`)
      .then(res => res.json())
      .then(data => setEmpleados(data))
      .catch(() => setMensaje("Error al cargar empleados"));
  }, [mostrarInactivos]);

  // Cargar cargos
  useEffect(() => {
    fetch("http://localhost:5000/cargos/")
      .then(res => res.json())
      .then(data => setCargos(data))
      .catch(() => setMensaje("Error al cargar cargos"));
  }, []);

  // Cargar usuarios activos
  useEffect(() => {
    fetch("http://localhost:5000/usuarios/?activos=true")
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(() => setMensaje("Error al cargar usuarios"));
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
        setModalVisible(false);
        setModalModo("");
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

  function handleModificar(empleado) {
    setEditId(empleado.idEmpleado);
    setForm(empleado);
    setModalModo("modificar");
    setModalVisible(true);
    setMensaje("");
  }

  function handleConsultar(empleado) {
    setEditId(empleado.idEmpleado);
    setForm(empleado);
    setModalModo("consultar");
    setModalVisible(true);
    setMensaje("");
  }

  function handleAgregar() {
    setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "", activo: 1 });
    setEditId(null);
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
  }

  function handleCancelar() {
    setModalVisible(false);
    setEditId(null);
    setModalModo("");
    setForm({ nombre: "", apellido: "", idCargo: "", idUsuario: "", activo: 1 });
    setMensaje("");
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
        setModalVisible(false);
        setModalModo("");
        setMensaje("Empleado modificado correctamente.");
        fetch("http://localhost:5000/empleados/")
          .then(res => res.json())
          .then(data => setEmpleados(data))
          .catch(() => setMensaje("Error al cargar empleados"));
      });
  }

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
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
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Cargo</th>
                      <th>Usuario</th>
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
                        <td>{cargos.find(c => c.idCargo === e.idCargo)?.nombreCargo || e.idCargo}</td>
                        <td>{usuarios.find(u => u.idUsuario === e.idUsuario)?.nombreUsuario || e.idUsuario}</td>
                        <td>{e.activo ? "Sí" : "No"}</td>
                        <td>
                          <button className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(e)}>
                            <i className="bi bi-eye"></i> Consultar
                          </button>
                          <button className="btn btn-sm btn-dorado fw-bold me-1"
                            onClick={() => handleModificar(e)}>
                            <i className="bi bi-pencil-square"></i> Modificar
                          </button>
                          {Number(e.activo) === 1 && (
                            <button className="btn btn-sm btn-rojo fw-bold"
                              onClick={() => handleDelete(e.idEmpleado)}>
                              <i className="bi bi-x-circle"></i> Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {empleados.length === 0 && (
                  <div className="text-center text-muted py-4">No hay empleados {mostrarInactivos ? "inactivos" : "activos"}.</div>
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
                    ? "Consultar empleado"
                    : modalModo === 'modificar'
                    ? "Modificar empleado"
                    : "Nuevo empleado"}
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
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-badge me-2"></i>Datos personales
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Nombre</label>
                          <input
                            type="text"
                            name="nombre"
                            value={form.nombre}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            required
                            className="form-control"
                            placeholder="Nombre"
                            readOnly={modalModo === "consultar"}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Apellido</label>
                          <input
                            type="text"
                            name="apellido"
                            value={form.apellido}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            required
                            className="form-control"
                            placeholder="Apellido"
                            readOnly={modalModo === "consultar"}
                          />
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
                          <select
                            name="idCargo"
                            value={form.idCargo ?? ""}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-select"
                            required
                            disabled={modalModo === "consultar"}
                          >
                            <option value="">Seleccione cargo</option>
                            {cargos.map(c => (
                              <option key={c.idCargo} value={c.idCargo}>{c.nombreCargo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person-badge me-2"></i>ID Usuario</label>
                          <select
                            name="idUsuario"
                            value={form.idUsuario ?? ""}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-select"
                            required
                            disabled={modalModo === "consultar"}
                          >
                            <option value="">Seleccione usuario</option>
                            {usuarios.map(u => (
                              <option key={u.idUsuario} value={u.idUsuario}>{u.nombreUsuario}</option>
                            ))}
                          </select>
                        </div>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select
                            name="activo"
                            value={form.activo ?? ""}
                            onChange={modalModo === "consultar" ? undefined : handleChange}
                            className="form-select"
                            disabled={modalModo === "consultar"}
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
                    {(modalModo === "modificar" || modalModo === "alta") && (
                      <button type="submit" className="btn btn-azul fw-bold">
                        <i className="bi bi-save me-1"></i>{modalModo === "modificar" ? "Actualizar" : "Agregar"}
                      </button>
                    )}
                    <button type="button" className="btn btn-dorado fw-bold" onClick={handleCancelar}>
                      <i className="bi bi-x-circle me-1"></i>Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Empleados;
