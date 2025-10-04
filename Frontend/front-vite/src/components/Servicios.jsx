import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({
    codigo: "",
    descripcion: "",
    precioBase: "",
    activo: 1
  });
  const [editCodigo, setEditCodigo] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch(`/servicios/?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.json())
      .then(data => setServicios(data))
      .catch(() => setMensaje("Error al cargar servicios"));
  }, [mostrarInactivos]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch("/servicios/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
        setMostrarFormulario(false);
        fetch(`/servicios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setServicios(data));
      });
  }

  function handleDelete(codigo) {
    fetch(`/servicios/${codigo}`, { method: "DELETE" })
      .then(() => {
        fetch(`/servicios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setServicios(data));
      });
  }

  function handleEdit(servicio) {
    setEditCodigo(servicio.codigo);
    setMostrarFormulario(true);
    setForm(servicio);
  }

  function handleUpdate(e) {
    e.preventDefault();
    fetch(`/servicios/${form.codigo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setEditCodigo(null);
        setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
        setMostrarFormulario(false);
        fetch(`/servicios/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setServicios(data));
      });
  }

  function handleCancel() {
    setMostrarFormulario(false);
    setEditCodigo(null);
    setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0">Gestión de Servicios</h4>
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
                  onClick={() => setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 })}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>{mensaje}</div>
              )}
              {!mostrarFormulario && (
                <div className="d-flex justify-content-end">
                  <button
                    className="btn"
                    style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                    onClick={() => {
                      setMostrarFormulario(true);
                      setEditCodigo(null);
                      setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
                    }}
                  >
                    <i className="bi bi-plus-lg"></i> Agregar servicio
                  </button>
                </div>
              )}
              {mostrarFormulario && (
                <form onSubmit={editCodigo ? handleUpdate : handleSubmit} style={{ marginTop: "16px" }}>
                  <div className="row">
                    <h4>Datos del Servicio</h4>
                  </div>
                  <div className="row mt-3 mb-3">
                    <div className='input-group'>
                      <span className='input-group-text'>Código</span>
                      <input type="number" name="codigo" value={form.codigo} onChange={handleChange} className="form-control" placeholder="Código" required disabled={!!editCodigo} />
                    </div>
                  </div>
                  <div className="row mt-3 mb-3">
                    <div className='input-group'>
                      <span className='input-group-text'>Descripción</span>
                      <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} className="form-control" placeholder="Descripción" required />
                    </div>
                  </div>
                  <div className="row mt-3 mb-3">
                    <div className='input-group'>
                      <span className='input-group-text'>$</span>
                      <input type="number" name="precioBase" value={form.precioBase} onChange={handleChange} className="form-control" placeholder="Precio Base" required />
                    </div>
                  </div>
                  <div className="row mt-3 mb-3">
                    <div className='input-group'>
                      <span className='input-group-text'>Activo</span>
                        <select name="activo" value={form.activo} onChange={handleChange} className="form-select">
                          <option value={1}>Activo</option>
                          <option value={0}>Inactivo</option>
                        </select>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>{editCodigo ? "Actualizar" : "Guardar"}</button>
                    <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={handleCancel}>Cancelar</button>
                  </div>
                </form>
              )}
              <div className="table-responsive mt-4">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Precio Base</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map(s => (
                      <tr key={s.codigo} style={s.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{s.codigo}</td>
                        <td>{s.descripcion}</td>
                        <td>${s.precioBase}</td>
                        <td>{s.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleEdit(s)}>
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                            onClick={() => handleDelete(s.codigo)}>
                            <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {servicios.length === 0 && (
                  <div className="text-center text-muted py-4">No hay servicios {mostrarInactivos ? "inactivos" : "activos"}.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Servicios;
