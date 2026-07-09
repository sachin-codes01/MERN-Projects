import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      const { type = "success", duration = 3000 } = options;
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  const value = {
    showToast,
    success: (message, duration) => showToast(message, { type: "success", duration }),
    error: (message, duration) => showToast(message, { type: "error", duration }),
    info: (message, duration) => showToast(message, { type: "info", duration }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col items-center gap-2 px-4 pt-4 sm:pt-5">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
};

const STYLES = {
  success: {
    border: "border-mdn-green/40",
    iconBg: "bg-mdn-green/15",
    iconColor: "text-mdn-green",
    bar: "bg-mdn-green",
  },
  error: {
    border: "border-red-500/40",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    bar: "bg-red-500",
  },
  info: {
    border: "border-sky-500/40",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
    bar: "bg-sky-500",
  },
};

function ToastItem({ toast, onDismiss }) {
  const style = STYLES[toast.type] || STYLES.success;

  return (
    <div
      role="status"
      className={`pointer-events-auto relative flex w-full max-w-sm animate-pop items-start gap-3 overflow-hidden rounded-xl border ${style.border} bg-mdn-charcoal px-4 py-3 shadow-card backdrop-blur`}
    >
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconBg} ${style.iconColor}`}>
        {ICONS[toast.type]}
      </span>
      <p className="flex-1 pt-0.5 text-sm font-medium text-mdn-white">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-mdn-gray transition-colors hover:bg-white/5 hover:text-mdn-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
      <span
        className={`absolute bottom-0 left-0 h-0.5 ${style.bar} animate-[toast-shrink_var(--toast-duration)_linear_forwards]`}
        style={{ "--toast-duration": `${toast.duration}ms` }}
      />
    </div>
  );
}