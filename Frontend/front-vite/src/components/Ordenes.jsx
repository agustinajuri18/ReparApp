import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };

const API_ORDENES = "http://localhost:5000/ordenes/";
const API_DETALLES = "http://localhost:5000/detalles_orden/";

function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [form, setForm] = useState({
    nroSerieDispositivo: "",
    fecha: "",
    descripcionDanos: "",
    diagnostico: "",
    presupuesto: "",
    idEmpleado: ""
  });
  const [ordenActual, setOrdenActual] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({
    idDetalle: "",
    nroDeOrden: "",
    codigoServicio: "",
    codRepuestos: "",
    cuitProveedor: "",
    costoServicio: "",
    costoRepuesto: "",
    subtotal: ""
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' o 'modificar'

  // --- Cargar todas las órdenes ---
  useEffect(() => {
    fetch(API_ORDENES)
      .then(res => res.json())
      .then(data => setOrdenes(data))
      .catch(err => console.error("Error al cargar órdenes:", err));
  }, []);

  // --- Helpers ---
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleDetalleChange(e) {
    setNuevoDetalle({ ...nuevoDetalle, [e.target.name]: e.target.value });
  }

  function limpiarForm() {
    setForm({
      nroSerieDispositivo: "",
      fecha: "",
      descripcionDanos: "",
      diagnostico: "",
      presupuesto: "",
      idEmpleado: ""
    });
  }

  // --- Crear orden ---
  function handleSubmit(e) {
    e.preventDefault();
    fetch(API_ORDENES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        limpiarForm();
        setMostrarFormulario(false);
        setMensaje("Orden creada correctamente");
        fetch(API_ORDENES)
          .then(res => res.json())
          .then(data => setOrdenes(data));
      })
      .catch(err => setMensaje("Error al crear orden: " + err));
  }

  // --- Consultar orden y sus detalles ---
  function handleConsultar(nroDeOrden) {
    fetch(`${API_DETALLES}${nroDeOrden}`)
      .then(res => res.json())
      .then(det => {
        const orden = ordenes.find(o => o.nroDeOrden === nroDeOrden);
        setOrdenActual(orden);
        setDetalles(det);
        setModalModo('consultar');
        setModalVisible(true);
      });
  }

  // --- Modificar orden (abrir modal) ---
  function handleModificar(nroDeOrden) {
    fetch(`${API_DETALLES}${nroDeOrden}`)
      .then(res => res.json())
      .then(det => {
        const orden = ordenes.find(o => o.nroDeOrden === nroDeOrden);
        setOrdenActual(orden);
        setDetalles(det);
        setModalModo('modificar');
        setModalVisible(true);
      });
  }

  // --- Guardar modificación de orden ---
  function handleModalSave(e) {
    e.preventDefault();
    fetch(`${API_ORDENES}${ordenActual.nroDeOrden}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ordenActual)
    })
      .then(res => res.json())
      .then(() => {
        setModalVisible(false);
        fetch(API_ORDENES)
          .then(res => res.json())
          .then(data => setOrdenes(data));
        setMensaje("Orden modificada correctamente");
      })
      .catch(err => setMensaje("Error al modificar orden: " + err));
  }

  // --- Agregar detalle a la orden ---
  function handleAgregarDetalle(e) {
    e.preventDefault();
    const payload = { ...nuevoDetalle, nroDeOrden: ordenActual.nroDeOrden };
    fetch(API_DETALLES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        setNuevoDetalle({
          idDetalle: "",
          nroDeOrden: ordenActual.nroDeOrden,
          codigoServicio: "",
          codRepuestos: "",
          cuitProveedor: "",
          costoServicio: "",
          costoRepuesto: "",
          subtotal: ""
        });
        fetch(`${API_DETALLES}${ordenActual.nroDeOrden}`)
          .then(res => res.json())
          .then(det => setDetalles(det));
      })
      .catch(err => console.error("Error al agregar detalle:", err));
  }

  function handleModalClose() {
    setModalVisible(false);
    setOrdenActual(null);
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{
          background: 'white', borderRadius: 16,
          boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh'
        }}>
          <div className="card shadow-sm mb-4" style={{
            border: `1.5px solid ${colores.azul}`,
            borderRadius: 16, background: colores.beige
          }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center"
              style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0"><i className="bi bi-clipboard-data me-2"></i>Gestión de Órdenes</h4>
              <button className="btn"
                style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                onClick={() => setMostrarFormulario(true)}>
                <i className="bi bi-plus-lg"></i> Agregar orden
              </button>
            </div>
            <div className="card-body">

              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="mb-3">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label>Nro Serie Dispositivo</label>
                      <input name="nroSerieDispositivo" className="form-control" value={form.nroSerieDispositivo} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                      <label>Fecha</label>
                      <input type="date" name="fecha" className="form-control" value={form.fecha} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                      <label>Empleado</label>
                      <input name="idEmpleado" className="form-control" value={form.idEmpleado} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <label>Descripción Daños</label>
                      <input name="descripcionDanos" className="form-control" value={form.descripcionDanos} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label>Diagnóstico</label>
                      <input name="diagnostico" className="form-control" value={form.diagnostico} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label>Presupuesto</label>
                      <input type="number" name="presupuesto" className="form-control" value={form.presupuesto} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mt-3 d-flex justify-content-end gap-2">
                    <button className="btn" style={{ background: colores.azul, color: colores.beige }}>Guardar</button>
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul }}
                      onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                  </div>
                </form>
              )}

              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Dispositivo</th>
                      <th>Fecha</th>
                      <th>Diagnóstico</th>
                      <th>Presupuesto</th>
                      <th>Empleado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o) => (
                      <tr key={o.nroDeOrden}>
                        <td>{o.nroDeOrden}</td>
                        <td>{o.nroSerieDispositivo}</td>
                        <td>{o.fecha}</td>
                        <td>{o.diagnostico}</td>
                        <td>{o.presupuesto}</td>
                        <td>{o.idEmpleado}</td>
                        <td>
                          <button className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul }}
                            onClick={() => handleConsultar(o.nroDeOrden)}>
                            <i className="bi bi-eye"></i> Consultar
                          </button>
                          <button className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul }}
                            onClick={() => handleModificar(o.nroDeOrden)}>
                            <i className="bi bi-pencil-square"></i> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- Modal de detalles --- */}
              {modalVisible && ordenActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog modal-lg">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16 }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige }}>
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Detalles de la Orden' : 'Editar Orden'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {/* Datos principales */}
                        {modalModo === 'modificar' && (
                          <form onSubmit={handleModalSave}>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label>Diagnóstico</label>
                                <input className="form-control"
                                  value={ordenActual.diagnostico || ""}
                                  onChange={e => setOrdenActual({ ...ordenActual, diagnostico: e.target.value })} />
                              </div>
                              <div className="col-md-6">
                                <label>Presupuesto</label>
                                <input className="form-control"
                                  value={ordenActual.presupuesto || ""}
                                  onChange={e => setOrdenActual({ ...ordenActual, presupuesto: e.target.value })} />
                              </div>
                            </div>
                            <button className="btn mt-3" style={{ background: colores.verdeAgua, color: colores.azul }}>Guardar cambios</button>
                          </form>
                        )}

                        {/* Tabla de detalles */}
                        <hr />
                        <h6 className="mt-3"><i className="bi bi-list-ul me-2"></i>Detalles de la Orden</h6>
                        <table className="table table-bordered table-sm">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Servicio</th>
                              <th>Repuesto</th>
                              <th>Proveedor</th>
                              <th>Costo Servicio</th>
                              <th>Costo Repuesto</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalles.map((d) => (
                              <tr key={d.idDetalle}>
                                <td>{d.idDetalle}</td>
                                <td>{d.codigoServicio}</td>
                                <td>{d.codRepuestos}</td>
                                <td>{d.cuitProveedor}</td>
                                <td>{d.costoServicio}</td>
                                <td>{d.costoRepuesto}</td>
                                <td>{d.subtotal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {modalModo === 'modificar' && (
                          <form onSubmit={handleAgregarDetalle} className="row g-2 mt-3">
                            <div className="col-md-2">
                              <input placeholder="ID" name="idDetalle" className="form-control" value={nuevoDetalle.idDetalle} onChange={handleDetalleChange} required />
                            </div>
                            <div className="col-md-2">
                              <input placeholder="Serv." name="codigoServicio" className="form-control" value={nuevoDetalle.codigoServicio} onChange={handleDetalleChange} required />
                            </div>
                            <div className="col-md-2">
                              <input placeholder="Repuesto" name="codRepuestos" className="form-control" value={nuevoDetalle.codRepuestos} onChange={handleDetalleChange} required />
                            </div>
                            <div className="col-md-2">
                              <input placeholder="Proveedor" name="cuitProveedor" className="form-control" value={nuevoDetalle.cuitProveedor} onChange={handleDetalleChange} required />
                            </div>
                            <div className="col-md-2">
                              <input placeholder="C.Serv" name="costoServicio" className="form-control" value={nuevoDetalle.costoServicio} onChange={handleDetalleChange} />
                            </div>
                            <div className="col-md-2">
                              <input placeholder="C.Rep" name="costoRepuesto" className="form-control" value={nuevoDetalle.costoRepuesto} onChange={handleDetalleChange} />
                            </div>
                            <div className="col-md-2 mt-2">
                              <input placeholder="Subtotal" name="subtotal" className="form-control" value={nuevoDetalle.subtotal} onChange={handleDetalleChange} />
                            </div>
                            <div className="col-md-2 mt-2">
                              <button className="btn btn-sm" style={{ background: colores.azul, color: colores.beige }}>Agregar Detalle</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Ordenes;
