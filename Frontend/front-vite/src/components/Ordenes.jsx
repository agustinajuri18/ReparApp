import React, { useEffect, useState, useMemo } from "react";
import MenuLateral from './MenuLateral';

const API_URL = "http://localhost:5000/ordenes";
const DISPOSITIVOS_URL = "http://localhost:5000/dispositivos";
const EMPLEADOS_URL = "http://localhost:5000/empleados";
const CLIENTES_URL = "http://localhost:5000/clientes";
const TIPOS_DOC_URL = "http://localhost:5000/tipos-documento";
const ESTADOS_URL = "http://localhost:5000/estados";
const REPUESTOS_PROVEEDORES_URL = "http://localhost:5000/repuestos-proveedores";
const SERVICIOS_URL = "http://localhost:5000/servicios";

function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [tiposDoc, setTiposDoc] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [repuestosProveedores, setRepuestosProveedores] = useState([]);

  const [mensaje, setMensaje] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalModo, setModalModo] = useState('alta');

  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [showAddDetalle, setShowAddDetalle] = useState(false);
  const [availableRepuestos, setAvailableRepuestos] = useState([]); // <-- repuestos filtrados por servicio

  const [form, setForm] = useState({
    nroDeOrden: null,
    idDispositivo: "",
    fecha: new Date().toISOString().split('T')[0],
    descripcionDanos: "",
    diagnostico: "",
    presupuesto: 0,
    idEmpleado: ""
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

  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [showAddDispositivoModal, setShowAddDispositivoModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ idTipoDoc: "", numeroDoc: "", nombre: "", apellido: "", telefono: "", mail: "", activo: 1 });
  const [nuevoDispositivo, setNuevoDispositivo] = useState({ nroSerie: "", marca: "", modelo: "", idCliente: "", activo: 1 });
  const [nuevoClienteErrors, setNuevoClienteErrors] = useState({});
  const [nuevoDispositivoErrors, setNuevoDispositivoErrors] = useState({});
  const [nuevoDetalleErrors, setNuevoDetalleErrors] = useState({}); // Agregar esta línea si no está presente (después de const [nuevoDispositivoErrors, setNuevoDispositivoErrors] = useState({});)

  // --- Carga de Datos ---
  const fetchOrdenes = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOrdenes(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar órdenes"));
  };

  // Cargar tipos de documento (igual que en Clientes.jsx)
  const fetchTiposDocumento = () => {
    fetch(TIPOS_DOC_URL)
      .then(res => res.json())
      .then(data => setTiposDoc(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar tipos de documento"));
  };

  const fetchServicios = () => {
    fetch(SERVICIOS_URL)
      .then(res => res.json())
      .then(data => setServicios(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar servicios"));
  };

  const fetchRepuestosProveedores = () => {
    fetch(REPUESTOS_PROVEEDORES_URL)
      .then(res => res.json())
      .then(data => setRepuestosProveedores(Array.isArray(data) ? data : []))
      .catch(() => setMensaje("Error al cargar repuestos"));
  };

  useEffect(() => {
    fetchOrdenes();
    fetchClientes();
    fetchEmpleados();
    fetchDispositivos();
    fetchTiposDocumento();
    fetchServicios();
    fetchRepuestosProveedores();
  }, []);

  const fetchClientes = () => {
    fetch(CLIENTES_URL)
      .then(res => res.json())
      .then(data => setClientes(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching clientes:", err));
  };

  const fetchEmpleados = () => {
    fetch(EMPLEADOS_URL)
      .then(res => res.json())
      .then(data => setEmpleados(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching empleados:", err));
  };

  const fetchDispositivos = () => {
    fetch(DISPOSITIVOS_URL)
      .then(res => res.json())
      .then(data => setDispositivos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching dispositivos:", err));
  };

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
    if (!form.idDispositivo) errors.idDispositivo = "Debe seleccionar un dispositivo.";
    if (!form.descripcionDanos || form.descripcionDanos.trim().length < 10) errors.descripcionDanos = "La descripción de daños es obligatoria y debe tener al menos 10 caracteres.";
    if (!form.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) errors.fecha = "La fecha es obligatoria y debe tener formato YYYY-MM-DD.";
    if (!form.idEmpleado) errors.idEmpleado = "Debe seleccionar un empleado.";
    if (form.presupuesto != null && (isNaN(form.presupuesto) || Number(form.presupuesto) < 0)) errors.presupuesto = "El presupuesto debe ser un número válido (>= 0).";
    return errors;
  }

  // --- Validaciones Cliente y Dispositivo ---
  function validarDocumento(tipo, numero) {
    const tipoDocObj = tiposDoc.find(td => String(td.idTipoDoc) === String(tipo));
    const tipoNombre = tipoDocObj ? tipoDocObj.nombre : '';
    if (tipoNombre === "DNI") return /^\d{7,8}$/.test(numero);
    if (tipoNombre === "CUIT" || tipoNombre === "CUIL") return /^\d{11}$/.test(numero);
    if (tipoNombre === "PASAPORTE") return /^[A-Z0-9]{6,9}$/.test(numero);
    return true;
  }

  function validarCliente(form) {
    const errors = {};
    if (!form.idTipoDoc) errors.idTipoDoc = "Debe seleccionar el tipo de documento.";
    if (!form.numeroDoc || !validarDocumento(form.idTipoDoc, form.numeroDoc)) errors.numeroDoc = "Número de documento inválido para el tipo seleccionado.";
    if (!form.nombre || form.nombre.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(form.nombre.trim())) errors.nombre = "El nombre es obligatorio, debe contener solo letras y espacios, y tener al menos 2 caracteres.";
    if (!form.apellido || form.apellido.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(form.apellido.trim())) errors.apellido = "El apellido es obligatorio, debe contener solo letras y espacios, y tener al menos 2 caracteres.";
    if (!form.telefono || form.telefono.trim().length < 6 || !/^\d{6,}$/.test(form.telefono.trim())) errors.telefono = "El teléfono es obligatorio, debe contener solo números y tener al menos 6 dígitos.";
    if (!form.mail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.mail)) errors.mail = "El email no es válido.";
    return errors;
  }

  function validarDispositivo(form) {
    const errors = {};
    if (!form.nroSerie || form.nroSerie.trim().length < 3) errors.nroSerie = "El número de serie es obligatorio y debe tener al menos 3 caracteres.";
    if (!form.marca || form.marca.trim().length < 2) errors.marca = "La marca es obligatoria y debe tener al menos 2 caracteres.";
    if (!form.modelo || form.modelo.trim().length < 2) errors.modelo = "El modelo es obligatorio y debe tener al menos 2 caracteres.";
    if (!form.idCliente) errors.idCliente = "Debe seleccionar un cliente válido.";
    return errors;
  }

  function validarNuevoDetalle(detalle) {
    const errors = {};
    if (!detalle.codigoServicio) errors.codigoServicio = "Debe seleccionar un servicio.";
    if (!detalle.codigoRepuesto) errors.codigoRepuesto = "Debe seleccionar un repuesto.";
    if (!detalle.repuestoProveedor) errors.repuestoProveedor = "Debe seleccionar un proveedor.";
    if (detalle.costoServicio == null || isNaN(detalle.costoServicio) || Number(detalle.costoServicio) < 0) errors.costoServicio = "Costo de servicio inválido.";
    if (detalle.costoRepuesto == null || isNaN(detalle.costoRepuesto) || Number(detalle.costoRepuesto) < 0) errors.costoRepuesto = "Costo de repuesto inválido.";
    if (detalle.subtotal == null || isNaN(detalle.subtotal) || Number(detalle.subtotal) < 0) errors.subtotal = "Subtotal inválido.";
    return errors;
  }

  // --- Manejadores de Modal ---
  const handleModalClose = () => setModalVisible(false);

  const handleAgregarClick = () => {
    setModalModo('alta');
    setForm({
      nroDeOrden: null,
      idDispositivo: "",
      fecha: new Date().toISOString().split('T')[0],
      descripcionDanos: "",
      diagnostico: "",
      presupuesto: 0,
      idEmpleado: ""
    });
    setDetalles([]);
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
    setShowAddDetalle(true); // abrir formulario al crear
    setAvailableRepuestos([]);
    setProveedoresFiltrados([]);
    setNuevoDetalle({ codigoServicio: "", codigoRepuesto: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" });
    setEditingDetalleId(null);
  };

  // En handleModificar, cambiar setShowAddDetalle(false) a setShowAddDetalle(true) para permitir añadir detalles en modificar
  const handleModificar = (orden) => {
    setModalModo('modificar');
    setForm({
      nroDeOrden: orden.nroDeOrden,
      idDispositivo: orden.idDispositivo || "",
      fecha: orden.fecha,
      descripcionDanos: orden.descripcionDanos || "",
      diagnostico: orden.diagnostico || "",
      presupuesto: orden.presupuesto || 0,
      idEmpleado: orden.idEmpleado || ""
    });
    fetch(`${API_URL}/${orden.nroDeOrden}/detalles`)
      .then(res => {
        if (!res.ok) {
          console.error(`Error ${res.status} al obtener detalles`);
          return []; // Devolver array vacío en caso de error
        }
        return res.json();
      })
      .then(data => {
        console.log("Detalles obtenidos:", data);
        setDetalles(Array.isArray(data) ? data.map(d => ({ ...d, isNew: false })) : []);
      })
      .catch(err => { 
        console.error("Error al obtener detalles:", err);
        setDetalles([]);
      });
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
    setShowAddDetalle(true); // Cambiado a true para permitir añadir en modificar
    setAvailableRepuestos([]);
    setProveedoresFiltrados([]);
    setEditingDetalleId(null);
  };

  const handleConsultar = (orden) => {
    setModalModo('consultar');
    setForm({
      nroDeOrden: orden.nroDeOrden,
      idDispositivo: orden.idDispositivo || "",
      fecha: orden.fecha,
      descripcionDanos: orden.descripcionDanos || "",
      diagnostico: orden.diagnostico || "",
      presupuesto: orden.presupuesto || 0,
      idEmpleado: orden.idEmpleado || ""
    });
    fetch(`${API_URL}/${orden.nroDeOrden}/detalles`)
      .then(res => {
        if (!res.ok) {
          console.error(`Error ${res.status} al obtener detalles`);
          return []; // Devolver array vacío en caso de error
        }
        return res.json();
      })
      .then(data => {
        console.log("Detalles obtenidos:", data);
        setDetalles(Array.isArray(data) ? data.map(d => ({ ...d, isNew: false })) : []);
      })
      .catch(err => { 
        console.error("Error al obtener detalles:", err);
        setDetalles([]);
      });
    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
    setShowAddDetalle(false);
    setAvailableRepuestos([]);
    setProveedoresFiltrados([]);
    setEditingDetalleId(null);
  };

  // --- Manejadores de Formularios ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(validarOrden({ ...form, [name]: value })); // Agrega validación en tiempo real
  };

  const handleNuevoDetalleChange = (e) => {
    const { name, value } = e.target;
    let updatedDetalle = { ...nuevoDetalle, [name]: value };

    // Cuando cambia el servicio -> pedir repuestos asociados al servicio al backend
    if (name === "codigoServicio") {
      const servicioCodigo = value;
      if (servicioCodigo) {
        // Usar URL correcta sin "ordenes/" en la ruta
        fetch(`http://localhost:5000/servicios/${encodeURIComponent(servicioCodigo)}/repuestos`)
          .then(res => res.ok ? res.json() : Promise.reject(res))
          .then(data => {
            console.log("Repuestos obtenidos:", data); // depuración
            setAvailableRepuestos(Array.isArray(data) ? data : []);
            setProveedoresFiltrados([]);
            // autocalcular costo servicio si existe en servicios
            const servicioSeleccionado = servicios.find(s => String(s.idServicio ?? s.id ?? s.codigo) === String(servicioCodigo));
            updatedDetalle.costoServicio = servicioSeleccionado ? parseFloat(servicioSeleccionado.precioBase ?? 0) : 0;
            updatedDetalle.codigoRepuesto = "";
            updatedDetalle.repuestoProveedor = "";
            setNuevoDetalle(updatedDetalle);
          })
          .catch(err => {
            console.error("Error al cargar repuestos:", err);
            setAvailableRepuestos([]);
            setProveedoresFiltrados([]);
            updatedDetalle.costoServicio = 0;
            updatedDetalle.codigoRepuesto = "";
            updatedDetalle.repuestoProveedor = "";
            setNuevoDetalle(updatedDetalle);
          });
      } else {
        setAvailableRepuestos([]);
        setProveedoresFiltrados([]);
        updatedDetalle.codigoRepuesto = "";
        updatedDetalle.repuestoProveedor = "";
        updatedDetalle.costoServicio = 0;
        setNuevoDetalle(updatedDetalle);
      }
      return;
    }

    // Si cambió el repuesto -> cargar proveedores desde availableRepuestos (respuesta del backend)
    if (name === "codigoRepuesto") {
      const codRepuesto = value;
      let encontrado = null;
      if (availableRepuestos && availableRepuestos.length > 0) {
        encontrado = availableRepuestos.find(r => String(r.idRepuesto) === String(codRepuesto));
      }
      if (!encontrado) {
        // fallback local
        encontrado = repuestosProveedores.find(r => String(r.idRepuesto) === String(codRepuesto) || String(r.codigoRepuesto) === String(codRepuesto));
      }
      if (encontrado && Array.isArray(encontrado.proveedores)) {
        setProveedoresFiltrados(encontrado.proveedores);
      } else {
        setProveedoresFiltrados([]);
      }
      updatedDetalle.repuestoProveedor = "";
      updatedDetalle.costoRepuesto = "";
    }

    if (name === "repuestoProveedor") {
      const [codRepuesto, cuilProv] = value.split('/');
      let costoEncontrado = 0;
      if (codRepuesto && cuilProv) {
        const prov = proveedoresFiltrados.find(p => String(p.cuilProveedor) === String(cuilProv) || String(p.idProveedor) === String(cuilProv));
        costoEncontrado = prov ? parseFloat(prov.costo || 0) : 0;
      }
      updatedDetalle.costoRepuesto = costoEncontrado;
    }

    const costoServ = parseFloat(updatedDetalle.costoServicio || 0);
    const costoRep = parseFloat(updatedDetalle.costoRepuesto || 0);
    updatedDetalle.subtotal = costoServ + costoRep;

    setNuevoDetalle(updatedDetalle);
    setNuevoDetalleErrors(validarNuevoDetalle(updatedDetalle)); // Agrega validación en tiempo real
  };


  // --- Acciones CRUD ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validarOrden(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      ...form,
      presupuesto: parseFloat(form.presupuesto) || 0,
      detalles: detalles.map(d => {
        let finalRepuestoProveedorId = d.repuesto_proveedor_id;

        // Si el detalle es nuevo o fue editado, necesitamos encontrar el ID de la relación.
        if (d.isNew || editingDetalleId === d.idDetalle || !finalRepuestoProveedorId) {
            const repuestoProveedorRel = repuestosProveedores.find(rp => 
                String(rp.idRepuesto) === String(d.codRepuestos) &&
                String(rp.cuilProveedor) === String(d.cuitProveedor) // <-- CORRECCIÓN: Usar 'cuilProveedor'
            );
            if (repuestoProveedorRel) {
                finalRepuestoProveedorId = repuestoProveedorRel.id;
            }
        }
        
        return {
          idDetalle: typeof d.idDetalle === 'string' && d.idDetalle.startsWith('new_') ? null : d.idDetalle,
          idServicio: d.codigoServicio || d.idServicio,
          repuesto_proveedor_id: finalRepuestoProveedorId,
          costoServicio: parseFloat(d.costoServicio || 0),
          costoRepuesto: parseFloat(d.costoRepuesto || 0),
          subtotal: parseFloat(d.subtotal || 0)
        };
      })
    };

    const url = modalModo === 'alta' ? API_URL : `${API_URL}/${form.nroDeOrden}`;
    const method = modalModo === 'alta' ? 'POST' : 'PUT';

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body?.error || body?.detail || `Error ${res.status}`;
        return Promise.reject(new Error(errMsg));
      }
      return res.json();
    })
    .then(() => {
      setMensaje(`Orden ${modalModo === 'alta' ? 'creada' : 'actualizada'} correctamente.`);
      // --- CORRECCIÓN ---
      // Mueve el cierre del modal y la recarga de datos aquí, al final del proceso exitoso.
      handleModalClose(); 
      fetchOrdenes();
    })
    .catch(err => {
      setMensaje(err.message || 'Error de red');
      // No cierres el modal si hay un error, para que el usuario pueda corregir.
    });
  };


  const handleAgregarDetalleLocal = (e) => {
    e.preventDefault();
    const errors = validarNuevoDetalle(nuevoDetalle);
    setNuevoDetalleErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const [codRepuestosFromValue, cuitProveedorFromValue] = (nuevoDetalle.repuestoProveedor || "").split('/');
    const codRepuestos = nuevoDetalle.codigoRepuesto || codRepuestosFromValue || "";
    const cuitProveedor = cuitProveedorFromValue || "";

    const servicioObj = servicios.find(s => String(s.idServicio) === String(nuevoDetalle.codigoServicio));
    const repuestoObj = availableRepuestos.find(r => String(r.idRepuesto) === String(codRepuestos));
    const proveedorObj = proveedoresFiltrados.find(p => String(p.cuilProveedor) === String(cuitProveedor));

    // --- CORRECCIÓN: Buscar el ID de la relación aquí ---
    const repuestoProveedorRel = repuestosProveedores.find(rp => 
        String(rp.idRepuesto) === String(codRepuestos) &&
        String(rp.cuilProveedor) === String(cuitProveedor)
    );

    const detalleCompleto = {
      idDetalle: editingDetalleId || `new_${Date.now()}`,
      isNew: !editingDetalleId,
      codigoServicio: nuevoDetalle.codigoServicio,
      servicioDescripcion: servicioObj ? servicioObj.descripcion : "",
      codRepuestos: codRepuestos,
      repuestoDescripcion: repuestoObj ? `${repuestoObj.marca} ${repuestoObj.modelo}`.trim() : "",
      cuitProveedor: cuitProveedor,
      proveedorRazonSocial: proveedorObj ? proveedorObj.razonSocial : "",
      costoServicio: parseFloat(nuevoDetalle.costoServicio) || 0,
      costoRepuesto: parseFloat(nuevoDetalle.costoRepuesto) || 0,
      subtotal: parseFloat(nuevoDetalle.subtotal) || 0,
      repuesto_proveedor_id: repuestoProveedorRel ? repuestoProveedorRel.id : null // <-- Añadir el ID encontrado
    };

    if (editingDetalleId) {
      setDetalles(prev => prev.map(d => d.idDetalle === editingDetalleId ? detalleCompleto : d));
      setMensaje('Detalle actualizado localmente.');
    } else {
      setDetalles(prev => [...prev, detalleCompleto]);
      setMensaje('Detalle añadido localmente.');
    }

    setEditingDetalleId(null);
    setNuevoDetalle({ codigoServicio: "", codigoRepuesto: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" });
    setNuevoDetalleErrors({});
    setAvailableRepuestos([]);
    setProveedoresFiltrados([]);
  };


  const handleRemoveDetalleLocal = (idDetalle) => {
    if (!window.confirm('¿Seguro que desea eliminar este detalle?')) return;
    // Simplemente filtramos el detalle del estado local
    setDetalles(prev => prev.filter(d => d.idDetalle !== idDetalle));
    setMensaje('Detalle eliminado localmente.');
  };

  const handleEditarDetalleClick = (detalle) => {
    console.log("Editando detalle:", detalle); // Para depuración
    setNuevoDetalle({
      codigoServicio: String(detalle.codigoServicio || ''),
      codigoRepuesto: String(detalle.codRepuestos || ''),
      repuestoProveedor: detalle.codRepuestos && detalle.cuitProveedor ? `${detalle.codRepuestos}/${detalle.cuitProveedor}` : '',
      costoServicio: String(detalle.costoServicio || ''),
      costoRepuesto: String(detalle.costoRepuesto || ''),
      subtotal: String(detalle.subtotal || '')
    });

    // Cargar availableRepuestos para el servicio seleccionado
    const servicioCodigo = detalle.codigoServicio;
    if (servicioCodigo) {
      fetch(`http://localhost:5000/servicios/${encodeURIComponent(servicioCodigo)}/repuestos`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          console.log("Repuestos cargados para edición:", data); // Depuración
          setAvailableRepuestos(Array.isArray(data) ? data : []);
          
          // Cargar proveedores para el repuesto seleccionado
          const cod = detalle.codRepuestos;
          const encontrado = (Array.isArray(data) ? data : []).find(r => String(r.idRepuesto) === String(cod));
          if (encontrado && Array.isArray(encontrado.proveedores)) {
            setProveedoresFiltrados(encontrado.proveedores);
          } else {
            // Fallback a repuestosProveedores
            const encontradoFallback = repuestosProveedores.find(r => String(r.idRepuesto) === String(cod) || String(r.codigoRepuesto) === String(cod));
            if (encontradoFallback && Array.isArray(encontradoFallback.proveedores)) {
              setProveedoresFiltrados(encontradoFallback.proveedores);
            } else {
              setProveedoresFiltrados([]);
            }
          }
        })
        .catch(err => {
          console.error("Error al cargar repuestos para edición:", err);
          setAvailableRepuestos([]);
          setProveedoresFiltrados([]);
        });
    } else {
      setAvailableRepuestos([]);
      setProveedoresFiltrados([]);
    }

    // abrir el formulario para editar este detalle
    setEditingDetalleId(detalle.idDetalle);
    setShowAddDetalle(true);
    setMensaje('Edite los campos y presione "Actualizar" para guardar.');
  };

  const handleNuevoClienteChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({ ...prev, [name]: value }));
    setNuevoClienteErrors(validarCliente({ ...nuevoCliente, [name]: value }));
  };

  const handleNuevoDispositivoChange = (e) => {
    const { name, value } = e.target;
    setNuevoDispositivo(prev => ({ ...prev, [name]: value }));
    setNuevoDispositivoErrors(validarDispositivo({ ...nuevoDispositivo, [name]: value }));
  };

  const handleGuardarCliente = () => {
    const errors = validarCliente(nuevoCliente);
    setNuevoClienteErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    fetch(CLIENTES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoCliente)
    })
    .then(res => res.json())
    .then(() => {
      fetchClientes();
      setNuevoCliente({ idTipoDoc: "", numeroDoc: "", nombre: "", apellido: "", telefono: "", mail: "", activo: 1 });
      setShowAddClienteModal(false);
      setNuevoClienteErrors({});
    })
    .catch(err => console.error("Error saving cliente:", err));
  };

  const handleGuardarDispositivo = () => {
    const errors = validarDispositivo(nuevoDispositivo);
    setNuevoDispositivoErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    fetch(DISPOSITIVOS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoDispositivo)
    })
    .then(res => res.json())
    .then(data => {
      fetchDispositivos();
      setForm(prev => ({ ...prev, idDispositivo: data.idDispositivo })); // Seleccionar el nuevo
      setNuevoDispositivo({ nroSerie: "", marca: "", modelo: "", idCliente: "", activo: 1 });
      setShowAddDispositivoModal(false);
      setNuevoDispositivoErrors({});
    })
    .catch(err => console.error("Error saving dispositivo:", err));
  };

  // Al crear o modificar un detalle, debes enviar el campo repuesto_proveedor_id (no cuitProveedor/codigoRepuesto) al backend.
  // Para eso, busca el repuesto_proveedor_id antes de hacer el POST o PUT.
  async function getRepuestoProveedorId(codRepuestos, cuitProveedor) {
    // Busca el objeto repuesto_proveedor en repuestosProveedores
    const rel = repuestosProveedores.find(
      r =>
        (String(r.idRepuesto) === String(codRepuestos) || String(r.codigoRepuesto) === String(codRepuestos)) &&
        (String(r.cuilProveedor) === String(cuitProveedor) || String(r.cuil) === String(cuitProveedor))
    );
    return rel ? rel.id : null;
  }

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
              {/* quitar el alert de mensaje general */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Dispositivo</th>
                      <th>Empleado</th>
                      <th>Fecha</th>
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
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{modalModo === 'alta' ? 'Nueva Orden' : modalModo === 'modificar' ? 'Modificar Orden' : 'Consultar Orden'}</h5>
                  <button type="button" className="btn-close" onClick={handleModalClose}></button>
                </div>
                <div className="modal-body" style={{ padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
                  <fieldset>
                    <legend>Datos de la Orden</legend>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label>Dispositivo</label>
                        <div className="d-flex">
                          <select name="idDispositivo" value={form.idDispositivo} onChange={handleFormChange} className={`form-select ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'}>
                            <option value="">Seleccione un dispositivo</option>
                            {dispositivos.map(d => <option key={d.idDispositivo} value={d.idDispositivo}>{`${d.marca} ${d.modelo} (${d.nroSerie})`}</option>)}
                          </select>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowAddDispositivoModal(true)}>
                            Nuevo Dispositivo
                          </button>
                        </div>
                        {formErrors.idDispositivo && <div className="input-error-message">{formErrors.idDispositivo}</div>}
                      </div>
                      <div className="col-md-6">
                        <label>Empleado Asignado</label>
                        <select name="idEmpleado" value={form.idEmpleado} onChange={handleFormChange} className={`form-select ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'}>
                          <option value="">Seleccione un empleado</option>
                          {empleados.map(e => <option key={e.idEmpleado} value={e.idEmpleado}>{`${e.nombre} ${e.apellido}`}</option>)}
                        </select>
                        {formErrors.idEmpleado && <div className="input-error-message">{formErrors.idEmpleado}</div>}
                      </div>
                      <div className="col-md-4">
                        <label>Fecha</label>
                        <input type="date" name="fecha" value={form.fecha} onChange={handleFormChange} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'} />
                        {formErrors.fecha && <div className="input-error-message">{formErrors.fecha}</div>}
                      </div>
                      <div className="col-md-8">
                        <label>Descripción de Daños</label>
                        <input name="descripcionDanos" value={form.descripcionDanos} onChange={handleFormChange} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'} />
                        {formErrors.descripcionDanos && <div className="input-error-message">{formErrors.descripcionDanos}</div>}
                      </div>
                      <div className="col-md-8">
                        <label>Diagnóstico</label>
                        <input name="diagnostico" value={form.diagnostico} onChange={handleFormChange} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'} />
                      </div>
                      <div className="col-md-4">
                        <label>Presupuesto Total</label>
                        <input type="number" name="presupuesto" value={form.presupuesto} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} readOnly />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <legend className="mb-0">Detalles de la Orden</legend>
                      {modalModo !== 'consultar' && (
                        <button type="button" className="btn btn-verdeAgua btn-sm" onClick={() => setShowAddDetalle(v => !v)}>
                          {showAddDetalle ? 'Ocultar formulario' : 'Agregar detalle'}
                        </button>
                      )}
                    </div>
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Servicio</th>
                          <th>Repuesto</th>
                          <th>Proveedor</th>
                          <th>Costo Servicio</th>
                          <th>Costo Repuesto</th>
                          <th>Subtotal</th>
                          {modalModo !== 'consultar' && <th>Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((detalle, index) => (
                          <tr key={detalle.idDetalle || index}>
                            <td>{detalle.servicioDescripcion}</td>
                            <td>{detalle.repuestoDescripcion}</td>
                            <td>{detalle.proveedorRazonSocial}</td>
                            <td>{detalle.costoServicio}</td>
                            <td>{detalle.costoRepuesto}</td>
                            <td>{detalle.subtotal}</td>
                            {modalModo !== 'consultar' && (
                              <td>
                                {modalModo === 'modificar' && (
                                  <button type="button" className="btn btn-sm btn-dorado fw-bold me-2" onClick={(e) => { e.preventDefault(); handleEditarDetalleClick(detalle); }}>
                                    <i className="bi bi-pencil-square me-1"></i>Editar
                                  </button>
                                )}
                                <button type="button" className="btn btn-sm btn-danger fw-bold" onClick={(e) => { e.preventDefault(); handleRemoveDetalleLocal(detalle.idDetalle); }}>
                                  <i className="bi bi-trash me-1"></i>Eliminar
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detalles.length === 0 && <p className="text-muted">No hay detalles para esta orden.</p>}

                    {modalModo !== 'consultar' && showAddDetalle && (
                      <div className="row g-2 mt-2 align-items-end">
                        <div className="col">
                          <label>Servicio</label>
                          <select
                            name="codigoServicio"
                            value={nuevoDetalle.codigoServicio}
                            onChange={handleNuevoDetalleChange}
                            className="form-select"
                            disabled={modalModo === 'consultar'}
                          >
                            <option value="">Seleccione un servicio</option>
                            {servicios.map((s, index) => (
                              <option key={`${s.idServicio}-${index}`} value={s.idServicio}>
                                {s.descripcion}
                              </option>
                            ))}
                          </select>
                          {nuevoDetalleErrors.codigoServicio && <div className="input-error-message">{nuevoDetalleErrors.codigoServicio}</div>}
                        </div>
                        <div className="col">
                          <label>Repuesto</label>
                          <select
                            name="codigoRepuesto"
                            value={nuevoDetalle.codigoRepuesto}
                            onChange={handleNuevoDetalleChange}
                            className="form-select"
                            disabled={!nuevoDetalle.codigoServicio || modalModo === 'consultar'}
                          >
                            <option value="">Seleccione un repuesto</option>
                            {availableRepuestos.map((r, index) => (
                              <option key={`${r.idRepuesto}-${index}`} value={r.idRepuesto}>
                                {r.marca} {r.modelo}
                              </option>
                            ))}
                          </select>
                          {nuevoDetalleErrors.codigoRepuesto && <div className="input-error-message">{nuevoDetalleErrors.codigoRepuesto}</div>}
                        </div>

                        <div className="col">
                          <label>Proveedor</label>
                          <select
                            name="repuestoProveedor"
                            value={nuevoDetalle.repuestoProveedor}
                            onChange={handleNuevoDetalleChange}
                            className="form-select"
                            disabled={!nuevoDetalle.codigoRepuesto || modalModo === 'consultar'}
                          >
                            <option value="">Seleccione un proveedor</option>
                            {proveedoresFiltrados.map((p, index) => (
                              <option key={`${p.cuilProveedor}-${index}`} value={`${nuevoDetalle.codigoRepuesto}/${p.cuilProveedor}`}>
                                {p.razonSocial} - ${p.costo}
                              </option>
                            ))}
                          </select>
                          {nuevoDetalleErrors.repuestoProveedor && <div className="input-error-message">{nuevoDetalleErrors.repuestoProveedor}</div>}
                        </div>
                        <div className="col">
                          <label>Costo Serv.</label>
                          <input name="costoServicio" value={nuevoDetalle.costoServicio} className="form-control" readOnly />
                          {nuevoDetalleErrors.costoServicio && <div className="input-error-message">{nuevoDetalleErrors.costoServicio}</div>}
                        </div>
                        <div className="col">
                          <label>Costo Rep.</label>
                          <input name="costoRepuesto" value={nuevoDetalle.costoRepuesto} className="form-control" readOnly />
                          {nuevoDetalleErrors.costoRepuesto && <div className="input-error-message">{nuevoDetalleErrors.costoRepuesto}</div>}
                        </div>
                        <div className="col">
                          <label>Subtotal</label>
                          <input name="subtotal" value={nuevoDetalle.subtotal} className="form-control" readOnly />
                          {nuevoDetalleErrors.subtotal && <div className="input-error-message">{nuevoDetalleErrors.subtotal}</div>}
                        </div>
                        <div className="col-auto d-flex gap-2">
                          <button type="button" className="btn btn-verdeAgua" onClick={handleAgregarDetalleLocal}>{editingDetalleId ? 'Actualizar' : 'Añadir'}</button>
                          {editingDetalleId && (
                            <button type="button" className="btn btn-dorado" onClick={() => { setEditingDetalleId(null); setNuevoDetalle({ codigoServicio: "", codigoRepuesto: "", repuestoProveedor: "", costoServicio: "", costoRepuesto: "", subtotal: "" }); setMensaje('Edición cancelada.'); }}>Cancelar</button>
                          )}
                        </div>
                      </div>
                    )}
                  </fieldset>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-dorado" onClick={handleModalClose}>Cerrar</button>
                  {modalModo !== 'consultar' && <button type="submit" className="btn btn-azul">Guardar</button>}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddClienteModal && (
        <div className="modal" style={{ display: "block", backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1f3345', color: '#f0ede5' }}>
                <h5 className="modal-title fw-bold"><i className="bi bi-person-plus-fill me-2"></i>Nuevo Cliente</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddClienteModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => { e.preventDefault(); handleGuardarCliente(); }}>
                  <fieldset>
                    <legend className="d-none">Datos del cliente</legend>
                    <h6 className="fw-bold mt-3 mb-2 border-bottom pb-1"><i className="bi bi-person-lines-fill me-2"></i>Datos personales</h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label><i className="bi bi-card-list me-2"></i>Tipo de documento</label>
                          <select name="idTipoDoc" value={nuevoCliente.idTipoDoc} onChange={handleNuevoClienteChange} className="form-control" required>
                            <option value="">Seleccione tipo de documento</option>
                            {tiposDoc.map(td => <option key={td.idTipoDoc} value={td.idTipoDoc}>{td.nombre}</option>)}
                          </select>
                          {nuevoClienteErrors.idTipoDoc && <div className="input-error-message">{nuevoClienteErrors.idTipoDoc}</div>}
                        </div>
                        <div className="mb-3">
                          <label><i className="bi bi-hash me-2"></i>Número de documento</label>
                          <input type="text" name="numeroDoc" value={nuevoCliente.numeroDoc} onChange={handleNuevoClienteChange} required className="form-control" />
                          {nuevoClienteErrors.numeroDoc && <div className="input-error-message">{nuevoClienteErrors.numeroDoc}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label><i className="bi bi-person me-2"></i>Nombre</label>
                          <input type="text" name="nombre" value={nuevoCliente.nombre} onChange={handleNuevoClienteChange} required className="form-control" />
                          {nuevoClienteErrors.nombre && <div className="input-error-message">{nuevoClienteErrors.nombre}</div>}
                        </div>
                        <div className="mb-3">
                          <label><i className="bi bi-person me-2"></i>Apellido</label>
                          <input type="text" name="apellido" value={nuevoCliente.apellido} onChange={handleNuevoClienteChange} required className="form-control" />
                          {nuevoClienteErrors.apellido && <div className="input-error-message">{nuevoClienteErrors.apellido}</div>}
                        </div>
                      </div>
                    </div>
                    <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1"><i className="bi bi-telephone me-2"></i>Datos de contacto</h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label><i className="bi bi-telephone me-2"></i>Teléfono</label>
                          <input type="text" name="telefono" value={nuevoCliente.telefono} onChange={handleNuevoClienteChange} required className="form-control" />
                          {nuevoClienteErrors.telefono && <div className="input-error-message">{nuevoClienteErrors.telefono}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label><i className="bi bi-envelope me-2"></i>Email</label>
                          <input type="email" name="mail" value={nuevoCliente.mail} onChange={handleNuevoClienteChange} required className="form-control" />
                          {nuevoClienteErrors.mail && <div className="input-error-message">{nuevoClienteErrors.mail}</div>}
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <div className="modal-footer mt-3">
                    <button type="button" className="btn btn-dorado fw-bold" onClick={() => setShowAddClienteModal(false)}><i className="bi bi-x-circle me-1"></i>Cancelar</button>
                    <button type="submit" className="btn btn-azul fw-bold"><i className="bi bi-save me-1"></i>Guardar Cliente</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddDispositivoModal && (
        <div className="modal" style={{ display: "block", backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1f3345', color: '#f0ede5' }}>
                <h5 className="modal-title fw-bold"><i className="bi bi-cpu me-2"></i>Agregar Nuevo Dispositivo</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddDispositivoModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => { e.preventDefault(); handleGuardarDispositivo(); }}>
                  <fieldset>
                    <legend className="d-none">Datos del dispositivo</legend>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Nro Serie</label>
                          <input className="form-control" name="nroSerie" value={nuevoDispositivo.nroSerie} onChange={handleNuevoDispositivoChange} required />
                          {nuevoDispositivoErrors.nroSerie && <div className="input-error-message">{nuevoDispositivoErrors.nroSerie}</div>}
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-pc me-2"></i>Marca</label>
                          <input className="form-control" name="marca" value={nuevoDispositivo.marca} onChange={handleNuevoDispositivoChange} required />
                          {nuevoDispositivoErrors.marca && <div className="input-error-message">{nuevoDispositivoErrors.marca}</div>}
                        </div>
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-pc-display me-2"></i>Modelo</label>
                          <input className="form-control" name="modelo" value={nuevoDispositivo.modelo} onChange={handleNuevoDispositivoChange} required />
                          {nuevoDispositivoErrors.modelo && <div className="input-error-message">{nuevoDispositivoErrors.modelo}</div>}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="fw-semibold"><i className="bi bi-person-lines-fill me-2"></i>Cliente</label>
                          <div className="d-flex">
                            <select name="idCliente" className="form-control me-2" value={nuevoDispositivo.idCliente} onChange={handleNuevoDispositivoChange}>
                              <option value="">Seleccione un cliente...</option>
                              {clientes.map(c => (
                                <option key={c.idCliente} value={c.idCliente}>
                                  {tiposDoc.find(td => td.idTipoDoc === c.idTipoDoc)?.nombre || c.idTipoDoc} - {c.numeroDoc} ({c.nombre} {c.apellido})
                                </option>
                              ))}
                            </select>
                            <button type="button" className="btn btn-verdeAgua" onClick={() => setShowAddClienteModal(true)}><i className="bi bi-plus-lg"></i></button>
                          </div>
                          {nuevoDispositivoErrors.idCliente && <div className="input-error-message">{nuevoDispositivoErrors.idCliente}</div>}
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <div className="modal-footer mt-3">
                    <button type="button" className="btn btn-dorado fw-bold" onClick={() => setShowAddDispositivoModal(false)}><i className="bi bi-x-circle me-1"></i>Cancelar</button>
                    <button type="submit" className="btn btn-azul fw-bold"><i className="bi bi-save me-1"></i>Guardar Dispositivo</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ordenes;