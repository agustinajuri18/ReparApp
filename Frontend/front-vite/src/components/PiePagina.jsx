import React from 'react';

const colores = { azul: '#1f3345', dorado: '#c78f57', verdeAgua: '#85abab', beige: '#f0ede5' };

const PiePagina = () => (
  <footer className="container-fluid py-3 mt-auto" style={{ background: colores.azul, color: colores.beige }}>
    <div className="row">
      <div className="col-12 text-center">
        <small>© 2025 ReparApp. Todos los derechos reservados.</small>
      </div>
    </div>
  </footer>
);

export default PiePagina;