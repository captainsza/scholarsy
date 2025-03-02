import { useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "default" | "success" | "error" | "warning" | "destructive";

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);
  let nextId = 0;

  const toast = (props: ToastProps) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { ...props, id }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, props.duration || 5000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-md shadow-md max-w-sm ${getToastClasses(t.variant)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{t.title}</h3>
                  {t.description && <p className="text-sm mt-1">{t.description}</p>}
                </div>
                <button
                  className="ml-4 text-gray-400 hover:text-gray-500"
                  onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                >
                  &times;
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function getToastClasses(variant: ToastVariant = "default") {
  switch (variant) {
    case "success":
      return "bg-green-50 border border-green-200 text-green-800";
    case "error":
    case "destructive":
      return "bg-red-50 border border-red-200 text-red-800";
    case "warning":
      return "bg-yellow-50 border border-yellow-200 text-yellow-800";
    default:
      return "bg-white border border-gray-200 text-gray-800";
  }
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export const toast = (props: ToastProps) => {
  // This is a helper for use outside of React components
  // In a real app, you'd use a more sophisticated approach
  
  // Create temporary DOM element
  const container = document.createElement("div");
  document.body.appendChild(container);
  
  // Style the toast
  container.className = `fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-md max-w-sm ${getToastClasses(props.variant)}`;
  
  // Create content
  container.innerHTML = `
    <div>
      <h3 class="font-medium">${props.title}</h3>
      ${props.description ? `<p class="text-sm mt-1">${props.description}</p>` : ""}
    </div>
  `;
  
  // Auto remove
  setTimeout(() => {
    container.style.opacity = "0";
    container.style.transform = "translateY(-20px)";
    container.style.transition = "opacity 0.3s, transform 0.3s";
    
    setTimeout(() => {
      document.body.removeChild(container);
    }, 300);
  }, props.duration || 5000);
};
