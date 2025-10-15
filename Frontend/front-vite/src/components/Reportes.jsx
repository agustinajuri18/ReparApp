import React from 'react';
import MenuLateral from './MenuLateral';

export default function Reportes() {
  return (
    <div className="container-fluid main-background" style={{ minHeight: '100vh' }}>
      <div className="row flex-nowrap">
        <MenuLateral />
        <main className="col-12 col-md-10 pt-4 px-2 px-md-4 d-flex flex-column">
          <div className="card shadow-sm mb-4" style={{ border: `1.5px solid #1f3345`, borderRadius: 16, background: "var(--color-beige)" }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: '#1f3345', color: '#f0ede5', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <h4 className="mb-0"><i className="bi bi-clipboard-data me-2"></i>Reportes</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <div className="card" style={{ borderRadius: 12 }}>
                    <div className="card-body">
                      <h5 className="card-title">Celulares reparados</h5>
                      <p className="card-text text-muted">Generar reportes de celulares que fueron reparados.</p>
                      <button className="btn btn-verdeAgua" disabled>Generar reporte</button>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="card" style={{ borderRadius: 12 }}>
                    <div className="card-body">
                      <h5 className="card-title">Celulares no reparados</h5>
                      <p className="card-text text-muted">Generar reportes de celulares que quedaron sin reparar o con presupuesto rechazado.</p>
                      <button className="btn btn-rojo" disabled>Generar reporte</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
