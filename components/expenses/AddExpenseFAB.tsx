"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AddExpenseModal } from "./AddExpenseModal";
import { BudgetSheet } from "@/components/budgets/BudgetSheet";

export function AddExpenseFAB() {
  const pathname = usePathname();
  const onBudgets = pathname === "/budgets";
  const [expOpen, setExpOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  return (
    <>
      <AnimatePresence mode="wait">
        {onBudgets ? (
          /* ── BUDGET page: "Add Budget" FAB ── */
          <motion.button
            key="budget-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => setBudgetOpen(true)}
            aria-label="Add budget"
            style={{
              position: "fixed",
              bottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 14px)",
              right: 20,
              zIndex: 50,
              height: 52,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 26,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.45), 0 2px 8px rgba(0,0,0,0.2)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Budget
          </motion.button>
        ) : (
          /* ── Other pages: "+" Add Expense FAB ── */
          <motion.button
            key="expense-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => setExpOpen(true)}
            aria-label="Add expense"
            style={{
              position: "fixed",
              bottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 14px)",
              right: 20,
              zIndex: 50,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.45), 0 2px 8px rgba(0,0,0,0.2)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AddExpenseModal isOpen={expOpen} onClose={() => setExpOpen(false)} />
      <BudgetSheet isOpen={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </>
  );
}
