"use client";
import { motion, AnimatePresence } from "framer-motion";
import { getMonthLabel } from "@/lib/utils";

interface CopyBudgetPromptProps {
  fromMonth: string;
  toMonth: string;
  onCopy: () => void;
  onDismiss: () => void;
}

export function CopyBudgetPrompt({ fromMonth, toMonth, onCopy, onDismiss }: CopyBudgetPromptProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1.5px solid rgba(34,197,94,0.3)",
          background: "rgba(34,197,94,0.06)",
        }}
      >
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: "rgba(34,197,94,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              📋
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 3 }}>
                Copy budgets from {getMonthLabel(fromMonth)}?
              </p>
              <p className="t-caption" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                {getMonthLabel(toMonth)} has no budgets yet.
                Copy last month&apos;s limits to get started quickly.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                background: "var(--bg-elevated)",
                border: "1.5px solid var(--bg-border)",
                color: "var(--text-secondary)",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700, fontSize: 13,
                cursor: "pointer",
              }}
            >
              Start fresh
            </button>
            <button
              onClick={onCopy}
              style={{
                flex: 2, height: 38, borderRadius: 12,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "none",
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(34,197,94,0.3)",
              }}
            >
              Yes, copy budgets
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
