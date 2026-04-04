'use client';

import { useState } from 'react';

interface PasswordInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  className = 'form-control form-control-lg rounded-3',
  required,
  autoFocus,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={className}
        style={{ borderRight: 'none' }}
        required={required}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        style={{ borderLeft: 'none', borderColor: '#dee2e6' }}
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} />
      </button>
    </div>
  );
}
