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
    <nav className="col-3 col-md-2 bg-light vh-100 d-flex flex-column align-items-start pt-4 border-end">
      <h4 className="mb-4 ms-3">Menú</h4>
      <ul className="nav flex-column w-100">
        {menuOptions.map((option) => (
          <li className="nav-item" key={option.path}>
            <Link
              className={`nav-link ms-3${location.pathname === option.path ? " active fw-bold text-primary" : " text-dark"}`}
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
