import React, { useState, useEffect } from "react";
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const API_URL = "http://localhost:5000/servicios/";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editCodigo, setEditCodigo] = useState(null);
  const [form, setForm] = useState({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
  const [mensaje, setMensaje] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    fetchServicios();
  }, [mostrarInactivos]);

  const fetchServicios = async () => {
    const res = await fetch(`${API_URL}?activos=${mostrarInactivos ? "false" : "true"}`);
    const data = await res.json();
    setServicios(data);
  };

  function validarServicio(form) {
    if (!form.codigo || String(form.codigo).trim() === "") return "El código es obligatorio.";
    if (!form.descripcion || form.descripcion.trim().length < 3) return "La descripción es obligatoria y debe tener al menos 3 caracteres.";
    if (!form.precioBase || isNaN(Number(form.precioBase)) || Number(form.precioBase) <= 0) return "El precio base debe ser un número mayor a 0.";
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") return "El estado es obligatorio.";
    return null;
  }

  function esCodigoDuplicado(codigo) {
    return servicios.some(s => Number(s.codigo) === Number(codigo));
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === "codigo" || name === "precioBase" || name === "activo" ? Number(value) : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (esCodigoDuplicado(form.codigo)) {
      setMensaje("Ya existe un servicio con ese código.");
      return;
    }
    const error = validarServicio(form);
    if (error) {
      setMensaje(error);
      return;
    }
    const datos = {
      codigo: Number(form.codigo),
      descripcion: form.descripcion,
      precioBase: Number(form.precioBase),
      activo: Number(form.activo)
    };
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      setMostrarFormulario(false);
      setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
      setMensaje("");
      fetchServicios();
    } else {
      const data = await res.json();
      setMensaje(data?.error || "Error al agregar servicio");
    }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    const error = validarServicio(form);
    if (error) {
      setMensaje(error);
      return;
    }
    const datos = { ...form, codigo: Number(form.codigo), precioBase: Number(form.precioBase), activo: Number(form.activo) };
    const res = await fetch(`${API_URL}${editCodigo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      setMostrarFormulario(false);
      setEditCodigo(null);
      setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
      setMensaje("");
      fetchServicios();
    } else {
      const data = await res.json();
      setMensaje(data?.error || "Error al modificar servicio");
    }
  };

  const handleEdit = servicio => {
    setEditCodigo(servicio.codigo);
    setForm({
      codigo: servicio.codigo,
      descripcion: servicio.descripcion,
      precioBase: servicio.precioBase,
      activo: servicio.activo
    });
    setMostrarFormulario(true);
    setMensaje("");
  };

  const handleCancel = () => {
    setMostrarFormulario(false);
    setEditCodigo(null);
    setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
    setMensaje("");
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-gear me-2"></i>Gestión de Servicios</h4>
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
                  onClick={() => {
                    setMostrarFormulario(true);
                    setEditCodigo(null);
                    setForm({ codigo: "", descripcion: "", precioBase: "", activo: 1 });
                    setMensaje("");
                  }}
                >
                  <i className="bi bi-plus-lg"></i> Agregar servicio
                </button>
              </div>
            </div>
            <div className="card-body">
              {mostrarFormulario && (
                <form onSubmit={editCodigo ? handleUpdate : handleSubmit} className="form-container mb-3">
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-gear me-2"></i>Datos del servicio
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Código</label>
                          <input
                            type="number"
                            name="codigo"
                            value={form.codigo}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Código"
                            disabled={!!editCodigo}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-file-text me-2"></i>Descripción</label>
                          <input
                            type="text"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Descripción"
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-cash-coin me-2"></i>Precio y estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-currency-dollar me-2"></i>Precio Base</label>
                          <input
                            type="number"
                            name="precioBase"
                            value={form.precioBase}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Precio Base"
                          />
                        </div>
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
                      <i className="bi bi-save me-1"></i>{editCodigo ? "Actualizar" : "Guardar"}
                    </button>
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }} onClick={handleCancel}>
                      <i className="bi bi-x-circle me-1"></i>Cancelar
                    </button>
                  </div>
                </form>
              )}
              <div className="table-responsive">
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
                          <button
                            className="btn btn-sm"
                            style={{
                              background: colores.dorado,
                              color: colores.azul,
                              borderRadius: "8px",
                              fontWeight: 600,
                              marginRight: "6px",
                              border: "none",
                              boxShadow: "0 1px 4px #0001"
                            }}
                            onClick={() => handleEdit(s)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
