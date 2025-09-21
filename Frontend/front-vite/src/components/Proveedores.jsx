import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    cuil: '',
    razonSocial: '',
    telefono: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar');
  const [proveedorActual, setProveedorActual] = useState(null);

  // Función para cargar proveedores
  const fetchProveedores = async () => {
    try {
      let url = 'http://localhost:5000/proveedores/';
      url += mostrarInactivos ? '?activos=false' : '?activos=true';
      const response = await fetch(url);
      const data = await response.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje("Error al cargar proveedores.");
    }
  };

  useEffect(() => {
    fetchProveedores();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  const handleEliminar = async (cuil) => {
    if (window.confirm('¿Seguro que desea dar de baja este proveedor?')) {
      try {
        const response = await fetch(`http://localhost:5000/proveedores/${cuil}`, {
          method: 'DELETE'
        });
        const resultado = await response.json();
        setMensaje(resultado.mensaje || resultado.detail);
        setProveedores(proveedores.map(p =>
          p.cuil === cuil ? { ...p, activo: false } : p
        ));
      } catch (error) {
        setMensaje('Error al eliminar proveedor.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { cuil, telefono } = formData;
    if (!validarCuit(cuil)) {
      alert("CUIT inválido");
      return;
    }
    if (!validarTelefono(telefono)) {
      alert("Teléfono inválido");
      return;
    }
    const response = await fetch('http://localhost:5000/proveedores/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const resultado = await response.json();
    setMensaje(resultado.mensaje || resultado.detail);
    setMostrarFormulario(false);
    setFormData({ cuil: '', razonSocial: '', telefono: '', activo: 1 });
    setProveedores([...proveedores, formData]);
  };

  // CONSULTAR proveedor
  const handleConsultar = async (cuil) => {
    const response = await fetch(`http://localhost:5000/proveedores/${cuil}`);
    if (!response.ok) {
      setMensaje("Proveedor no encontrado");
      return;
    }
    const datos = await response.json();
    setProveedorActual(datos);
    setModalModo('consultar');
    setModalVisible(true);
  };

  // MODIFICAR proveedor
  const handleModificar = async (cuil) => {
    const response = await fetch(`http://localhost:5000/proveedores/${cuil}`);
    if (!response.ok) {
      setMensaje("Proveedor no encontrado");
      return;
    }
    const datos = await response.json();
    setProveedorActual({ ...datos });
    setModalModo('modificar');
    setModalVisible(true);
  };

  const modificarProveedor = async (cuil, datos) => {
    const response = await fetch(`http://localhost:5000/proveedores/${cuil}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    if (proveedorActual) {
      if (!validarCuit(proveedorActual.cuil)) {
        alert("CUIT inválido");
        return;
      }
      if (!validarTelefono(proveedorActual.telefono)) {
        alert("Teléfono inválido");
        return;
      }
      const resultado = await modificarProveedor(proveedorActual.cuil, proveedorActual);
      setMensaje(resultado.mensaje || resultado.detail);
      setModalVisible(false);
      setProveedorActual(null);
      setProveedores(proveedores.map(p =>
        String(p.cuil) === String(proveedorActual.cuil)
          ? proveedorActual : p
      ));
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setProveedorActual(null);
  };

  function validarCuit(cuit) {
    return /^\d{11}$/.test(cuit);
  }

  function validarTelefono(telefono) {
    return /^\d{10,11}$/.test(telefono);
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0" style={{ letterSpacing: 1 }}>Gestión de Proveedores</h4>
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
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body" style={{ background: colores.beige }}>
              {mostrarFormulario && (
                <form className="mb-3" style={{ background: colores.beige, borderRadius: 12, border: `1px solid ${colores.verdeAgua}`, padding: 16 }} onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-3">
                      <input type="text" name="cuil" value={formData.cuil} onChange={e => setFormData({ ...formData, cuil: e.target.value })} className="form-control" placeholder="CUIL" required />
                    </div>
                    <div className="col-md-3">
                      <input type="text" name="razonSocial" value={formData.razonSocial} onChange={e => setFormData({ ...formData, razonSocial: e.target.value })} className="form-control" placeholder="Razón Social" required />
                    </div>
                    <div className="col-md-3">
                      <input type="text" name="telefono" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="form-control" placeholder="Teléfono" required />
                    </div>
                    <div className="col-md-3">
                      <select name="activo" value={formData.activo} onChange={e => setFormData({ ...formData, activo: Number(e.target.value) })} className="form-select">
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}>Guardar</button>
                    <button type="button" className="btn" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }} onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                  </div>
                </form>
              )}
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>{mensaje}</div>
              )}
              {/* Modal para consultar o modificar proveedor */}
              {modalVisible && proveedorActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Proveedor' : 'Modificar Proveedor'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {modalModo === 'consultar' ? (
                          <ul className="list-group">
                            <li className="list-group-item"><b>CUIL:</b> {proveedorActual.cuil}</li>
                            <li className="list-group-item"><b>Razón Social:</b> {proveedorActual.razonSocial}</li>
                            <li className="list-group-item"><b>Teléfono:</b> {proveedorActual.telefono}</li>
                          </ul>
                        ) : (
                          <form onSubmit={handleModalSave}>
                            <div className="mb-2">
                              <label className="form-label">CUIL</label>
                              <input type="text" className="form-control" value={proveedorActual.cuil} onChange={e => setProveedorActual({ ...proveedorActual, cuil: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Razón Social</label>
                              <input type="text" className="form-control" value={proveedorActual.razonSocial} onChange={e => setProveedorActual({ ...proveedorActual, razonSocial: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Teléfono</label>
                              <input type="text" className="form-control" value={proveedorActual.telefono} onChange={e => setProveedorActual({ ...proveedorActual, telefono: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Estado</label>
                              <select className="form-select" value={proveedorActual.activo} onChange={e => setProveedorActual({ ...proveedorActual, activo: Number(e.target.value) })}>
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
                      <th>CUIL</th>
                      <th>Razón Social</th>
                      <th>Teléfono</th>
                      <th>Estado</th> 
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov) => (
                      <tr key={prov.cuil} style={prov.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{prov.cuil}</td>
                        <td>{prov.razonSocial}</td>
                        <td>{prov.telefono}</td>
                        <td>{prov.activo === 1 ? "Activo" : "Inactivo"}</td> {/* Estado visible */}
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(prov.cuil)}
                          >
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(prov.cuil)}
                          >
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          {prov.activo !== false && (
                            <button
                              className="btn btn-sm"
                              style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                              onClick={() => handleEliminar(prov.cuil)}
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

export default Proveedores;
