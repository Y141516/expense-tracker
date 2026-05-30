"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getCategoryTotals } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel, getBudgetStatus } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/types";
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Target, Info } from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";

export default function BudgetsPage() {
  const { budgets, setBudget, deleteBudget, categories, expenses } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const currencySymbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£",
    JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ",
  };
  const symbol = currencySymbols[currency] || "₹";

  const [viewMonth, setViewMonth] = useState(getCurrentMonth());
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatId, setNewCatId] = useState("food");
  const [newAmount, setNewAmount] = useState("");

  const categoryTotals = useMemo(() => getCategoryTotals(viewMonth), [expenses, viewMonth]);
  // ✅ Only budgets for the selected month — never multiplied
  const monthBudgets = useMemo(
    () => budgets.filter(b => b.month === viewMonth),
    [budgets, viewMonth]
  );

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const prevMonth = () =>
    setViewMonth(format(subMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM"));
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

  const catsWithData = useMemo(() => {
    return categories
      .map(cat => {
        const budget = monthBudgets.find(b => b.category_id === cat.id);
        const spent = categoryTotals[cat.id] || 0;
        const status = budget ? getBudgetStatus(spent, budget.amount) : null;
        return { ...cat, budget, spent, status };
      })
      .filter(c => c.budget || c.spent > 0);
  }, [categories, monthBudgets, categoryTotals]);

  const catsWithoutBudget = useMemo(
    () => categories.filter(cat => !monthBudgets.find(b => b.category_id === cat.id)),
    [categories, monthBudgets]
  );

  const overCount = catsWithData.filter(c => c.status?.status === "exceeded").length;
  const warnCount = catsWithData.filter(c => c.status?.status === "warning").length;

  const statusColor = overallPct >= 100 ? "#ef4444" : overallPct >= 80 ? "#f59e0b" : "#22c55e";

  return (
    <div className="page-enter pb-28">
      {/* ── HEADER ── */}
      <div
        className="sticky top-0 z-20 px-4 pt-6 pb-4"
        style={{
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--bg-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
              Budgets
            </h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>
              Monthly spending limits
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            <Plus size={16} strokeWidth={3} /> Set Budget
          </motion.button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--bg-border)" }}
          >
            <ChevronLeft size={17} style={{ color: "var(--text-secondary)" }} />
          </motion.button>
          <div className="text-center">
            <p className="text-base font-black" style={{ color: "var(--text-primary)" }}>
              {getMonthLabel(viewMonth)}
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
              budgets reset each month
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--bg-border)" }}
          >
            <ChevronRight size={17} style={{ color: "var(--text-secondary)" }} />
          </motion.button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── TOTAL SUMMARY CARD ── */}
        {totalBudget > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #0d2518, #0a1a2e)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: statusColor }} />

            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              {getMonthLabel(viewMonth)} Overview
            </p>

            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Spent</p>
                <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  {formatCurrency(totalSpent, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Monthly Budget
                </p>
                <p className="text-2xl font-bold" style={{ color: statusColor }}>
                  {formatCurrency(totalBudget, currency)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full overflow-hidden mb-2"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  background: `linear-gradient(90deg, ${statusColor}, ${statusColor}cc)`,
                  boxShadow: `0 0 10px ${statusColor}60`,
                }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                {overallPct.toFixed(0)}% used
              </p>
              <p className="text-xs font-bold" style={{ color: statusColor }}>
                {totalBudget - totalSpent >= 0
                  ? `${formatCurrency(totalBudget - totalSpent, currency)} remaining`
                  : `${formatCurrency(totalSpent - totalBudget, currency)} over budget`}
              </p>
            </div>

            {/* Alert chip */}
            {(overCount > 0 || warnCount > 0) && (
              <div
                className="mt-3 px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-2"
                style={{
                  background: overCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                  color: overCount > 0 ? "#f87171" : "#fbbf24",
                  border: `1px solid ${overCount > 0 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}
              >
                {overCount > 0
                  ? `🚨 ${overCount} categor${overCount > 1 ? "ies" : "y"} exceeded budget`
                  : `⚠️ ${warnCount} categor${warnCount > 1 ? "ies" : "y"} nearing limit`}
              </div>
            )}
          </motion.div>
        )}

        {/* ── CATEGORY BUDGET CARDS ── */}
        {catsWithData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl p-10 flex flex-col items-center text-center"
            style={{ background: "var(--bg-card)", border: "1.5px dashed var(--bg-border)" }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              🎯
            </div>
            <p className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>
              No budgets yet
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Set a monthly limit per category to track spending
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              <Plus size={16} /> Set First Budget
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {catsWithData.map((cat, i) => {
              const pct = cat.status?.percentage || 0;
              const barColor = cat.status?.color || "#22c55e";

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: "var(--bg-card)",
                    border: `1.5px solid ${
                      cat.status?.status === "exceeded"
                        ? "rgba(239,68,68,0.35)"
                        : cat.status?.status === "warning"
                        ? "rgba(245,158,11,0.35)"
                        : "var(--bg-border)"
                    }`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        background: `${cat.color}22`,
                      }}
                    >
                      {cat.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {cat.name}
                      </p>
                      {cat.status ? (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: barColor }}>
                          {cat.status.status === "exceeded"
                            ? "🚨 Over budget"
                            : cat.status.status === "warning"
                            ? "⚠️ Nearing limit"
                            : "✓ On track"}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          No budget set
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {cat.budget && (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => {
                              setEditingCat(cat.id);
                              setEditValue(cat.budget!.amount.toString());
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
                          >
                            <Pencil size={13} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => deleteBudget(cat.budget!.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                          >
                            <Trash2 size={13} />
                          </motion.button>
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
                        className="overflow-hidden mb-3"
                      >
                        <div className="flex gap-2">
                          <div
                            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1.5px solid #22c55e",
                            }}
                          >
                            <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                              {symbol}
                            </span>
                            <input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              autoFocus
                              inputMode="numeric"
                              className="flex-1 bg-transparent outline-none text-sm font-bold"
                              style={{ color: "var(--text-primary)" }}
                              placeholder="Amount / month"
                            />
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditSave(cat.id)}
                            className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                          >
                            <Check size={17} strokeWidth={3} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingCat(null)}
                            className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress */}
                  {cat.budget && (
                    <>
                      <div className="progress-bar mb-2">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
                          style={{ background: barColor }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                          {formatCurrency(cat.spent, currency)} spent
                        </span>
                        <span className="text-xs font-bold" style={{ color: barColor }}>
                          {pct.toFixed(0)}% of {formatCurrency(cat.budget.amount, currency)}/mo
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Monthly note */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <span className="font-bold" style={{ color: "var(--text-secondary)" }}>
              Budgets are monthly.
            </span>{" "}
            Each amount you set applies only to {getMonthLabel(viewMonth)}. Use the arrows to set budgets for other months.
          </p>
        </div>

      </div>

      {/* ── ADD BUDGET SHEET ── */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60"
              style={{ backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-6"
              style={{
                background: "var(--bg-card)",
                maxHeight: "90dvh",
                overflowY: "auto",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              {/* Handle */}
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--bg-border)" }} />
              </div>

              <h3 className="text-xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
                Set Budget
              </h3>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                This budget applies only to{" "}
                <span className="font-bold" style={{ color: "var(--text-secondary)" }}>
                  {getMonthLabel(viewMonth)}
                </span>
              </p>

              {catsWithoutBudget.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-3">✅</div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                    All categories have budgets!
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    Edit existing ones using the ✏️ button
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Category grid */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "var(--text-muted)" }}>
                      Select Category
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {catsWithoutBudget.map(cat => (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setNewCatId(cat.id)}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
                          style={{
                            background: newCatId === cat.id ? `${cat.color}22` : "var(--bg-elevated)",
                            border: `2px solid ${newCatId === cat.id ? cat.color : "transparent"}`,
                          }}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                            style={{ background: `${cat.color}20` }}
                          >
                            {cat.icon}
                          </div>
                          <span
                            className="text-[10px] font-bold text-center leading-tight"
                            style={{ color: newCatId === cat.id ? cat.color : "var(--text-muted)" }}
                          >
                            {cat.name.split(" ")[0]}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Amount input */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      Monthly Limit
                    </p>
                    <div
                      className="flex items-center gap-3 px-4 py-4 rounded-2xl"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1.5px solid var(--bg-border)",
                      }}
                    >
                      <span className="text-2xl font-black" style={{ color: "var(--text-muted)" }}>
                        {symbol}
                      </span>
                      <input
                        type="number"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        placeholder="0"
                        inputMode="numeric"
                        autoFocus
                        className="flex-1 bg-transparent outline-none text-2xl font-black"
                        style={{ color: "var(--text-primary)" }}
                      />
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
                      >
                        / month
                      </span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      You'll be alerted when you reach 80% and 100%
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddBudget}
                    disabled={!newAmount || parseFloat(newAmount) <= 0}
                    className="w-full h-14 rounded-2xl font-black text-white text-base disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                  >
                    Save Budget for {getMonthLabel(viewMonth)}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
