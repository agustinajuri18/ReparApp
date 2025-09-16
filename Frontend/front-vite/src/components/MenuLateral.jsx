import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const menuOptions = [
  { path: "/ordenes", label: "Órdenes" },
  { path: "/clientes", label: "Clientes" },
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
      className="col-3 col-md-2 vh-100 d-flex flex-column align-items-start pt-4 border-end"
      style={{
        background: colores.azul,
        color: colores.beige,
        minWidth: 200,
      }}
    >
      {/* Logo arriba del menú */}
      <img
        src={logo}
        alt="Logo"
        style={{
          width: "160px", // <-- Cambiado de 120px a 160px
          marginBottom: "32px",
          borderRadius: "12px",
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
      <ul className="nav flex-column w-100">
        {menuOptions.map((option) => (
          <li className="nav-item" key={option.path}>
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
                fontSize: 18,
                letterSpacing: 0.5,
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
