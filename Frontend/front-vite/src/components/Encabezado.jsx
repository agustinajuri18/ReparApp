// Import del archivo Encabezado.css
import "../assets/css/Encabezado.css"
// Import de funciones de react-router-dom
import { NavLink } from "react-router-dom";

function Encabezado () {
    return (
        <>
            <header class="py-4 header-bg text-center">
                <div class="container">
                    <h1 class="display-5">Gestión de Reparaciones 🔧</h1>
                </div>
                <div class="row mt-3 mb-3">
                    <div class="list-group">
                        <NavLink to="/" className="list-group-item">Menu Principal</NavLink>
                        <NavLink to="/ordenes" className="list-group-item">Órdenes</NavLink>
                        <NavLink to="/proveedores" className="list-group-item">Proveedores</NavLink>
                        <NavLink to="/repuestos" className="list-group-item">Repuestos</NavLink>
                        <NavLink to="/servicios" className="list-group-item">Servicios</NavLink>                            
                        <NavLink to="/usuarios" className="list-group-item">Usuarios</NavLink>
                        <NavLink to="/clientes" className="list-group-item">Clientes</NavLink>
                        <NavLink to="/empleados" className="list-group-item">Empleados</NavLink>
                    </div>
                </div>
            </header>
        </>
    )
}

export default Encabezado;