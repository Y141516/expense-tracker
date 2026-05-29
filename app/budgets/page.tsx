"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getCategoryTotals } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel, getBudgetStatus } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/types";
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";

export default function BudgetsPage() {
  const { budgets, setBudget, deleteBudget, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const currencySymbols: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ" };
  const symbol = currencySymbols[currency] || "₹";

  const [viewMonth, setViewMonth] = useState(getCurrentMonth());
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatId, setNewCatId] = useState("food");
  const [newAmount, setNewAmount] = useState("");

  const { expenses } = useApp();
  const categoryTotals = useMemo(() => getCategoryTotals(viewMonth), [expenses, viewMonth]);
  const monthBudgets = useMemo(() => budgets.filter(b => b.month === viewMonth), [budgets, viewMonth]);

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  const prevMonth = () => setViewMonth(format(subMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM"));
  const nextMonth = () => {
    const next = format(addMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM");
    if (next <= format(addMonths(new Date(), 1), "yyyy-MM")) setViewMonth(next);
  };

  const handleEditSave = (catId: string) => {
    const amount = parseFloat(editValue);
    if (amount > 0) setBudget(catId, amount, viewMonth);
    setEditingCat(null);
    setEditValue("");
  };

  const handleAddBudget = () => {
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) return;
    setBudget(newCatId, amount, viewMonth);
    setShowAddModal(false);
    setNewAmount("");
  };

  const categoriesWithBudget = useMemo(() => {
    return categories.map(cat => {
      const budget = monthBudgets.find(b => b.category_id === cat.id);
      const spent = categoryTotals[cat.id] || 0;
      const status = budget ? getBudgetStatus(spent, budget.amount) : null;
      return { ...cat, budget, spent, status };
    }).filter(c => c.budget || c.spent > 0);
  }, [categories, monthBudgets, categoryTotals]);

  const categoriesWithoutBudget = useMemo(() =>
    categories.filter(cat => !monthBudgets.find(b => b.category_id === cat.id)),
    [categories, monthBudgets]);

  const overBudgetCount = categoriesWithBudget.filter(c => c.status?.status === "exceeded").length;
  const warningCount = categoriesWithBudget.filter(c => c.status?.status === "warning").length;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Budgets</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            <Plus size={16} /> Set Budget
          </motion.button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--bg-border)]">
            <ChevronLeft size={16} className="text-[var(--text-secondary)]" />
          </button>
          <h2 className="text-base font-bold text-[var(--text-primary)]">{getMonthLabel(viewMonth)}</h2>
          <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--bg-border)]">
            <ChevronRight size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Summary card */}
        {totalBudget > 0 && (
          <div className="card p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Total Budget</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(totalBudget, currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">Spent</p>
                <p className="text-xl font-bold" style={{ color: totalSpent > totalBudget ? "#ef4444" : "#22c55e" }}>
                  {formatCurrency(totalSpent, currency)}
                </p>
              </div>
            </div>
            <div className="progress-bar h-2.5 mb-2">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                transition={{ duration: 0.8 }}
                style={{ background: totalSpent > totalBudget ? "#ef4444" : totalSpent / totalBudget > 0.8 ? "#f59e0b" : "#22c55e" }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">{Math.round((totalSpent / totalBudget) * 100)}% used</span>
              <span className={totalBudget - totalSpent >= 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                {totalBudget - totalSpent >= 0 ? `${formatCurrency(totalBudget - totalSpent, currency)} left` : `${formatCurrency(totalSpent - totalBudget, currency)} over`}
              </span>
            </div>

            {/* Alerts */}
            {(overBudgetCount > 0 || warningCount > 0) && (
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${overBudgetCount > 0 ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                {overBudgetCount > 0 ? `🚨 ${overBudgetCount} categor${overBudgetCount > 1 ? "ies" : "y"} over budget!` : `⚠️ ${warningCount} categor${warningCount > 1 ? "ies" : "y"} near limit`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget list */}
      <div className="px-4 pb-24 space-y-3">
        {categoriesWithBudget.length === 0 ? (
          <div className="card p-10 text-center">
            <Target size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
            <h3 className="font-bold text-[var(--text-primary)] mb-1">No budgets set</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Set monthly spending limits to stay on track</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              + Set First Budget
            </button>
          </div>
        ) : (
          categoriesWithBudget.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-4 ${cat.status?.status === "exceeded" ? "border-red-500/30" : cat.status?.status === "warning" ? "border-amber-500/30" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{cat.name}</p>
                  {cat.status && (
                    <p className="text-xs mt-0.5" style={{ color: cat.status.color }}>
                      {cat.status.status === "exceeded" ? "⚠️ Over budget!" : cat.status.status === "warning" ? "⚠️ Almost at limit" : "✓ On track"}
                    </p>
                  )}
                  {!cat.budget && <p className="text-xs text-[var(--text-muted)]">No budget set</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cat.budget && (
                    <>
                      <button
                        onClick={() => { setEditingCat(cat.id); setEditValue(cat.budget!.amount.toString()); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteBudget(cat.budget!.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline edit */}
              <AnimatePresence>
                {editingCat === cat.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 input-base py-2">
                        <span className="text-[var(--text-muted)] text-sm">{symbol}</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-sm font-semibold"
                          autoFocus
                          inputMode="numeric"
                        />
                      </div>
                      <button onClick={() => handleEditSave(cat.id)} className="w-10 h-10 rounded-xl bg-green-500/15 text-green-500 flex items-center justify-center">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingCat(null)} className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] flex items-center justify-center">
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {cat.budget && (
                <>
                  <div className="progress-bar mb-2">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(cat.status!.percentage, 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                      style={{ background: cat.status!.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{formatCurrency(cat.spent, currency)} spent</span>
                    <span className="font-semibold" style={{ color: cat.status!.color }}>
                      {cat.status!.percentage.toFixed(0)}% of {formatCurrency(cat.budget.amount, currency)}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add Budget Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} />
            <motion.div
              className="bottom-sheet p-6"
              style={{ background: "var(--bg-card)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full bg-[var(--bg-border)]" /></div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Set Budget</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 block">Category</label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {categoriesWithoutBudget.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewCatId(cat.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold border-2 transition-all ${newCatId === cat.id ? "border-green-500 bg-green-500/10 text-green-500" : "border-[var(--bg-border)] text-[var(--text-secondary)]"}`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-center leading-tight">{cat.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                  {categoriesWithoutBudget.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">All categories have budgets set! ✓</p>
                  )}
                </div>

                {categoriesWithoutBudget.length > 0 && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 block">Monthly Limit</label>
                      <div className="input-base flex items-center gap-2">
                        <span className="text-[var(--text-muted)]">{symbol}</span>
                        <input
                          type="number"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          placeholder="0"
                          className="flex-1 bg-transparent outline-none text-lg font-bold"
                          inputMode="numeric"
                          autoFocus
                        />
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddBudget}
                      disabled={!newAmount || parseFloat(newAmount) <= 0}
                      className="w-full h-14 rounded-2xl font-bold text-white text-base disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      Save Budget
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
