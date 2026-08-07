import React from 'react';

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ children, title, actions, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}
