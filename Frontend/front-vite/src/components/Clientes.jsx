import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';
import PiePagina from './PiePagina';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };

// Valida que el DNI tenga 7 u 8 dígitos numéricos
function validarDNI(dni) {
  return /^\d{7,8}$/.test(dni);
}

// Valida que el pasaporte tenga entre 6 y 15 caracteres alfanuméricos
function validarPasaporte(pasaporte) {
  return /^[A-Za-z0-9]{6,15}$/.test(pasaporte);
}

// Valida que el CUIT/CUIL tenga 11 dígitos numéricos
function validarCuitCuil(cuit) {
  return /^\d{11}$/.test(cuit);
}

// Valida que el teléfono tenga entre 10 y 11 dígitos numéricos
function validarTelefono(telefono) {
  return /^\d{10,11}$/.test(telefono);
}

const tiposDocumento = [
  { value: "DNI", label: "DNI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CUIT/CUIL", label: "CUIT/CUIL" },
];

const Clientes = () => {
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    tipoDocumento: '',
    numeroDni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    mail: '',
    activo: 1
  });
  const [clientes, setClientes] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar');
  const [clienteActual, setClienteActual] = useState(null);

  // Función para cargar clientes
  const fetchClientes = async () => {
    try {
      let url = 'http://localhost:5000/clientes/';
      url += mostrarInactivos ? '?activos=false' : '?activos=true';
      const response = await fetch(url);
      const data = await response.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje("Error al cargar clientes.");
    }
  };

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  //REGISTRO DE CLIENTES
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.tipoDocumento === "DNI" && !validarDNI(formData.numeroDni)) {
      alert("DNI inválido");
      return;
    }
    if (formData.tipoDocumento === "PASAPORTE" && !validarPasaporte(formData.numeroDni)) {
      alert("Pasaporte inválido");
      return;
    }
    if (formData.tipoDocumento === "CUIT/CUIL" && !validarCuitCuil(formData.numeroDni)) {
      alert("CUIT/CUIL inválido");
      return;
    }
    if (!validarTelefono(formData.telefono)) {
      alert("Teléfono inválido");
      return;
    }
    const datos = { ...formData, telefono: Number(formData.telefono) };
    const resultado = await registrarCliente(datos);
    setMensaje(resultado.mensaje || resultado.detail);
    setMostrarFormulario(false);
    setFormData({
      tipoDocumento: '',
      numeroDni: '',
      nombre: '',
      apellido: '',
      telefono: '',
      mail: '',
      activo: 1
    });
    // Recarga la lista
    setClientes([...clientes, formData]);
  };

  const registrarCliente = async (cliente) => {
    const response = await fetch('http://localhost:5000/clientes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });
    return await response.json();
  };



  // CONSULTA DE CLIENTES
  // La búsqueda individual no depende del estado activo
  const handleConsultar = async (tipoDocumento, numeroDni) => {
    const datos = await consultarCliente(tipoDocumento, numeroDni);
    setClienteActual(datos);
    setModalModo('consultar');
    setModalVisible(true);
  };

  const consultarCliente = async (tipoDocumento, numeroDni) => {
    const response = await fetch(`http://localhost:5000/clientes/${tipoDocumento}/${numeroDni}`);
    if (!response.ok) return {};
    return await response.json();
  };



  // MODIFICACION DE CLIENTES
  const handleModificar = async (tipoDocumento, numeroDni) => {
    const datos = await consultarCliente(tipoDocumento, numeroDni);
    setClienteActual({ ...datos });
    setModalModo('modificar');
    setModalVisible(true);
  };

  // API: Modificar cliente por DNI (asegura mayúsculas)
  const modificarCliente = async (tipoDocumento, numeroDni, datos) => {
    const tipoDoc = tipoDocumento.toUpperCase();
    // Convierte teléfono a número antes de enviar
    const datosAEnviar = { ...datos, telefono: Number(datos.telefono) };
    const response = await fetch(`http://localhost:5000/clientes/${tipoDoc}/${numeroDni}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosAEnviar)
    });
    return await response.json();
  };


  // Guardar cambios en cliente
  const handleModalSave = async (e) => {
    e.preventDefault();
    if (clienteActual) {
      // Convierte teléfono a número antes de enviar
      const datosAEnviar = { ...clienteActual, telefono: Number(clienteActual.telefono) };
      const resultado = await modificarCliente(clienteActual.tipoDocumento, clienteActual.numeroDni, datosAEnviar);
      setMensaje(resultado.mensaje || resultado.detail);
      setModalVisible(false);
      setClienteActual(null);
      setClientes(clientes.map(c =>
        c.tipoDocumento === clienteActual.tipoDocumento && String(c.numeroDni) === String(clienteActual.numeroDni)
          ? clienteActual : c
      ));
    }
  };

  // ELIMINACION (BAJA LOGICA)
  const handleEliminar = async (tipoDocumento, numeroDni) => {
    if (window.confirm('¿Seguro que desea dar de baja este cliente?')) {
      await fetch(`http://localhost:5000/clientes/${tipoDocumento}/${numeroDni}`, {
        method: 'DELETE'
      });
      await fetchClientes(); // <-- recarga la lista
    }
  };









  const handleModalClose = () => {
    setModalVisible(false);
    setClienteActual(null);
  };

  const handleAgregarClick = () => {
    setMostrarFormulario(!mostrarFormulario);
    setMensaje("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0">Gestión de Clientes</h4>
              <div className="d-flex flex-column flex-md-row gap-2">
                <button
                  className="btn mb-2 mb-md-0 me-md-2 w-100"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? 'Ver solo activos' : 'Ver también inactivos'}
                </button>
                <button
                  className="btn w-100"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={handleAgregarClick}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="form-container mb-3">
                  <div className="row">
                    <fieldset className="col-12 col-md-6" style={{ border: "none", marginBottom: "1.5rem" }}>
                      <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                        <i className="bi bi-person-badge me-2"></i>Datos personales
                      </legend>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-card-list me-2"></i>Tipo de Documento
                        </label>
                        <select
                          name="tipoDocumento"
                          value={formData.tipoDocumento}
                          onChange={handleChange}
                          required
                          className="form-control"
                        >
                          <option value="">Seleccione...</option>
                          {tiposDocumento.map(td => (
                            <option key={td.value} value={td.value}>{td.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-123 me-2"></i>Número de Documento
                        </label>
                        <input
                          type="text"
                          name="numeroDni"
                          value={formData.numeroDni}
                          onChange={handleChange}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-person me-2"></i>Nombre
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-person me-2"></i>Apellido
                        </label>
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          required
                          className="form-control"
                        />
                      </div>
                    </fieldset>
                    <fieldset className="col-12 col-md-6" style={{ border: "none", marginBottom: "1.5rem" }}>
                      <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                        <i className="bi bi-telephone me-2"></i>Datos de contacto
                      </legend>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-telephone me-2"></i>Teléfono
                        </label>
                        <input
                          type="text"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label>
                          <i className="bi bi-envelope me-2"></i>Email
                        </label>
                        <input
                          type="email"
                          name="mail"
                          value={formData.mail}
                          onChange={handleChange}
                          required
                          className="form-control"
                        />
                      </div>
                      <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                        <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                          <i className="bi bi-check2-circle me-2"></i>Estado
                        </legend>
                        <div className="form-group mb-2">
                          <label>
                            <i className="bi bi-check2-circle me-2"></i>Estado
                          </label>
                          <select name="activo" value={formData.activo} onChange={handleChange} className="form-control">
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
                        </div>
                      </fieldset>
                    </fieldset>
                  </div>
                  <div className="row">
                    <div className="col-12 d-flex flex-column flex-md-row justify-content-end">
                      <button type="submit" className="btn mb-2 mb-md-0" style={{ background: colores.azul, color: colores.beige }}>
                        <i className="bi bi-save me-1"></i>Guardar
                      </button>
                      <button type="button" className="btn ms-md-2" style={{ background: colores.dorado, color: colores.azul }} onClick={handleAgregarClick}>
                        <i className="bi bi-x-circle me-1"></i>Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              )}
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>
                  {mensaje}
                </div>
              )}
              {/* Modal para consultar o modificar cliente */}
              {modalVisible && clienteActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Cliente' : 'Modificar Cliente'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {modalModo === 'consultar' ? (
                          <div className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-person-badge me-2"></i>Datos personales
                              </legend>
                              <div className="form-group"><i className="bi bi-card-list me-2"></i><b>Tipo Documento:</b> {clienteActual.tipoDocumento}</div>
                              <div className="form-group"><i className="bi bi-123 me-2"></i><b>Número de Documento:</b> {clienteActual.numeroDni}</div>
                              <div className="form-group"><i className="bi bi-person me-2"></i><b>Nombre:</b> {clienteActual.nombre}</div>
                              <div className="form-group"><i className="bi bi-person me-2"></i><b>Apellido:</b> {clienteActual.apellido}</div>
                            </fieldset>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-telephone me-2"></i>Datos de contacto
                              </legend>
                              <div className="form-group"><i className="bi bi-telephone me-2"></i><b>Teléfono:</b> {clienteActual.telefono}</div>
                              <div className="form-group"><i className="bi bi-envelope me-2"></i><b>Correo:</b> {clienteActual.mail}</div>
                            </fieldset>
                            <fieldset style={{ border: "none" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </legend>
                              <div className="form-group"><i className="bi bi-check2-circle me-2"></i><b>Estado:</b> {clienteActual.activo === 1 ? "Activo" : "Inactivo"}</div>
                            </fieldset>
                          </div>
                        ) : (
                          <form onSubmit={handleModalSave} className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-person-badge me-2"></i>Datos personales
                              </legend>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-card-list me-2"></i>Tipo Documento
                                </label>
                                <select
                                  value={clienteActual.tipoDocumento}
                                  onChange={e => setClienteActual({ ...clienteActual, tipoDocumento: e.target.value })}
                                  required
                                  className="form-control"
                                >
                                  <option value="">Seleccione...</option>
                                  {tiposDocumento.map(td => (
                                    <option key={td.value} value={td.value}>{td.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-123 me-2"></i>Número de Documento
                                </label>
                                <input
                                  type="text"
                                  value={clienteActual.numeroDni}
                                  onChange={e => setClienteActual({ ...clienteActual, numeroDni: e.target.value })}
                                  required
                                  className="form-control"
                                />
                              </div>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-person me-2"></i>Nombre
                                </label>
                                <input
                                  type="text"
                                  value={clienteActual.nombre}
                                  onChange={e => setClienteActual({ ...clienteActual, nombre: e.target.value })}
                                  required
                                  className="form-control"
                                />
                              </div>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-person me-2"></i>Apellido
                                </label>
                                <input
                                  type="text"
                                  value={clienteActual.apellido}
                                  onChange={e => setClienteActual({ ...clienteActual, apellido: e.target.value })}
                                  required
                                  className="form-control"
                                />
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-telephone me-2"></i>Datos de contacto
                              </legend>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-telephone me-2"></i>Teléfono
                                </label>
                                <input
                                  type="text"
                                  value={clienteActual.telefono}
                                  onChange={e => setClienteActual({ ...clienteActual, telefono: e.target.value })}
                                  required
                                  className="form-control"
                                />
                              </div>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-envelope me-2"></i>Correo
                                </label>
                                <input
                                  type="email"
                                  value={clienteActual.mail}
                                  onChange={e => setClienteActual({ ...clienteActual, mail: e.target.value })}
                                  required
                                  className="form-control"
                                />
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </legend>
                              <div className="form-group">
                                <label style={{ color: colores.azul }}>
                                  <i className="bi bi-check2-circle me-2"></i>Estado
                                </label>
                                <select
                                  value={clienteActual.activo}
                                  onChange={e => setClienteActual({ ...clienteActual, activo: Number(e.target.value) })}
                                  className="form-control"
                                >
                                  <option value={1}>Activo</option>
                                  <option value={0}>Inactivo</option>
                                </select>
                              </div>
                            </fieldset>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <button type="submit" style={{ background: colores.azul, color: colores.beige }}>
                                <i className="bi bi-save me-1"></i>Guardar
                              </button>
                              <button type="button" style={{ marginLeft: 8, background: colores.dorado, color: colores.azul }} onClick={handleModalClose}>
                                <i className="bi bi-x-circle me-1"></i>Cancelar
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Tipo Doc</th>
                      <th>DNI</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(c => (
                      <tr
                        key={c.tipoDocumento + '-' + c.numeroDni}
                        style={c.activo === 0 ? { opacity: 0.5 } : {}}
                      >
                        <td>{c.tipoDocumento}</td>
                        <td>{c.numeroDni}</td>
                        <td>{c.nombre}</td>
                        <td>{c.apellido}</td>
                        <td>{c.telefono}</td>
                        <td>{c.mail}</td>
                        <td>{c.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(c.tipoDocumento, c.numeroDni)}
                          >
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(c.tipoDocumento, c.numeroDni)}
                          >
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          {c.activo !== false && (
                            <button
                              className="btn btn-sm"
                              style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                              onClick={() => handleEliminar(c.tipoDocumento, c.numeroDni)}
                            >
                              <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <PiePagina />
        </main>
      </div>
    </div>
  );
};

export default Clientes;
