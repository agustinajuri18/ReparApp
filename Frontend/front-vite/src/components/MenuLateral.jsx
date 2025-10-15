import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

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
    </nav>
  );
};

export default MenuLateral;
