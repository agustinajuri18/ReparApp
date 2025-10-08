import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000";

function Repuestos() {
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('alta');

  const [form, setForm] = useState({
    codigo: "",
    marca: "",
    modelo: "",
    activo: 1,
    proveedores: []
  });

  const [modalTodosRepuestos, setModalTodosRepuestos] = useState({ open: false, lista: [] });
  const [originalProveedores, setOriginalProveedores] = useState([]);

  const fetchRepuestos = () => {
    fetch(`${API_URL}/repuestos/?activos=${mostrarInactivos ? "false" : "true"}`)
      .then(res => res.ok ? res.json() : Promise.reject("Error al cargar repuestos"))
      .then(data => setRepuestos(Array.isArray(data) ? data : []))
      .catch(err => setMensaje(err.toString()));
  };

  const fetchProveedores = () => {
    fetch(`${API_URL}/proveedores/?activos=true`)
      .then(res => res.ok ? res.json() : Promise.reject("Error al cargar proveedores"))
      .then(data => setProveedores(Array.isArray(data) ? data : []))
      .catch(err => setMensaje(err.toString()));
  };

  useEffect(() => {
    fetchRepuestos();
  }, [mostrarInactivos]);

  useEffect(() => {
    fetchProveedores();
  }, []);

  // --- Lógica de filtrado de proveedores ---
  const getAvailableProveedoresForRow = (rowIndex) => {
    // Obtiene los CUILs ya seleccionados en OTRAS filas
    const selectedCuils = form.proveedores
      .filter((_, index) => index !== rowIndex)
      .map(p => p.cuilProveedor);

    // Filtra la lista principal de proveedores
    return proveedores.filter(p => !selectedCuils.includes(p.cuil));
  };

  const availableProveedoresCount = () => {
    const selectedCuils = form.proveedores.map(p => p.cuilProveedor);
    return proveedores.filter(p => !selectedCuils.includes(p.cuil)).length;
  };
  // --- Fin de la lógica de filtrado ---

  function validarRepuesto(data) {
    const errors = {};
    const codigoStr = String(data.codigo || "");
    const marcaStr = String(data.marca || "");
    const modeloStr = String(data.modelo || "");

    if (codigoStr.trim().length < 1) errors.codigo = "El código es obligatorio.";
    if (marcaStr.trim().length < 1) errors.marca = "La marca es obligatoria.";
    if (modeloStr.trim().length < 1) errors.modelo = "El modelo es obligatorio.";

    if (modalModo !== 'consultar') {
      if (data.proveedores.length === 0) errors.proveedores = "Debe agregar al menos un proveedor.";
      const cuils = data.proveedores.map(p => p.cuilProveedor);
      if (new Set(cuils).size !== cuils.length) errors.proveedores = "No puede haber proveedores repetidos.";
      for (const p of data.proveedores) {
        if (!p.cuilProveedor) errors.proveedorDetalle = "El proveedor es obligatorio.";
        if (p.costo === "" || isNaN(p.costo) || p.costo < 0) errors.proveedorDetalle = "El costo debe ser un número positivo.";
        if (p.cantidad === "" || isNaN(p.cantidad) || !Number.isInteger(Number(p.cantidad)) || p.cantidad < 0) errors.proveedorDetalle = "La cantidad debe ser un número entero positivo.";
      }
    }
    return errors;
  }

  const handleModalClose = () => setModalVisible(false);

  const handleAgregarClick = () => {
    setModalModo('alta');
    setForm({ codigo: "", marca: "", modelo: "", activo: 1, proveedores: [] });
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  const handleModificar = (repuesto) => {
    fetch(`${API_URL}/repuestos/${repuesto.codigo}`)
      .then(res => res.json())
      .then(data => {
        const proveedoresData = data.proveedores || [];
        setModalModo('modificar');
        setForm({
          codigo: data.codigo,
          marca: data.marca,
          modelo: data.modelo,
          activo: data.activo,
          proveedores: proveedoresData
        });
        setOriginalProveedores(proveedoresData);
        setFormErrors({});
        setMensaje("");
        setModalVisible(true);
      });
  };

  const handleConsultar = (repuesto) => {
    fetch(`${API_URL}/repuestos/${repuesto.codigo}`)
      .then(res => res.json())
      .then(data => {
        setModalModo('consultar');
        setForm({ ...data, proveedores: data.proveedores || [] });
        setFormErrors({});
        setMensaje("");
        setModalVisible(true);
      });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'activo' ? Number(value) : value }));
  };

  const handleProveedorChange = (idx, field, value) => {
    const updatedProveedores = [...form.proveedores];
    updatedProveedores[idx][field] = value;
    setForm(prev => ({ ...prev, proveedores: updatedProveedores }));
  };

  const handleAddProveedor = () => {
    setForm(prev => ({
      ...prev,
      proveedores: [...prev.proveedores, { cuilProveedor: "", costo: "", cantidad: "" }]
    }));
  };

  const handleRemoveProveedor = (idx) => {
    const updatedProveedores = [...form.proveedores];
    updatedProveedores.splice(idx, 1);
    setForm(prev => ({ ...prev, proveedores: updatedProveedores }));
  };

  const handleDelete = (codigo) => {
    if (window.confirm("¿Está seguro de que desea eliminar este repuesto? Se eliminarán también sus asociaciones con proveedores.")) {
      fetch(`${API_URL}/repuestos/${codigo}`, { method: "DELETE" })
        .then(res => {
          if (!res.ok) throw new Error("Error al eliminar el repuesto.");
          fetchRepuestos();
        })
        .catch(err => setMensaje(err.message));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validarRepuesto(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores antes de continuar.");
      return;
    }
    setMensaje("");

    const repuestoData = { codigo: form.codigo, marca: form.marca, modelo: form.modelo, activo: form.activo };

    if (modalModo === 'alta') {
      fetch(`${API_URL}/repuestos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repuestoData)
      })
        .then(res => { if (!res.ok) throw new Error("Error al crear el repuesto. El código puede ya existir."); return res.json(); })
        .then(() => Promise.all(form.proveedores.map(p =>
          fetch(`${API_URL}/repuestoxproveedor/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigoRepuesto: form.codigo, ...p })
          })
        )))
        .then(() => { handleModalClose(); fetchRepuestos(); })
        .catch(err => setMensaje(err.message));
      return;
    }

    if (modalModo === 'modificar') {
      const repuestoUpdateData = { marca: form.marca, modelo: form.modelo, activo: form.activo };
      fetch(`${API_URL}/repuestos/${form.codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repuestoUpdateData)
      })
        .then(res => { if (!res.ok) throw new Error("Error al actualizar datos del repuesto."); return res.json(); })
        .then(() => {
          const proveedoresAEliminar = originalProveedores.filter(orig => !form.proveedores.some(p => p.cuilProveedor === orig.cuilProveedor));
          const proveedoresParaUpsert = form.proveedores;

          const promesasEliminar = proveedoresAEliminar.map(p => fetch(`${API_URL}/repuestoxproveedor/`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigoRepuesto: form.codigo, cuilProveedor: p.cuilProveedor })
          }));

          const promesasUpsert = proveedoresParaUpsert.map(p => fetch(`${API_URL}/repuestoxproveedor/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigoRepuesto: form.codigo, ...p })
          }));

          return Promise.all([...promesasEliminar, ...promesasUpsert]);
        })
        .then(() => { handleModalClose(); fetchRepuestos(); })
        .catch(err => setMensaje(err.message));
    }
  };

  const handleVerTodosRepuestos = () => {
    fetch(`${API_URL}/repuestos_con_proveedores`)
      .then(res => res.json())
      .then(data => setModalTodosRepuestos({ open: true, lista: data }))
      .catch(() => setModalTodosRepuestos({ open: true, lista: [] }));
  };

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 #1f334522`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid #1f3345`, borderRadius: 16, background: "var(--color-beige)" }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: '#1f3345', color: '#f0ede5', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-gear-wide-connected me-2"></i>Gestión de Repuestos</h4>
              <div className="d-flex gap-2">
                <button className="btn btn-dorado" onClick={() => setMostrarInactivos(!mostrarInactivos)}>
                  {mostrarInactivos ? 'Ver activos' : 'Ver inactivos'}
                </button>
                <button className="btn btn-verdeAgua" onClick={handleAgregarClick}>
                  <i className="bi bi-plus-lg"></i> Agregar repuesto
                </button>
                <button className="btn btn-gris" onClick={handleVerTodosRepuestos}>
                  <i className="bi bi-list-ul"></i> Listar Todos
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestos.map((r) => (
                      <tr key={r.codigo} style={Number(r.activo) === 0 ? { opacity: 0.6 } : {}}>
                        <td>{r.codigo}</td>
                        <td>{r.marca}</td>
                        <td>{r.modelo}</td>
                        <td>{r.activo ? "Sí" : "No"}</td>
                        <td>
                          <button className="btn btn-sm btn-verdeAgua fw-bold me-1" onClick={() => handleConsultar(r)}>
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button className="btn btn-sm btn-dorado fw-bold me-1" onClick={() => handleModificar(r)}>
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          <button className="btn btn-sm btn-rojo fw-bold" onClick={() => handleDelete(r.codigo)}>
                            <i className="bi bi-trash me-1"></i>Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {repuestos.length === 0 && <div className="text-center text-muted py-4">No hay repuestos para mostrar.</div>}
              </div>
            </div>
          </div>
        </main>
      </div>

      {modalVisible && (
        <div className="modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalModo === 'consultar' && <><i className="bi bi-search me-2"></i>Consultar Repuesto</>}
                    {modalModo === 'modificar' && <><i className="bi bi-pencil-square me-2"></i>Modificar Repuesto</>}
                    {modalModo === 'alta' && <><i className="bi bi-plus-lg me-2"></i>Nuevo Repuesto</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleModalClose} style={{ filter: 'invert(0.5) grayscale(100%) brightness(200%)' }}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto', padding: 0 }}>
                  <div className="form-container">
                    <fieldset style={{ border: 'none' }}>
                      <legend><i className="bi bi-gear me-2"></i>Datos del Repuesto</legend>
                      <div className="row g-3">
                        <div className="col-12">
                          <label htmlFor="codigo"><i className="bi bi-hash me-2"></i>Código</label>
                          <input type="text" id="codigo" name="codigo" value={form.codigo} onChange={handleFormChange} required readOnly={modalModo !== 'alta'} />
                          {formErrors.codigo && <div className="input-error-message">{formErrors.codigo}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                          <label htmlFor="marca"><i className="bi bi-pc me-2"></i>Marca</label>
                          <input type="text" id="marca" name="marca" value={form.marca} onChange={handleFormChange} required readOnly={modalModo === 'consultar'} />
                          {formErrors.marca && <div className="input-error-message">{formErrors.marca}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                          <label htmlFor="modelo"><i className="bi bi-pc-display me-2"></i>Modelo</label>
                          <input type="text" id="modelo" name="modelo" value={form.modelo} onChange={handleFormChange} required readOnly={modalModo === 'consultar'} />
                          {formErrors.modelo && <div className="input-error-message">{formErrors.modelo}</div>}
                        </div>
                        <div className="col-12">
                          <label htmlFor="activo"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select id="activo" name="activo" value={form.activo} onChange={handleFormChange} disabled={modalModo === 'consultar'}>
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset style={{ border: 'none', marginTop: '1.5rem' }}>
                      <legend><i className="bi bi-truck me-2"></i>Proveedores</legend>
                      {formErrors.proveedores && <div className="input-error-message">{formErrors.proveedores}</div>}
                      {formErrors.proveedorDetalle && <div className="input-error-message">{formErrors.proveedorDetalle}</div>}

                      {form.proveedores.map((p, idx) => (
                        <div key={idx} className="p-2 mb-2" style={{ background: "#fff", border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                          <div className="row g-2 align-items-center">
                            <div className="col-12">
                              <label>Proveedor</label>
                              <select 
                                className="form-select" 
                                value={p.cuilProveedor} 
                                onChange={e => handleProveedorChange(idx, "cuilProveedor", e.target.value)} 
                                required 
                                disabled={modalModo === 'consultar'}
                              >
                                <option value="">Seleccione proveedor...</option>
                                {getAvailableProveedoresForRow(idx).map(pr => <option key={pr.cuil} value={pr.cuil}>{pr.razonSocial} ({pr.cuil})</option>)}
                              </select>
                            </div>
                            <div className="col-sm-6">
                              <label>Costo</label>
                              <input className="form-control" type="number" step="0.01" placeholder="Costo" value={p.costo} onChange={e => handleProveedorChange(idx, "costo", e.target.value)} required readOnly={modalModo === 'consultar'} />
                            </div>
                            <div className="col-sm-6">
                              <label>Cantidad</label>
                              <input className="form-control" type="number" placeholder="Cantidad" value={p.cantidad} onChange={e => handleProveedorChange(idx, "cantidad", e.target.value)} required readOnly={modalModo === 'consultar'} />
                            </div>
                            {modalModo !== 'consultar' && (
                              <div className="col-12 d-flex align-items-end mt-2">
                                <button type="button" className="btn btn-rojo w-100" onClick={() => handleRemoveProveedor(idx)}>Quitar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {modalModo !== 'consultar' && (
                        <button 
                          type="button" 
                          className="btn btn-verdeAgua mt-2" 
                          onClick={handleAddProveedor}
                          disabled={availableProveedoresCount() === 0}
                        >
                          <i className="bi bi-plus-lg me-1"></i>Añadir Proveedor
                        </button>
                      )}
                    </fieldset>
                    {mensaje && <div className="alert mt-3">{mensaje}</div>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-dorado" onClick={handleModalClose}><i className="bi bi-x-circle me-1"></i>
                    {modalModo === 'consultar' ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {modalModo !== 'consultar' && (
                    <button type="submit" className="btn btn-azul"><i className="bi bi-save me-1"></i>Guardar</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modalTodosRepuestos.open && (
        <div className="modal">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-list-ul me-2"></i>Listado Completo de Repuestos</h5>
                <button type="button" className="btn-close" onClick={() => setModalTodosRepuestos({ open: false, lista: [] })} style={{ filter: 'invert(0.5) grayscale(100%) brightness(200%)' }}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-striped table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Código Rep.</th>
                        <th>Repuesto</th>
                        <th>Proveedor</th>
                        <th>Costo</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalTodosRepuestos.lista.flatMap(r =>
                        r.proveedores.length > 0 ? r.proveedores.map((p, i) => (
                          <tr key={`${r.codigo}-${i}`}>
                            {i === 0 && <td rowSpan={r.proveedores.length}>{r.codigo}</td>}
                            {i === 0 && <td rowSpan={r.proveedores.length}>{r.marca} {r.modelo}</td>}
                            <td>{p.razonSocial} ({p.cuilProveedor})</td>
                            <td>${p.costo}</td>
                            <td>{p.cantidad}</td>
                          </tr>
                        )) : (
                          <tr key={r.codigo}>
                            <td>{r.codigo}</td>
                            <td>{r.marca} {r.modelo}</td>
                            <td colSpan="3" className="text-center text-muted">Sin proveedores asignados</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-dorado" onClick={() => setModalTodosRepuestos({ open: false, lista: [] })}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Repuestos;