import React from 'react';

export function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}
