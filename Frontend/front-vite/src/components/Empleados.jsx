import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = { 
  azul: '#1f3345', 
  dorado: '#c78f57', 
  rojo: '#b54745', 
  verdeAgua: '#85abab', 
  beige: '#f0ede5' 
};

const Empleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    idEmpleado: '',
    nombre: '',
    apellido: '',
    idRol: '',
    idUsuario: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar');
  const [empleadoActual, setEmpleadoActual] = useState(null);

  // Cargar empleados
  const fetchEmpleados = async () => {
    try {
      let url = 'http://localhost:5000/empleados/';
      url += mostrarInactivos ? '?activos=false' : '?activos=true';
      const response = await fetch(url);
      const data = await response.json();
      setEmpleados(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje("Error al cargar empleados.");
    }
  };

  useEffect(() => {
    fetchEmpleados();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  // Baja lógica
  const handleEliminar = async (idEmpleado) => {
    if (window.confirm('¿Seguro que desea dar de baja este empleado?')) {
      try {
        const response = await fetch(`http://localhost:5000/empleados/${idEmpleado}`, {
          method: 'DELETE'
        });
        const resultado = await response.json();
        setMensaje(resultado.mensaje || resultado.detail);
        setEmpleados(empleados.map(e =>
          e.idEmpleado === idEmpleado ? { ...e, activo: false } : e
        ));
      } catch (error) {
        setMensaje('Error al eliminar empleado.');
      }
    }
  };

  // Alta de empleados
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar que todos los campos estén completos
    const { idEmpleado, nombre, apellido, idRol, idUsuario } = formData;
    if (!idEmpleado || !nombre || !apellido || !idRol || !idUsuario) {
      alert("Todos los campos son obligatorios.");
      return;
    }
    const response = await fetch('http://localhost:5000/empleados/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const resultado = await response.json();
    setMensaje(resultado.mensaje || resultado.detail);
    setMostrarFormulario(false);
    setFormData({ idEmpleado: '', nombre: '', apellido: '', idRol: '', idUsuario: '', activo: 1 });
    setEmpleados([...empleados, formData]);
  };

  // CONSULTAR empleado
  const handleConsultar = async (idEmpleado) => {
    const response = await fetch(`http://localhost:5000/empleados/${idEmpleado}`);
    if (!response.ok) {
      setMensaje("Empleado no encontrado");
      return;
    }
    const datos = await response.json();
    setEmpleadoActual(datos);
    setModalModo('consultar');
    setModalVisible(true);
  };

  // MODIFICAR empleado
  const handleModificar = async (idEmpleado) => {
    const response = await fetch(`http://localhost:5000/empleados/${idEmpleado}`);
    if (!response.ok) {
      setMensaje("Empleado no encontrado");
      return;
    }
    const datos = await response.json();
    setEmpleadoActual({ ...datos });
    setModalModo('modificar');
    setModalVisible(true);
  };

  const modificarEmpleado = async (idEmpleado, datos) => {
    const response = await fetch(`http://localhost:5000/empleados/${idEmpleado}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    if (empleadoActual) {
      // Validar que todos los campos estén completos
      const { idEmpleado, nombre, apellido, idRol, idUsuario } = empleadoActual;
      if (!idEmpleado || !nombre || !apellido || !idRol || !idUsuario) {
        alert("Todos los campos son obligatorios.");
        return;
      }
      const resultado = await modificarEmpleado(empleadoActual.idEmpleado, empleadoActual);
      setMensaje(resultado.mensaje || resultado.detail);
      setModalVisible(false);
      setEmpleadoActual(null);
      setEmpleados(empleados.map(e =>
        String(e.idEmpleado) === String(empleadoActual.idEmpleado)
          ? empleadoActual : e
      ));
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEmpleadoActual(null);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div className="row">
        <MenuLateral />
        <main className="col-9 col-md-10 pt-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0" style={{ letterSpacing: 1 }}>Gestión de Empleados</h4>
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
                    <div className="col-md-2">
                      <input type="text" name="idEmpleado" value={formData.idEmpleado} onChange={e => setFormData({ ...formData, idEmpleado: e.target.value })} className="form-control" placeholder="ID Empleado" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="nombre" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="form-control" placeholder="Nombre" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="apellido" value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} className="form-control" placeholder="Apellido" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="idRol" value={formData.idRol} onChange={e => setFormData({ ...formData, idRol: e.target.value })} className="form-control" placeholder="ID Rol" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="idUsuario" value={formData.idUsuario} onChange={e => setFormData({ ...formData, idUsuario: e.target.value })} className="form-control" placeholder="ID Usuario" required />
                    </div>
                    <div className="col-md-2">
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
              {/* Modal para consultar o modificar empleado */}
              {modalVisible && empleadoActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Empleado' : 'Modificar Empleado'}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        {modalModo === 'consultar' ? (
                          <ul className="list-group">
                            <li className="list-group-item"><b>ID Empleado:</b> {empleadoActual.idEmpleado}</li>
                            <li className="list-group-item"><b>Nombre:</b> {empleadoActual.nombre}</li>
                            <li className="list-group-item"><b>Apellido:</b> {empleadoActual.apellido}</li>
                            <li className="list-group-item"><b>ID Rol:</b> {empleadoActual.idRol}</li>
                            <li className="list-group-item"><b>ID Usuario:</b> {empleadoActual.idUsuario}</li>
                            <li className="list-group-item"><b>Estado:</b> {empleadoActual.activo === 1 ? "Activo" : "Inactivo"}</li>
                          </ul>
                        ) : (
                          <form onSubmit={handleModalSave}>
                            <div className="mb-2">
                              <label className="form-label">ID Empleado</label>
                              <input type="text" className="form-control" value={empleadoActual.idEmpleado} onChange={e => setEmpleadoActual({ ...empleadoActual, idEmpleado: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Nombre</label>
                              <input type="text" className="form-control" value={empleadoActual.nombre} onChange={e => setEmpleadoActual({ ...empleadoActual, nombre: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Apellido</label>
                              <input type="text" className="form-control" value={empleadoActual.apellido} onChange={e => setEmpleadoActual({ ...empleadoActual, apellido: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">ID Rol</label>
                              <input type="text" className="form-control" value={empleadoActual.idRol} onChange={e => setEmpleadoActual({ ...empleadoActual, idRol: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">ID Usuario</label>
                              <input type="text" className="form-control" value={empleadoActual.idUsuario} onChange={e => setEmpleadoActual({ ...empleadoActual, idUsuario: e.target.value })} />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">Estado</label>
                              <select className="form-select" value={empleadoActual.activo} onChange={e => setEmpleadoActual({ ...empleadoActual, activo: Number(e.target.value) })}>
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
                      <th>ID Empleado</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>ID Rol</th>
                      <th>ID Usuario</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map((e) => (
                      <tr key={e.idEmpleado} style={e.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{e.idEmpleado}</td>
                        <td>{e.nombre}</td>
                        <td>{e.apellido}</td>
                        <td>{e.idRol}</td>
                        <td>{e.idUsuario}</td>
                        <td>{e.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(e.idEmpleado)}
                          >
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(e.idEmpleado)}
                          >
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          {e.activo !== false && (
                            <button
                              className="btn btn-sm"
                              style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}
                              onClick={() => handleEliminar(e.idEmpleado)}
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

export default Empleados;
