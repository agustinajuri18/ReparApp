import React from "react";
import { Link, useLocation } from "react-router-dom";

const menuOptions = [
  { path: "/clientes", label: "Clientes" },
  { path: "/empleados", label: "Empleados" },
  { path: "/repuestos", label: "Repuestos" },
  { path: "/ordenes", label: "Órdenes" },
  { path: "/usuarios", label: "Usuarios" },
  { path: "/servicios", label: "Servicios" },
  { path: "/proveedores", label: "Proveedores" },
];

const MenuLateral = () => {
  const location = useLocation();
  return (
    <nav className="col-3 col-md-2 vh-100 d-flex flex-column align-items-start pt-4 border-end" style={{ background: '#1f3345', color: '#f0ede5', minWidth: 200 }}>
      <h4 className="mb-4 ms-3" style={{ color: '#c78f57', fontWeight: 700, letterSpacing: 1 }}>Menú</h4>
      <ul className="nav flex-column w-100">
        {menuOptions.map((option) => (
          <li className="nav-item" key={option.path}>
            <Link
              className={`nav-link ms-3${location.pathname === option.path ? " active fw-bold" : ""}`}
              style={{ color: location.pathname === option.path ? '#c78f57' : '#f0ede5', fontWeight: location.pathname === option.path ? 700 : 400, fontSize: 18, letterSpacing: 0.5 }}
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
