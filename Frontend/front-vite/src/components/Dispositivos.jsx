import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';
import PiePagina from './PiePagina';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };

const API_URL = "http://localhost:5000/dispositivos/";
const CLIENTES_URL = "http://localhost:5000/clientes/";
const TIPOS_DOC_URL = "http://localhost:5000/tipos-documento/";

export default function Dispositivos() {
    const [dispositivos, setDispositivos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar' | 'alta'
    const [dispositivoActual, setDispositivoActual] = useState({
        nroSerie: "",
        marca: "",
        modelo: "",
        clienteTipoDocumento: "",
        clienteNumeroDoc: "",
        activo: 1,
    });

    // Cargar dispositivos
    const fetchDispositivos = async () => {
        let url = API_URL + (mostrarInactivos ? "?activos=false" : "?activos=true");
        const res = await fetch(url);
        const data = await res.json();
        setDispositivos(Array.isArray(data) ? data : []);
    };

    // Cargar clientes
    const fetchClientes = async () => {
        const res = await fetch(CLIENTES_URL + "?activos=true");
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        fetchDispositivos();
        fetchClientes();
        fetch(TIPOS_DOC_URL)
            .then(res => res.json())
            .then(data => setTiposDocumento(Array.isArray(data) ? data : []));
        // eslint-disable-next-line
    }, [mostrarInactivos]);

    // Modal handlers
    const handleAgregarClick = () => {
        setDispositivoActual({
            nroSerie: "",
            marca: "",
            modelo: "",
            clienteTipoDocumento: "",
            clienteNumeroDoc: "",
            activo: 1,
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

    const handleEliminar = async (nroSerie) => {
        if (window.confirm("¿Seguro que desea eliminar este dispositivo?")) {
            await fetch(`${API_URL}${nroSerie}`, { method: "DELETE" });
            fetchDispositivos();
        }
    };

    function validarDispositivo(form) {
        if (!form.nroSerie || form.nroSerie.trim().length < 3) return "El número de serie es obligatorio y debe tener al menos 3 caracteres.";
        if (!form.marca || form.marca.trim().length < 2) return "La marca es obligatoria y debe tener al menos 2 caracteres.";
        if (!form.modelo || form.modelo.trim().length < 2) return "El modelo es obligatorio y debe tener al menos 2 caracteres.";
        if (!form.clienteTipoDocumento) return "Debe seleccionar el tipo de documento del cliente.";
        if (!form.clienteNumeroDoc || !/^\d{7,8}$/.test(form.clienteNumeroDoc)) return "Debe seleccionar un cliente válido con DNI de 7 u 8 dígitos.";
        if (form.activo !== 0 && form.activo !== 1 && form.activo !== "0" && form.activo !== "1") return "El estado es obligatorio.";
        return null;
    }

    // Guardar alta
    const handleSubmit = async e => {
        e.preventDefault();
        const error = validarDispositivo(dispositivoActual);
        if (error) {
            setMensaje(error);
            return;
        }
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dispositivoActual),
        });
        const resultado = await res.json();
        setMensaje(resultado.mensaje || resultado.detail);
        setModalVisible(false);
        setDispositivoActual({
            nroSerie: "",
            marca: "",
            modelo: "",
            clienteTipoDocumento: "",
            clienteNumeroDoc: "",
            activo: 1,
        });
        fetchDispositivos();
    };

    // Guardar modificación
    const handleGuardarModificacion = async (e) => {
        if (e) e.preventDefault();
        const error = validarDispositivo(dispositivoActual);
        if (error) {
            setMensaje(error);
            return;
        }
        await fetch(`${API_URL}${dispositivoActual.nroSerie}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dispositivoActual),
        });
        setModalVisible(false);
        setDispositivoActual({
            nroSerie: "",
            marca: "",
            modelo: "",
            clienteTipoDocumento: "",
            clienteNumeroDoc: "",
            activo: 1,
        });
        fetchDispositivos();
    };

    // Actualiza campos del dispositivo en edición
    const handleModalChange = e => {
        setDispositivoActual({ ...dispositivoActual, [e.target.name]: e.target.value });
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
                            <div className="table-responsive">
                                <table className="table table-striped table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Nro Serie</th>
                                            <th>Marca</th>
                                            <th>Modelo</th>
                                            <th>Tipo Documento</th>
                                            <th>Numero Documento</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dispositivos.map(d => (
                                            <tr key={d.nroSerie} style={d.activo === 0 ? { opacity: 0.5 } : {}}>
                                                <td>{d.nroSerie}</td>
                                                <td>{d.marca}</td>
                                                <td>{d.modelo}</td>
                                                <td>
                                                    {
                                                        tiposDocumento.find(td => String(td.codigo) === String(d.clienteTipoDocumento))?.nombre
                                                        || d.clienteTipoDocumento
                                                    }
                                                </td>
                                                <td>{d.clienteNumeroDoc}</td>
                                                <td>{d.activo === 1 ? "Activo" : "Inactivo"}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-verdeAgua fw-bold me-1"
                                                        onClick={() => handleConsultar(d)}
                                                    >
                                                        <i className="bi bi-search me-1"></i>Consultar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-dorado fw-bold me-1"
                                                        onClick={() => handleModificar(d)}
                                                    >
                                                        <i className="bi bi-pencil-square me-1"></i>Modificar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-rojo fw-bold"
                                                        onClick={() => handleEliminar(d.nroSerie)}
                                                    >
                                                        <i className="bi bi-trash me-1"></i>Eliminar
                                                    </button>
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
                                        <div className="row g-4">
                                            <div className="col-12 col-md-6">
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-hash me-2"></i>Nro Serie</label>
                                                    <input
                                                        className="form-control"
                                                        name="nroSerie"
                                                        value={dispositivoActual?.nroSerie || ""}
                                                        onChange={modalModo === "consultar" ? undefined : handleModalChange}
                                                        required
                                                        disabled={modalModo === "consultar" || modalModo === "modificar"}
                                                        readOnly={modalModo === "consultar"}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-pc me-2"></i>Marca</label>
                                                    <input
                                                        className="form-control"
                                                        name="marca"
                                                        value={dispositivoActual?.marca || ""}
                                                        onChange={modalModo === "consultar" ? undefined : handleModalChange}
                                                        required
                                                        disabled={modalModo === "consultar"}
                                                        readOnly={modalModo === "consultar"}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-pc-display me-2"></i>Modelo</label>
                                                    <input
                                                        className="form-control"
                                                        name="modelo"
                                                        value={dispositivoActual?.modelo || ""}
                                                        onChange={modalModo === "consultar" ? undefined : handleModalChange}
                                                        required
                                                        disabled={modalModo === "consultar"}
                                                        readOnly={modalModo === "consultar"}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-person-lines-fill me-2"></i>Cliente</label>
                                                    {modalModo === "consultar" ? (
                                                        (() => {
                                                            const cliente = clientes.find(c =>
                                                                String(c.tipoDocumento) === String(dispositivoActual.clienteTipoDocumento) &&
                                                                (
                                                                    String(c.numeroDoc) === String(dispositivoActual.clienteNumeroDoc) ||
                                                                    String(c.numeroDni) === String(dispositivoActual.clienteNumeroDoc)
                                                                )
                                                            );
                                                            return cliente ? (
                                                                <div style={{ background: "#e8f7f7", borderRadius: 8, padding: "12px" }}>
                                                                    <div><b>Nombre:</b> {cliente.nombre} {cliente.apellido}</div>
                                                                    <div><b>Documento:</b> {
                                                                        tiposDocumento.find(td => String(td.codigo) === String(cliente.tipoDocumento))?.nombre || cliente.tipoDocumento
                                                                    } - {cliente.numeroDoc || cliente.numeroDni}</div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-danger">Cliente no encontrado</div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <select
                                                            name="cliente"
                                                            className="form-control"
                                                            value={
                                                                dispositivoActual?.clienteTipoDocumento && dispositivoActual?.clienteNumeroDoc
                                                                    ? `${dispositivoActual.clienteTipoDocumento}-${dispositivoActual.clienteNumeroDoc}`
                                                                    : ""
                                                            }
                                                            onChange={e => {
                                                                const [tipoDocumento, numeroDoc] = e.target.value.split("-");
                                                                setDispositivoActual({
                                                                    ...dispositivoActual,
                                                                    clienteTipoDocumento: tipoDocumento,
                                                                    clienteNumeroDoc: numeroDoc
                                                                });
                                                            }}
                                                            disabled={modalModo === 'consultar'}
                                                        >
                                                            <option value="">Seleccione un cliente...</option>
                                                            {clientes.map(c => (
                                                                <option key={`${c.tipoDocumento}-${c.numeroDoc}`} value={`${c.tipoDocumento}-${c.numeroDoc}`}>
                                                                    {(tiposDocumento.find(td => String(td.codigo) === String(c.tipoDocumento))?.nombre || c.tipoDocumento)}
                                                                    {" - "}{c.numeroDoc} ({c.nombre} {c.apellido})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fw-semibold"><i className="bi bi-check2-circle me-2"></i>Estado</label>
                                                    <select
                                                        className="form-control"
                                                        name="activo"
                                                        value={dispositivoActual?.activo}
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
            <PiePagina />
        </div>
    );
}