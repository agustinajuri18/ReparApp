import React, { useEffect, useState } from "react";
import MenuLateral from './MenuLateral';
import PiePagina from './PiePagina';

const colores = { azul: '#1f3345', dorado: '#c78f57', rojo: '#b54745', verdeAgua: '#85abab', beige: '#f0ede5' };

const API_URL = "http://localhost:5000/dispositivos/";
const CLIENTES_URL = "http://localhost:5000/clientes/";

export default function Dispositivos() {
    const [dispositivos, setDispositivos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [mostrarInactivos, setMostrarInactivos] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [form, setForm] = useState({
        nroSerie: "",
        marca: "",
        modelo: "",
        clienteTipoDocumento: "",
        clienteNumeroDni: "",
        activo: 1,
    });
    const [busquedaDni, setBusquedaDni] = useState("");

    // Nuevo estado para edición y consulta
    const [modalVisible, setModalVisible] = useState(false);
    const [modalModo, setModalModo] = useState('consultar'); // 'consultar' | 'modificar'
    const [dispositivoActual, setDispositivoActual] = useState(null);

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
        // eslint-disable-next-line
    }, [mostrarInactivos]);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Cuando selecciona un cliente, actualiza los campos del cliente en el form
    const handleClienteSelect = e => {
        const value = e.target.value;
        if (value === "") {
            setForm({ ...form, clienteTipoDocumento: "", clienteNumeroDni: "" });
            return;
        }
        const [tipoDocumento, numeroDni] = value.split("-");
        setForm({ ...form, clienteTipoDocumento: tipoDocumento, clienteNumeroDni: numeroDni });
    };

    const handleAgregarClick = () => {
        setMostrarFormulario(!mostrarFormulario);
        setMensaje("");
        setBusquedaDni("");
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const resultado = await res.json();
        setMensaje(resultado.mensaje || resultado.detail);
        setMostrarFormulario(false);
        setForm({
            nroSerie: "",
            marca: "",
            modelo: "",
            clienteTipoDocumento: "",
            clienteNumeroDni: "",
            activo: 1,
        });
        fetchDispositivos();
    };

    // Filtrar clientes por DNI
    const clientesFiltrados = busquedaDni.trim() === ""
        ? clientes
        : clientes.filter(c =>
            String(c.numeroDni).includes(busquedaDni.trim())
        );

    // Consultar dispositivo
    const handleConsultar = (dispositivo) => {
        setDispositivoActual(dispositivo);
        setModalModo('consultar');
        setModalVisible(true);
    };

    // Modificar dispositivo
    const handleModificar = (dispositivo) => {
        setDispositivoActual(dispositivo);
        setModalModo('modificar');
        setModalVisible(true);
    };

    // Eliminar dispositivo
    const handleEliminar = async (nroSerie) => {
        if (window.confirm("¿Seguro que desea eliminar este dispositivo?")) {
            await fetch(`${API_URL}${nroSerie}`, { method: "DELETE" });
            fetchDispositivos();
        }
    };

    // Guardar modificación
    const handleGuardarModificacion = async () => {
        await fetch(`${API_URL}${dispositivoActual.nroSerie}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dispositivoActual),
        });
        setModalVisible(false);
        fetchDispositivos();
    };

    // Actualiza campos del dispositivo en edición
    const handleModalChange = e => {
        setDispositivoActual({ ...dispositivoActual, [e.target.name]: e.target.value });
    };

    return (
        <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
            <div className="row flex-nowrap">
                <MenuLateral />
                <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
                    <div className="card shadow-sm mb-4" style={{ border: `1.5px solid ${colores.azul}`, borderRadius: 16, background: colores.beige }}>
                        <div className="card-header d-flex justify-content-between align-items-center" style={{ background: colores.azul, color: colores.beige, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <h4 className="mb-0">Gestión de Dispositivos</h4>
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
                            {mostrarFormulario && (
                                <form onSubmit={handleSubmit} className="form-container mb-3">
                                    <div className="row">
                                        <fieldset className="col-12 col-md-6" style={{ border: "none", marginBottom: "1.5rem" }}>
                                            <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                                <i className="bi bi-cpu me-2"></i>Datos del dispositivo
                                            </legend>
                                            <div className="form-group mb-2">
                                                <label>
                                                    <i className="bi bi-hash me-2"></i>Nro Serie
                                                </label>
                                                <input
                                                    type="text"
                                                    name="nroSerie"
                                                    value={form.nroSerie}
                                                    onChange={handleChange}
                                                    required
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group mb-2">
                                                <label>
                                                    <i className="bi bi-pc me-2"></i>Marca
                                                </label>
                                                <input
                                                    type="text"
                                                    name="marca"
                                                    value={form.marca}
                                                    onChange={handleChange}
                                                    required
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group mb-2">
                                                <label>
                                                    <i className="bi bi-pc-display me-2"></i>Modelo
                                                </label>
                                                <input
                                                    type="text"
                                                    name="modelo"
                                                    value={form.modelo}
                                                    onChange={handleChange}
                                                    required
                                                    className="form-control"
                                                />
                                            </div>
                                        </fieldset>
                                        <fieldset className="col-12 col-md-6" style={{ border: "none", marginBottom: "1.5rem" }}>
                                            <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                                <i className="bi bi-person-badge me-2"></i>Seleccionar cliente
                                            </legend>
                                            <div className="form-group mb-2">
                                                <label>
                                                    <i className="bi bi-search me-2"></i>Buscar cliente por DNI
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="Ingrese DNI"
                                                    value={busquedaDni}
                                                    onChange={e => setBusquedaDni(e.target.value)}
                                                />
                                                <label>
                                                    <i className="bi bi-person-lines-fill me-2"></i>Cliente
                                                </label>
                                                <select
                                                    name="cliente"
                                                    value={form.clienteTipoDocumento && form.clienteNumeroDni ? `${form.clienteTipoDocumento}-${form.clienteNumeroDni}` : ""}
                                                    onChange={handleClienteSelect}
                                                    required
                                                    className="form-control"
                                                >
                                                    <option value="">Seleccione un cliente...</option>
                                                    {clientesFiltrados.map(c => (
                                                        <option key={`${c.tipoDocumento}-${c.numeroDni}`} value={`${c.tipoDocumento}-${c.numeroDni}`}>
                                                            {c.tipoDocumento} - {c.numeroDni} ({c.nombre} {c.apellido})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <fieldset style={{ border: "none", marginBottom: "1.5rem" }}>
                                                <legend style={{ fontWeight: 600, color: colores.azul, marginBottom: "0.5rem" }}>
                                                    <i className="bi bi-check2-circle me-2"></i>Estado
                                                </legend>
                                                <div className="form-group mb-2">
                                                    <label>
                                                        <i className="bi bi-check2-circle me-2"></i>Estado
                                                    </label>
                                                    <select name="activo" value={form.activo} onChange={handleChange} className="form-control">
                                                        <option value={1}>Activo</option>
                                                        <option value={0}>Inactivo</option>
                                                    </select>
                                                </div>
                                            </fieldset>
                                        </fieldset>
                                    </div>
                                    <div className="row">
                                        <div className="col-12 d-flex flex-column flex-md-row justify-content-end">
                                            <button type="submit" className="btn mb-2 mb-md-0" style={{ background: colores.azul, color: colores.beige }}>
                                                <i className="bi bi-save me-1"></i>Guardar
                                            </button>
                                            <button type="button" className="btn ms-md-2" style={{ background: colores.dorado, color: colores.azul }} onClick={handleAgregarClick}>
                                                <i className="bi bi-x-circle me-1"></i>Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                            {mensaje && (
                                <div className="alert" role="alert" style={{ background: colores.dorado, color: colores.azul, fontWeight: 600, border: 'none', borderRadius: 8 }}>
                                    {mensaje}
                                </div>
                            )}
                            <div className="table-responsive">
                                <table className="table table-striped table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Nro Serie</th>
                                            <th>Marca</th>
                                            <th>Modelo</th>
                                            <th>Tipo Doc Cliente</th>
                                            <th>DNI Cliente</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dispositivos.map(d => (
                                            <tr
                                                key={d.nroSerie}
                                                style={d.activo === 0 ? { opacity: 0.5 } : {}}
                                            >
                                                <td>{d.nroSerie}</td>
                                                <td>{d.marca}</td>
                                                <td>{d.modelo}</td>
                                                <td>{d.clienteTipoDocumento}</td>
                                                <td>{d.clienteNumeroDni}</td>
                                                <td>{d.activo === 1 ? "Activo" : "Inactivo"}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: colores.verdeAgua,
                                                            color: colores.azul,
                                                            borderRadius: "8px",
                                                            fontWeight: 600,
                                                            marginRight: "6px",
                                                            border: "none",
                                                            boxShadow: "0 1px 4px #0001"
                                                        }}
                                                        onClick={() => handleConsultar(d)}
                                                    >
                                                        <i className="bi bi-search me-1"></i>Consultar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: colores.dorado,
                                                            color: colores.azul,
                                                            borderRadius: "8px",
                                                            fontWeight: 600,
                                                            marginRight: "6px",
                                                            border: "none",
                                                            boxShadow: "0 1px 4px #0001"
                                                        }}
                                                        onClick={() => handleModificar(d)}
                                                    >
                                                        <i className="bi bi-pencil-square me-1"></i>Modificar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: colores.rojo,
                                                            color: colores.beige,
                                                            borderRadius: "8px",
                                                            fontWeight: 600,
                                                            border: "none",
                                                            boxShadow: "0 1px 4px #0001"
                                                        }}
                                                        onClick={() => handleEliminar(d.nroSerie)}
                                                    >
                                                        <i className="bi bi-trash me-1"></i>Eliminar
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
            {/* Modal para consultar/modificar */}
            {modalVisible && dispositivoActual && (
                <div className="modal" style={{
                    display: "block", background: "#0008", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999
                }}>
                    <div className="modal-dialog" style={{ margin: "5rem auto", maxWidth: 500 }}>
                        <div className="modal-content">
                            <div className="modal-header" style={{ background: colores.azul, color: colores.beige }}>
                                <h5 className="modal-title">
                                    {modalModo === 'consultar' ? "Consultar dispositivo" : "Modificar dispositivo"}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="mb-2">
                                        <label>Nro Serie</label>
                                        <input className="form-control" name="nroSerie" value={dispositivoActual.nroSerie} disabled />
                                    </div>
                                    <div className="mb-2">
                                        <label>Marca</label>
                                        <input className="form-control" name="marca" value={dispositivoActual.marca}
                                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                                    </div>
                                    <div className="mb-2">
                                        <label>Modelo</label>
                                        <input className="form-control" name="modelo" value={dispositivoActual.modelo}
                                            onChange={handleModalChange} disabled={modalModo === 'consultar'} />
                                    </div>
                                    <div className="mb-2">
                                        <label>Cliente</label>
                                        <select
                                            name="cliente"
                                            className="form-control"
                                            value={
                                                dispositivoActual.clienteTipoDocumento && dispositivoActual.clienteNumeroDni
                                                    ? `${dispositivoActual.clienteTipoDocumento}-${dispositivoActual.clienteNumeroDni}`
                                                    : ""
                                            }
                                            onChange={e => {
                                                const [tipoDocumento, numeroDni] = e.target.value.split("-");
                                                setDispositivoActual({
                                                    ...dispositivoActual,
                                                    clienteTipoDocumento: tipoDocumento,
                                                    clienteNumeroDni: numeroDni
                                                });
                                            }}
                                            disabled={modalModo === 'consultar'}
                                            style={{ marginBottom: "8px" }}
                                        >
                                            <option value="">Seleccione un cliente...</option>
                                            {clientes.map(c => (
                                                <option key={`${c.tipoDocumento}-${c.numeroDni}`} value={`${c.tipoDocumento}-${c.numeroDni}`}>
                                                    {c.tipoDocumento} - {c.numeroDni} ({c.nombre} {c.apellido})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {modalModo === 'consultar' && (
                                        <>
                                            <div className="mb-2">
                                                <label>Tipo Doc Cliente</label>
                                                <input className="form-control" name="clienteTipoDocumento" value={dispositivoActual.clienteTipoDocumento} disabled />
                                            </div>
                                            <div className="mb-2">
                                                <label>DNI Cliente</label>
                                                <input className="form-control" name="clienteNumeroDni" value={dispositivoActual.clienteNumeroDni} disabled />
                                            </div>
                                        </>
                                    )}
                                    <div className="mb-2">
                                        <label>Estado</label>
                                        <select className="form-control" name="activo"
                                            value={dispositivoActual.activo}
                                            onChange={handleModalChange}
                                            disabled={modalModo === 'consultar'}>
                                            <option value={1}>Activo</option>
                                            <option value={0}>Inactivo</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button className="btn" style={{ background: colores.azul, color: colores.beige }} onClick={() => setModalVisible(false)}>
                                    Cerrar
                                </button>
                                {modalModo === 'modificar' && (
                                    <button className="btn" style={{ background: colores.dorado, color: colores.azul }} onClick={handleGuardarModificacion}>
                                        Guardar cambios
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <PiePagina />
        </div>
    );
}