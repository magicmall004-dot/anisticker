import { useState, useCallback, createContext, useContext } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = "info", duration = 2800) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);

  const typeColor = { info:"var(--hint)", success:"var(--success)", error:"var(--danger)", warning:"var(--warning)" };

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast" style={{ borderLeft:`3px solid ${typeColor[t.type] || typeColor.info}` }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const fn = useContext(ToastCtx);
  if (!fn) throw new Error("useToast must be inside ToastProvider");
  return fn;
}
