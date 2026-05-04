import React from 'react';

const variants = {
  error:   'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
};

export default function Alert({ message, variant = 'error' }) {
  if (!message) return null;
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]}`} role="alert">
      {message}
    </div>
  );
}
