import React from 'react';
import MenuLateral from './MenuLateral';

// Componente principal de inicio
const Home = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <MenuLateral />
    <main style={{ flex: 1, padding: '2rem' }}>
      <h1>Bienvenido a ReparApp</h1>
      <p>
        Gestiona tus reparaciones de manera sencilla y eficiente.
      </p>
      {/* Aquí puedes agregar más contenido de inicio */}
    </main>
  </div>
);

export default Home;
