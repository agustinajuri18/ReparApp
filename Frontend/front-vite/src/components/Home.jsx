import React from 'react';
import MenuLateral from './MenuLateral';

const colores = { azul: '#1f3345', dorado: '#c78f57', verdeAgua: '#85abab', beige: '#f0ede5' };

const Home = () => (
  <div className="container-fluid" style={{ backgroundColor: colores.beige, minHeight: '100vh' }}>
    <div className="row flex-nowrap">
      <MenuLateral />
      <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column" style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 24px 0 ${colores.azul}22`, minHeight: '90vh' }}>
        <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
          <h1 style={{ color: colores.azul, fontWeight: 700 }}>Bienvenido a ReparApp</h1>
          <p style={{ color: colores.dorado, fontSize: 18 }}>Gestione clientes, proveedores, empleados y más desde un solo lugar.</p>
        </div>
      </main>
    </div>
  </div>
);

export default Home;
