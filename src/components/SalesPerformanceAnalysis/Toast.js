// components/Toast.js
import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'danger':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  const getTitle = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-header">
        <span className={`toast-icon toast-icon-${type}`}>{getIcon()}</span>
        <strong className="toast-title">{getTitle()}</strong>
        <button className="toast-close" onClick={onClose}>×</button>
      </div>
      <div className="toast-body">
        {message}
      </div>
    </div>
  );
};

export default Toast;