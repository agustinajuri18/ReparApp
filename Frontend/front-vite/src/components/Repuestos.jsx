import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';
import ConfirmModal from './ConfirmModal';

const API_URL = "http://localhost:5000/repuestos";
const REPUESTOS_PROVEEDORES_URL = "http://localhost:5000/repuestos-proveedores";
const PROVEEDORES_URL = "http://localhost:5000/proveedores";

function Repuestos() {
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('alta');

  const [form, setForm] = useState({
    idRepuesto: "",
    marca: "",
    modelo: "",
    proveedores: [],
  });

  const [modalTodosRepuestos, setModalTodosRepuestos] = useState({ open: false, lista: [] });
  const [originalProveedores, setOriginalProveedores] = useState([]);
  const [repuestosProveedores, setRepuestosProveedores] = useState([]);
  const [confirmRemoveProveedor, setConfirmRemoveProveedor] = useState({ open: false, idx: null });

  const fetchRepuestos = (search = searchTerm) => {
    // Use current mostrarInactivos state to fetch correct set
    const activosParam = mostrarInactivos ? 'false' : 'true';
    const params = new URLSearchParams({ activos: activosParam });
    if (search && search.trim().length > 0) params.set('search', search.trim());
    fetch(`${API_URL}?${params.toString()}`)
      .then(res => res.json())
      .then(data => setRepuestos(data))
      .catch(() => setMensaje("Error al cargar repuestos"));
  };

  const fetchRepuestosProveedores = () => {
    fetch(REPUESTOS_PROVEEDORES_URL)
      .then(res => res.json())
      .then(data => setRepuestosProveedores(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar repuestos-proveedores"));
  };

  const fetchProveedores = () => {
    fetch(PROVEEDORES_URL)
      .then(res => res.json())
      .then(data => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar proveedores"));
  };

  // Fetch repuestos whenever mostrarInactivos or searchTerm changes (debounced) so toggle works on first click
  useEffect(() => {
    const t = setTimeout(() => fetchRepuestos(searchTerm), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [mostrarInactivos, searchTerm]);

  useEffect(() => {
    fetchProveedores();
    fetchRepuestosProveedores();
  }, []);

  // --- Lógica de filtrado de proveedores ---
  const getAvailableProveedoresForRow = (rowIndex) => {
    // Obtiene los IDs ya seleccionados en OTRAS filas
    const selectedIds = form.proveedores
      .filter((_, index) => index !== rowIndex)
      .map(p => p.cuilProveedor);

    // Filtra la lista principal de proveedores
    return proveedores.filter(p => !selectedIds.includes(p.idProveedor));
  };

  const availableProveedoresCount = () => {
    const selectedIds = form.proveedores.map(p => p.cuilProveedor);
    return proveedores.filter(p => !selectedIds.includes(p.idProveedor)).length;
  };
  // --- Fin de la lógica de filtrado ---

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors(validarRepuesto({ ...form, [e.target.name]: e.target.value }));
  };

  function validarRepuesto(data) {
    const errors = {};
  const marcaStr = String(data.marca || "");
  const modeloStr = String(data.modelo || "");
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
    setForm({ idRepuesto: "", marca: "", modelo: "", proveedores: [] });
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  const handleModificar = (repuesto) => {
    fetch(`${API_URL}/${repuesto.idRepuesto}`)
      .then(res => res.json())
      .then(data => {
        const proveedoresData = data.proveedores || [];
        setModalModo('modificar');
        setForm({
          idRepuesto: data.idRepuesto,
          marca: data.marca,
          modelo: data.modelo,
          proveedores: proveedoresData
        });
        setOriginalProveedores(proveedoresData);
        setFormErrors({});
        setMensaje("");
        setModalVisible(true);
      });
  };

  const handleConsultar = (repuesto) => {
    fetch(`${API_URL}/${repuesto.idRepuesto}`)
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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProveedorChange = (idx, field, value) => {
    const updatedProveedores = [...form.proveedores];
    if (field === 'cuilProveedor') {
      updatedProveedores[idx][field] = Number(value);
    } else if (field === 'costo' || field === 'cantidad') {
      updatedProveedores[idx][field] = value === '' ? null : Number(value);
    } else {
      updatedProveedores[idx][field] = value;
    }
    setForm(prev => ({ ...prev, proveedores: updatedProveedores }));
  };

  const handleAddProveedor = () => {
    setForm(prev => ({ ...prev, proveedores: [...prev.proveedores, { cuilProveedor: '', costo: null, cantidad: null }] }));
  };

  const handleRemoveProveedor = (idx) => {
    // open confirm modal
    setConfirmRemoveProveedor({ open: true, idx });
  };

  const confirmRemoveProveedorCancel = () => setConfirmRemoveProveedor({ open: false, idx: null });

  const confirmRemoveProveedorConfirm = () => {
    const idx = confirmRemoveProveedor.idx;
    const updatedProveedores = [...form.proveedores];
    updatedProveedores.splice(idx, 1);
    setForm(prev => ({ ...prev, proveedores: updatedProveedores }));
    setConfirmRemoveProveedor({ open: false, idx: null });
  };

  const [confirmDeleteRepuesto, setConfirmDeleteRepuesto] = useState({ open: false, id: null });

  const handleDelete = (idRepuesto) => {
    setConfirmDeleteRepuesto({ open: true, id: idRepuesto });
  };

  const confirmDeleteRepuestoCancel = () => setConfirmDeleteRepuesto({ open: false, id: null });

  const confirmDeleteRepuestoConfirm = () => {
    const idRepuesto = confirmDeleteRepuesto.id;
    fetch(`${API_URL}/${idRepuesto}`, { method: "DELETE" })
      .then(res => {
        if (!res.ok) throw new Error("Error al eliminar el repuesto.");
        fetchRepuestos();
      })
      .catch(err => setMensaje(err.message))
      .finally(() => setConfirmDeleteRepuesto({ open: false, id: null }));
  };

  const handleReactivar = async (idRepuesto) => {
    try {
      const res = await fetch(`${API_URL}/${idRepuesto}/reactivar`, { method: "PUT" });
      if (!res.ok) throw new Error("Error al reactivar el repuesto.");
      fetchRepuestos();
    } catch (err) {
      setMensaje(err.message);
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

    if (modalModo === 'alta') {
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marca: form.marca, modelo: form.modelo })
      })
        .then(res => { if (!res.ok) throw new Error("Error al crear el repuesto. El código puede ya existir."); return res.json(); })
        .then(data => {
          const idRepuesto = data.idRepuesto;
          return Promise.all(form.proveedores.map(p =>
            fetch(REPUESTOS_PROVEEDORES_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                idRepuesto: Number(idRepuesto), 
                idProveedor: Number(p.cuilProveedor), 
                costo: Number(p.costo || 0),      // Asegurar que sea número 
                cantidad: Number(p.cantidad || 0)  // Asegurar que sea número
              })
            })
          ));
        })
        .then(() => { handleModalClose(); fetchRepuestos(); fetchRepuestosProveedores(); })
        .catch(err => setMensaje(err.message));
      return;
    }

    if (modalModo === 'modificar') {
      const repuestoUpdateData = { marca: form.marca, modelo: form.modelo };
      fetch(`${API_URL}/${form.idRepuesto}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repuestoUpdateData)
      })
        .then(res => { if (!res.ok) throw new Error("Error al actualizar datos del repuesto."); return res.json(); })
        .then(() => {
          const proveedoresAEliminar = originalProveedores.filter(orig => !form.proveedores.some(p => p.cuilProveedor === orig.cuilProveedor));
          const proveedoresParaUpsert = form.proveedores;

          const promesasEliminar = proveedoresAEliminar.map(p => fetch(`${REPUESTOS_PROVEEDORES_URL}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idRepuesto: form.idRepuesto, idProveedor: p.cuilProveedor })
          }));

          const promesasUpsert = proveedoresParaUpsert.map(p => fetch(REPUESTOS_PROVEEDORES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              idRepuesto: Number(form.idRepuesto), 
              idProveedor: Number(p.cuilProveedor), 
              costo: Number(p.costo || 0),      // Asegurar que sea número
              cantidad: Number(p.cantidad || 0)  // Asegurar que sea número
            })
          }));

          return Promise.all([...promesasEliminar, ...promesasUpsert]);
        })
        .then(() => { handleModalClose(); fetchRepuestos(); fetchRepuestosProveedores(); })
        .catch(err => setMensaje(err.message));
    }
  };

  const handleVerTodosRepuestos = () => {
    Promise.all([
      fetch(REPUESTOS_PROVEEDORES_URL).then(res => res.json()),
      fetch(API_URL).then(res => res.json()),
      fetch(PROVEEDORES_URL).then(res => res.json())
    ])
      .then(([rels, reps, provs]) => {
        const repMap = reps.reduce((acc, r) => { acc[r.idRepuesto] = r; return acc; }, {});
        const provMap = provs.reduce((acc, p) => { acc[p.idProveedor] = p; return acc; }, {});
        const grouped = rels.reduce((acc, rel) => {
          const id = rel.idRepuesto;
          if (!acc[id]) {
            const rep = repMap[id];
            acc[id] = { idRepuesto: id, marca: rep?.marca || '', modelo: rep?.modelo || '', proveedores: [] };
          }
          acc[id].proveedores.push({
            razonSocial: provMap[rel.idProveedor]?.razonSocial || '',
            cuilProveedor: rel.idProveedor,
            costo: rel.costo,
            cantidad: rel.cantidad
          });
          return acc;
        }, {});
        setModalTodosRepuestos({ open: true, lista: Object.values(grouped) });
      })
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
                <button
                  className="btn btn-dorado"
                  onClick={() => setMostrarInactivos(prev => !prev)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
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
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="table-responsive" style={{ overflow: 'visible' }}>
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
                    {repuestos
                      .filter(r => Number(r.activo) === (mostrarInactivos ? 0 : 1))
                      .map((r) => (
                      <tr key={r.idRepuesto} style={Number(r.activo) === 0 ? { opacity: 0.6 } : {}}>
                        <td>{r.idRepuesto}</td>
                        <td>{r.marca}</td>
                        <td>{r.modelo}</td>
                        <td>{r.activo ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button className="btn btn-sm btn-verdeAgua fw-bold me-1" onClick={() => handleConsultar(r)}>
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button className={`btn btn-sm fw-bold me-1 ${r.activo ? 'btn-dorado' : 'btn-secondary'}`} onClick={() => r.activo && handleModificar(r)} disabled={!r.activo}>
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          {r.activo ? (
                            <button className="btn btn-sm btn-rojo fw-bold" onClick={() => handleDelete(r.idRepuesto)}>
                              <i className="bi bi-trash me-1"></i>Eliminar
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-verdeAgua fw-bold" onClick={() => handleReactivar(r.idRepuesto)}>
                              <i className="bi bi-arrow-clockwise me-1"></i>Reactivar
                            </button>
                          )}
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
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog" style={{ maxWidth: "100vw" }}>
            <div className="modal-content" style={{ width: "100vw", maxWidth: "100vw" }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalModo === 'consultar' && <><i className="bi bi-search me-2"></i>Consultar Repuesto</>}
                  {modalModo === 'modificar' && <><i className="bi bi-pencil-square me-2"></i>Modificar Repuesto</>}
                  {modalModo === 'alta' && <><i className="bi bi-plus-lg me-2"></i>Nuevo Repuesto</>}
                </h5>
                <button type="button" className="btn-close" onClick={handleModalClose} style={{ filter: 'invert(0.5) grayscale(100%) brightness(200%)' }}></button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <form
                  className="form-container"
                  onSubmit={handleSubmit}
                >
                    <fieldset style={{ border: 'none' }}>
                      <legend><i className="bi bi-gear me-2"></i>Datos del Repuesto</legend>
                      <div className="row g-4">
                        
                        {/* División: Especificaciones */}
                        <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1">
                          <i className="bi bi-pc me-2"></i>Especificaciones
                        </h6>
                        <div className="col-12 col-md-6">
                          <div className="mb-3">
                            <label>
                              <i className="bi bi-pc me-2"></i>Marca
                            </label>
                            <input
                              type="text"
                              name="marca"
                              value={form.marca}
                              onChange={handleFormChange}
                              className="form-control"
                              required
                              readOnly={modalModo === 'consultar'}
                              style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                            />
                            {formErrors.marca && <div className="input-error-message">{formErrors.marca}</div>}
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="mb-3">
                            <label>
                              <i className="bi bi-pc-display me-2"></i>Modelo
                            </label>
                            <input
                              type="text"
                              name="modelo"
                              value={form.modelo}
                              onChange={handleFormChange}
                              className="form-control"
                              required
                              readOnly={modalModo === 'consultar'}
                              style={{ backgroundColor: modalModo === "consultar" ? '#dee2e6' : 'white' }}
                            />
                            {formErrors.modelo && <div className="input-error-message">{formErrors.modelo}</div>}
                          </div>
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
                                {getAvailableProveedoresForRow(idx).map(pr => <option key={pr.idProveedor} value={pr.idProveedor}>{pr.razonSocial} ({pr.cuil})</option>)}
                              </select>
                            </div>
                            <div className="col-sm-6">
                              <label>Costo</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={p.costo ?? ''} 
                                onChange={e => handleProveedorChange(idx, "costo", e.target.value)} 
                                required 
                                min="0" 
                                step="0.01" 
                                disabled={modalModo === 'consultar'}
                              />
                            </div>
                            <div className="col-sm-6">
                              <label>Cantidad</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={p.cantidad ?? ''} 
                                onChange={e => handleProveedorChange(idx, "cantidad", e.target.value)} 
                                required 
                                min="0" 
                                disabled={modalModo === 'consultar'}
                              />
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
                    {mensaje && <div className="alert alert-danger">{mensaje}</div>}
                    {(modalModo === "modificar" || modalModo === "alta") && (
                      <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                        <button type="submit" className="btn btn-azul fw-bold">
                          <i className="bi bi-save me-1"></i>
                          {modalModo === "modificar" ? "Guardar cambios" : "Guardar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-dorado fw-bold"
                          onClick={handleModalClose}
                        >
                          <i className="bi bi-x-circle me-1"></i>Cancelar
                        </button>
                      </div>
                    )}
                  </form>
                </div>
                {modalModo === "consultar" && (
                  <div className="modal-footer">
                    <button className="btn btn-dorado fw-bold" onClick={handleModalClose}>
                      <i className="bi bi-x-circle me-1"></i>Cerrar
                    </button>
                  </div>
                )}
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
                <div className="table-responsive" style={{ overflow: 'visible' }}>
                  <table className="table table-striped table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Repuesto</th>
                        <th>Proveedor</th>
                        <th>Costo</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalTodosRepuestos.lista.flatMap(r =>
                        r.proveedores.length > 0 ? r.proveedores.map((p, i) => (
                          <tr key={`${r.idRepuesto}-${i}`}>
                            {i === 0 && <td rowSpan={r.proveedores.length}>{r.marca} {r.modelo}</td>}
                            <td>{p.razonSocial} ({p.cuilProveedor})</td>
                            <td>${p.costo}</td>
                            <td>{p.cantidad}</td>
                          </tr>
                        )) : (
                          <tr key={r.idRepuesto}>
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

      <ConfirmModal
        open={confirmRemoveProveedor.open}
        title="Confirmar eliminación"
        message="¿Está seguro que desea quitar este proveedor del repuesto?"
        onCancel={confirmRemoveProveedorCancel}
        onConfirm={confirmRemoveProveedorConfirm}
      />
      <ConfirmModal
        open={confirmDeleteRepuesto.open}
        title="Confirmar eliminación"
        message="¿Está seguro de que desea eliminar este repuesto? Se eliminarán también sus asociaciones con proveedores."
        onCancel={confirmDeleteRepuestoCancel}
        onConfirm={confirmDeleteRepuestoConfirm}
      />
    </div>
  )
};


export default Repuestos;