import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false, 
  disabled = false, 
  icon,
  ...props 
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const finalClassName = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button 
      className={finalClassName} 
      disabled={disabled || loading} 
      {...props}
    >
      {loading ? (
        <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'currentColor', borderTopColor: 'transparent' }} />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      {children}
    </button>
  );
}
