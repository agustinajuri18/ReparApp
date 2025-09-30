import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5', mentaSuave: '#c6e8e8' };

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

    // Aseguramos que activo tenga valor correcto
    setProveedorActual({
      ...datos,
      activo: Boolean(datos.activo)
    });
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

  // Función para el botón de listar proveedores (usa la lista actual)
  const handleListarProveedores = (proveedores) => {
    const lista = proveedores ? [...proveedores] : [];
    mostrarVentanaEmergente(lista);
  };

  const mostrarVentanaEmergente = (lista) => {
    // Crear ventana emergente
    const ventana = window.open(
      'about:blank',
      "ListaProveedores",
      // Aseguramos que el scroll esté habilitado: "scrollbars=yes"
      "width=900,height=700,scrollbars=yes,resizable=yes"
    );

    if (!ventana) return;

    ventana.document.write(`
    <html>
      <head>
        <title>Listado de Proveedores</title>
        <link 
          rel="stylesheet" 
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
        >
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css"
        >
        <style>
          /* Estilos generales */
          body { 
            padding: 30px; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            /* IMPORTANTE: Un padding inferior amplio para que el botón de cierre no se pegue abajo */
            padding-bottom: 80px; 
          }
          /* ... (resto de tus estilos) ... */
          h2 { 
            margin-bottom: 25px;
            color: #343a40;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
            font-weight: 600;
          }
          .table-hover tbody tr:hover {
            background-color: #e2f4ff;
            cursor: default;
          }
          .activo-si { color: #28a745; font-weight: bold; }
          .activo-no { color: #dc3545; font-weight: bold; }
          .btn-container {
            margin-top: 30px;
            text-align: right;
            /* Opcional: Para mantener el botón visible si el scroll es muy lento */
          }
        </style>
      </head>
      <body>
        <div class="container-fluid">
          <h2><i class="fas fa-users"></i> Listado de Proveedores (${lista.length} Registros)</h2>
          <table class="table table-bordered table-striped table-hover">
            <thead class="thead-dark">
              <tr>
                <th>CUIL</th>
                <th>Razón Social</th>
                <th>Teléfono</th>
                <th class="text-center">Activo</th>
              </tr>
            </thead>
            <tbody>
              ${lista
        .map((p) => {
          const esActivo = p.activo;
          const claseActivo = esActivo ? 'activo-si' : 'activo-no';
          const iconoActivo = esActivo
            ? '<i class="fas fa-check-circle"></i> Sí'
            : '<i class="fas fa-times-circle"></i> No';

          return `
                    <tr>
                      <td>${p.cuil}</td>
                      <td>${p.razonSocial}</td>
                      <td>${p.telefono}</td>
                      <td class="text-center ${claseActivo}">
                        ${iconoActivo}
                      </td>
                    </tr>
                  `;
        })
        .join("")}
            </tbody>
          </table>
          
          <div class="btn-container">
            <button class="btn btn-primary btn-lg" onclick="window.close()">
              <i class="fas fa-times-circle"></i> Cerrar Listado
            </button>
          </div>
        </div>
      </body>
    </html>
  `);

    ventana.document.close();
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-2 mb-md-0">Gestión de Proveedores</h4>
              <div>
                <button
                  className="btn btn-success me-2"
                  style={{ background: colores.mentaSuave, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => handleListarProveedores(proveedores)}
                >
                  Listar Proveedores
                </button>
                <button
                  className="btn me-2"
                  style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? 'Ver solo activos' : 'Ver también inactivos'}
                </button>
                {/* Botón Agregar */}
                <button
                  className="btn"
                  style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                  onClick={() => setMostrarFormulario(true)}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            <div className="card-body">
              {mensaje && (
                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>{mensaje}</div>
              )}
              {/* Modal para agregar proveedor */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Proveedor</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <div className="col-12 col-md-3 mb-2">
                              <input type="text" name="cuil" value={formData.cuil} onChange={e => setFormData({ ...formData, cuil: e.target.value })} className="form-control" placeholder="CUIL" required />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <input type="text" name="razonSocial" value={formData.razonSocial} onChange={e => setFormData({ ...formData, razonSocial: e.target.value })} className="form-control" placeholder="Razón Social" required />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <input type="text" name="telefono" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="form-control" placeholder="Teléfono" required />
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <select name="activo" value={formData.activo} onChange={e => setFormData({ ...formData, activo: Number(e.target.value) })} className="form-select">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                              </select>
                            </div>
                          </div>
                          <div className="d-flex justify-content-end">
                            <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>Guardar</button>
                            <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Modal para consultar o modificar proveedor */}
              {modalVisible && proveedorActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">
                          {modalModo === 'consultar' ? 'Datos del Proveedor' : 'Modificar Proveedor'}
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
                              <div className="form-group mb-2">
                                <i className="bi bi-credit-card-2-front me-2"></i>
                                <b>CUIL:</b> {proveedorActual.cuil}
                              </div>
                              <div className="form-group mb-2">
                                <i className="bi bi-building me-2"></i>
                                <b>Razón Social:</b> {proveedorActual.razonSocial}
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-telephone me-2"></i>Datos de contacto
                              </legend>
                              <div className="form-group mb-2">
                                <i className="bi bi-telephone me-2"></i>
                                <b>Teléfono:</b> {proveedorActual.telefono}
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </legend>
                              <div className="form-group mb-2">
                                <i className="bi bi-check2-circle me-2"></i>
                                <b>Estado:</b> {Number(proveedorActual.activo) == 1 ? "Activo" : "Inactivo"}
                              </div>
                            </fieldset>
                          </div>
                        ) : (
                          <form onSubmit={handleModalSave} className="form-container" style={{ boxShadow: "none", padding: "1rem", background: colores.beige }}>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-person-badge me-2"></i>Datos personales
                              </legend>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-credit-card-2-front me-2"></i>CUIL
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={proveedorActual.cuil}
                                  onChange={e => setProveedorActual({ ...proveedorActual, cuil: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-building me-2"></i>Razón Social
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={proveedorActual.razonSocial}
                                  onChange={e => setProveedorActual({ ...proveedorActual, razonSocial: e.target.value })}
                                  required
                                />
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-telephone me-2"></i>Datos de contacto
                              </legend>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-telephone me-2"></i>Teléfono
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={proveedorActual.telefono}
                                  onChange={e => setProveedorActual({ ...proveedorActual, telefono: e.target.value })}
                                  required
                                />
                              </div>
                            </fieldset>
                            <fieldset style={{ border: "none" }}>
                              <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                <i className="bi bi-check2-circle me-2"></i>Estado
                              </legend>
                              <div className="form-group mb-2">
                                <label className="form-label" style={{ color: colores.azul }}>
                                  <i className="bi bi-check2-circle me-2"></i>Estado
                                </label>
                                <select
                                  className="form-select"
                                  value={Number(proveedorActual.activo) ?? 1}
                                  onChange={e => setProveedorActual({
                                    ...proveedorActual,
                                    activo: parseInt(e.target.value, 10)
                                  })}
                                >
                                  <option value={1}>Activo</option>
                                  <option value={0}>Inactivo</option>
                                </select>

                              </div>
                            </fieldset>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <button type="submit" className="btn" style={{ background: colores.azul, color: colores.beige }}>
                                <i className="bi bi-save me-1"></i>Guardar
                              </button>
                              <button type="button" className="btn" style={{ marginLeft: 8, background: colores.dorado, color: colores.azul }} onClick={handleModalClose}>
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
                      <th>CUIL</th>
                      <th>Razón Social</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov) => (
                      <tr key={prov.cuil} style={Number(prov.activo) == 0 ? { opacity: 0.5 } : {}}>
                        <td>{prov.cuil}</td><td>{prov.razonSocial}</td><td>{prov.telefono}</td><td>{prov.activo === 1 ? "Activo" : "Inactivo"}</td><td>
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
                          {prov.activo == true && (
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
