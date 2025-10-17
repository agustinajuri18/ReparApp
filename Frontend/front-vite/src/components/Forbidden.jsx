import React from 'react';

export default function Forbidden() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, color: '#b54745' }}>403 — Acceso denegado</h1>
      <p style={{ color: '#444', marginTop: 12 }}>No tenés permisos suficientes para ver esta página.</p>
    </div>
  );
}
