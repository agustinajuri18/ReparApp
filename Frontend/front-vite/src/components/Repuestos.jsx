import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

const Repuestos = () => {
  const [repuestos, setRepuestos] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    codigo: '',
    marca: '',
    modelo: '',
    tipo: '',
    proveedor: '',
    costo: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('consultar'); // 'consultar' o 'editar'
  const [repuestoActual, setRepuestoActual] = useState(null);

  // Cargar repuestos desde la API al montar el componente
  const cargarRepuestos = () => {
    fetch('http://localhost:5000/repuestos')
      .then(res => res.json())
      .then(data => setRepuestos(data))
      .catch(() => setMensaje("Error al cargar repuestos"));
  };

  useEffect(() => {
    cargarRepuestos();
  }, []);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetch('http://localhost:5000/proveedores/')
      .then(res => res.json())
      .then(data => setProveedores(data));
  }, []);

  // Filtro de repuestos según activos/inactivos
  const repuestosFiltrados = repuestos.filter(r => mostrarInactivos ? r.activo === 0 : r.activo === 1);

  // BuscadorSelect interno
  function BuscadorSelect({
    label,
    options,
    value,
    onChange,
    placeholder = "Buscar...",
    optionLabel = "label",
    optionValue = "value",
    required = false,
  }) {
    const [busqueda, setBusqueda] = useState("");

    const opcionesFiltradas = options.filter(
      opt =>
        opt[optionLabel] &&
        opt[optionLabel].toLowerCase().includes(busqueda.toLowerCase())
    );

    useEffect(() => {
      if (opcionesFiltradas.length === 1 && value !== opcionesFiltradas[0][optionValue]) {
        onChange(opcionesFiltradas[0][optionValue]);
      }
      // eslint-disable-next-line
    }, [busqueda]);

    return (
      <div>
        {label && <label className="form-label fw-bold">{label}</label>}
        <div className="input-group mb-2">
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            className="form-select"
            value={value}
            onChange={e => onChange(e.target.value)}
            required={required}
          >
            <option value="">Seleccione un proveedor</option>
            {opcionesFiltradas.map(opt => (
              <option key={opt.cuil} value={opt.cuil}>
                {opt.razonSocial}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Alta de repuesto
  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      cuilProveedor: formData.proveedor
    };
    delete body.proveedor;

    try {
      const response = await fetch('http://localhost:5000/repuestos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setMensaje("Repuesto agregado correctamente.");
        setMostrarFormulario(false);
        setFormData({
          codigo: '',
          marca: '',
          modelo: '',
          tipo: '',
          proveedor: '',
          costo: '',
          activo: 1
        });
        cargarRepuestos();
      } else {
        setMensaje("Error al agregar repuesto.");
      }
    } catch {
      setMensaje("Error de conexión al agregar repuesto.");
    }
  };

  // Consultar repuesto
  const handleConsultar = async (codigo) => {
    try {
      const response = await fetch(`http://localhost:5000/repuestos/${codigo}`);
      if (response.ok) {
        const data = await response.json();
        setRepuestoActual(data);
        setModalModo('consultar');
        setModalVisible(true);
      } else {
        setMensaje("No se pudo consultar el repuesto.");
      }
    } catch {
      setMensaje("Error de conexión al consultar repuesto.");
    }
  };

  // Modificar repuesto
  const handleModificar = async (codigo) => {
    try {
      const response = await fetch(`http://localhost:5000/repuestos/${codigo}`);
      if (response.ok) {
        const data = await response.json();
        setRepuestoActual(data);
        setModalModo('editar');
        setModalVisible(true);
      } else {
        setMensaje("No se pudo consultar el repuesto.");
      }
    } catch {
      setMensaje("Error de conexión al consultar repuesto.");
    }
  };

  // Guardar modificación
  const handleModalSave = async (e) => {
    e.preventDefault();
    const body = {
      ...repuestoActual,
      cuilProveedor: repuestoActual.proveedor
    };
    delete body.proveedor;

    try {
      const response = await fetch(`http://localhost:5000/repuestos/${repuestoActual.codigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setMensaje("Repuesto modificado correctamente.");
        setModalVisible(false);
        cargarRepuestos();
      } else {
        setMensaje("Error al modificar repuesto.");
      }
    } catch {
      setMensaje("Error de conexión al modificar repuesto.");
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setRepuestoActual(null);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0">Gestión de Repuestos</h4>
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
              {/* Modal para agregar repuesto */}
              {mostrarFormulario && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">Agregar Repuesto</h5>
                        <button type="button" className="btn-close" onClick={() => setMostrarFormulario(false)}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="codigo" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} className="form-control" placeholder="Código" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="marca" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} className="form-control" placeholder="Marca" required />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <input type="text" name="modelo" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} className="form-control" placeholder="Modelo" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="text" name="tipo" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="form-control" placeholder="Tipo" required />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <input type="number" name="costo" value={formData.costo} onChange={e => setFormData({ ...formData, costo: e.target.value })} className="form-control" placeholder="Costo" required />
                            </div>
                            <div className="col-12 mb-2">
                              <BuscadorSelect
                                label="Proveedor"
                                options={proveedores}
                                value={formData.proveedor}
                                onChange={val => setFormData({ ...formData, proveedor: val })}
                                placeholder="Buscar proveedor por razón social"
                                optionLabel="razonSocial"
                                optionValue="cuil"
                                required
                              />
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

              {/* Modal para consultar/modificar repuesto */}
              {modalVisible && repuestoActual && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content" style={{ background: colores.beige, borderRadius: 16, border: `2px solid ${colores.azul}` }}>
                      <div className="modal-header" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">{modalModo === 'consultar' ? 'Consultar Repuesto' : 'Modificar Repuesto'}</h5>
                        <button type="button" className="btn-close" onClick={handleModalClose}></button>
                      </div>
                      <div className="modal-body">
                        <form onSubmit={handleModalSave}>
                          <div className="row">
                            <div className="col-12 col-md-4 mb-2">
                              <label className="form-label fw-bold">Código</label>
                              <input type="text" value={repuestoActual.codigo} className="form-control" disabled />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <label className="form-label fw-bold">Marca</label>
                              <input type="text" value={repuestoActual.marca} className="form-control"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setRepuestoActual({ ...repuestoActual, marca: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-4 mb-2">
                              <label className="form-label fw-bold">Modelo</label>
                              <input type="text" value={repuestoActual.modelo} className="form-control"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setRepuestoActual({ ...repuestoActual, modelo: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <label className="form-label fw-bold">Tipo</label>
                              <input type="text" value={repuestoActual.tipo} className="form-control"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setRepuestoActual({ ...repuestoActual, tipo: e.target.value })} />
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                              <label className="form-label fw-bold">Costo</label>
                              <input type="number" value={repuestoActual.costo} className="form-control"
                                disabled={modalModo === 'consultar'}
                                onChange={e => setRepuestoActual({ ...repuestoActual, costo: e.target.value })} />
                            </div>
                            <div className="col-12 mb-2">
                              <label className="form-label fw-bold">Proveedor</label>
                              {modalModo === 'consultar' ? (
                                <input
                                  type="text"
                                  className="form-control"
                                  value={
                                    proveedores.find(p => p.cuil === repuestoActual.proveedor)?.razonSocial ||
                                    repuestoActual.proveedor
                                  }
                                  disabled
                                />
                              ) : (
                                <BuscadorSelect
                                  options={proveedores}
                                  value={repuestoActual.proveedor}
                                  onChange={val => setRepuestoActual({ ...repuestoActual, proveedor: val })}
                                  placeholder="Buscar proveedor por razón social"
                                  optionLabel="razonSocial"
                                  optionValue="cuil"
                                  required
                                />
                              )}
                            </div>
                          </div>
                          <div className="d-flex justify-content-end">
                            {modalModo === 'editar' && (
                              <button type="submit" className="btn" style={{ background: colores.verdeAgua, color: colores.azul }}>Guardar</button>
                            )}
                            <button type="button" className="btn ms-2" style={{ background: colores.dorado, color: colores.azul }} onClick={handleModalClose}>Cerrar</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Tipo</th>
                      <th>Proveedor</th>
                      <th>Costo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestosFiltrados.map((rep, idx) => (
                      <tr key={idx} style={rep.activo === 0 ? { opacity: 0.5 } : {}}>
                        <td>{rep.codigo}</td>
                        <td>{rep.marca}</td>
                        <td>{rep.modelo}</td>
                        <td>{rep.tipo}</td>
                        <td>
                          {proveedores.find(p => p.cuil === rep.proveedor)?.razonSocial || rep.proveedor}
                        </td>
                        <td>{rep.costo}</td>
                        <td>{rep.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button className="btn btn-sm me-1" style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleConsultar(rep.codigo)}>
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button className="btn btn-sm me-1" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
                            onClick={() => handleModificar(rep.codigo)}>
                            <span title="Modificar"><i className="bi bi-pencil-square"></i></span> Modificar
                          </button>
                          <button className="btn btn-sm" style={{ background: colores.rojo, color: colores.beige, fontWeight: 600, border: 'none' }}>
                            <span title="Eliminar"><i className="bi bi-x-circle"></i></span> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {repuestosFiltrados.length === 0 && (
                  <div className="text-center text-muted py-4">No hay repuestos {mostrarInactivos ? "inactivos" : "activos"}.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Repuestos;
