import React from 'react';
import MenuLateral from './MenuLateral';

export default function Reportes() {
  React.useEffect(() => {
    const q = (sel) => document.querySelector(sel);
    // Base URL for backend API: use Vite env var VITE_API_BASE_URL if present, otherwise default to localhost:5000
    const API_BASE = import.meta.env.VITE_API_BASE_URL || `${location.protocol}//${location.hostname}:5000`;

    const fetchAndDownload = async (url, filename) => {
      const res = await fetch(url);
      if (!res.ok) return alert('Error generando reporte');
      const blob = await res.blob();
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlBlob);
    };

    // Helper: validar rango
    const validateRange = (d, h) => {
      if (d && h) {
        const dd = new Date(d);
        const hh = new Date(h);
        if (dd > hh) return false;
      }
      return true;
    };

    // (JSON export removed - only PDF and CSV supported)

    // Reparados PDF
    const onReparadosPdf = () => {
      const d = q('#desdeReparados').value;
      const h = q('#hastaReparados').value;
      if (!validateRange(d, h)) return alert('Rango inválido: la fecha "desde" no puede ser posterior a "hasta"');
      if (!confirm('Previsualizar reporte en PDF?')) return;
      const url = `${API_BASE}/reportes/reparados?format=pdf${d?`&desde=${d}`:''}${h?`&hasta=${h}`:''}`;
      window.open(url, '_blank');
    };
    q('#btnReparadosPdf')?.addEventListener('click', onReparadosPdf);

    // Reparados CSV
    const onReparadosCsv = () => {
      const d = q('#desdeReparados').value;
      const h = q('#hastaReparados').value;
      if (!validateRange(d, h)) return alert('Rango inválido: la fecha "desde" no puede ser posterior a "hasta"');
      if (!confirm('Descargar CSV de celulares reparados?')) return;
      const url = `${API_BASE}/reportes/reparados?format=csv${d?`&desde=${d}`:''}${h?`&hasta=${h}`:''}`;
      fetch(url).then(r=>{
        if (!r.ok) return r.text().then(t=>{ throw new Error(t||'Error'); });
        return r.blob();
      }).then(blob=>{
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = urlBlob; a.download = 'reparados.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(urlBlob);
      }).catch(e=>alert('Error generando CSV: '+(e.message||e)));
    };
    q('#btnReparadosCsv')?.addEventListener('click', onReparadosCsv);

    // (JSON export removed - only PDF and CSV supported)

    // No reparados PDF
    const onNoReparadosPdf = () => {
      const d = q('#desdeNoReparados').value;
      const h = q('#hastaNoReparados').value;
      if (!validateRange(d, h)) return alert('Rango inválido: la fecha "desde" no puede ser posterior a "hasta"');
      if (!confirm('Previsualizar reporte no reparados en PDF?')) return;
      const url = `${API_BASE}/reportes/no-reparados?format=pdf${d?`&desde=${d}`:''}${h?`&hasta=${h}`:''}`;
      window.open(url, '_blank');
    };
    q('#btnNoReparadosPdf')?.addEventListener('click', onNoReparadosPdf);

    // No reparados CSV
    const onNoReparadosCsv = () => {
      const d = q('#desdeNoReparados').value;
      const h = q('#hastaNoReparados').value;
      if (!validateRange(d, h)) return alert('Rango inválido: la fecha "desde" no puede ser posterior a "hasta"');
      if (!confirm('Descargar CSV de celulares no reparados?')) return;
      const url = `${API_BASE}/reportes/no-reparados?format=csv${d?`&desde=${d}`:''}${h?`&hasta=${h}`:''}`;
      fetch(url).then(r=>{
        if (!r.ok) return r.text().then(t=>{ throw new Error(t||'Error'); });
        return r.blob();
      }).then(blob=>{
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = urlBlob; a.download = 'no_reparados.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(urlBlob);
      }).catch(e=>alert('Error generando CSV: '+(e.message||e)));
    };
    q('#btnNoReparadosCsv')?.addEventListener('click', onNoReparadosCsv);

    return () => {
      // cleanup: remover listeners para evitar múltiples confirm al hacer hot-reload
      q('#btnReparadosPdf')?.removeEventListener('click', onReparadosPdf);
      q('#btnReparadosCsv')?.removeEventListener('click', onReparadosCsv);
      q('#btnNoReparadosPdf')?.removeEventListener('click', onNoReparadosPdf);
      q('#btnNoReparadosCsv')?.removeEventListener('click', onNoReparadosCsv);
    };
  }, []);

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
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <label className="form-label small">Fecha desde</label>
                              <input type="date" id="desdeReparados" className="form-control" />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Fecha hasta</label>
                              <input type="date" id="hastaReparados" className="form-control" />
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-dark" id="btnReparadosPdf">Ver PDF</button>
                            <button className="btn btn-secondary" id="btnReparadosCsv">Descargar CSV</button>
                          </div>
                        </div>
                      </div>
                    </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="card" style={{ borderRadius: 12 }}>
                    <div className="card-body">
                      <h5 className="card-title">Celulares no reparados</h5>
                      <p className="card-text text-muted">Generar reportes de celulares que quedaron sin reparar o con presupuesto rechazado.</p>
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <label className="form-label small">Fecha desde</label>
                              <input type="date" id="desdeNoReparados" className="form-control" />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Fecha hasta</label>
                              <input type="date" id="hastaNoReparados" className="form-control" />
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-dark" id="btnNoReparadosPdf">Ver PDF</button>
                            <button className="btn btn-secondary" id="btnNoReparadosCsv">Descargar CSV</button>
                          </div>
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
