import React, { useEffect, useState, useMemo } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000/ordenes";
const DISPOSITIVOS_URL = "http://localhost:5000/dispositivos";
const EMPLEADOS_URL = "http://localhost:5000/empleados";
const ESTADOS_URL = "http://localhost:5000/estados";
const REPUESTOS_PROVEEDORES_URL = "http://localhost:5000/repuestos-proveedores";
const SERVICIOS_URL = "http://localhost:5000/servicios";

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

  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);

  const [modalMensaje, setModalMensaje] = useState(null);

  const [form, setForm] = useState({
    nroDeOrden: null,
    nroSerieDispositivo: "",
    fecha: new Date().toISOString().split('T')[0],
    descripcionDanos: "",
    diagnostico: "",
    presupuesto: 0,
    idEmpleado: "",
    estado: "EnDiagnostico" // Estado por defecto
  });

  const [detalles, setDetalles] = useState([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({
    codigoServicio: "",
    codigoRepuesto: "",
    repuestoProveedor: "", // "codRepuesto/cuitProveedor"
    costoServicio: "",
    costoRepuesto: "",
    subtotal: ""
  });
  const [editingDetalleId, setEditingDetalleId] = useState(null);

  // Para registrar avances técnicos
  const [avances, setAvances] = useState([]);
  const [nuevoAvance, setNuevoAvance] = useState("");

  // --- Carga de Datos ---
  const fetchOrdenes = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOrdenes(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar órdenes"));
  };

  useEffect(() => {
    fetchOrdenes();
    fetch(DISPOSITIVOS_URL + "?activos=true").then(res => res.json()).then(setDispositivos);
    fetch(EMPLEADOS_URL).then(res => res.json()).then(setEmpleados);
    fetch(SERVICIOS_URL).then(res => res.json()).then(data => setServicios(Array.isArray(data) ? data : []));
    fetch(REPUESTOS_PROVEEDORES_URL).then(res => res.json()).then(data => setRepuestosProveedores(Array.isArray(data) ? data : []));
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
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors(validarOrden({ ...form, [e.target.name]: e.target.value }));
  };

  function validarOrden(form) {
    const errors = {};
    if (!form.idCliente) errors.idCliente = "Debe seleccionar un cliente.";
    if (!form.idDispositivo) errors.idDispositivo = "Debe seleccionar un dispositivo.";
    if (!form.descripcionProblema || form.descripcionProblema.trim().length < 10) errors.descripcionProblema = "La descripción del problema es obligatoria y debe tener al menos 10 caracteres.";
    if (!form.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaIngreso)) errors.fechaIngreso = "La fecha de ingreso es obligatoria y debe tener formato YYYY-MM-DD.";
    if (!form.idEstado) errors.idEstado = "Debe seleccionar un estado.";
    if (!form.costoEstimado || isNaN(form.costoEstimado) || form.costoEstimado <= 0) errors.costoEstimado = "El costo estimado es obligatorio y debe ser un número positivo.";
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
      idEmpleado: "",
      estado: "En Diagnóstico" // Mostrar estado legible para el usuario
    });
    setDetalles([]);
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  const handleModificar = (orden) => {
    setModalModo('modificar');
    setForm(orden);
    fetch(`${API_URL}/${orden.nroDeOrden}/detalles`)
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status} al pedir ${res.url}`);
        return res.json();
      })
      .then(data => setDetalles(Array.isArray(data) ? data : []))
      .catch(err => { setDetalles([]); setMensaje(err.message); });
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  const handleConsultar = (orden) => {
    setModalModo('consultar');
    setForm(orden);
    fetch(`${API_URL}/${orden.nroDeOrden}/detalles`)
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status} al pedir ${res.url}`);
        return res.json();
      })
      .then(data => setDetalles(Array.isArray(data) ? data : []))
      .catch(err => { setDetalles([]); setMensaje(err.message); });

    // Cargar actualizaciones si existe el endpoint
    fetch(`${API_URL}/${orden.nroDeOrden}/actualizaciones`)
      .then(res => res.json())
      .then(setAvances)
      .catch(() => setAvances([]));

    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
  };

  // --- Confirmación de Presupuesto ---
  // Reemplaza la función confirmarPresupuesto existente por esta
  const confirmarPresupuesto = (aceptado) => {
    fetch(`http://localhost:5000/ordenes/${form.nroDeOrden}/confirmacion-presupuesto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aceptado, usuario: "encargado1" })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // En lugar de usar setMensaje global, usamos un estado local para el modal
          setModalMensaje({
            tipo: 'success',
            texto: `Presupuesto ${aceptado ? 'aceptado' : 'rechazado'} correctamente.`
          });
          fetchOrdenes();
          setForm(prev => ({
            ...prev,
            estado: data.nuevoEstado
          }));
        } else {
          setModalMensaje({
            tipo: 'danger',
            texto: data.error || 'Ocurrió un error'
          });
        }
      })
      .catch(() => {
        setModalMensaje({
          tipo: 'danger',
          texto: 'Error de red'
        });
      });
  };

  // --- Registro de avances técnicos ---
  const registrarAvance = (e) => {
    e.preventDefault();

    // Validación básica
    if (!nuevoAvance.trim()) {
      setModalMensaje({
        tipo: 'warning',
        texto: 'Debe ingresar una descripción del avance'
      });
      return;
    }

    console.log("Enviando avance:", nuevoAvance); // Debug

    fetch(`http://localhost:5000/ordenes/${form.nroDeOrden}/actualizaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: nuevoAvance, usuario: "tecnico1" })
    })
      .then(res => {
        console.log("Respuesta del servidor:", res.status); // Debug
        if (!res.ok) {
          throw new Error(`Error al registrar avance: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Datos del servidor:", data); // Debug

        if (data.success) {
          // Limpiar el campo
          setNuevoAvance("");

          // Mostrar mensaje de éxito dentro del modal
          setModalMensaje({
            tipo: 'success',
            texto: "Avance registrado correctamente"
          });

          // Cargar avances inmediatamente después del registro exitoso
          console.log("Recargando avances para orden:", form.nroDeOrden); // Debug

          fetch(`http://localhost:5000/ordenes/${form.nroDeOrden}/actualizaciones`)
            .then(res => {
              console.log("Respuesta de carga de avances:", res.status); // Debug
              if (!res.ok) {
                throw new Error("Error al cargar avances");
              }
              return res.json();
            })
            .then(data => {
              console.log("Avances cargados:", data); // Debug
              setAvances(data);
            })
            .catch(err => {
              console.error("Error al cargar avances:", err);
              setModalMensaje({
                tipo: 'warning',
                texto: "Avance registrado pero no se pudieron cargar las actualizaciones"
              });
            });
        } else {
          setModalMensaje({
            tipo: 'danger',
            texto: data.error || "Error al registrar el avance"
          });
        }
      })
      .catch(err => {
        console.error("Error en registrarAvance:", err); // Debug
        setModalMensaje({
          tipo: 'danger',
          texto: err.message
        });
      });
  };
  // Función para cargar avances
  const cargarAvances = () => {
    const url = `http://localhost:5000/ordenes/${form.nroDeOrden}/actualizaciones`;

    // Mostrar indicador de carga (opcional)
    // setModalMensaje({ tipo: 'info', texto: 'Cargando avances...' });

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setAvances(Array.isArray(data) ? data : []);

        // Opcional: mostrar mensaje solo si no hay mensaje de éxito ya visible
        if (!modalMensaje || modalMensaje.tipo !== 'success') {
          setModalMensaje({
            tipo: 'info',
            texto: data.length > 0
              ? `${data.length} avances registrados para esta orden`
              : 'No hay avances registrados para esta orden'
          });
        }
      })
      .catch(err => {
        console.error("Error al cargar avances:", err);
        setModalMensaje({
          tipo: 'warning',
          texto: `No se pudieron cargar los avances: ${err.message}`
        });
      });
  };

  // --- Manejadores de Formularios ---
  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNuevoDetalleChange = (e) => {
    const { name, value } = e.target;
    let updatedDetalle = { ...nuevoDetalle, [name]: value };

    // Si cambió el repuesto (select específico) solicitamos proveedores para ese repuesto
    if (name === "codigoRepuesto") {
      const codRepuesto = value;
      if (codRepuesto) {
        // Intentar obtener proveedores desde la lista ya cargada (repuestos_con_proveedores)
        const encontrado = repuestosProveedores.find(r => String(r.codigo) === String(codRepuesto) || String(r.codigoRepuesto) === String(codRepuesto));
        if (encontrado && Array.isArray(encontrado.proveedores) && encontrado.proveedores.length > 0) {
          setProveedoresFiltrados(encontrado.proveedores);
        } else {
          // Fallback: pedir al endpoint individual del repuesto (devuelve campo 'proveedores')
          fetch(`${API_URL}/repuestos/${codRepuesto}`)
            .then(res => {
              if (!res.ok) {
                setProveedoresFiltrados([]);
                return null;
              }
              return res.json();
            })
            .then(data => {
              if (data && Array.isArray(data.proveedores)) setProveedoresFiltrados(data.proveedores);
            })
            .catch(() => setProveedoresFiltrados([]));
        }
      } else {
        setProveedoresFiltrados([]);
      }
      // limpiar selección/valores relacionados al cambiar repuesto
      updatedDetalle.repuestoProveedor = "";
      updatedDetalle.costoRepuesto = "";
    }

    // --- lógica de autocompletar costos (como ya tenías) ---
    let costoServ = parseFloat(updatedDetalle.costoServicio || 0);
    let costoRep = parseFloat(updatedDetalle.costoRepuesto || 0);

    if (name === "codigoServicio") {
      const servicioSeleccionado = servicios.find(s => s.idServicio?.toString() === value);
      costoServ = servicioSeleccionado ? parseFloat(servicioSeleccionado.precioBase) : 0;
      updatedDetalle.costoServicio = costoServ;
    }

    if (name === "repuestoProveedor") {
      const [codRepuesto, cuilProv] = value.split('/');
      let costoEncontrado = 0;
      if (codRepuesto && cuilProv) {
        const prov = proveedoresFiltrados.find(p => String(p.cuilProveedor) === String(cuilProv));
        costoEncontrado = prov ? parseFloat(prov.costo) : 0;
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

    let url = API_URL;
    let method = 'POST';
    let payload = { ...form, detalles: detalles };

    if (modalModo === 'modificar') {
      url = `${API_URL}/${form.nroDeOrden}`;
      method = 'PUT';
    }

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error al ${modalModo === 'alta' ? 'crear' : 'actualizar'} la orden.`);
        return res.json();
      })
      .then(() => {
        handleModalClose();
        fetchOrdenes();
        setMensaje(`Orden ${modalModo === 'alta' ? 'creada' : 'actualizada'} correctamente.`);
      })
      .catch(err => setMensaje(err.message));
  };


  const handleAgregarDetalleLocal = async (e) => {
    e.preventDefault();
    // Validación mínima: se requiere seleccionar un servicio, repuesto y proveedor
    if (!nuevoDetalle.codigoServicio) {
      setMensaje('Seleccione un servicio antes de añadir el detalle.');
      return;
    }
    if (!nuevoDetalle.codigoRepuesto) {
      setMensaje('Seleccione un repuesto antes de añadir el detalle.');
      return;
    }
    if (!nuevoDetalle.repuestoProveedor) {
      setMensaje('Seleccione un proveedor para el repuesto antes de añadir el detalle.');
      return;
    }

    // Extraer proveedor y repuesto seleccionados (valor: "codigoRepuesto/cuilProveedor")
    const [codRepuestosFromValue, cuitProveedorFromValue] = (nuevoDetalle.repuestoProveedor || "").split('/');
    const codRepuestos = nuevoDetalle.codigoRepuesto || codRepuestosFromValue || "";
    const cuitProveedor = cuitProveedorFromValue || "";

    // Buscar descripciones y datos legibles
    const servicioObj = servicios.find(s => String(s.idServicio) === String(nuevoDetalle.codigoServicio));
    const servicioDescripcion = servicioObj ? servicioObj.descripcion : "";

    const repuestoObj = repuestosProveedores.find(r => String(r.idRepuesto) === String(codRepuestos) || String(r.codigoRepuesto) === String(codRepuestos));
    const repuestoDescripcion = repuestoObj ? (repuestoObj.descripcion || `${repuestoObj.marca || ''} ${repuestoObj.modelo || ''}`.trim()) : "";

    // Buscar proveedor (puede estar en proveedoresFiltrados o en repuestoObj.proveedores)
    let proveedorObj = proveedoresFiltrados.find(p => String(p.idProveedor) === String(cuitProveedor));
    if (!proveedorObj && repuestoObj && Array.isArray(repuestoObj.proveedores)) {
      proveedorObj = repuestoObj.proveedores.find(p => String(p.idProveedor) === String(cuitProveedor));
    }
    const proveedorRazonSocial = proveedorObj ? proveedorObj.razonSocial : "";

    const detallePayload = {
      codigoServicio: nuevoDetalle.codigoServicio,
      codRepuestos,
      cuitProveedor,
      costoServicio: parseFloat(nuevoDetalle.costoServicio) || 0,
      costoRepuesto: parseFloat(nuevoDetalle.costoRepuesto) || 0,
      subtotal: parseFloat(nuevoDetalle.subtotal) || 0
    };

    // Si estamos editando un detalle existente
    if (editingDetalleId) {
      if (modalModo === 'alta') {
        // actualizar localmente
        setDetalles(prev => prev.map(d => d.idDetalle === editingDetalleId ? {
          ...d,
          codigoServicio: detallePayload.codigoServicio,
          servicioDescripcion,
          codRepuestos: detallePayload.codRepuestos,
          repuestoDescripcion,
          cuitProveedor: detallePayload.cuitProveedor,
          proveedorRazonSocial,
          costoServicio: detallePayload.costoServicio,
          costoRepuesto: detallePayload.costoRepuesto,
          subtotal: detallePayload.subtotal
        } : d));
        setMensaje('Detalle actualizado (local).');
        setEditingDetalleId(null);
        setNuevoDetalle({ codigoServicio: "", codigoRepuesto: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" });
      } else if (modalModo === 'modificar') {
        // enviar PUT al servidor para actualizar detalle
        try {
          const res = await fetch(`${API_URL}/detalles/${editingDetalleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(detallePayload)
          });
          if (!res.ok) {
            const rj = await res.json().catch(() => ({}));
            setMensaje(rj.error || rj.detail || 'Error al actualizar detalle');
          } else {
            // recargar detalles desde servidor
            const resp = await fetch(`${API_URL}/${form.nroDeOrden}/detalles`);
            const data = await resp.json().catch(() => []);
            setDetalles(Array.isArray(data) ? data : []);
            setMensaje('Detalle actualizado.');
            setEditingDetalleId(null);
            setNuevoDetalle({ codigoServicio: "", codigoRepuesto: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" });
          }
        } catch (err) {
          setMensaje('Error de red: ' + err.message);
        }
      }
      return;
    }

    // Si no estamos editando, agregamos un nuevo detalle (local)
    const detalleCompleto = {
      idDetalle: Date.now(), // ID temporal para el key en React
      codigoServicio: detallePayload.codigoServicio,
      servicioDescripcion,
      codRepuestos: detallePayload.codRepuestos,
      repuestoDescripcion,
      cuitProveedor: detallePayload.cuitProveedor,
      proveedorRazonSocial,
      costoServicio: detallePayload.costoServicio,
      costoRepuesto: detallePayload.costoRepuesto,
      subtotal: detallePayload.subtotal
    };

    setDetalles(prev => [...prev, detalleCompleto]);
    setMensaje('Detalle añadido.');
    setNuevoDetalle({ codigoServicio: "", codigoRepuesto: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" });
  };

  const handleRemoveDetalleLocal = async (idDetalle) => {
    // Si está en modo 'alta' trabajamos sólo en local
    if (modalModo === 'alta') {
      setDetalles(prev => prev.filter(d => d.idDetalle !== idDetalle));
      return;
    }

    // En modo 'modificar' debemos borrar en servidor
    if (detalles.length <= 1) {
      setMensaje('No se puede eliminar el único detalle de la orden.');
      return;
    }

    if (!window.confirm('¿Seguro que desea eliminar este detalle?')) return;

    try {
      const res = await fetch(`${API_URL}/detalles/${idDetalle}`, { method: 'DELETE' });
      if (!res.ok) {
        const rj = await res.json().catch(() => ({}));
        setMensaje(rj.error || rj.detail || 'Error al eliminar detalle');
      } else {
        // recargar lista de detalles desde servidor
        const resp = await fetch(`${API_URL}/${form.nroDeOrden}/detalles`);
        const data = await resp.json().catch(() => []);
        setDetalles(Array.isArray(data) ? data : []);
        setMensaje('Detalle eliminado.');
      }
    } catch (err) {
      setMensaje('Error de red: ' + err.message);
    }
  };

  const handleEditarDetalleClick = (detalle) => {
    if (detalles.length <= 1) {
      setMensaje('No se puede modificar el único detalle de la orden.');
      return;
    }

    // poblar los selects con los datos del detalle
    setNuevoDetalle({
      codigoServicio: detalle.codigoServicio || '',
      codigoRepuesto: detalle.codRepuestos || '',
      repuestoProveedor: detalle.codRepuestos && detalle.cuitProveedor ? `${detalle.codRepuestos}/${detalle.cuitProveedor}` : '',
      costoServicio: detalle.costoServicio || '',
      costoRepuesto: detalle.costoRepuesto || '',
      subtotal: detalle.subtotal || ''
    });

    // preparar proveedores filtrados para el repuesto seleccionado
    const cod = detalle.codRepuestos || detalle.codigoRepuesto || '';
    const encontrado = repuestosProveedores.find(r => String(r.codigo) === String(cod) || String(r.codigoRepuesto) === String(cod));
    if (encontrado && Array.isArray(encontrado.proveedores)) {
      setProveedoresFiltrados(encontrado.proveedores);
    } else {
      setProveedoresFiltrados([]);
    }

    setEditingDetalleId(detalle.idDetalle);
    setMensaje('Edite los campos y presione "Actualizar" para guardar.');
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
                      <th>Estado</th> {/* Columna para estado */}
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
                        <td>{o.estado}</td> {/* Mostramos el estado actual */}
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
                {modalMensaje && (
                  <div className={`alert alert-${modalMensaje.tipo} alert-dismissible fade show mx-3 mt-3 mb-0`}>
                    {modalMensaje.texto}
                    <button type="button" className="btn-close" onClick={() => setModalMensaje(null)}></button>
                  </div>
                )}

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                      <div className="col-md-4">
                        <label>Estado actual</label>
                        <input
                          type="text"
                          className="form-control"
                          value={modalModo === 'alta' ? 'En Diagnóstico' : form.estado || "-"}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label>Presupuesto Total</label>
                        <input type="number" name="presupuesto" value={form.presupuesto} className="form-control" readOnly />
                      </div>
                      <div className="col-md-12">
                        <label>Descripción de Daños</label>
                        <textarea name="descripcionDanos" value={form.descripcionDanos} onChange={handleFormChange} className="form-control" readOnly={modalModo === 'consultar'} />
                      </div>
                      <div className="col-md-12">
                        <label>Diagnóstico</label>
                        <textarea name="diagnostico" value={form.diagnostico} onChange={handleFormChange} className="form-control" readOnly={modalModo === 'consultar'} />
                      </div>
                    </div>

                    {/* Botones de confirmación de presupuesto (solo si está pendiente) */}
                    {modalModo === 'consultar' &&
                      (form.estado === 'PendienteDeAprobacion' ||
                        form.estado?.toLowerCase().includes('pendiente') && form.estado?.toLowerCase().includes('aprob')) && (
                        <div className="my-3">
                          <button type="button" className="btn btn-success me-2" onClick={() => confirmarPresupuesto(true)}>
                            Aceptar Presupuesto
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => confirmarPresupuesto(false)}>
                            Rechazar Presupuesto
                          </button>
                        </div>
                      )}
                  </fieldset>

                  <fieldset className="mt-4">
                    <legend>Detalles de la Orden</legend>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Servicio</th>
                          <th>Repuesto</th>
                          <th>Proveedor</th>
                          <th>Costo Serv.</th>
                          <th>Costo Rep.</th>
                          <th>Subtotal</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map(d => (
                          <tr key={d.idDetalle}>
                            <td>{d.servicioDescripcion || d.codigoServicio}</td>
                            <td>{d.repuestoDescripcion || d.codRepuestos || '-'}</td>
                            <td>{d.proveedorRazonSocial || d.cuitProveedor || '-'}</td>
                            <td>{d.costoServicio}</td>
                            <td>{d.costoRepuesto}</td>
                            <td>{d.subtotal}</td>
                            <td>
                              {modalModo !== 'consultar' && (
                                <>
                                  <button type="button" className="btn btn-sm btn-dorado me-1" onClick={() => handleEditarDetalleClick(d)}>Editar</button>
                                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveDetalleLocal(d.idDetalle)}>Eliminar</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detalles.length === 0 && <p className="text-muted">No hay detalles para esta orden.</p>}

                    {modalModo !== 'consultar' && (
                      <div className="row g-2 mt-2 align-items-end">
                        <div className="col">
                          <label>Servicio</label>
                          <select name="codigoServicio" value={nuevoDetalle.codigoServicio} onChange={handleNuevoDetalleChange} className="form-select">
                            <option value="">Seleccione</option>
                            {servicios.map(s => <option key={s.idServicio} value={s.idServicio}>{s.descripcion}</option>)}
                          </select>
                        </div>
                        <div className="col">
                          <label>Repuesto</label>
                          <select name="codigoRepuesto" value={nuevoDetalle.codigoRepuesto} onChange={handleNuevoDetalleChange} className="form-select">
                            <option value="">Seleccione un repuesto</option>
                            {repuestosProveedores.map(r => (
                              <option key={r.idRepuesto || r.codigo} value={r.idRepuesto || r.codigo}>
                                {r.descripcion || `${r.marca || ''} ${r.modelo || ''}`.trim() || (r.idRepuesto || r.codigo)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col">
                          <label>Proveedor</label>
                          <select
                            name="repuestoProveedor"
                            value={nuevoDetalle.repuestoProveedor}
                            onChange={handleNuevoDetalleChange}
                            className="form-select"
                            disabled={proveedoresFiltrados.length === 0}
                          >
                            {proveedoresFiltrados.length === 0 ? (
                              <option value="">No hay proveedores para el repuesto seleccionado</option>
                            ) : (
                              <>
                                <option value="">Seleccione un proveedor</option>
                                {proveedoresFiltrados.map((p) => (
                                  <option key={p.idProveedor} value={`${nuevoDetalle.codigoRepuesto}/${p.idProveedor}`}>
                                    {p.razonSocial} (Costo: {p.costo})
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>
                        <div className="col">
                          <label>Costo Serv.</label>
                          <input name="costoServicio" value={nuevoDetalle.costoServicio} className="form-control" readOnly />
                        </div>
                        <div className="col">
                          <label>Costo Rep.</label>
                          <input name="costoRepuesto" value={nuevoDetalle.costoRepuesto} className="form-control" readOnly />
                        </div>
                        <div className="col">
                          <label>Subtotal</label>
                          <input name="subtotal" value={nuevoDetalle.subtotal} className="form-control" readOnly />
                        </div>
                        <div className="col-auto d-flex gap-2">
                          <button type="button" className="btn btn-secondary" onClick={handleAgregarDetalleLocal}>
                            {editingDetalleId ? 'Actualizar' : 'Añadir'}
                          </button>
                          {editingDetalleId && (
                            <button type="button" className="btn btn-outline-secondary" onClick={() => {
                              setEditingDetalleId(null);
                              setNuevoDetalle({
                                codigoServicio: "",
                                codigoRepuesto: "",
                                repuestoProveedor: "",
                                costoServicio: "",
                                costoRepuesto: "",
                                subtotal: ""
                              });
                              setMensaje('Edición cancelada.');
                            }}>
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </fieldset>

                  {/* Sección de Avances Técnicos */}
                  <fieldset className="mt-4">
                    <legend>Avances Técnicos</legend>

                    {/* Solo muestra la entrada si está en reparación */}
                    {form.estado === 'EnReparacion' && (
                      <div className="mb-3">
                        <div className="input-group">
                          <input
                            type="text"
                            value={nuevoAvance}
                            onChange={e => setNuevoAvance(e.target.value)}
                            placeholder="Descripción del avance técnico"
                            className="form-control"
                          />
                          <button
                            type="button"
                            className="btn btn-dorado"
                            onClick={() => {
                              // Validación
                              if (!nuevoAvance.trim()) {
                                setModalMensaje({
                                  tipo: 'warning',
                                  texto: 'Debe ingresar una descripción del avance'
                                });
                                return;
                              }

                              // Mostrar indicador de carga
                              setModalMensaje({
                                tipo: 'info',
                                texto: 'Registrando avance...'
                              });

                              fetch(`http://localhost:5000/ordenes/${form.nroDeOrden}/actualizaciones`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                  descripcion: nuevoAvance,
                                  usuario: "vbluciana"
                                })
                              })
                                .then(res => {
                                  if (!res.ok) {
                                    throw new Error(`Error del servidor: ${res.status}`);
                                  }
                                  return res.json();
                                })
                                .then(data => {
                                  if (data.success) {
                                    // Limpiar campo
                                    setNuevoAvance("");

                                    // Mostrar confirmación
                                    setModalMensaje({
                                      tipo: 'success',
                                      texto: "Avance registrado correctamente"
                                    });

                                    // Recargar avances tras un breve retardo
                                    setTimeout(() => {
                                      fetch(`http://localhost:5000/ordenes/${form.nroDeOrden}/actualizaciones`)
                                        .then(res => res.json())
                                        .then(data => setAvances(Array.isArray(data) ? data : []))
                                        .catch(err => console.error("Error al recargar avances:", err));
                                    }, 300);
                                  } else {
                                    throw new Error(data.error || "Error desconocido");
                                  }
                                })
                                .catch(err => {
                                  console.error("Error:", err);
                                  setModalMensaje({
                                    tipo: 'danger',
                                    texto: `Error: ${err.message}`
                                  });
                                });
                            }}
                          >
                            <i className="bi bi-plus-circle me-1"></i> Registrar avance
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botón para ver avances (siempre visible) */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Historial de avances</h5>
                      <button
                        type="button"
                        className="btn btn-sm btn-verdeAgua"
                        onClick={() => {
                          // Mostrar indicador de carga
                          setModalMensaje({
                            tipo: 'info',
                            texto: 'Actualizando historial de avances...'
                          });

                          fetch(`http://localhost:5000/ordenes/${form.nroDeOrden}/actualizaciones`)
                            .then(res => {
                              if (!res.ok) throw new Error("Error al cargar historial");
                              return res.json();
                            })
                            .then(data => {
                              setAvances(Array.isArray(data) ? data : []);
                              setModalMensaje({
                                tipo: 'info',
                                texto: `Se ${data.length > 0 ? `encontraron ${data.length} avances` : 'cargó el historial de avances'}`
                              });
                            })
                            .catch(err => {
                              setModalMensaje({
                                tipo: 'danger',
                                texto: `Error al cargar historial: ${err.message}`
                              });
                            });
                        }}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i> Actualizar historial
                      </button>
                    </div>

                    {/* Lista de avances */}
                    {avances.length > 0 ? (
                      <div className="list-group">
                        {avances.map(a => (
                          <div key={a.idHistorialor} className="list-group-item list-group-item-action">
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1 fw-bold">Avance técnico</h6>
                              <small className="text-muted">
                                {new Date(a.fechaArreglo).toLocaleString()}
                              </small>
                            </div>
                            <p className="mb-1">{a.descripcion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-light text-center">
                        No hay avances registrados para esta orden.
                        {form.estado === 'EnReparacion' ?
                          ' Utilice el formulario superior para registrar un nuevo avance.' :
                          ''}
                      </div>
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