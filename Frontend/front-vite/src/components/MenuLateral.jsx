import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { usePermission } from '../auth/PermissionContext';
import { hasPermission, hasAnyPermission } from '../utils/permissions';
import ConfirmModal from './ConfirmModal';

// Small panel component to show user's display name and role
function MenuIdentityPanel({ identity }) {
  const [displayName, setDisplayName] = React.useState(null);
  const idUsuario = localStorage.getItem('idUsuario');

  React.useEffect(() => {
    let mounted = true;
    const fetchName = async () => {
      if (!idUsuario) return;
      try {
        const res = await fetch(`http://localhost:5000/usuarios/${idUsuario}`);
        if (!res.ok) return;
        const j = await res.json();
        if (mounted) setDisplayName(j.nombreUsuario || j.nombre || null);
      } catch {
        // ignore
      }
    };
    fetchName();
    return () => { mounted = false; };
  }, [idUsuario]);

  const roleNames = {
    1: 'Supervisor',
    2: 'Técnico',
    3: 'Asistente de ventas',
    4: 'Asistente de compras'
  };
  const roleLabel = roleNames[identity.idCargo] || `Cargo ${identity.idCargo}`;

  return (
    <div className="w-100 p-2 text-start text-white-50" style={{ fontSize: 12, borderTop: '1px dashed rgba(255,255,255,0.08)', marginTop: 8 }}>
      <div><strong>Usuario:</strong> {displayName || idUsuario || '—'}</div>
      <div><strong>Rol:</strong> {roleLabel}</div>
    </div>
  );
}

  // Map menu routes to labels and the permiso id(s) required to view them.
// For `repuestos` we allow multiple related permisos so roles like
// Asistente de Compras (20/21/22) or Técnico (19/23) can see the menu.
const menuOptions = [
  { path: "/ordenes", label: "Órdenes", permiso: 29 },
  { path: "/clientes", label: "Clientes", permiso: 32 },
  { path: "/dispositivos", label: "Dispositivos", permiso: 40 },
  { path: "/reportes", label: "Reportes", permiso: 36 },
  { path: "/proveedores", label: "Proveedores", permiso: 16 },
  { path: "/repuestos", label: "Repuestos", permiso: [19,20,21,22,23] },
  { path: "/servicios", label: "Servicios", permiso: 27 },
  { path: "/empleados", label: "Empleados", permiso: 47 },
  { path: "/usuarios", label: "Usuarios", permiso: 11 },
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

  const permCtx = usePermission();
  // permission context and current identity
  const identity = permCtx ? permCtx.identity : null;

  // If identity is not yet loaded but there is a session id, fetch session to populate identity
  // Run once on mount: if there's a session id and no identity in context, fetch the session and populate context.
  React.useEffect(() => {
    const loadIdentity = async () => {
      try {
        const idSesion = localStorage.getItem('idSesion');
        if (!idSesion) return;
        if (permCtx && permCtx.identity) return; // already set
        if (permCtx && typeof permCtx.setIdentity === 'function') {
          const res = await fetch(`http://localhost:5000/session/${idSesion}`);
          if (!res.ok) return;
          const j = await res.json();
          // Debug: log session response to help diagnose missing permisos
          console.debug('MenuLateral: session response', j);
          const identityFromResponse = { idCargo: j.idCargo ?? j.cargoId ?? j.cargo, permisos: j.permisos ?? j.permisosIds ?? [] };
          console.debug('MenuLateral: computed identityFromResponse', identityFromResponse);
          permCtx.setIdentity(identityFromResponse);
        }
      } catch (err) {
        console.warn('MenuLateral: error loading identity', err);
      }
    };
    loadIdentity();
    // intentionally run on mount and whenever permCtx identity setter reference changes
  }, [permCtx]);

  const openConfirmLogout = () => setConfirmLogout({ open: true });

  const confirmLogoutCancel = () => setConfirmLogout({ open: false });

  const confirmLogoutConfirm = async () => {
    const idSesion = localStorage.getItem('idSesion');
    if (idSesion) {
      try {
        await fetch(`http://localhost:5000/logout/${idSesion}`, { method: 'POST' });
      } catch (e) {
        console.warn('MenuLateral: logout network error', e);
      }
    }
    localStorage.removeItem('idSesion');
    localStorage.removeItem('idUsuario');
    // clear permission context identity
    try {
      if (permCtx && typeof permCtx.setIdentity === 'function') permCtx.setIdentity(null);
    } catch (err) { console.warn('MenuLateral: error clearing identity', err); }
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
        {(() => {
          const rendered = menuOptions.filter((option) => {
            if (!option.permiso) return true;
            const allowed = Array.isArray(option.permiso)
              ? hasAnyPermission(identity, option.permiso)
              : hasPermission(identity, option.permiso);
            // Debug: log which options are allowed/denied
            console.debug(`MenuLateral: option ${option.path} allowed=${allowed}`);
            return allowed;
          });
          if (rendered.length === 0) {
            // If identity exists but no options rendered, show a helpful message
            if (identity) {
              return (
                <div className="w-100 p-3 text-center text-muted small">
                  No hay opciones disponibles para tu usuario. Si creés que es un error, consultá al administrador.
                </div>
              );
            }
            // otherwise show nothing until identity is loaded
            return null;
          }
          return rendered.map((option) => (
            <li className="nav-item w-100" key={option.path}>
              <Link
                className={`nav-link ms-3${location.pathname === option.path ? " active fw-bold" : ""}`}
                style={{
                  color: location.pathname === option.path ? colores.dorado : colores.beige,
                  fontWeight: location.pathname === option.path ? 700 : 400,
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
          ));
        })()}
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

      {/* Development-only identity panel: show only username and role name */}
      {identity && (
        <MenuIdentityPanel identity={identity} />
      )}

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
