import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };
const API_URL = "http://localhost:5000/clientes/";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [form, setForm] = useState({
    tipoDocumento: "",
    numeroDoc: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    activo: 1,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
  const [clienteActual, setClienteActual] = useState(null);

  // Cargar clientes
  const fetchClientes = async () => {
    let url = API_URL + (mostrarInactivos ? "?activos=false" : "?activos=true");
    const res = await fetch(url);
    const data = await res.json();
    setClientes(Array.isArray(data) ? data : []);
  };

  // Cargar tipos de documento
  const fetchTiposDocumento = async () => {
    const res = await fetch("http://localhost:5000/tipos-documento/");
    const data = await res.json();
    setTiposDocumento(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchClientes();
    fetchTiposDocumento();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAgregarClick = () => {
    setMostrarFormulario(!mostrarFormulario);
    setMensaje("");
  };

  function validarDocumento(tipo, numero) {
    if (tipo === "DNI") return /^\d{7,8}$/.test(numero);
    if (tipo === "CUIT" || tipo === "CUIL") return /^\d{11}$/.test(numero);
    if (tipo === "PASAPORTE") return /^[A-Z0-9]{6,9}$/.test(numero);
    return true;
  }

  function validarCliente(form) {
    if (!form.tipoDocumento) return "Debe seleccionar el tipo de documento.";
    if (!form.numeroDoc || !validarDocumento(form.tipoDocumento, form.numeroDoc)) return "Número de documento inválido para el tipo seleccionado.";
    if (!form.nombre || form.nombre.trim().length < 2) return "El nombre es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.apellido || form.apellido.trim().length < 2) return "El apellido es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.telefono || form.telefono.trim().length < 6) return "El teléfono es obligatorio y debe tener al menos 6 caracteres.";
    if (!form.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) return "El email no es válido.";
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") return "El estado es obligatorio.";
    return null;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    const error = validarCliente(form);
    if (error) {
      setMensaje(error);
      return;
    }
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const resultado = await res.json();
    setMensaje(resultado.mensaje || resultado.detail);
    setMostrarFormulario(false);
    setForm({
      tipoDocumento: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      activo: 1,
    });
    fetchClientes();
  };

  // Consultar cliente
  const handleConsultar = (cliente) => {
    setClienteActual({
      ...cliente,
      tipoDocumento: cliente.tipoDocumento || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      activo: cliente.activo ?? 1,
    });
    setModalModo('consultar');
    setModalVisible(true);
  };

  // Modificar cliente
  const handleModificar = (cliente) => {
    setClienteActual({
      ...cliente,
      tipoDocumento: cliente.tipoDocumento || "",
      numeroDoc: cliente.numeroDoc || "",
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      activo: cliente.activo ?? 1,
    });
    setModalModo('modificar');
    setModalVisible(true);
  };

  // Eliminar cliente
  const handleEliminar = async (idCliente) => {
    const [tipoDocumento, numeroDoc] = idCliente.split("-");
    await fetch(`${API_URL}${tipoDocumento}/${numeroDoc}`, { method: "DELETE" });
    fetchClientes();
  };

  // Guardar modificación
  const handleGuardarModificacion = async () => {
    const error = validarCliente(clienteActual);
    if (error) {
      setMensaje(error);
      return;
    }
    if (!clienteActual || !clienteActual.idCliente) {
      setMensaje("Error: No se seleccionó cliente para modificar.");
      return;
    }
    const [tipoDocumento, numeroDoc] = clienteActual.idCliente.split("-");
    await fetch(`${API_URL}${tipoDocumento}/${numeroDoc}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clienteActual),
    });
    setModalVisible(false);
    fetchClientes();
  };

  // Actualiza campos del cliente en edición
  const handleModalChange = e => {
    setClienteActual({ ...clienteActual, [e.target.name]: e.target.value });
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-person-badge me-2"></i>Gestión de Clientes</h4>
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
                  onClick={handleAgregarClick}
                >
                  <i className="bi bi-plus-lg"></i> Agregar cliente
                </button>
              </div>
            </div>
            <div className="card-body">
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="form-container mb-3">
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-vcard me-2"></i>Datos personales
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-card-list me-2"></i>Tipo de documento</label>
                          <select
                            name="tipoDocumento"
                            value={form.tipoDocumento || ""}
                            onChange={handleChange}
                            className="form-control"
                            required
                          >
                            <option value="">Seleccione tipo de documento</option>
                            {tiposDocumento.map(td => (
                              <option key={td.codigo || td.codTipoDoc} value={td.codigo || td.codTipoDoc}>{td.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Número de documento</label>
                          <input
                            type="text"
                            name="numeroDoc"
                            value={form.numeroDoc || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Nombre</label>
                          <input
                            type="text"
                            name="nombre"
                            value={form.nombre || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Apellido</label>
                          <input
                            type="text"
                            name="apellido"
                            value={form.apellido || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-telephone me-2"></i>Datos de contacto
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-telephone me-2"></i>Teléfono</label>
                          <input
                            type="text"
                            name="telefono"
                            value={form.telefono || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-envelope me-2"></i>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email || ""}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                        </div>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select name="activo" value={form.activo} onChange={handleChange} className="form-control">
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
                        </div>
                      </fieldset>
                    </div>
                  </div>
                  {/* Mensaje de error visible dentro del formulario */}
                  {mensaje && (
                    <div className="alert alert-danger" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}>
                      {mensaje}
                    </div>
                  )}
                  <div className="row mt-3">
                    <div className="col-12 d-flex flex-column flex-md-row justify-content-end gap-2">
                      <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige, fontWeight: 600, borderRadius: "8px" }}>
                        <i className="bi bi-save me-1"></i>Guardar
                      </button>
                      <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px" }} onClick={handleAgregarClick}>
                        <i className="bi bi-x-circle me-1"></i>Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              )}
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      {/* <th>ID</th> <-- QUITADO */}
                      <th>Tipo Doc</th>
                      <th>Número Doc</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr key={c.idCliente}>
                        {/* <td>{c.idCliente}</td> <-- QUITADO */}
                        <td>{tiposDocumento.find(td => (td.codigo || td.codTipoDoc) === c.tipoDocumento)?.nombre || c.tipoDocumento}</td>
                        <td>{c.numeroDoc}</td>
                        <td>{c.nombre}</td>
                        <td>{c.apellido}</td>
                        <td>{c.telefono}</td>
                        <td>{c.email}</td>
                        <td>{c.activo ? "Sí" : "No"}</td>
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, borderRadius: "8px", border: 'none' }}
                            onClick={() => handleConsultar(c)}
                          >
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, borderRadius: "8px", border: 'none' }}
                            onClick={() => handleModificar(c)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, borderRadius: "8px", border: 'none' }}
                            onClick={() => c.idCliente && handleEliminar(c.idCliente)}
                          >
                            <i className="bi bi-trash me-1"></i>Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {clientes.length === 0 && (
                  <div className="text-center text-muted py-4">No hay clientes registrados.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Modal para consultar/modificar */}
      {modalVisible && clienteActual && (
        <div className="modal" style={{
          display: "block", background: "#0008", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999
        }}>
          <div className="modal-dialog" style={{ margin: "5rem auto", maxWidth: 500 }}>
            <div className="modal-content" style={{ background: colores.beige, borderRadius: 16 }}>
              <div className="modal-header" style={{ background: colores.azul, color: colores.beige }}>
                <h5 className="modal-title">
                  {modalModo === 'consultar' ? "Consultar cliente" : "Modificar cliente"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-person-vcard me-2"></i>Datos personales
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-card-list me-2"></i>Tipo de documento</label>
                          <select
                            name="tipoDocumento"
                            className="form-control"
                            value={clienteActual.tipoDocumento || ""}
                            onChange={handleModalChange}
                            disabled={modalModo === 'consultar'}
                          >
                            <option value="">Seleccione tipo de documento</option>
                            {tiposDocumento.map(td => (
                              <option key={td.codigo || td.codTipoDoc} value={td.codigo || td.codTipoDoc}>{td.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Número de documento</label>
                          <input className="form-control" name="numeroDoc" value={clienteActual.numeroDoc || ""}
                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Nombre</label>
                          <input className="form-control" name="nombre" value={clienteActual.nombre || ""}
                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person me-2"></i>Apellido</label>
                          <input className="form-control" name="apellido" value={clienteActual.apellido || ""}
                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-12 col-md-6">
                      <fieldset style={{ border: "none" }}>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-telephone me-2"></i>Datos de contacto
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-telephone me-2"></i>Teléfono</label>
                          <input className="form-control" name="telefono" value={clienteActual.telefono || ""}
                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-envelope me-2"></i>Email</label>
                          <input className="form-control" name="email" value={clienteActual.email || ""}
                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                        </div>
                        <legend style={{ fontWeight: 700, color: colores.azul, marginBottom: "1rem", fontSize: "1.3rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select className="form-control" name="activo"
                            value={clienteActual.activo}
                            onChange={handleModalChange}
                            disabled={modalModo === 'consultar'}>
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
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn" style={{ background: colores.azul, color: colores.beige }} onClick={() => setModalVisible(false)}>
                  Cerrar
                </button>
                {modalModo === 'modificar' && (
                  <button className="btn" style={{ background: colores.dorado, color: colores.azul }} onClick={handleGuardarModificacion}>
                    Guardar cambios
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

