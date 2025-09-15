
import React from 'react';
import MenuLateral from './MenuLateral';

const colores = {
  azul: '#1f3345',
  dorado: '#c78f57',
  rojo: '#b54745',
  verdeAgua: '#85abab',
  beige: '#f0ede5'
};

// Componente principal de inicio
const Home = () => (
  <div style={{ display: 'flex', minHeight: '100vh', background: colores.beige, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
    <MenuLateral />
    <main style={{ flex: 1, padding: '2rem', background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, margin: 32 }}>
      <h1 style={{ color: colores.azul, fontWeight: 700 }}>Bienvenido a ReparApp</h1>
      <p style={{ color: colores.azul }}>
        Gestiona tus reparaciones de manera sencilla y eficiente.
      </p>
      {/* Aquí puedes agregar más contenido de inicio */}
    </main>
  </div>
);

export default Home;
