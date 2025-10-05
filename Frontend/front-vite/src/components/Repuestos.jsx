import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5',
  mentaSuave: '#c6e8e8'
};

const API = "http://localhost:5000";

function Repuestos() {
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    codigo: "",
    marca: "",
    modelo: "",
    activo: 1,
    proveedores: []
  });
  const [editCodigo, setEditCodigo] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modalProveedores, setModalProveedores] = useState({ open: false, lista: [], repuesto: null });
  const [modalTodosRepuestos, setModalTodosRepuestos] = useState({ open: false, lista: [] });

  useEffect(() => {
    setError("");
    fetch(`${API}/repuestos/?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => {
        if (!res.ok) throw new Error("Error al cargar repuestos");
        return res.json();
      })
      .then(data => setRepuestos(data))
      .catch(() => setError("Error al cargar repuestos"));
  }, [mostrarInactivos]);

  useEffect(() => {
    fetch(`${API}/proveedores/?activos=true`)
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, []);

  function handleConsultar(codigo) {
    fetch(`${API}/repuestos/${codigo}`)
      .then(res => res.json())
      .then(data => {
        setModalProveedores({
          open: true,
          lista: data.proveedores || [],
          repuesto: data
        });
      });
  }

  function handleCloseModal() {
    setModalProveedores({ open: false, lista: [], repuesto: null });
  }

  function handleRemoveProveedor(idx) {
    const proveedor = form.proveedores[idx];
    // Elimina en backend si existe el repuesto y proveedor
    if (form.codigo && proveedor.cuilProveedor) {
      fetch(`${API}/repuestoxproveedor/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoRepuesto: form.codigo,
          cuilProveedor: proveedor.cuilProveedor
        })
      }).then(() => {
        // Elimina del estado local
        const nuevos = [...form.proveedores];
        nuevos.splice(idx, 1);
        setForm({ ...form, proveedores: nuevos });
      });
    } else {
      // Solo elimina del estado local si aún no existe en backend
      const nuevos = [...form.proveedores];
      nuevos.splice(idx, 1);
      setForm({ ...form, proveedores: nuevos });
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleProveedorChange(idx, field, value) {
    const nuevos = [...form.proveedores];
    nuevos[idx][field] = value;
    setForm({ ...form, proveedores: nuevos });
  }

  function handleAddProveedor() {
    setForm({
      ...form,
      proveedores: [
        ...form.proveedores,
        { cuilProveedor: "", costo: "", cantidad: "" }
      ]
    });
  }

  function validarRepuesto(form) {
    if (!form.codigo || form.codigo.trim().length < 2) return "El código es obligatorio.";
    if (!form.marca || form.marca.trim().length < 2) return "La marca es obligatoria.";
    if (!form.modelo || form.modelo.trim().length < 2) return "El modelo es obligatorio.";
    if (form.proveedores.length === 0) return "Debe agregar al menos un proveedor.";
    for (let p of form.proveedores) {
      if (!p.cuilProveedor) return "El proveedor es obligatorio.";
      if (p.costo === "" || isNaN(p.costo)) return "El costo debe ser un número.";
      if (p.cantidad === "" || isNaN(p.cantidad)) return "La cantidad debe ser un número.";
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const error = validarRepuesto(form);
    if (error) {
      setMensaje(error);
      return;
    }
    setMensaje("");
    fetch(`${API}/repuestos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: form.codigo,
        marca: form.marca,
        modelo: form.modelo,
        activo: form.activo
      })
    })
      .then(res => res.json())
      .then(() => {
        form.proveedores.forEach(p => {
          fetch(`${API}/repuestoxproveedor/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codigoRepuesto: form.codigo,
              cuilProveedor: p.cuilProveedor,
              costo: p.costo,
              cantidad: p.cantidad
            })
          });
        });
        setForm({ codigo: "", marca: "", modelo: "", activo: 1, proveedores: [] });
        setMostrarFormulario(false);
        fetch(`${API}/repuestos/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setRepuestos(data));
      });
  }

  function handleDelete(codigo) {
    fetch(`${API}/repuestos/${codigo}`, { method: "DELETE" })
      .then(() => {
        fetch(`${API}/repuestos/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setRepuestos(data));
      });
  }

  function handleEdit(repuesto) {
    setEditCodigo(repuesto.codigo);
    setMostrarFormulario(true);
    fetch(`${API}/repuestos/${repuesto.codigo}`)
      .then(res => res.json())
      .then(data => {
        setForm({
          codigo: data.codigo,
          marca: data.marca,
          modelo: data.modelo,
          activo: data.activo,
          proveedores: data.proveedores
            ? data.proveedores.map(p => ({
                cuilProveedor: p.cuilProveedor,
                costo: p.costo,
                cantidad: p.cantidad
              }))
            : []
        });
      });
  }

  function handleUpdate(e) {
    e.preventDefault();
    fetch(`${API}/repuestos/${form.codigo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marca: form.marca,
        modelo: form.modelo,
        activo: form.activo
      })
    })
      .then(res => res.json())
      .then(() => {
        form.proveedores.forEach(p => {
          fetch(`${API}/repuestoxproveedor/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codigoRepuesto: form.codigo,
              cuilProveedor: p.cuilProveedor,
              costo: p.costo,
              cantidad: p.cantidad
            })
          });
        });
        setEditCodigo(null);
        setForm({ codigo: "", marca: "", modelo: "", activo: 1, proveedores: [] });
        setMostrarFormulario(false);
        fetch(`${API}/repuestos/?activos=${mostrarInactivos ? "false" : "true"}`)
          .then(res => res.json())
          .then(data => setRepuestos(data));
      });
  }

  function handleCancel() {
    setMostrarFormulario(false);
    setEditCodigo(null);
    setForm({ codigo: "", marca: "", modelo: "", activo: 1, proveedores: [] });
  }

  function handleVerTodosRepuestos() {
    fetch(`${API}/repuestos_con_proveedores`)
      .then(res => res.json())
      .then(data => {
        setModalTodosRepuestos({ open: true, lista: data });
      })
      .catch(() => {
        setModalTodosRepuestos({ open: true, lista: [] });
      });
  }

  function handleCloseModalTodosRepuestos() {
    setModalTodosRepuestos({ open: false, lista: [] });
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0">Gestión de Repuestos</h4>
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
                    setEditCodigo(null);
                    setForm({ codigo: "", marca: "", modelo: "", activo: 1, proveedores: [] });
                  }}
                >
                  <i className="bi bi-plus-lg"></i> Agregar repuesto
                </button>
                <button
                  className="btn"
                  style={{ background: colores.mentaSuave, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={handleVerTodosRepuestos}
                >
                  Listar Repuestos
                </button>
              </div>
            </div>
            <div className="card-body">
              {error && <div style={{ background: colores.dorado, color: colores.azul, padding: "12px", borderRadius: "8px", margin: "12px 0" }}>{error}</div>}
              {mensaje && (
                <div className="alert alert-danger" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}>
                  {mensaje}
                </div>
              )}
              {/* Formulario para agregar/editar repuesto */}
              {mostrarFormulario && (
                <form onSubmit={editCodigo ? handleUpdate : handleSubmit} className="form-container mb-3">
                  <div className="row">
                    <fieldset className="col-12 col-md-6" style={{ border: "none", marginBottom: "1.5rem" }}>
                      <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                        <i className="bi bi-gear me-2"></i>Datos del repuesto
                      </legend>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-hash me-2"></i>Código
                        </label>
                        <input name="codigo" value={form.codigo} onChange={handleChange} required disabled={!!editCodigo} className="form-control" />
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-pc me-2"></i>Marca
                        </label>
                        <input name="marca" value={form.marca} onChange={handleChange} required className="form-control" />
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-pc-display me-2"></i>Modelo
                        </label>
                        <input name="modelo" value={form.modelo} onChange={handleChange} required className="form-control" />
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </label>
                        <select name="activo" value={form.activo} onChange={handleChange} className="form-control">
                          <option value={1}>Activo</option>
                          <option value={0}>Inactivo</option>
                        </select>
                      </div>
                    </fieldset>
                    <fieldset className="col-12 col-md-6" style={{ border: "none", marginBottom: "1.5rem" }}>
                      <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                        <i className="bi bi-truck me-2"></i>Proveedores
                      </legend>
                      {form.proveedores.map((p, idx) => (
                        <div key={idx} className="mb-2 p-2" style={{ background: "#fff", borderRadius: 8, border: `1px solid ${colores.verdeAgua}` }}>
                          <select
                            value={p.cuilProveedor}
                            onChange={e => handleProveedorChange(idx, "cuilProveedor", e.target.value)}
                            required
                            className="form-control mb-2"
                          >
                            <option value="">Seleccione proveedor</option>
                            {proveedores.map(pr => (
                              <option key={pr.cuil} value={pr.cuil}>{pr.razonSocial} ({pr.cuil})</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Costo"
                            value={p.costo}
                            onChange={e => handleProveedorChange(idx, "costo", e.target.value)}
                            required
                            className="form-control mb-2"
                          />
                          <input
                            type="number"
                            placeholder="Cantidad"
                            value={p.cantidad}
                            onChange={e => handleProveedorChange(idx, "cantidad", e.target.value)}
                            required
                            className="form-control mb-2"
                          />
                          <button type="button" className="btn btn-danger btn-sm" style={{ background: colores.rojo, color: colores.beige }} onClick={() => handleRemoveProveedor(idx)}>Eliminar</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-info btn-sm" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600 }} onClick={handleAddProveedor}>Agregar proveedor</button>
                    </fieldset>
                  </div>
                  <div className="row">
                    <div className="col-12 d-flex flex-column flex-md-row justify-content-end">
                      <button type="submit" className="btn mb-2 mb-md-0" style={{ background: colores.azul, color: colores.beige }}>
                        <i className="bi bi-save me-1"></i>{editCodigo ? "Actualizar" : "Agregar"}
                      </button>
                      <button type="button" className="btn ms-md-2" style={{ background: colores.dorado, color: colores.azul }} onClick={handleCancel}>
                        <i className="bi bi-x-circle me-1"></i>Cancelar
                      </button>
                    </div>
                  </div>
                  {mensaje && (
                    <div className="alert alert-danger" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}>
                      {mensaje}
                    </div>
                  )}
                </form>
              )}

              {/* Modal de proveedores */}
              {modalProveedores.open && (
                <div style={{
                  position: "fixed",
                  top: 0, left: 0, width: "100vw", height: "100vh",
                  background: "#0008", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{
                    background: colores.beige,
                    borderRadius: 16,
                    padding: 32,
                    minWidth: 350,
                    maxWidth: 500,
                    boxShadow: "0 4px 24px #0004",
                    position: "relative"
                  }}>
                    <button
                      onClick={handleCloseModal}
                      style={{
                        position: "absolute", top: 12, right: 12,
                        background: colores.rojo, color: colores.beige, border: "none", borderRadius: 8, padding: "4px 12px", fontWeight: 600
                      }}
                    >X</button>
                    <h5 style={{ color: colores.azul, marginBottom: 16 }}>
                      Proveedores de {modalProveedores.repuesto?.codigo}
                    </h5>
                    {modalProveedores.lista.length === 0 ? (
                      <div>No hay proveedores asociados.</div>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {modalProveedores.lista.map((p, idx) => (
                          <li key={idx} style={{
                            background: "#fff",
                            borderRadius: 8,
                            border: `1px solid ${colores.verdeAgua}`,
                            marginBottom: 8,
                            padding: 12
                          }}>
                            <strong>{p.razonSocial || ""} ({p.cuilProveedor})</strong><br />
                            Costo: <span style={{ color: colores.dorado }}>{p.costo}</span> | Cantidad: <span style={{ color: colores.azul }}>{p.cantidad}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div className="table-responsive mt-4">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Activo</th>
                      <th>Proveedores</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestos.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "16px" }}>
                          No hay repuestos {mostrarInactivos ? "inactivos" : "activos"}.
                        </td>
                      </tr>
                    ) : (
                      repuestos.map(r => (
                        <tr key={r.codigo} style={r.activo === 0 ? { opacity: 0.5 } : {}}>
                          <td>{r.codigo}</td>
                          <td>{r.marca}</td>
                          <td>{r.modelo}</td>
                          <td>{r.activo ? "Sí" : "No"}</td>
                          <td>
                            <button onClick={() => handleConsultar(r.codigo)} className="btn btn-info btn-sm" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600 }}>
                              Ver proveedores
                            </button>
                          </td>
                          <td>
                            <button onClick={() => handleEdit(r)} className="btn btn-warning btn-sm" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600 }}>
                              Editar
                            </button>
                            <button onClick={() => handleDelete(r.codigo)} className="btn btn-danger btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600 }}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {modalTodosRepuestos.open && (
            <div style={{
              position: "fixed",
              top: 0, left: 0, width: "100vw", height: "100vh",
              background: "#0008",
              zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{
                background: colores.beige,
                borderRadius: 16,
                padding: 32,
                width: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 4px 24px #0004",
                position: "relative"
              }}>
                {/* BOTÓN CERRAR */}
                <button
                  onClick={handleCloseModalTodosRepuestos}
                  style={{
                    position: "absolute", top: 12, right: 12,
                    background: colores.rojo, color: colores.beige,
                    border: "none", borderRadius: 8, padding: "4px 12px",
                    fontWeight: 600, cursor: "pointer"
                  }}
                >
                  X
                </button>
                <h4 style={{color: colores.azul, marginBottom: 20, fontWeight: 700}}> Listado de repuestos y proveedores</h4>
                {/* VALIDO QUE HAYA LISTADO, SINO MUESTRA UN MENSAJE */}
                {modalTodosRepuestos.lista.length === 0 ? (
                  <div style={{ textAlign: "center", color: colores.rojo }}>
                    No se encontraron repuestos.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle">
                      <thead className="table-primary">
                        <tr>
                          <th>Código</th>
                          <th>Marca</th>
                          <th>Modelo</th>
                          <th>Activo</th>
                          <th>CUIL</th>
                          <th>Teléfono</th>
                          <th>Razón Social</th>
                          <th>Costo</th>
                          <th>Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalTodosRepuestos.lista.flatMap((r, idx) =>
                          r.proveedores.map((p, i) => (
                            <tr key={`${idx}-${i}`}>
                              <td>{r.codigo}</td>
                              <td>{r.marca}</td>
                              <td>{r.modelo}</td>
                              <td>{r.activo ? "Sí" : "No"}</td>
                              <td>{p.cuilProveedor}</td>
                              <td>{p.telefono}</td>
                              <td>{p.razonSocial}</td>
                              <td>${p.costo}</td>
                              <td>{p.cantidad}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Repuestos;
