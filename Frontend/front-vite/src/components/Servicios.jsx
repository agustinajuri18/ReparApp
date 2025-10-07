import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000";
const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState("alta"); // "alta" | "modificar" | "consultar"
  const [servicioActual, setServicioActual] = useState({
    codigo: "",
    descripcion: "",
    precioBase: "",
    activo: 1
  });
  const [mensaje, setMensaje] = useState("");

  // Cargar servicios
  const fetchServicios = async () => {
    let url = `${API_URL}/servicios/?activos=${!mostrarInactivos}`;
    const res = await fetch(url);
    const data = await res.json();
    setServicios(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchServicios();
    // eslint-disable-next-line
  }, [mostrarInactivos]);

  // Modal handlers
  const handleAgregarClick = () => {
    setServicioActual({
      codigo: "",
      descripcion: "",
      precioBase: "",
      activo: 1
    });
    setModalModo("alta");
    setModalVisible(true);
    setMensaje("");
  };

  const handleModificar = (servicio) => {
    setServicioActual({ ...servicio });
    setModalModo('modificar');
    setModalVisible(true);
    setMensaje("");
  };

  const handleConsultar = (servicio) => {
    setServicioActual({ ...servicio });
    setModalModo('consultar');
    setModalVisible(true);
    setMensaje("");
  };

  const handleEliminar = async (codigo) => {
    if (window.confirm("¿Seguro que desea eliminar este servicio?")) {
      await fetch(`${API_URL}/servicios/${codigo}`, { method: "DELETE" });
      fetchServicios();
    }
  };

  function validarServicio(form) {
    if (!form.codigo || isNaN(Number(form.codigo)) || Number(form.codigo) <= 0) return "El código debe ser un número mayor a 0.";
    if (!form.descripcion || form.descripcion.trim().length < 2) return "La descripción es obligatoria y debe tener al menos 2 caracteres.";
    if (!form.precioBase || isNaN(Number(form.precioBase)) || Number(form.precioBase) < 0) return "El precio base debe ser un número mayor o igual a 0.";
    if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") return "El estado es obligatorio.";
    return null;
  }

  // Guardar alta
  const handleSubmit = async e => {
    e.preventDefault();
    const error = validarServicio(servicioActual);
    if (error) {
      setMensaje(error);
      return;
    }
    const res = await fetch(`${API_URL}/servicios/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...servicioActual,
        codigo: Number(servicioActual.codigo),
        precioBase: Number(servicioActual.precioBase)
      }),
    });
    const resultado = await res.json();
    setMensaje(resultado.mensaje || resultado.detail || resultado.error || "");
    setModalVisible(false);
    setServicioActual({
      codigo: "",
      descripcion: "",
      precioBase: "",
      activo: 1
    });
    fetchServicios();
  };

  // Guardar modificación
  const handleGuardarModificacion = async e => {
    e.preventDefault();
    const error = validarServicio(servicioActual);
    if (error) {
      setMensaje(error);
      return;
    }
    await fetch(`${API_URL}/servicios/${servicioActual.codigo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...servicioActual,
        codigo: Number(servicioActual.codigo),
        precioBase: Number(servicioActual.precioBase)
      }),
    });
    setModalVisible(false);
    setServicioActual({
      codigo: "",
      descripcion: "",
      precioBase: "",
      activo: 1
    });
    fetchServicios();
  };

  // Actualiza campos del servicio en edición
  const handleModalChange = e => {
    setServicioActual({ ...servicioActual, [e.target.name]: e.target.value });
  };

  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: "var(--color-beige)" }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-gear me-2"></i>Gestión de Servicios</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dorado"
                  onClick={() => setMostrarInactivos(!mostrarInactivos)}
                >
                  {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
                </button>
                <button
                  className="btn btn-verdeAgua"
                  onClick={handleAgregarClick}
                >
                  <i className="bi bi-plus-lg"></i> Agregar servicio
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Precio Base</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map(s => (
                      <tr key={s.codigo} style={Number(s.activo) === 0 ? { opacity: 0.5 } : {}}>
                        <td>{s.codigo}</td>
                        <td>{s.descripcion}</td>
                        <td>${Number(s.precioBase).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                        <td>{s.activo === 1 ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-verdeAgua fw-bold me-1"
                            onClick={() => handleConsultar(s)}
                          >
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button
                            className="btn btn-sm btn-dorado fw-bold me-1"
                            onClick={() => handleModificar(s)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Modificar
                          </button>
                          {s.activo === 1 && (
                            <button
                              className="btn btn-sm btn-rojo fw-bold"
                              onClick={() => handleEliminar(s.codigo)}
                            >
                              <i className="bi bi-trash me-1"></i>Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {servicios.length === 0 && (
                  <div className="text-center text-muted py-4">No hay servicios registrados.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Modal para alta, consultar y modificar */}
      {modalVisible && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog" style={{ maxWidth: "100vw" }}>
            <div className="modal-content" style={{ width: "100vw", maxWidth: "100vw" }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {modalModo === 'consultar'
                    ? "Consultar servicio"
                    : modalModo === 'modificar'
                    ? "Modificar servicio"
                    : "Nuevo servicio"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setModalVisible(false)}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <form
                  className="form-container"
                  onSubmit={
                    modalModo === "modificar"
                      ? handleGuardarModificacion
                      : modalModo === "alta"
                      ? handleSubmit
                      : undefined
                  }
                >
                  <fieldset style={{ border: "none" }}>
                    <legend>
                      <i className="bi bi-gear me-2"></i>Datos del servicio
                    </legend>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Código</label>
                          <input
                            className="form-control"
                            name="codigo"
                            type="number"
                            value={servicioActual?.codigo || ""}
                            onChange={modalModo === "consultar" ? undefined : handleModalChange}
                            required
                            disabled={modalModo === "consultar" || modalModo === "modificar"}
                            readOnly={modalModo === "consultar"}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-gear me-2"></i>Descripción</label>
                          <input
                            className="form-control"
                            name="descripcion"
                            value={servicioActual?.descripcion || ""}
                            onChange={modalModo === "consultar" ? undefined : handleModalChange}
                            required
                            disabled={modalModo === "consultar"}
                            readOnly={modalModo === "consultar"}
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-currency-dollar me-2"></i>Precio Base</label>
                          <input
                            className="form-control"
                            name="precioBase"
                            type="number"
                            min="0"
                            step="0.01"
                            value={servicioActual?.precioBase || ""}
                            onChange={modalModo === "consultar" ? undefined : handleModalChange}
                            required
                            disabled={modalModo === "consultar"}
                            readOnly={modalModo === "consultar"}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                          <select
                            className="form-control"
                            name="activo"
                            value={servicioActual?.activo ?? ""}
                            onChange={modalModo === "consultar" ? undefined : handleModalChange}
                            disabled={modalModo === "consultar"}
                          >
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  {mensaje && (
                    <div className="alert alert-danger">{mensaje}</div>
                  )}
                  {(modalModo === "modificar" || modalModo === "alta") && (
                    <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                      <button type="submit" className="btn btn-azul fw-bold">
                        <i className="bi bi-save me-1"></i>
                        {modalModo === "modificar" ? "Guardar cambios" : "Guardar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-dorado fw-bold"
                        onClick={() => setModalVisible(false)}
                      >
                        <i className="bi bi-x-circle me-1"></i>Cancelar
                      </button>
                    </div>
                  )}
                  {modalModo === "consultar" && (
                    <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                      <button className="btn btn-dorado fw-bold" onClick={() => setModalVisible(false)}>
                        Cerrar
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
