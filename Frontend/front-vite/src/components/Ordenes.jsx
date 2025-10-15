import React, { useEffect, useState, useMemo } from "react";
import MenuLateral from './MenuLateral';
import SearchableSelect from './SearchableSelect';

const API_URL = "http://localhost:5000/ordenes";
const DISPOSITIVOS_URL = "http://localhost:5000/dispositivos";
const TECNICOS_URL = "http://localhost:5000/empleadosTecnicos";
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

  const [modalMensaje, setModalMensaje] = useState(null);
  const [showAddDetalle, setShowAddDetalle] = useState(false);
  const [availableRepuestos, setAvailableRepuestos] = useState([]); // <-- repuestos filtrados por servicio

  const [form, setForm] = useState({
    nroDeOrden: null,
    idDispositivo: "",
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

  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [showAddDispositivoModal, setShowAddDispositivoModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ idTipoDoc: "", numeroDoc: "", nombre: "", apellido: "", telefono: "", mail: "", activo: 1 });
  const [nuevoDispositivo, setNuevoDispositivo] = useState({ nroSerie: "", marca: "", modelo: "", idCliente: "", activo: 1 });
  const [nuevoClienteErrors, setNuevoClienteErrors] = useState({});
  const [nuevoDispositivoErrors, setNuevoDispositivoErrors] = useState({});
  const [nuevoDetalleErrors, setNuevoDetalleErrors] = useState({}); // Agregar esta línea si no está presente (después de const [nuevoDispositivoErrors, setNuevoDispositivoErrors] = useState({});)

  // State for preserving form data when redirecting
  const [preservedFormData, setPreservedFormData] = useState(null);
  const [redirectAfterAdd, setRedirectAfterAdd] = useState(null); // 'cliente' or 'dispositivo'

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
    fetchTecnicos();
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

  const fetchTecnicos = () => {
    fetch(TECNICOS_URL)
      .then(res => res.json())
      .then(data => setEmpleados(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching tecnicos:", err));
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

  // Functions to handle adding new cliente/dispositivo with form preservation
  const handleAddDispositivo = () => {
    setPreservedFormData({ ...form, detalles: [...detalles] });
    setRedirectAfterAdd('dispositivo');
    setShowAddDispositivoModal(true);
  };

  const handleAddCliente = () => {
    setPreservedFormData({ ...form, detalles: [...detalles] });
    setRedirectAfterAdd('cliente');
    setShowAddClienteModal(true);
  };

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
      idEmpleado: "",
      estado: "En Diagnóstico" // Mostrar estado legible para el usuario
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
    // Configura el modal en modo modificar y carga detalles
    setModalModo('modificar');
    setForm({
      nroDeOrden: orden.nroDeOrden,
      idDispositivo: orden.idDispositivo || "",
      fecha: orden.fecha,
      descripcionDanos: orden.descripcionDanos || "",
      diagnostico: orden.diagnostico || "",
      presupuesto: orden.presupuesto || 0,
      idEmpleado: orden.idEmpleado || "",
      estado: orden.estado || form.estado
    });

    fetch(`${API_URL}/${orden.nroDeOrden}/detalles`)
      .then(res => {
        if (!res.ok) {
          console.error(`Error ${res.status} al obtener detalles`);
          return [];
        }
        return res.json();
      })
      .then(data => {
        console.log("Detalles obtenidos:", data);
        setDetalles(Array.isArray(data) ? data.map(d => ({
          ...d,
          isNew: false,
          codRepuestos: d.codRepuestos ?? (d.repuesto ? d.repuesto.idRepuesto : null),
          cuitProveedor: d.cuitProveedor ?? (d.proveedor ? d.proveedor.cuil : null),
          repuestoDescripcion: d.repuestoDescripcion ?? (d.repuesto ? `${d.repuesto.marca || ''} ${d.repuesto.modelo || ''}`.trim() : ''),
          proveedorRazonSocial: d.proveedorRazonSocial ?? (d.proveedor ? d.proveedor.razonSocial : ''),
        })) : []);
      })
      .catch(err => {
        console.error("Error al obtener detalles:", err);
        setDetalles([]);
      })
      .finally(() => {
        setFormErrors({});
        setMensaje("");
        setModalVisible(true);
        setShowAddDetalle(true);
        setAvailableRepuestos([]);
        setProveedoresFiltrados([]);
        setEditingDetalleId(null);
      });
  };

  const handleGenerarPDF = (nroDeOrden) => {
    // Abrir la página de previsualización en una nueva ventana
    window.open(`${API_URL}/${nroDeOrden}/preview`, '_blank', 'width=1000,height=800');
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
        setDetalles(Array.isArray(data) ? data.map(d => ({
          ...d,
          isNew: false,
          codRepuestos: d.codRepuestos ?? (d.repuesto ? d.repuesto.idRepuesto : null),
          cuitProveedor: d.cuitProveedor ?? (d.proveedor ? d.proveedor.cuil : null),
          repuestoDescripcion: d.repuestoDescripcion ?? (d.repuesto ? `${d.repuesto.marca || ''} ${d.repuesto.modelo || ''}`.trim() : ''),
          proveedorRazonSocial: d.proveedorRazonSocial ?? (d.proveedor ? d.proveedor.razonSocial : ''),
        })) : []);
      })
      .catch(err => { 
        console.error("Error al obtener detalles:", err);
        setDetalles([]);
      });

    // Cargar actualizaciones si existe el endpoint
    fetch(`${API_URL}/${orden.nroDeOrden}/actualizaciones`)
      .then(res => res.json())
      .then(setAvances)
      .catch(() => setAvances([]));

    setFormErrors({});
    setMensaje("");
    setModalVisible(true);
    setShowAddDetalle(false);
    setAvailableRepuestos([]);
    setProveedoresFiltrados([]);
    setEditingDetalleId(null);
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
        const prov = proveedoresFiltrados.find(p => String(p.cuilProveedor) === String(cuilProv) || String(p.idProveedor) === String(cuilProv));
        costoEncontrado = prov ? parseFloat(prov.costo || 0) : 0;
      }
      updatedDetalle.costoRepuesto = costoEncontrado;
    }

    costoRep = parseFloat(updatedDetalle.costoRepuesto || 0);
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
      ...(modalModo === 'alta' && { diagnostico: undefined }), // Excluir diagnóstico en modo alta
      presupuesto: parseFloat(form.presupuesto) || 0,
      detalles: detalles.map(d => {
        let finalRepuestoProveedorId = d.repuesto_proveedor_id;

    // Si el detalle es nuevo o fue editado, necesitamos encontrar el ID de la relación.
    if (d.isNew || editingDetalleId === d.idDetalle || !finalRepuestoProveedorId) {
      // Intentar por cuilProveedor (legacy)
      let repuestoProveedorRel = repuestosProveedores.find(rp => 
        String(rp.idRepuesto) === String(d.codRepuestos) &&
        (String(rp.cuilProveedor) === String(d.cuitProveedor) || String(rp.cuil) === String(d.cuitProveedor))
      );
      // Si no se encontró, intentar por idProveedor
      if (!repuestoProveedorRel) {
        repuestoProveedorRel = repuestosProveedores.find(rp => 
          String(rp.idRepuesto) === String(d.codRepuestos) &&
          (String(rp.idProveedor) === String(d.cuitProveedor) || String(rp.idProveedor) === String(d.idProveedor))
        );
      }
      if (repuestoProveedorRel) {
        finalRepuestoProveedorId = repuestoProveedorRel.id;
      }
    }
        
        return {
          idDetalle: typeof d.idDetalle === 'string' && d.idDetalle.startsWith('new_') ? null : d.idDetalle,
          idServicio: d.codigoServicio || d.idServicio,
          repuesto_proveedor_id: finalRepuestoProveedorId ?? null,
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
    .then(data => {
      fetchClientes();
      if (preservedFormData && redirectAfterAdd === 'cliente') {
        setForm(preservedFormData);
        setDetalles(preservedFormData.detalles || []);
        setPreservedFormData(null);
        setRedirectAfterAdd(null);
      }
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
      if (preservedFormData && redirectAfterAdd === 'dispositivo') {
        setForm({ ...preservedFormData, idDispositivo: data.idDispositivo });
        setDetalles(preservedFormData.detalles || []);
        setPreservedFormData(null);
        setRedirectAfterAdd(null);
      } else {
        setForm(prev => ({ ...prev, idDispositivo: data.idDispositivo })); // Seleccionar el nuevo
      }
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
              <div className="table-responsive" style={{ overflow: 'visible' }}>
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Dispositivo</th>
                      <th>Cliente</th>
                      <th>Empleado</th>
                      <th>Fecha</th>
                      <th>Estado</th> {/* Columna para estado */}
                      <th>Diagnóstico</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o) => (
                      <tr key={String(o.nroDeOrden)}>
                        <td>{o.nroDeOrden}</td>
                        <td>{o.dispositivo_info}</td>
                        <td>{
                          // cliente_info has format 'Nombre Apellido (numeroDoc)'. We show only the name part.
                          o.cliente_info ? o.cliente_info.split('(')[0].trim() : (o.dispositivo_info ? o.dispositivo_info.split('(')[0].trim() : '')
                        }</td>
                        <td>{o.empleado_info}</td>
                        <td>{o.fecha}</td>
                        <td>{o.estado}</td> {/* Mostramos el estado actual */}
                        <td>{o.diagnostico}</td>
                        <td>
                          <button className="btn btn-sm btn-verdeAgua fw-bold me-1" onClick={() => handleConsultar(o)}>
                            <i className="bi bi-search me-1"></i>Consultar
                          </button>
                          <button className="btn btn-sm btn-rojo fw-bold me-1" onClick={() => handleGenerarPDF(o.nroDeOrden)}>
                            <i className="bi bi-file-earmark-pdf me-1"></i>PDF
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
                {modalMensaje && (
                  <div className={`alert alert-${modalMensaje.tipo} alert-dismissible fade show mx-3 mt-3 mb-0`}>
                    {modalMensaje.texto}
                    <button type="button" className="btn-close" onClick={() => setModalMensaje(null)}></button>
                  </div>
                )}

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: 16 }}>
                  <fieldset>
                    <legend>Datos de la Orden</legend>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label>Dispositivo</label>
                        <div className="d-flex">
                          <div className="flex-grow-1 me-2">
                            <SearchableSelect
                              options={dispositivos}
                              value={dispositivos.find(d => d.idDispositivo === form.idDispositivo) || ""}
                              onChange={(selected) => setForm(prev => ({ ...prev, idDispositivo: selected ? selected.idDispositivo : "" }))}
                              placeholder="Seleccione un dispositivo"
                              displayFormat={(d) => `${d.marca} ${d.modelo} (${d.nroSerie})`}
                              className={modalModo === 'consultar' ? 'readonly-field' : ''}
                              disabled={modalModo === 'consultar'}
                              required
                            />
                          </div>
                          <button type="button" className="btn btn-secondary" onClick={handleAddDispositivo}>
                            Nuevo Dispositivo
                          </button>
                        </div>
                        {formErrors.idDispositivo && <div className="input-error-message">{formErrors.idDispositivo}</div>}
                      </div>
                      <div className="col-md-6">
                        <label>Técnico Asignado</label>
                        <SearchableSelect
                          options={empleados}
                          value={empleados.find(e => e.idEmpleado === form.idEmpleado) || ""}
                          onChange={(selected) => setForm(prev => ({ ...prev, idEmpleado: selected ? selected.idEmpleado : "" }))}
                          placeholder="Seleccione un Técnico"
                          displayFormat={(e) => `${e.nombre} ${e.apellido}`}
                          className={modalModo === 'consultar' ? 'readonly-field' : ''}
                          disabled={modalModo === 'consultar'}
                        />
                        {formErrors.idEmpleado && <div className="input-error-message">{formErrors.idEmpleado}</div>}
                      </div>
                      <div className="col-md-4">
                        <label>Fecha</label>
                        <input type="date" name="fecha" value={form.fecha} onChange={handleFormChange} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'} />
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
                      <div className="col-md-8">
                        <label>Descripción de Daños</label>
                        <input name="descripcionDanos" value={form.descripcionDanos} onChange={handleFormChange} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'} />
                        {formErrors.descripcionDanos && <div className="input-error-message">{formErrors.descripcionDanos}</div>}
                      </div>
                      {modalModo !== 'alta' && (
                        <div className="col-md-8">
                          <label>Diagnóstico</label>
                          <input name="diagnostico" value={form.diagnostico} onChange={handleFormChange} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} disabled={modalModo === 'consultar'} />
                        </div>
                      )}
                      <div className="col-md-4">
                        <label>Presupuesto Total</label>
                        <input type="number" name="presupuesto" value={form.presupuesto} className={`form-control ${modalModo === 'consultar' ? 'readonly-field' : ''}`} readOnly />
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
                          <tr key={String(detalle.idDetalle ?? index)}>
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
                              <option key={`${p.idProveedor}-${index}`} value={`${nuevoDetalle.codigoRepuesto}/${p.idProveedor}`}>
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
                          <button type="button" className="btn btn-verdeAgua" onClick={handleAgregarDetalleLocal}>
                            {editingDetalleId ? 'Actualizar' : 'Añadir'}
                          </button>
                          {editingDetalleId && (
                            <button type="button" className="btn btn-dorado" onClick={() => {
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
                            <div className="flex-grow-1 me-2">
                              <SearchableSelect
                                options={clientes}
                                value={clientes.find(c => c.idCliente === nuevoDispositivo.idCliente) || ""}
                                onChange={(selected) => setNuevoDispositivo(prev => ({ ...prev, idCliente: selected ? selected.idCliente : "" }))}
                                placeholder="Seleccione un cliente..."
                                displayFormat={(c) => `${tiposDoc.find(td => td.idTipoDoc === c.idTipoDoc)?.nombre || c.idTipoDoc} - ${c.numeroDoc} (${c.nombre} ${c.apellido})`}
                              />
                            </div>
                            <button type="button" className="btn btn-verdeAgua" onClick={handleAddCliente}><i className="bi bi-plus-lg"></i></button>
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