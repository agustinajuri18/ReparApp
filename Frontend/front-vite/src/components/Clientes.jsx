
import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

// Paleta de colores personalizada
const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};



const Clientes = () => {
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero_dni: '',
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







  // CARGA DE CLIENTES AL RENDERIZAR EL COMPONENTE
  // Solo filtrar por activos al cargar la lista inicial
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        let url = 'http://localhost:5000/clientes/';
        if (!mostrarInactivos) {
          url += '?activos=true';
        } else {
          url += '?activos=false';
        }
        const response = await fetch(url);
        const data = await response.json();
        setClientes(Array.isArray(data) ? data : []);
      } catch (error) {
        setMensaje("Error al cargar clientes.");
      }
    };
    fetchClientes();
  }, [mostrarInactivos]);












  //REGISTRO DE CLIENTES
  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultado = await registrarCliente(formData);
    setMensaje(resultado.mensaje || resultado.detail);
    setMostrarFormulario(false);
    setFormData({
      tipo_documento: '',
      numero_dni: '',
      nombre: '',
      apellido: '',
      telefono: '',
      mail: '',
      activo: 1
    });
    // Actualiza la lista de clientes (simulado)
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
  const handleConsultar = async (dni) => {
    const datos = await consultarCliente(dni);
    setClienteActual(datos);
    setModalModo('consultar');
    setModalVisible(true);
  };

  const consultarCliente = async (dni) => {
    const response = await fetch(`http://localhost:5000/clientes/${dni}`);
    return await response.json();
  };








  // MODIFICACION DE CLIENTES
  const handleModificar = async (dni) => {
    const datos = await consultarCliente(dni);
    setClienteActual({ ...datos }); // Copia para edición local
    setModalModo('modificar');
    setModalVisible(true);
  };

  

  // API: Modificar cliente por DNI
  const modificarCliente = async (dni, datos) => {
    const response = await fetch(`http://localhost:5000/clientes/${dni}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  };


  // Guardar cambios en cliente
  const handleModalSave = async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página al enviar.
    if (clienteActual) { // Verifica que hay un cliente seleccionado para editar.
      const resultado = await modificarCliente(clienteActual.numero_dni, clienteActual); // Envía los datos modificados al backend usando la API.
      setMensaje(resultado.mensaje || resultado.detail); // Muestra el mensaje de respuesta del backend.
      setModalVisible(false); // Cierra el modal de edición.
      setClienteActual(null); // Limpia el estado del cliente actual.
      setClientes(clientes.map(c => c.numero_dni === clienteActual.numero_dni ? clienteActual : c)); // Actualiza la lista de clientes en el frontend con los datos modificados.
    }
  };

  // ELIMINACION (BAJA LOGICA)
  const handleEliminar = async (dni) => {
    if (window.confirm('¿Seguro que desea dar de baja este cliente?')) {
      try {
        const response = await fetch(`http://localhost:5000/clientes/${dni}`, {
          method: 'DELETE'
        });
        const resultado = await response.json();
        setMensaje(resultado.mensaje || resultado.detail);
        // Recargar la lista de clientes
        setClientes(clientes.map(c =>
          c.numero_dni === dni ? { ...c, activo: false } : c
        ));
      } catch (error) {
        setMensaje('Error al eliminar cliente.');
      }
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
  <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div className="row">
        <MenuLateral />
  <main className="col-9 col-md-10 pt-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0" style={{ letterSpacing: 1 }}>Gestión de Clientes</h4>
              <div>
                <button
                  className="btn me-2"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? 'Ver solo activos' : 'Ver también inactivos'}
                </button>
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={handleAgregarClick}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body" style={{ background: colores.beige }}>
              {mostrarFormulario && (
                <form onSubmit={handleSubmit} className="mb-3" style={{ background: colores.beige, borderRadius: 12, border: `1px solid ${colores.verdeAgua}`, padding: 16 }}>
                  <div className="row">
                    <div className="col-md-2">
                      <input type="text" name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="form-control" placeholder="Tipo Documento" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="numero_dni" value={formData.numero_dni} onChange={handleChange} className="form-control" placeholder="DNI" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-control" placeholder="Nombre" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="form-control" placeholder="Apellido" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="form-control" placeholder="Teléfono" required />
                    </div>
                    <div className="col-md-2">
                      <input type="email" name="mail" value={formData.mail} onChange={handleChange} className="form-control" placeholder="Correo" required />
                    </div>
                    <div className="col-md-2 mt-2">
                      <select name="activo" value={formData.activo} onChange={handleChange} className="form-select">
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button type="submit" className="btn me-2" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}>Guardar</button>
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }} onClick={handleAgregarClick}>Cancelar</button>
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
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Cliente' : 'Modificar Cliente'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {modalModo === 'consultar' ? (
                          <ul className="list-group">
                            <li className="list-group-item"><b>Tipo Documento:</b> {clienteActual.tipo_documento}</li>
                            <li className="list-group-item"><b>DNI:</b> {clienteActual.numero_dni}</li>
                            <li className="list-group-item"><b>Nombre:</b> {clienteActual.nombre}</li>
                            <li className="list-group-item"><b>Apellido:</b> {clienteActual.apellido}</li>
                            <li className="list-group-item"><b>Teléfono:</b> {clienteActual.telefono}</li>
                            <li className="list-group-item"><b>Correo:</b> {clienteActual.mail}</li>
                          </ul>
                        ) : (
                          <form onSubmit={handleModalSave}>
                            <div className="mb-2">
                              <label className="form-label">Tipo Documento</label>
                              <input type="text" className="form-control" value={clienteActual.tipo_documento} onChange={e => setClienteActual({ ...clienteActual, tipo_documento: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">DNI</label>
                              <input type="text" className="form-control" value={clienteActual.numero_dni} onChange={e => setClienteActual({ ...clienteActual, numero_dni: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Nombre</label>
                              <input type="text" className="form-control" value={clienteActual.nombre} onChange={e => setClienteActual({ ...clienteActual, nombre: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Apellido</label>
                              <input type="text" className="form-control" value={clienteActual.apellido} onChange={e => setClienteActual({ ...clienteActual, apellido: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Teléfono</label>
                              <input type="text" className="form-control" value={clienteActual.telefono} onChange={e => setClienteActual({ ...clienteActual, telefono: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Correo</label>
                              <input type="email" className="form-control" value={clienteActual.mail} onChange={e => setClienteActual({ ...clienteActual, mail: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Estado</label>
                              <select className="form-select" value={clienteActual.activo} onChange={e => setClienteActual({ ...clienteActual, activo: Number(e.target.value) })}>
                                <option value={1}>Activo</option>
                                <option value={0}>Inactivo</option>
                              </select>
                            </div>
                            <div className="d-flex justify-content-end">
                              <button type="submit" className="btn btn-success me-2">Guardar</button>
                              <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Cancelar</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(cliente => (
                      <tr key={cliente.numero_dni} style={cliente.activo === false ? { opacity: 0.5 } : {}}>
                        <td>{cliente.numero_dni}</td>
                        <td>{cliente.nombre}</td>
                        <td>{cliente.apellido}</td>
                        <td>{cliente.telefono}</td>
                        <td>{cliente.mail}</td>
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(cliente.numero_dni)}
                          >
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(cliente.numero_dni)}
                          >
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          {cliente.activo !== false && (
                            <button
                              className="btn btn-sm"
                              style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                              onClick={() => handleEliminar(cliente.numero_dni)}
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
        </main>
      </div>
    </div>
  );
};

export default Clientes;
