import React from 'react';

export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input 
        id={inputId}
        className="form-input" 
        {...props} 
      />
      {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
    </div>
  );
}

export function Select({ label, error, options = [], className = '', id, ...props }) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={selectId} className="form-label">{label}</label>}
      <select 
        id={selectId}
        className="form-select" 
        {...props}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value !== undefined ? opt.value : opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = '', id, ...props }) {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={`form-group ${className}`}>
        {label && <label htmlFor={textareaId} className="form-label">{label}</label>}
        <textarea 
          id={textareaId}
          className="form-textarea" 
          rows={3}
          {...props} 
        />
        {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
      </div>
    );
  }
