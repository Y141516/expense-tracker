"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Pencil, ChevronRight } from "lucide-react";
import { Expense } from "@/types";
import { useApp } from "@/store/app-context";
import { formatCurrency } from "@/lib/utils";
import { getProfile } from "@/lib/storage";
import { AddExpenseModal } from "./AddExpenseModal";
import { useToast } from "@/components/ui/Toaster";

interface ExpenseItemProps {
  expense: Expense;
  showDate?: boolean;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  const { categories, deleteExpense } = useApp();
  const { success } = useToast();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const [editOpen, setEditOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const category = categories.find((c) => c.id === expense.category_id);

  const handleDelete = () => {
    deleteExpense(expense.id);
    success("Expense deleted");
    setShowActions(false);
  };

  const paymentIcons: Record<string, string> = {
    upi: "📱", card: "💳", cash: "💵", netbanking: "🏦", other: "🔄"
  };

  return (
    <>
      <motion.div
        layout
        className="relative overflow-hidden"
        onContextMenu={(e) => { e.preventDefault(); setShowActions(!showActions); }}
      >
        <motion.div
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors rounded-xl cursor-pointer active:bg-[var(--bg-elevated)]"
          onClick={() => setShowActions(!showActions)}
        >
          {/* Category Icon */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: category ? `${category.color}20` : "#6b728020" }}
          >
            {category?.icon || "📦"}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{expense.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[var(--text-muted)]">{category?.name || "Others"}</span>
              {expense.payment_method && (
                <>
                  <span className="text-[var(--bg-border)]">·</span>
                  <span className="text-xs text-[var(--text-muted)]">{paymentIcons[expense.payment_method]} {expense.payment_method === "upi" ? "UPI" : expense.payment_method}</span>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(expense.amount, currency)}</p>
            <ChevronRight size={12} className={`text-[var(--text-muted)] ml-auto transition-transform ${showActions ? "rotate-90" : ""}`} />
          </div>
        </motion.div>

        {/* Actions row */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 px-4 pb-3">
                <button
                  onClick={() => { setEditOpen(true); setShowActions(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 text-sm font-semibold"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-sm font-semibold"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AddExpenseModal isOpen={editOpen} onClose={() => setEditOpen(false)} editExpense={expense} />
    </>
  );
}
