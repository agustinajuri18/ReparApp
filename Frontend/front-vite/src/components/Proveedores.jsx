
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

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    cuil: '',
    nombre: '',
    telefono: '',
    razon_social: '',
    activo: 1
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        let url = 'http://localhost:5000/proveedores/';
        if (!mostrarInactivos) {
          url += '?activos=true';
        } else {
          url += '?activos=false';
        }
        const response = await fetch(url);
        const data = await response.json();
        setProveedores(Array.isArray(data) ? data : []);
      } catch (error) {
        setMensaje("Error al cargar proveedores.");
      }
    };
    fetchProveedores();
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
                <form className="mb-3" style={{ background: colores.beige, borderRadius: 12, border: `1px solid ${colores.verdeAgua}`, padding: 16 }} onSubmit={e => {
                  e.preventDefault();
                  // Aquí deberías llamar a la función para registrar proveedor
                  // y luego limpiar el formulario y ocultarlo
                }}>
                  <div className="row">
                    <div className="col-md-2">
                      <input type="text" name="cuil" value={formData.cuil} onChange={e => setFormData({ ...formData, cuil: e.target.value })} className="form-control" placeholder="CUIL" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="nombre" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="form-control" placeholder="Nombre" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="telefono" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="form-control" placeholder="Teléfono" required />
                    </div>
                    <div className="col-md-2">
                      <input type="text" name="razon_social" value={formData.razon_social} onChange={e => setFormData({ ...formData, razon_social: e.target.value })} className="form-control" placeholder="Razón Social" required />
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
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>CUIL</th>
                      <th>Razón Social</th>
                      <th>Teléfono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov, idx) => (
                      <tr key={prov.cuil} style={prov.activo === false ? { opacity: 0.5 } : {}}>
                        <td>{prov.cuil}</td>
                        <td>{prov.razon_social || prov.razonSocial}</td>
                        <td>{prov.telefono}</td>
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.verdeAgua, color: colores.azul, fontWeight: 600, border: 'none' }}
                          >
                            <span title="Consultar"><i className="bi bi-eye"></i></span> Consultar
                          </button>
                          <button
                            className="btn btn-sm me-1"
                            style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none' }}
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
