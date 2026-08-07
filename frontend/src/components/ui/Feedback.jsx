import React from 'react';

export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

export function Alert({ children, variant = 'info', className = '', icon }) {
    return (
      <div className={`alert-card ${variant} ${className}`}>
        {icon && <div className="alert-icon">{icon}</div>}
        <div className="alert-content">{children}</div>
      </div>
    );
  }
