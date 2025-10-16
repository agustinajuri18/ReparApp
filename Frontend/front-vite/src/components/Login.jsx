import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const API_AUTH = 'http://localhost:5000/auth';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreUsuario, contraseña })
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Error de login');
        return;
      }
      // store session id and redirect
      localStorage.setItem('idSesion', j.idSesion);
      localStorage.setItem('idUsuario', j.idUsuario);
      navigate('/');
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9e7e6', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 880, borderRadius: 16, overflow: 'hidden', background: colores.beige, boxShadow: `0 8px 30px rgba(0,0,0,0.08)` }}>
        {/* top rounded bar */}
        <div style={{ background: colores.dorado, height: 48, display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: 8, background: `${colores.dorado}44`, marginRight: 8 }} />
          <div style={{ width: 8, height: 8, borderRadius: 8, background: `${colores.dorado}44`, marginRight: 8 }} />
          <div style={{ width: 8, height: 8, borderRadius: 8, background: `${colores.dorado}44` }} />
        </div>

        <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logo} alt="logo" style={{ width: 120, marginBottom: 12 }} />
          <h1 style={{ color: colores.dorado, fontSize: 40, margin: '8px 0' }}>Ingresá</h1>
          <p style={{ color: '#6b6b6b', marginBottom: 28 }}>Iniciá sesión para continuar</p>

          <form onSubmit={submit} style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 6, letterSpacing: 1.2 }}>USUARIO</label>
              <input
                type="text"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="usuario"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: 'none', background: colores.verdeAgua, color: '#08323a' }}
                required
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 6, letterSpacing: 1.2 }}>CONTRASEÑA</label>
              <input
                type="password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                placeholder="********"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: 'none', background: colores.verdeAgua, color: '#08323a' }}
                required
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button type="submit" style={{ background: colores.dorado, color: 'white', border: 'none', padding: '10px 36px', borderRadius: 8, fontWeight: 700 }}>Ingresar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
