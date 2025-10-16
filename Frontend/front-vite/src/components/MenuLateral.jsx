import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import ConfirmModal from './ConfirmModal';

const menuOptions = [
  { path: "/ordenes", label: "Órdenes" },
  { path: "/clientes", label: "Clientes" },
  { path: "/dispositivos", label: "Dispositivos" },
  { path: "/reportes", label: "Reportes" },
  { path: "/proveedores", label: "Proveedores" },
  { path: "/repuestos", label: "Repuestos" },
  { path: "/servicios", label: "Servicios" },
  { path: "/empleados", label: "Empleados" },
  { path: "/usuarios", label: "Usuarios" },
];

const colores = {
  azul: "#1f3345",
  dorado: "#c78f57",
  rojo: "#b54745",
  verdeAgua: "#85abab",
  beige: "#f0ede5",
};

const MenuLateral = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState({ open: false });

  const openConfirmLogout = () => setConfirmLogout({ open: true });

  const confirmLogoutCancel = () => setConfirmLogout({ open: false });

  const confirmLogoutConfirm = async () => {
    const idSesion = localStorage.getItem('idSesion');
    if (idSesion) {
      try {
        await fetch(`http://localhost:5000/logout/${idSesion}`, { method: 'POST' });
      } catch (e) {
        // ignore network errors, still clear local storage
      }
    }
    localStorage.removeItem('idSesion');
    localStorage.removeItem('idUsuario');
    setConfirmLogout({ open: false });
    navigate('/login');
  };
  return (
    <nav
      className="col-12 col-md-2 d-flex flex-md-column flex-row align-items-center align-items-md-start py-3 px-2 px-md-3"
      style={{ background: colores.azul, minHeight: "100vh", width: '14rem', maxWidth: '18rem' }}
    >
      {/* Logo arriba del menú */}
      <img
        src={logo}
        alt="Logo"
        style={{
          width: "110px",
          marginBottom: "24px",
          borderRadius: "10px",
          boxShadow: `0 2px 8px ${colores.dorado}55`,
        }}
      />
      <h4
        className="mb-4 ms-3"
        style={{
          color: colores.dorado,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        Menú
      </h4>
      <ul className="nav nav-pills flex-md-column flex-row w-100 gap-2">
        {menuOptions.map((option) => (
          <li className="nav-item w-100" key={option.path}>
            <Link
              className={`nav-link ms-3${
                location.pathname === option.path ? " active fw-bold" : ""
              }`}
              style={{
                color:
                  location.pathname === option.path
                    ? colores.dorado
                    : colores.beige,
                fontWeight:
                  location.pathname === option.path ? 700 : 400,
                fontSize: 16,
                letterSpacing: 0.4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              to={option.path}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
      {/* Logout button at the bottom */}
      <div className="w-100 d-flex justify-content-center justify-content-md-start" style={{ marginTop: 'auto' }}>
        <button
          className="btn btn-rojo fw-bold ms-3 mb-3"
          onClick={openConfirmLogout}
          title="Cerrar sesión"
        >
          <i className="bi bi-box-arrow-right me-1"></i>Cerrar sesión
        </button>
      </div>

      <ConfirmModal
        open={confirmLogout.open}
        title="Confirmar cierre de sesión"
        message="¿Estás seguro de que querés cerrar sesión?"
        onCancel={confirmLogoutCancel}
        onConfirm={confirmLogoutConfirm}
      />
    </nav>
  );
};

export default MenuLateral;
