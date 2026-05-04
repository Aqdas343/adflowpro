import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    bar:  'bg-brand-500',
    icon: '✓',
    iconBg: 'bg-brand-100 text-brand-700',
    text: 'text-gray-900',
    border: 'border-brand-200',
  },
  error: {
    bar:  'bg-red-500',
    icon: '✕',
    iconBg: 'bg-red-100 text-red-700',
    text: 'text-gray-900',
    border: 'border-red-200',
  },
  info: {
    bar:  'bg-blue-500',
    icon: 'ℹ',
    iconBg: 'bg-blue-100 text-blue-700',
    text: 'text-gray-900',
    border: 'border-blue-200',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type] ?? TOAST_CONFIG.info;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 pl-1 pr-4 py-3 rounded-xl shadow-hover bg-white border ${cfg.border} max-w-sm pointer-events-auto`}
            >
              <div className={`w-1 self-stretch rounded-full ${cfg.bar} shrink-0`} />
              <span className={`w-6 h-6 rounded-full ${cfg.iconBg} flex items-center justify-center text-xs font-bold shrink-0`}>
                {cfg.icon}
              </span>
              <span className={`flex-1 text-sm font-medium ${cfg.text}`}>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
