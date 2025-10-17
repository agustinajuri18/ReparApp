import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../auth/PermissionContext';
import { hasPermission, hasAnyPermission } from '../utils/permissions';
import Forbidden from './Forbidden';

const API_SESSION = 'http://localhost:5000/session';

// Accepts either a single permiso id (number/string) or an array of ids.
export default function ProtectedRoute({ children, requiredPermission = null }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const permCtx = usePermission();

  useEffect(() => {
    const idSesion = localStorage.getItem('idSesion');
    // If permission context already contains an identity, use it and skip fetching session to avoid repeated calls
    if (permCtx && permCtx.identity) {
      const identityFromResponse = permCtx.identity;
      if (!identityFromResponse) {
        setAllowed(false);
      } else if (!requiredPermission) {
        setAllowed(true);
      } else if (Array.isArray(requiredPermission)) {
        setAllowed(hasAnyPermission(identityFromResponse, requiredPermission));
      } else {
        setAllowed(hasPermission(identityFromResponse, requiredPermission));
      }
      setChecking(false);
      return;
    }
    if (!idSesion) {
      setAllowed(false);
      setChecking(false);
      return;
    }
    fetch(`${API_SESSION}/${idSesion}`)
      .then(res => res.json())
      .then(j => {
        const active = j.active === true || j.active === 'true';
        // Build identity from response (use this for permission checks to avoid race with context updates)
        const identityFromResponse = { idCargo: j.idCargo ?? j.cargoId ?? j.cargo, permisos: j.permisos ?? j.permisosIds ?? [] };
        // update context so other components can use it
        if (permCtx && typeof permCtx.setIdentity === 'function') {
          permCtx.setIdentity(identityFromResponse);
        }
        if (!active) {
          setAllowed(false);
          return;
        }
        if (!requiredPermission) {
          setAllowed(true);
          return;
        }
        // permission check using the response-derived identity to avoid stale reads
        if (Array.isArray(requiredPermission)) {
          setAllowed(hasAnyPermission(identityFromResponse, requiredPermission));
        } else {
          setAllowed(hasPermission(identityFromResponse, requiredPermission));
        }
      })
      .catch(() => setAllowed(false))
      .finally(() => setChecking(false));
  }, [requiredPermission, permCtx]);

  if (checking) return null;
  // If user isn't allowed because they are unauthenticated, send to login.
  // If they are authenticated but lack permission, render 403 Forbidden.
  if (!allowed) {
    const idSesion = localStorage.getItem('idSesion');
    if (!idSesion) return <Navigate to="/login" replace />;
    return <Forbidden />;
  }
  return children;
}
