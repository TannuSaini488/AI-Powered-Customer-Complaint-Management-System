import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { removeToast } from "../features/ui/uiSlice";

export function ToastContainer() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = "bg-blue-600";
        let icon = "ℹ️";
        let textColor = "text-white";

        if (toast.type === "error") {
          bgColor = "bg-red-600";
          icon = "⚠️";
        } else if (toast.type === "success") {
          bgColor = "bg-green-600";
          icon = "✅";
        } else if (toast.type === "warning") {
          bgColor = "bg-yellow-500";
          textColor = "text-gray-900";
          icon = "⚠️";
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm animate-fade-in pointer-events-auto ${bgColor} ${textColor}`}
          >
            <span>{icon}</span>
            <p className="flex-1 whitespace-pre-wrap max-w-sm">{toast.message}</p>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
