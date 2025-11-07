import React, { useState, useEffect } from 'react';
import MenuLateral from './MenuLateral';
// Chart.js + react-chartjs-2 imports (moved to top-level)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Reportes() {
  const [series, setSeries] = useState({ dates: [], ingresos: [], ordenes: [] });
  const [kpis, setKpis] = useState({
    ingresos: { daily: 0, weekly: 0, monthly: 0 },
    ordenes: { daily: 0, weekly: 0, monthly: 0 },
    average_repair_time_days: null
  });

  useEffect(() => {
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

    // Open a new window with an inline PDF preview and a download button
    const openPreviewWindow = (url, filename) => {
      const win = window.open('', '_blank', 'width=1000,height=800');
      if (!win) return alert('No se pudo abrir la ventana de previsualización. Verificá el bloqueador de ventanas.');
      const escapedUrl = url.replace(/'/g, "\\'");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Previsualización - ${filename}</title></head><body style="margin:0;display:flex;flex-direction:column;height:100vh">` +
        `<div style="padding:10px;background:#f8f9fa;display:flex;gap:8px;align-items:center;border-bottom:1px solid #ddd;">` +
        `<button id="downloadBtn" style="padding:.35rem .6rem">Descargar PDF</button>` +
        `<button id="closeBtn" style="padding:.35rem .6rem">Cerrar</button>` +
        `</div>` +
        `<iframe src="${escapedUrl}" style="flex:1;width:100%;border:none"></iframe>` +
        `<script>
          (function(){
            const url = '${escapedUrl}';
            const filename = '${filename}';
            document.getElementById('downloadBtn').addEventListener('click', async function(){
              try{
                const r = await fetch(url);
                if(!r.ok){ alert('Error al obtener el PDF: HTTP ' + r.status); return; }
                const blob = await r.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = blobUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(blobUrl);
              }catch(e){ alert('Error al descargar: ' + (e.message || e)); }
            });
            document.getElementById('closeBtn').addEventListener('click', function(){ window.close(); });
          })();
        <\/script></body></html>`;
      win.document.open();
      win.document.write(html);
      win.document.close();
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

    // Dashboard KPIs fetch
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/reportes/dashboard`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        // Update React state so UI (KPIs and charts) re-render
        setKpis({
          ingresos: json.ingresos || { daily: 0, weekly: 0, monthly: 0 },
          ordenes: json.ordenes || { daily: 0, weekly: 0, monthly: 0 },
          average_repair_time_days: json.average_repair_time_days
        });
        if (json.series) {
          setSeries(json.series);
        }
      } catch (e) {
        // Fallo al obtener dashboard: mostrar en consola y continuar sin bloquear la UI
        // (Las importaciones/registro de Chart.js se realizan al tope del archivo)
        console.error('Error fetching dashboard', e);
      }
    };

    // cargar KPIs al montar
    fetchDashboard();

    // (JSON export removed - only PDF and CSV supported)

    // Reparados PDF
    const onReparadosPdf = () => {
      const d = q('#desdeReparados').value;
      const h = q('#hastaReparados').value;
      if (!validateRange(d, h)) return alert('Rango inválido: la fecha "desde" no puede ser posterior a "hasta"');
      const url = `${API_BASE}/reportes/reparados?format=pdf${d?`&desde=${d}`:''}${h?`&hasta=${h}`:''}`;
      openPreviewWindow(url, 'reparados.pdf');
    };
    q('#btnReparadosPdf')?.addEventListener('click', onReparadosPdf);

    // Reparados CSV
            // función para cargar series y actualizar gráficos
            // also fetch and populate series for charts (same as fetchDashboard)
            fetchDashboard();
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
      const url = `${API_BASE}/reportes/no-reparados?format=pdf${d?`&desde=${d}`:''}${h?`&hasta=${h}`:''}`;
      openPreviewWindow(url, 'no_reparados.pdf');
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
      // no need to remove fetchDashboard since it's not attached
    };
  }, []);

  // Build chart data from series state
  const ingresosData = {
    labels: series?.dates || [],
    datasets: [
      {
        label: 'Ingresos',
        data: series?.ingresos || [],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  };

  const ordenesData = {
    labels: series?.dates || [],
    datasets: [
      {
        label: 'Órdenes',
        data: series?.ordenes || [],
        backgroundColor: 'rgba(54,162,235,0.6)',
        borderColor: 'rgba(54,162,235,1)',
      },
    ],
  };

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
                {/* Dashboard KPIs */}
                <div className="col-12 mb-3">
                  <div className="d-flex gap-3 flex-wrap">
                    <div className="card p-3" style={{ minWidth: 160, borderRadius: 12 }}>
                      <div className="text-muted small">Ingresos (hoy)</div>
                      <div id="kpi-ingresos-diarios" style={{ fontSize: 20, fontWeight: 700 }}>{`$${(kpis.ingresos?.daily||0).toFixed(2)}`}</div>
                    </div>
                    <div className="card p-3" style={{ minWidth: 160, borderRadius: 12 }}>
                      <div className="text-muted small">Ingresos (semana)</div>
                      <div id="kpi-ingresos-semanales" style={{ fontSize: 20, fontWeight: 700 }}>{`$${(kpis.ingresos?.weekly||0).toFixed(2)}`}</div>
                    </div>
                    <div className="card p-3" style={{ minWidth: 160, borderRadius: 12 }}>
                      <div className="text-muted small">Ingresos (mes)</div>
                      <div id="kpi-ingresos-mensuales" style={{ fontSize: 20, fontWeight: 700 }}>{`$${(kpis.ingresos?.monthly||0).toFixed(2)}`}</div>
                    </div>
                    <div className="card p-3" style={{ minWidth: 140, borderRadius: 12 }}>
                      <div className="text-muted small">Órdenes (hoy)</div>
                      <div id="kpi-ordenes-diarias" style={{ fontSize: 18, fontWeight: 700 }}>{kpis.ordenes?.daily || 0}</div>
                    </div>
                    <div className="card p-3" style={{ minWidth: 140, borderRadius: 12 }}>
                      <div className="text-muted small">Órdenes (semana)</div>
                      <div id="kpi-ordenes-semanales" style={{ fontSize: 18, fontWeight: 700 }}>{kpis.ordenes?.weekly || 0}</div>
                    </div>
                    <div className="card p-3" style={{ minWidth: 140, borderRadius: 12 }}>
                      <div className="text-muted small">Órdenes (mes)</div>
                      <div id="kpi-ordenes-mensuales" style={{ fontSize: 18, fontWeight: 700 }}>{kpis.ordenes?.monthly || 0}</div>
                    </div>
                    <div className="card p-3" style={{ minWidth: 180, borderRadius: 12 }}>
                      <div className="text-muted small">Tiempo promedio de reparación</div>
                      <div id="kpi-tmo" style={{ fontSize: 18, fontWeight: 700 }}>{kpis.average_repair_time_days !== null && kpis.average_repair_time_days !== undefined ? `${Number(kpis.average_repair_time_days).toFixed(1)} días` : 'N/A'}</div>
                    </div>
                  </div>
                        {/* Charts: ingresos (línea) y órdenes (barras) */}
                        <div className="row mt-3">
                          <div className="col-12 col-md-8 mb-3">
                            <div className="card p-3" style={{ borderRadius: 12 }}>
                              <h5 className="card-title mb-2">Ingresos últimos 30 días</h5>
                              <div>
                                <Line id="chart-ingresos" data={ingresosData} options={{maintainAspectRatio:false}} height={200} />
                              </div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4 mb-3">
                            <div className="card p-3" style={{ borderRadius: 12 }}>
                              <h5 className="card-title mb-2">Órdenes últimos 30 días</h5>
                              <div>
                                <Bar id="chart-ordenes" data={ordenesData} options={{maintainAspectRatio:false}} height={200} />
                              </div>
                            </div>
                          </div>
                        </div>
                </div>
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
