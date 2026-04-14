import React from 'react';
import './chartmodal.css'

const ChartModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="chart-modal-backdrop" onClick={handleBackdropClick}>
      <div className="chart-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="chart-modal-header">
          <h2>{title}</h2>
          <button className="chart-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="chart-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
