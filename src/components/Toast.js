import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), toast.duration || 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {/* Toast container positioned under navigation, top-left */}
      <div className="fixed top-16 left-6 z-50 space-y-2 max-w-md">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg ${t.variant === 'success' ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-white/10 border-white/20 text-white'}`}>
            {t.icon || (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>
            )}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}


