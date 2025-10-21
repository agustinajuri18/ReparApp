import React from 'react';

function ConfirmModal({ open, title = 'Confirmar', message = '', onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer d-flex justify-content-end gap-2">
            {onConfirm ? (
              <>
                <button className="btn btn-dorado" onClick={onCancel}>
                  Cancelar
                </button>
                <button className="btn btn-rojo" onClick={onConfirm}>
                  Confirmar
                </button>
              </>
            ) : (
              <button className="btn btn-dorado" onClick={onCancel}>Cerrar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
