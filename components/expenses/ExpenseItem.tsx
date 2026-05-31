"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Expense } from "@/types";
import { useApp } from "@/store/app-context";
import { formatCurrency } from "@/lib/utils";
import { getProfile } from "@/lib/storage";
import { AddExpenseModal } from "./AddExpenseModal";
import { useToast } from "@/components/ui/Toaster";

const PM_LABELS: Record<string, string> = {
  upi: "UPI", card: "Card", cash: "Cash", netbanking: "Net Banking", other: "Other",
};
const PM_ICONS: Record<string, string> = {
  upi: "📱", card: "💳", cash: "💵", netbanking: "🏦", other: "🔄",
};

export function ExpenseItem({ expense }: { expense: Expense }) {
  const { categories, deleteExpense } = useApp();
  const { success } = useToast();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const cat = categories.find(c => c.id === expense.category_id) || {
    icon: "📦", name: "Others", color: "#6b7280",
  };

  return (
    <>
      <div>
        {/* Main row */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
            transition: "background 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          {/* Category icon */}
          <div style={{
            width: 44, height: 44, minWidth: 44,
            borderRadius: 14,
            background: `${cat.color}1a`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            {cat.icon}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="t-label" style={{
              color: "var(--text-primary)", marginBottom: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {expense.description}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="t-caption" style={{ color: "var(--text-muted)" }}>{cat.name}</span>
              {expense.payment_method && (
                <>
                  <span style={{ color: "var(--bg-border)", fontSize: 10 }}>·</span>
                  <span className="t-caption" style={{ color: "var(--text-muted)" }}>
                    {PM_ICONS[expense.payment_method]} {PM_LABELS[expense.payment_method]}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Amount + chevron */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
            <span className="t-label" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(expense.amount, currency)}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2.5"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s ease" }}
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </button>

        {/* Expandable actions */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {expense.note && (
                <p className="t-caption"
                  style={{ padding: "0 16px 8px 72px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  "{expense.note}"
                </p>
              )}
              <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
                <button
                  onClick={() => { setEditOpen(true); setOpen(false); }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, height: 38 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => { deleteExpense(expense.id); success("Deleted"); }}
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1, height: 38 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddExpenseModal isOpen={editOpen} onClose={() => setEditOpen(false)} editExpense={expense} />
    </>
  );
}
