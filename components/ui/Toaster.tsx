"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const CONFIG: Record<ToastType, { icon: string; accent: string; bg: string; border: string }> = {
  success: { icon: "✅", accent: "#22c55e", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.25)" },
  error:   { icon: "❌", accent: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)" },
  info:    { icon: "ℹ️",  accent: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.25)" },
  warning: { icon: "⚠️", accent: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-3), { ...opts, id }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: "error", title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: "info", title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {/* Toast container — above everything */}
      <div style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100vw - 32px)",
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const cfg = CONFIG[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "var(--bg-surface)",
                  border: `1.5px solid ${cfg.border}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  pointerEvents: "auto",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 10, bottom: 10,
                  width: 3, borderRadius: "0 3px 3px 0",
                  background: cfg.accent,
                }} />

                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{cfg.icon}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {t.title}
                  </p>
                  {t.message && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>
                      {t.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => dismiss(t.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: "var(--bg-elevated)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {},
    } as ToastContextType;
  }
  return ctx;
}
