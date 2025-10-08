import React, { useEffect, useState, useMemo } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000";

function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [repuestosProveedores, setRepuestosProveedores] = useState([]);

  const [mensaje, setMensaje] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('alta');

  const [form, setForm] = useState({
    nroDeOrden: null,
    nroSerieDispositivo: "",
    fecha: new Date().toISOString().split('T')[0],
    descripcionDanos: "",
    diagnostico: "",
    presupuesto: 0,
    idEmpleado: ""
  });

  const [detalles, setDetalles] = useState([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({
    codigoServicio: "",
    repuestoProveedor: "", // "codRepuesto/cuitProveedor"
    costoServicio: "",
    costoRepuesto: "",
    subtotal: ""
  });

  // --- Carga de Datos ---
  const fetchOrdenes = () => {
    fetch(`${API_URL}/ordenes/`)
      .then(res => res.json())
      .then(data => setOrdenes(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar órdenes"));
  };

  useEffect(() => {
    fetchOrdenes();
    fetch(`${API_URL}/dispositivos/?activos=true`).then(res => res.json()).then(setDispositivos);
    fetch(`${API_URL}/empleados/`).then(res => res.json()).then(setEmpleados);
    fetch(`${API_URL}/servicios/`).then(res => res.json()).then(data => setServicios(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/repuestos_con_proveedores`).then(res => res.json()).then(data => setRepuestosProveedores(Array.isArray(data) ? data : []));
  }, []);

  // --- Presupuesto autocalculado ---
  const presupuestoTotal = useMemo(() => {
    return detalles.reduce((total, det) => total + parseFloat(det.subtotal || 0), 0);
  }, [detalles]);

  useEffect(() => {
    if (modalVisible) {
      setForm(prev => ({ ...prev, presupuesto: presupuestoTotal }));
    }
  }, [presupuestoTotal, modalVisible]);


  // --- Validaciones ---
  function validarOrden(data) {
    const errors = {};
    if (!data.nroSerieDispositivo) errors.nroSerieDispositivo = "El dispositivo es obligatorio.";
    if (!data.idEmpleado) errors.idEmpleado = "El empleado es obligatorio.";
    if (!data.fecha) errors.fecha = "La fecha es obligatoria.";
    return errors;
  }

  // --- Manejadores de Modal ---
  const handleModalClose = () => setModalVisible(false);

  const handleAgregarClick = () => {
    setModalModo('alta');
    setForm({
      nroDeOrden: null,
      nroSerieDispositivo: "",
      fecha: new Date().toISOString().split('T')[0],
      descripcionDanos: "",
      diagnostico: "",
      presupuesto: 0,
      idEmpleado: ""
    });
    setDetalles([]);
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  const handleModificar = (orden) => {
    setModalModo('modificar');
    setForm(orden);
    fetch(`${API_URL}/ordenes/${orden.nroDeOrden}/detalles/`)
        .then(res => res.json())
        .then(data => setDetalles(Array.isArray(data) ? data : []));
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  const handleConsultar = (orden) => {
    setModalModo('consultar');
    setForm(orden);
    fetch(`${API_URL}/ordenes/${orden.nroDeOrden}/detalles/`)
        .then(res => res.json())
        .then(data => setDetalles(Array.isArray(data) ? data : []));
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };
  
  // --- Manejadores de Formularios ---
  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNuevoDetalleChange = (e) => {
    const { name, value } = e.target;
    let updatedDetalle = { ...nuevoDetalle, [name]: value };

    // --- Lógica de autocompletar costos ---
    let costoServ = parseFloat(updatedDetalle.costoServicio || 0);
    let costoRep = parseFloat(updatedDetalle.costoRepuesto || 0);

    if (name === "codigoServicio") {
        const servicioSeleccionado = servicios.find(s => s.codigo.toString() === value);
        costoServ = servicioSeleccionado ? parseFloat(servicioSeleccionado.precioBase) : 0;
        updatedDetalle.costoServicio = costoServ;
    }

    if (name === "repuestoProveedor") {
        const [codRepuesto, cuilProv] = value.split('/');
        let costoEncontrado = 0;
        if(codRepuesto && cuilProv) {
            const repuesto = repuestosProveedores.find(r => r.codigo.toString() === codRepuesto);
            if(repuesto) {
                const prov = repuesto.proveedores.find(p => p.cuilProveedor === cuilProv);
                costoEncontrado = prov ? parseFloat(prov.costo) : 0;
            }
        }
        costoRep = costoEncontrado;
        updatedDetalle.costoRepuesto = costoRep;
    }
    
    updatedDetalle.subtotal = costoServ + costoRep;
    setNuevoDetalle(updatedDetalle);
  };
  
  // --- Acciones CRUD ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validarOrden(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMensaje("Por favor, corrige los errores.");
      return;
    }
    
    const payload = { ...form, detalles: modalModo === 'alta' ? detalles : undefined };

    fetch(`${API_URL}/ordenes/`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`Error al crear la orden.`);
        return res.json();
    })
    .then(() => {
        handleModalClose();
        fetchOrdenes();
    })
    .catch(err => setMensaje(err.message));
  };
  
  const handleAgregarDetalleLocal = (e) => {
    e.preventDefault();
    const [codRepuestos, cuitProveedor] = (nuevoDetalle.repuestoProveedor || "").split('/');
    
    const detalleCompleto = {
      idDetalle: Date.now(), // ID temporal para el key en React
      codigoServicio: nuevoDetalle.codigoServicio,
      costoServicio: nuevoDetalle.costoServicio,
      codRepuestos,
      cuitProveedor,
      costoRepuesto: nuevoDetalle.costoRepuesto,
      subtotal: nuevoDetalle.subtotal
    };
    
    setDetalles(prev => [...prev, detalleCompleto]);
    setNuevoDetalle({ codigoServicio: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" });
  };

  const handleRemoveDetalleLocal = (idDetalle) => {
    setDetalles(prev => prev.filter(d => d.idDetalle !== idDetalle));
  };

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column">
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid #1f3345`, borderRadius: 16, background: "var(--color-beige)" }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: '#1f3345', color: '#f0ede5', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-clipboard-data me-2"></i>Gestión de Órdenes</h4>
              <button className="btn btn-verdeAgua" onClick={handleAgregarClick}>
                <i className="bi bi-plus-lg"></i> Agregar Orden
              </button>
            </div>
            <div className="card-body">
              {mensaje && <div className="alert alert-info">{mensaje}</div>}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Dispositivo</th>
                      <th>Empleado</th>
                      <th>Fecha</th>
                      <th>Diagnóstico</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o) => (
                      <tr key={o.nroDeOrden}>
                        <td>{o.nroDeOrden}</td>
                        <td>{o.dispositivo_info}</td>
                        <td>{o.empleado_info}</td>
                        <td>{o.fecha}</td>
                        <td>{o.diagnostico}</td>
                        <td>
                          <button className="btn btn-sm btn-verdeAgua fw-bold me-1" onClick={() => handleConsultar(o)}>
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button className="btn btn-sm btn-dorado fw-bold" onClick={() => handleModificar(o)}>
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

      {modalVisible && (
        <div className="modal">
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{modalModo === 'alta' ? 'Nueva Orden' : modalModo === 'modificar' ? 'Modificar Orden' : 'Consultar Orden'}</h5>
                  <button type="button" className="btn-close" onClick={handleModalClose}></button>
                </div>
                <div className="modal-body">
                  <fieldset>
                    <legend>Datos de la Orden</legend>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label>Dispositivo</label>
                        <select name="nroSerieDispositivo" value={form.nroSerieDispositivo} onChange={handleFormChange} className="form-select" disabled={modalModo !== 'alta'}>
                          <option value="">Seleccione un dispositivo</option>
                          {dispositivos.map(d => <option key={d.nroSerie} value={d.nroSerie}>{`${d.marca} ${d.modelo} (${d.nroSerie})`}</option>)}
                        </select>
                        {formErrors.nroSerieDispositivo && <div className="input-error-message">{formErrors.nroSerieDispositivo}</div>}
                      </div>
                      <div className="col-md-6">
                        <label>Empleado Asignado</label>
                        <select name="idEmpleado" value={form.idEmpleado} onChange={handleFormChange} className="form-select" disabled={modalModo === 'consultar'}>
                          <option value="">Seleccione un empleado</option>
                          {empleados.map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{`${e.nombre} ${e.apellido}`}</option>)}
                        </select>
                        {formErrors.idEmpleado && <div className="input-error-message">{formErrors.idEmpleado}</div>}
                      </div>
                      <div className="col-md-4">
                        <label>Fecha</label>
                        <input type="date" name="fecha" value={form.fecha} onChange={handleFormChange} className="form-control" disabled={modalModo === 'consultar'} />
                        {formErrors.fecha && <div className="input-error-message">{formErrors.fecha}</div>}
                      </div>
                      <div className="col-md-8">
                        <label>Descripción de Daños</label>
                        <input name="descripcionDanos" value={form.descripcionDanos} onChange={handleFormChange} className="form-control" readOnly={modalModo === 'consultar'} />
                      </div>
                      <div className="col-md-8">
                        <label>Diagnóstico</label>
                        <input name="diagnostico" value={form.diagnostico} onChange={handleFormChange} className="form-control" readOnly={modalModo === 'consultar'} />
                      </div>
                       <div className="col-md-4">
                        <label>Presupuesto Total</label>
                        <input type="number" name="presupuesto" value={form.presupuesto} className="form-control" readOnly />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="mt-4">
                      <legend>Detalles de la Orden</legend>
                      <table className="table table-sm">
                          <thead><tr><th>Servicio</th><th>Repuesto</th><th>Costo Serv.</th><th>Costo Rep.</th><th>Subtotal</th><th>Acciones</th></tr></thead>
                          <tbody>
                              {detalles.map(d => <tr key={d.idDetalle}>
                                <td>{d.codigoServicio}</td>
                                <td>{d.codRepuestos}</td>
                                <td>{d.costoServicio}</td>
                                <td>{d.costoRepuesto}</td>
                                <td>{d.subtotal}</td>
                                <td>
                                  {modalModo === 'alta' && 
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveDetalleLocal(d.idDetalle)}>X</button>}
                                </td>
                              </tr>)}
                          </tbody>
                      </table>
                      {detalles.length === 0 && <p className="text-muted">No hay detalles para esta orden.</p>}
                      
                      {modalModo !== 'consultar' && (
                          <form onSubmit={handleAgregarDetalleLocal} className="row g-2 mt-2 align-items-end">
                              <div className="col">
                                <label>Servicio</label>
                                <select name="codigoServicio" value={nuevoDetalle.codigoServicio} onChange={handleNuevoDetalleChange} className="form-select"><option value="">Seleccione</option>{servicios.map(s=><option key={s.codigo} value={s.codigo}>{s.descripcion}</option>)}</select>
                              </div>
                              <div className="col">
                                <label>Repuesto</label>
                                <select name="repuestoProveedor" value={nuevoDetalle.repuestoProveedor} onChange={handleNuevoDetalleChange} className="form-select"><option value="">Seleccione</option>{repuestosProveedores.flatMap(r => r.proveedores.map(p => <option key={`${r.codigo}-${p.cuilProveedor}`} value={`${r.codigo}/${p.cuilProveedor}`}>{`${r.marca} ${r.modelo} - ${p.razonSocial}`}</option>))}</select>
                              </div>
                              <div className="col">
                                <label>Costo Serv.</label>
                                <input name="costoServicio" value={nuevoDetalle.costoServicio} className="form-control" readOnly/>
                              </div>
                              <div className="col">
                                <label>Costo Rep.</label>
                                <input name="costoRepuesto" value={nuevoDetalle.costoRepuesto} className="form-control" readOnly/>
                              </div>
                              <div className="col">
                                <label>Subtotal</label>
                                <input name="subtotal" value={nuevoDetalle.subtotal} className="form-control" readOnly/>
                              </div>
                              <div className="col-auto">
                                <button type="submit" className="btn btn-secondary">Añadir</button>
                              </div>
                          </form>
                      )}
                  </fieldset>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Cerrar</button>
                  {modalModo !== 'consultar' && <button type="submit" className="btn btn-primary">Guardar</button>}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ordenes;