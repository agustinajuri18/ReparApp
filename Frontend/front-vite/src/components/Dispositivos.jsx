import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import MenuLateral from './MenuLateral';
import ConfirmModal from './ConfirmModal';
import PiePagina from './PiePagina';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };

const API_URL = "http://localhost:5000/dispositivos";
const CLIENTES_URL = "http://localhost:5000/clientes";
const TIPOS_DOC_URL = "http://localhost:5000/tipos-documento";

export default function Dispositivos() {
    const [dispositivos, setDispositivos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar' | 'alta'
    const [dispositivoActual, setDispositivoActual] = useState({
        idDispositivo: "",
        nroSerie: "",
        marca: "",
        modelo: "",
        idCliente: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [historialVisible, setHistorialVisible] = useState(false);
    const [historialOrdenes, setHistorialOrdenes] = useState([]);
    const [openMenuFor, setOpenMenuFor] = useState(null);
    const menuAnchorRefs = React.useRef({});
    const navigate = useNavigate();
    const [showAddClienteModal, setShowAddClienteModal] = useState(false);
    const [nuevoCliente, setNuevoCliente] = useState({ idTipoDoc: "", numeroDoc: "", nombre: "", apellido: "", telefono: "", mail: "" });
    const [nuevoClienteErrors, setNuevoClienteErrors] = useState({});
    const [nuevoClienteErrorMessage, setNuevoClienteErrorMessage] = useState("");
    const [dupChecking, setDupChecking] = useState(false);
    const [duplicateExists, setDuplicateExists] = useState(false);
    const [duplicateMsg, setDuplicateMsg] = useState("");
    const [nuevoClienteSaving, setNuevoClienteSaving] = useState(false);
    const clienteCheckTimer = React.useRef(null);

    // Debounced duplicate check (idTipoDoc + numeroDoc)
    useEffect(() => {
        // reset duplicate state when inputs change
        setDuplicateExists(false);
        setDuplicateMsg("");
        if (clienteCheckTimer.current) clearTimeout(clienteCheckTimer.current);
        if (!nuevoCliente.idTipoDoc || !nuevoCliente.numeroDoc) return;
        clienteCheckTimer.current = setTimeout(async () => {
            setDupChecking(true);
            setDuplicateExists(false);
            setDuplicateMsg("");
            try {
                const res = await fetch(`${CLIENTES_URL}/existe?idTipoDoc=${encodeURIComponent(nuevoCliente.idTipoDoc)}&numeroDoc=${encodeURIComponent(nuevoCliente.numeroDoc)}`);
                if (res.ok) {
                    const j = await res.json();
                    if (j.exists) {
                        setDuplicateExists(true);
                        setDuplicateMsg('Ya existe un cliente con ese tipo y número de documento.');
                    }
                }
            } catch (err) {
                console.warn('Error verificando duplicado', err);
            } finally {
                setDupChecking(false);
            }
        }, 500);
        return () => { if (clienteCheckTimer.current) clearTimeout(clienteCheckTimer.current); };
    }, [nuevoCliente.idTipoDoc, nuevoCliente.numeroDoc]);

    // Cargar dispositivos
    const fetchDispositivos = () => {
        fetch(`${API_URL}?activos=${!mostrarInactivos}`)
            .then(res => res.json())
            .then(data => setDispositivos(Array.isArray(data) ? data.filter(c => c && typeof c === 'object' && 'idDispositivo' in c && c.idDispositivo != null) : []))
            .catch(() => setMensaje("Error al cargar dispositivos"));
    };

    // Cargar clientes
    const fetchClientes = () => {
        fetch(CLIENTES_URL + "?activos=true")
            .then(res => res.json())
            .then(data => setClientes(Array.isArray(data) ? data : []))
            .catch(() => setMensaje("Error al cargar clientes"));
    };

    // Cargar tipos de documento
    const fetchTiposDocumento = () => {
        fetch(TIPOS_DOC_URL)
            .then(res => res.json())
            .then(data => setTiposDocumento(Array.isArray(data) ? data : []))
            .catch(() => setMensaje("Error al cargar tipos de documento"));
    };

    useEffect(() => {
        fetchDispositivos();
        fetchClientes();
        fetchTiposDocumento();
        // eslint-disable-next-line
    }, [mostrarInactivos]);

    // Close three-dot menu when clicking outside or pressing Escape
    useEffect(() => {
        const onDocClick = () => setOpenMenuFor(null);
        const onEsc = (e) => { if (e.key === 'Escape') setOpenMenuFor(null); };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onEsc); };
    }, []);

    // Modal handlers
    const handleAgregarClick = () => {
        setDispositivoActual({
            idDispositivo: "",
            nroSerie: "",
            marca: "",
            modelo: "",
            idCliente: "",
        });
        setModalModo("alta");
        setModalVisible(true);
        setMensaje("");
    };

    const handleModificar = (dispositivo) => {
        setDispositivoActual({ ...dispositivo });
        setModalModo('modificar');
        setModalVisible(true);
        setMensaje("");
    };

    const handleConsultar = (dispositivo) => {
        setDispositivoActual({ ...dispositivo });
        setModalModo('consultar');
        setModalVisible(true);
        setMensaje("");
    };

    const [confirmDeleteDispositivo, setConfirmDeleteDispositivo] = useState({ open: false, id: null });

    const handleEliminar = async (idDispositivo) => {
        setConfirmDeleteDispositivo({ open: true, id: idDispositivo });
    };

    const confirmDeleteDispositivoCancel = () => setConfirmDeleteDispositivo({ open: false, id: null });

    const confirmDeleteDispositivoConfirm = async () => {
        const id = confirmDeleteDispositivo.id;
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        fetchDispositivos();
        setConfirmDeleteDispositivo({ open: false, id: null });
    };

    const handleReactivar = async (idDispositivo) => {
        await fetch(`${API_URL}/${idDispositivo}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activo: 1 })
        });
        fetchDispositivos();
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setDispositivoActual({ ...dispositivoActual, [name]: value });
        setFormErrors(validarDispositivo({ ...dispositivoActual, [name]: value }));
    };

    function validarDispositivo(form) {
        const errors = {};
        if (!form.nroSerie || form.nroSerie.trim().length < 3) errors.nroSerie = "El número de serie es obligatorio y debe tener al menos 3 caracteres.";
        if (!form.marca || form.marca.trim().length < 2) errors.marca = "La marca es obligatoria y debe tener al menos 2 caracteres.";
        if (!form.modelo || form.modelo.trim().length < 2) errors.modelo = "El modelo es obligatorio y debe tener al menos 2 caracteres.";
        if (!form.idCliente) errors.idCliente = "Debe seleccionar un cliente válido.";
        return errors;
    }

    // Guardar alta
    const handleSubmit = async e => {
        e.preventDefault();
        const errors = validarDispositivo(dispositivoActual);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            setMensaje("Por favor, corrige los errores antes de continuar.");
            return;
        }
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dispositivoActual),
            });
            const resultado = await res.json().catch(() => ({}));
            if (res.ok) {
                // success: close modal and refresh list
                setModalVisible(false);
                setDispositivoActual({
                    idDispositivo: "",
                    nroSerie: "",
                    marca: "",
                    modelo: "",
                    idCliente: "",
                });
                fetchDispositivos();
            } else {
                // show backend error message and keep modal open
                setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido del servidor");
            }
        } catch (err) {
            setMensaje("Error de red: " + (err.message || String(err)));
        }
    };

    // Guardar modificación
    const handleGuardarModificacion = async (e) => {
        if (e) e.preventDefault();
        const errors = validarDispositivo(dispositivoActual);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            setMensaje("Por favor, corrige los errores antes de continuar.");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/${dispositivoActual.idDispositivo}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dispositivoActual),
            });
            const resultado = await res.json().catch(() => ({}));
            if (res.ok) {
                setModalVisible(false);
                setDispositivoActual({
                    idDispositivo: "",
                    nroSerie: "",
                    marca: "",
                    modelo: "",
                    idCliente: "",
                });
                fetchDispositivos();
            } else {
                setMensaje(resultado.error || resultado.detail || resultado.mensaje || "Error desconocido del servidor");
            }
        } catch (err) {
            setMensaje("Error de red: " + (err.message || String(err)));
        }
    };

    return (
        <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
            <div className="row flex-nowrap">
                <MenuLateral />
                <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
                    <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: "var(--color-beige)" }}>
                        <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <h4 className="mb-0"><i className="bi bi-cpu me-2"></i>Gestión de Dispositivos</h4>
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
                                    <i className="bi bi-plus-lg"></i> Agregar dispositivo
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive" style={{ overflow: 'visible' }}>
                                <table className="table table-striped table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Nro Serie</th>
                                            <th>Marca</th>
                                            <th>Modelo</th>
                                            <th>Cliente</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dispositivos.map(d => (
                                            <tr key={d.idDispositivo}>
                                                <td>{d.nroSerie}</td>
                                                <td>{d.marca}</td>
                                                <td>{d.modelo}</td>
                                                <td>
                                                    {(() => {
                                                        const cliente = clientes.find(c => c.idCliente === d.idCliente);
                                                        return cliente ? `${cliente.nombre} ${cliente.apellido} (${tiposDocumento.find(td => td.idTipoDoc === cliente.idTipoDoc)?.nombre || cliente.idTipoDoc} - ${cliente.numeroDoc})` : 'Cliente no encontrado';
                                                    })()}
                                                </td>
                                                <td>{d.activo ? "Activo" : "Inactivo"}</td>
                                                <td style={{ position: 'relative', overflow: 'visible' }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <button
                                                            className="btn btn-sm btn-verdeAgua fw-bold"
                                                            onClick={() => handleConsultar(d)}
                                                        >
                                                            <i className="bi bi-search me-1"></i>Consultar
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-azul fw-bold"
                                                            onClick={async () => {
                                                                try {
                                                                    setMensaje('');
                                                                    const res = await fetch(`${API_URL}/${d.idDispositivo}/historial-ordenes`);
                                                                    // Try to parse JSON but don't throw on parse error
                                                                    let data = null;
                                                                    try { data = await res.json(); } catch (e) { data = null; }

                                                                    if (!res.ok) {
                                                                        // backend returned an error object
                                                                        const errMsg = data && (data.error || data.mensaje || data.detail) ? (data.error || data.mensaje || data.detail) : `Error ${res.status}`;
                                                                        setMensaje(`Error al cargar historial: ${errMsg}`);
                                                                        setHistorialOrdenes([]);
                                                                    } else {
                                                                        setHistorialOrdenes(Array.isArray(data) ? data : []);
                                                                    }

                                                                    // show modal either way so user sees message or results
                                                                    setHistorialVisible(true);
                                                                } catch (err) {
                                                                    setMensaje('Error de red al cargar historial: ' + (err.message || String(err)));
                                                                    setHistorialOrdenes([]);
                                                                    setHistorialVisible(true);
                                                                }
                                                            }}
                                                        >
                                                            <i className="bi bi-clock-history me-1"></i>Historial
                                                        </button>

                                                        {/* three-dot dropdown for modify/delete */}
                                                        <div style={{ position: 'relative', overflow: 'visible' }}>
                                                            <button
                                                                ref={el => { if (el) menuAnchorRefs.current[d.idDispositivo] = el }}
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === d.idDispositivo ? null : d.idDispositivo); }}
                                                                aria-expanded={openMenuFor === d.idDispositivo}
                                                            >
                                                                <i className="bi bi-three-dots-vertical"></i>
                                                            </button>
                                                            {openMenuFor === d.idDispositivo && (
                                                                <ActionMenuPortal
                                                                    anchorEl={menuAnchorRefs.current[d.idDispositivo]}
                                                                    onClose={() => setOpenMenuFor(null)}
                                                                    onModificar={() => { setOpenMenuFor(null); d.activo && handleModificar(d); }}
                                                                    onEliminar={() => { setOpenMenuFor(null); d.idDispositivo && handleEliminar(d.idDispositivo); }}
                                                                    onReactivar={() => { setOpenMenuFor(null); d.idDispositivo && handleReactivar(d.idDispositivo); }}
                                                                    activo={d.activo}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {dispositivos.length === 0 && (
                                    <div className="text-center text-muted py-4">No hay dispositivos registrados.</div>
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
                                        ? "Consultar dispositivo"
                                        : modalModo === 'modificar'
                                            ? "Modificar dispositivo"
                                            : "Nuevo dispositivo"}
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
                                            <i className="bi bi-cpu me-2"></i>Datos del dispositivo
                                        </legend>
                                        {/* División: Información del dispositivo */}
                                        <h6 className="fw-bold mt-3 mb-2 border-bottom pb-1">
                                            <i className="bi bi-cpu me-2"></i>Información del dispositivo
                                        </h6>
                                        <div className="row g-4">
                                            <div className="col-12 col-md-6">
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Nro Serie</label>
                                                    <input
                                                        className="form-control"
                                                        name="nroSerie"
                                                        value={dispositivoActual?.nroSerie || ""}
                                                        onChange={modalModo === "consultar" ? undefined : handleChange}
                                                        required
                                                        disabled={modalModo === "consultar"}
                                                        readOnly={modalModo === "consultar"}
                                                    />
                                                    {formErrors.nroSerie && <div className="input-error-message">{formErrors.nroSerie}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-pc me-2"></i>Marca</label>
                                                    <input
                                                        className="form-control"
                                                        name="marca"
                                                        value={dispositivoActual?.marca || ""}
                                                        onChange={modalModo === "consultar" ? undefined : handleChange}
                                                        required
                                                        disabled={modalModo === "consultar"}
                                                        readOnly={modalModo === "consultar"}
                                                    />
                                                    {formErrors.marca && <div className="input-error-message">{formErrors.marca}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-pc-display me-2"></i>Modelo</label>
                                                    <input
                                                        className="form-control"
                                                        name="modelo"
                                                        value={dispositivoActual?.modelo || ""}
                                                        onChange={modalModo === "consultar" ? undefined : handleChange}
                                                        required
                                                        disabled={modalModo === "consultar"}
                                                        readOnly={modalModo === "consultar"}
                                                    />
                                                    {formErrors.modelo && <div className="input-error-message">{formErrors.modelo}</div>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* División: Cliente asociado */}
                                        <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1">
                                            <i className="bi bi-person-lines-fill me-2"></i>Cliente asociado
                                        </h6>
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-person-lines-fill me-2"></i>Cliente</label>
                                                    {modalModo === "consultar" ? (
                                                        (() => {
                                                            const cliente = clientes.find(c => c.idCliente === dispositivoActual.idCliente);
                                                            return cliente ? (
                                                                <div style={{ background: "#e8f7f7", borderRadius: 8, padding: "12px" }}>
                                                                    <div><b>Nombre:</b> {cliente.nombre} {cliente.apellido}</div>
                                                                    <div><b>Documento:</b> {
                                                                        tiposDocumento.find(td => td.idTipoDoc === cliente.idTipoDoc)?.nombre || cliente.idTipoDoc
                                                                    } - {cliente.numeroDoc}</div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-danger">Cliente no encontrado</div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <div className="d-flex gap-2">
                                                            <select
                                                                name="idCliente"
                                                                className="form-control flex-grow-1"
                                                                value={dispositivoActual?.idCliente || ""}
                                                                onChange={e => setDispositivoActual({ ...dispositivoActual, idCliente: e.target.value })}
                                                                disabled={modalModo === 'consultar'}
                                                            >
                                                                <option value="">Seleccione un cliente...</option>
                                                                {clientes.map(c => (
                                                                    <option key={c.idCliente} value={c.idCliente}>
                                                                        {(tiposDocumento.find(td => td.idTipoDoc === c.idTipoDoc)?.nombre || c.idTipoDoc)}
                                                                        {" - "}{c.numeroDoc} ({c.nombre} {c.apellido})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                className="btn btn-verdeAgua"
                                                                title="Registrar nuevo cliente"
                                                                onClick={() => {
                                                                    // open inline modal to add cliente
                                                                    setShowAddClienteModal(true);
                                                                }}
                                                            >
                                                                <i className="bi bi-plus-lg me-1"></i>Nuevo cliente
                                                            </button>
                                                        </div>
                                                    )}
                                                    {formErrors.idCliente && <div className="input-error-message">{formErrors.idCliente}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    {/* Modal para agregar cliente desde Dispositivos */}
                                    {showAddClienteModal && (
                                        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                                            <div className="modal-dialog modal-md modal-dialog-centered">
                                                <div className="modal-content" style={{ width: '100%', maxWidth: '680px' }}>
                                                    <div className="modal-header" style={{ background: '#1f3345', color: '#f0ede5' }}>
                                                        <h5 className="modal-title"><i className="bi bi-plus-lg me-2"></i>Nuevo cliente</h5>
                                                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddClienteModal(false)}></button>
                                                    </div>
                                                    <div className="modal-body" style={{ padding: 0 }}>
                                                        <div className="form-container">
                                                            {nuevoClienteErrorMessage && <div className="alert alert-danger">{nuevoClienteErrorMessage}</div>}
                                                            <fieldset style={{ border: 'none' }}>
                                                                <legend><i className="bi bi-person-vcard me-2"></i>Datos del cliente</legend>
                                                                <h6 className="fw-bold mt-3 mb-2 border-bottom pb-1"><i className="bi bi-person-lines-fill me-2"></i>Datos personales</h6>
                                                                <div className="row g-4">
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="mb-3">
                                                                            <label><i className="bi bi-card-list me-2"></i>Tipo de documento</label>
                                                                            <select className="form-control" value={nuevoCliente.idTipoDoc} onChange={e => setNuevoCliente(prev => ({ ...prev, idTipoDoc: e.target.value }))}>
                                                                                <option value="">Seleccione tipo de documento</option>
                                                                                {tiposDocumento.map(td => <option key={td.idTipoDoc} value={td.idTipoDoc}>{td.nombre}</option>)}
                                                                            </select>
                                                                            {nuevoClienteErrors.idTipoDoc && <div className="input-error-message">{nuevoClienteErrors.idTipoDoc}</div>}
                                                                        </div>
                                                                        <div className="mb-3">
                                                                            <label><i className="bi bi-hash me-2"></i>Número de documento</label>
                                                                            <input className="form-control" value={nuevoCliente.numeroDoc} onChange={e => setNuevoCliente(prev => ({ ...prev, numeroDoc: e.target.value }))} />
                                                                            {nuevoClienteErrors.numeroDoc && <div className="input-error-message">{nuevoClienteErrors.numeroDoc}</div>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="mb-3">
                                                                            <label><i className="bi bi-person me-2"></i>Nombre</label>
                                                                            <input className="form-control" value={nuevoCliente.nombre} onChange={e => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))} />
                                                                            {nuevoClienteErrors.nombre && <div className="input-error-message">{nuevoClienteErrors.nombre}</div>}
                                                                        </div>
                                                                        <div className="mb-3">
                                                                            <label><i className="bi bi-person me-2"></i>Apellido</label>
                                                                            <input className="form-control" value={nuevoCliente.apellido} onChange={e => setNuevoCliente(prev => ({ ...prev, apellido: e.target.value }))} />
                                                                            {nuevoClienteErrors.apellido && <div className="input-error-message">{nuevoClienteErrors.apellido}</div>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <h6 className="fw-bold mt-4 mb-2 border-bottom pb-1"><i className="bi bi-telephone me-2"></i>Datos de contacto</h6>
                                                                <div className="row g-4">
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="mb-3">
                                                                            <label><i className="bi bi-telephone me-2"></i>Teléfono</label>
                                                                            <input className="form-control" value={nuevoCliente.telefono} onChange={e => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="mb-3">
                                                                            <label><i className="bi bi-envelope me-2"></i>Email</label>
                                                                            <input className="form-control" value={nuevoCliente.mail} onChange={e => setNuevoCliente(prev => ({ ...prev, mail: e.target.value }))} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </fieldset>
                                                        </div>
                                                    </div>
                                                    <div className="modal-footer">
                                                                <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-0 w-100">
                                                            <button type="button" className="btn btn-azul fw-bold" disabled={dupChecking || duplicateExists || nuevoClienteSaving} onClick={async () => {
                                                                setNuevoClienteErrorMessage("");
                                                                const errors = {};
                                                                if (!nuevoCliente.idTipoDoc) errors.idTipoDoc = 'Seleccione un tipo de documento.';
                                                                if (!nuevoCliente.numeroDoc || nuevoCliente.numeroDoc.trim().length === 0) errors.numeroDoc = 'Número de documento obligatorio.';
                                                                if (!nuevoCliente.nombre || nuevoCliente.nombre.trim().length < 2) errors.nombre = 'Nombre obligatorio.';
                                                                if (!nuevoCliente.apellido || nuevoCliente.apellido.trim().length < 2) errors.apellido = 'Apellido obligatorio.';
                                                                setNuevoClienteErrors(errors);
                                                                if (Object.keys(errors).length > 0) return;
                                                                setNuevoClienteSaving(true);
                                                                try {
                                                                    const res = await fetch(CLIENTES_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoCliente) });
                                                                    const resultado = await res.json().catch(() => ({}));
                                                                    if (res.ok) {
                                                                        const createdId = resultado.idCliente || resultado.id || (resultado.data && resultado.data.idCliente);
                                                                        if (createdId) setDispositivoActual(prev => ({ ...prev, idCliente: String(createdId) }));
                                                                        setShowAddClienteModal(false);
                                                                        setNuevoCliente({ idTipoDoc: "", numeroDoc: "", nombre: "", apellido: "", telefono: "", mail: "" });
                                                                        setNuevoClienteErrors({});
                                                                        setDuplicateExists(false);
                                                                        setDuplicateMsg("");
                                                                        fetchClientes();
                                                                    } else {
                                                                        setNuevoClienteErrorMessage(resultado.error || resultado.mensaje || 'Error al crear cliente');
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Error creando cliente', err);
                                                                    setNuevoClienteErrorMessage('Error de conexión al crear cliente');
                                                                } finally {
                                                                    setNuevoClienteSaving(false);
                                                                }
                                                            }}>
                                                                <i className="bi bi-save me-1"></i>Guardar
                                                            </button>
                                                            <button type="button" className="btn btn-dorado fw-bold" onClick={() => setShowAddClienteModal(false)}>
                                                                <i className="bi bi-x-circle me-1"></i>Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
            {historialVisible && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title"><i className="bi bi-clock-history me-2"></i>Historial de Órdenes</h5>
                                <button className="btn-close" onClick={() => setHistorialVisible(false)}></button>
                            </div>
                            <div className="modal-body">
                                {historialOrdenes.length === 0 ? (
                                    <div className="text-muted">No se encontraron órdenes para este dispositivo.</div>
                                ) : (
                                    <div className="table-responsive" style={{ overflow: 'visible' }}>
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Nro Orden</th>
                                                    <th>Fecha</th>
                                                    <th>Diagnóstico</th>
                                                    <th>Precio Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historialOrdenes.map(o => {
                                                    // precio puede venir en distintas keys según backend; usar fallback
                                                    const precio = o.precioTotal ?? o.precio_total ?? o.price ?? 0;
                                                    const precioFmt = typeof precio === 'number' ? precio.toFixed(2) : String(precio);
                                                    return (
                                                        <tr key={o.nroDeOrden}>
                                                            <td>{o.nroDeOrden}</td>
                                                            <td>{o.fecha}</td>
                                                            <td>{o.diagnostico}</td>
                                                            <td>${precioFmt}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-dorado" onClick={() => setHistorialVisible(false)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <PiePagina />
            <ConfirmModal
                open={confirmDeleteDispositivo.open}
                title="Confirmar eliminación"
                message="¿Seguro que desea eliminar este dispositivo?"
                onCancel={confirmDeleteDispositivoCancel}
                onConfirm={confirmDeleteDispositivoConfirm}
            />
        </div>
    );
}

        // Portal component for action menu (copied from Clientes.jsx)
        function ActionMenuPortal({ anchorEl, onClose, onModificar, onEliminar, onReactivar, activo }) {
            const [pos, setPos] = React.useState({ left: 0, top: 0, transformOrigin: 'top right' });

            useEffect(() => {
                if (!anchorEl) return;
                const rect = anchorEl.getBoundingClientRect();
                const menuWidth = 160; // approx
                const left = rect.right - menuWidth;
                const top = rect.bottom + 6; // 6px gap

                // If there's not enough space below, open upwards
                const spaceBelow = window.innerHeight - rect.bottom;
                const menuHeight = 120; // approximate
                if (spaceBelow < menuHeight) {
                    setPos({ left: Math.max(8, left), top: rect.top - menuHeight - 6, transformOrigin: 'bottom right' });
                } else {
                    setPos({ left: Math.max(8, left), top: top, transformOrigin: 'top right' });
                }
            }, [anchorEl]);

            React.useEffect(() => {
                const onDocClick = (e) => {
                    if (!anchorEl) return;
                    const node = document.getElementById('action-menu-portal');
                    if (node && !node.contains(e.target) && !anchorEl.contains(e.target)) onClose();
                };
                const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
                document.addEventListener('mousedown', onDocClick);
                document.addEventListener('keydown', onEsc);
                return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onEsc); };
            }, [anchorEl, onClose]);

            if (!anchorEl) return null;

            return ReactDOM.createPortal(
                <div id="action-menu-portal" style={{ position: 'absolute', left: pos.left, top: pos.top, zIndex: 2147483647, minWidth: 140 }}>
                    <div className="card" style={{ overflow: 'visible' }}>
                        <ul className="list-group list-group-flush p-2">
                            <li className="list-group-item border-0 p-0 mb-1"><button className={`btn btn-sm w-100 ${activo ? 'btn-dorado' : 'btn-secondary'}`} onClick={onModificar} disabled={!activo}>Modificar</button></li>
                            {activo ? (
                                <li className="list-group-item border-0 p-0"><button className="btn btn-sm btn-rojo w-100" onClick={onEliminar}>Eliminar</button></li>
                            ) : (
                                <li className="list-group-item border-0 p-0"><button className="btn btn-sm btn-verdeAgua w-100" onClick={onReactivar}>Reactivar</button></li>
                            )}
                        </ul>
                    </div>
                </div>,
                document.body
            );
        }