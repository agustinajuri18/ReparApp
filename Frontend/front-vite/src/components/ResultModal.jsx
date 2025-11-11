import React from 'react';

export default function ResultModal({ open, title = 'Resultado', message = '', success = true, onClose }) {
  if (!open) return null;
  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content">
          <div className={`modal-header ${success ? '' : 'bg-danger'} `} style={{ color: success ? undefined : '#fff' }}>
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className={`btn ${success ? 'btn-dorado' : 'btn-rojo'}`} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
