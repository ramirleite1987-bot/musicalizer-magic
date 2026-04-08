import * as React from "react";
import { cn } from "../utils";

// Lightweight toast notification component (standalone, no external dependency)
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToasterContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const ToasterContext = React.createContext<ToasterContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToasterContext);
  if (!context) {
    throw new Error("useToast must be used within a ToasterProvider");
  }
  return context;
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToasterContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToasterContext.Provider>
  );
}

const typeStyles: Record<Toast["type"], string> = {
  success: "border-green-500 bg-green-50 text-green-900",
  error: "border-red-500 bg-red-50 text-red-900",
  warning: "border-yellow-500 bg-yellow-50 text-yellow-900",
  info: "border-blue-500 bg-blue-50 text-blue-900",
};

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm shadow-lg transition-all animate-in slide-in-from-bottom-2",
            typeStyles[toast.type]
          )}
          role="alert"
        >
          <div className="flex items-center justify-between gap-4">
            <span>{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export { Toaster };
