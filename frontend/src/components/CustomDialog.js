import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiX, FiInfo, FiAlertCircle } from 'react-icons/fi';
import './CustomDialog.css';

const CustomDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="dialog-icon success" />;
      case 'error':
        return <FiAlertCircle className="dialog-icon error" />;
      case 'warning':
        return <FiAlertTriangle className="dialog-icon warning" />;
      case 'confirm':
        return <FiAlertTriangle className="dialog-icon confirm" />;
      default:
        return <FiInfo className="dialog-icon info" />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="custom-dialog-overlay" onClick={onClose}>
      <div className="custom-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close-btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="dialog-content">
          <div className="dialog-icon-wrapper">
            {getIcon()}
          </div>

          <h3 className="dialog-title">{title}</h3>

          <div className="dialog-message">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        <div className="dialog-actions">
          {showCancel && (
            <button className="dialog-btn btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            className={`dialog-btn ${type === 'error' ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
