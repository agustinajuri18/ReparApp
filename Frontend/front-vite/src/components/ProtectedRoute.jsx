import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const API_SESSION = 'http://localhost:5000/session';

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const idSesion = localStorage.getItem('idSesion');
    if (!idSesion) {
      setAllowed(false);
      setChecking(false);
      return;
    }
    fetch(`${API_SESSION}/${idSesion}`)
      .then(res => res.json())
      .then(j => {
        setAllowed(j.active === true || j.active === 'true');
      })
      .catch(() => setAllowed(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;
  if (!allowed) return <Navigate to="/login" replace />;
  return children;
}
