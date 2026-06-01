"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getCategoryTotals, hasBudgetsForMonth, copyBudgetsToMonth, getPreviousMonthKey } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel, getBudgetStatus } from "@/lib/utils";
import { BudgetSheet } from "@/components/budgets/BudgetSheet";
import { CopyBudgetPrompt } from "@/components/budgets/CopyBudgetPrompt";
import { format, addMonths } from "date-fns";

/* ── helper ── */
function clamp(v: number, min = 0, max = 100) { return Math.min(max, Math.max(min, v)); }

export default function BudgetsPage() {
  const { budgets, deleteBudget, categories, expenses, refreshData } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ" };
  const symbol = SYM[currency] || "₹";

  const [viewMonth, setViewMonth] = useState(getCurrentMonth());
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<string | undefined>();
  const [editAmt, setEditAmt] = useState<number | undefined>();
  const [showCopyPrompt, setShowCopyPrompt] = useState(false);
  const [copyPromptDismissed, setCopyPromptDismissed] = useState<string>(""); // month key

  /* ── computed values ── */
  const categoryTotals = useMemo(() =>
    getCategoryTotals(viewMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, viewMonth]
  );

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === viewMonth),
    [budgets, viewMonth]
  );

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((s, v) => s + v, 0),
    [categoryTotals]
  );
  const totalRemaining = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? clamp((totalSpent / totalBudget) * 100) : 0;
  const overallStatus = getBudgetStatus(totalSpent, totalBudget);

  /* ── category rows ── */
  const categoryRows = useMemo(() => {
    return categories.map((cat) => {
      const budget = monthBudgets.find((b) => b.category_id === cat.id);
      const spent = categoryTotals[cat.id] || 0;
      const status = budget ? getBudgetStatus(spent, budget.amount) : null;
      return { ...cat, budget, spent, status };
    });
  }, [categories, monthBudgets, categoryTotals]);

  const budgetedRows = categoryRows.filter((c) => c.budget);
  const unbudgetedSpentRows = categoryRows.filter((c) => !c.budget && c.spent > 0);

  /* ── month navigation ── */
  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      const prev = getPreviousMonthKey(m);
      return prev;
    });
    setShowCopyPrompt(false);
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      const next = format(addMonths(new Date(m + "-01"), 1), "yyyy-MM");
      const limit = format(addMonths(new Date(), 1), "yyyy-MM");
      return next <= limit ? next : m;
    });
    setShowCopyPrompt(false);
  }, []);

  /* ── show copy prompt when navigating to a month with no budgets ── */
  useEffect(() => {
    if (copyPromptDismissed === viewMonth) return;
    const prevMon = getPreviousMonthKey(viewMonth);
    const hasThis = hasBudgetsForMonth(viewMonth);
    const hasPrev = hasBudgetsForMonth(prevMon);
    if (!hasThis && hasPrev) {
      setShowCopyPrompt(true);
    } else {
      setShowCopyPrompt(false);
    }
  }, [viewMonth, budgets, copyPromptDismissed]);

  const handleCopyBudgets = () => {
    const prevMon = getPreviousMonthKey(viewMonth);
    copyBudgetsToMonth(prevMon, viewMonth);
    refreshData();
    setShowCopyPrompt(false);
    setCopyPromptDismissed(viewMonth);
  };

  const handleDismissCopy = () => {
    setShowCopyPrompt(false);
    setCopyPromptDismissed(viewMonth);
  };

  /* ── edit a budget ── */
  const openEdit = (catId: string, amount: number) => {
    setEditCatId(catId);
    setEditAmt(amount);
    setBudgetSheetOpen(true);
  };

  const closeBudgetSheet = () => {
    setBudgetSheetOpen(false);
    setEditCatId(undefined);
    setEditAmt(undefined);
  };

  /* ── open add budget sheet ── */
  const openAdd = () => {
    setEditCatId(undefined);
    setEditAmt(undefined);
    setBudgetSheetOpen(true);
  };

  /* ── status label ── */
  const statusLabel = () => {
    if (totalBudget === 0) return null;
    if (overallPct >= 100) return { text: "🚨 Over budget", color: "#ef4444" };
    if (overallPct >= 90)  return { text: "🔴 Critical — slow down", color: "#ef4444" };
    if (overallPct >= 70)  return { text: "🟠 Getting close", color: "#f97316" };
    return { text: "🟢 On track", color: "#22c55e" };
  };

  const canGoNext = viewMonth < format(addMonths(new Date(), 1), "yyyy-MM");

  return (
    <>
      <div className="page-content">

        {/* ── STICKY HEADER ── */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>Budgets</h1>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                Monthly spending limits
              </p>
            </div>
            {/* Header Set Budget button — always visible */}
            <button
              onClick={openAdd}
              className="btn btn-primary btn-md"
              style={{ flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Set Budget
            </button>
          </div>

          {/* Month navigator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={prevMonth} className="btn btn-ghost btn-sm" style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div style={{ textAlign: "center" }}>
              <p className="t-label" style={{ color: "var(--text-primary)" }}>{getMonthLabel(viewMonth)}</p>
              <p className="t-micro" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                {viewMonth === getCurrentMonth() ? "current month" : "past month"}
              </p>
            </div>
            <button onClick={nextMonth} disabled={!canGoNext} className="btn btn-ghost btn-sm" style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── COPY PROMPT ── */}
          <AnimatePresence>
            {showCopyPrompt && (
              <CopyBudgetPrompt
                fromMonth={getPreviousMonthKey(viewMonth)}
                toMonth={viewMonth}
                onCopy={handleCopyBudgets}
                onDismiss={handleDismissCopy}
              />
            )}
          </AnimatePresence>

          {/* ── HERO SUMMARY CARD ── */}
          {totalBudget > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: 24,
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(145deg, #0a1f14 0%, #080f1e 55%, #100820 100%)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Glow */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: `radial-gradient(circle, ${overallStatus.color}30, transparent)`,
                pointerEvents: "none",
              }} />

              <p className="t-overline" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
                {getMonthLabel(viewMonth)} Overview
              </p>

              {/* Spent vs Budget */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>SPENT</p>
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "2.25rem", fontWeight: 800, color: "#fff", lineHeight: 1,
                    letterSpacing: "-1px",
                  }}>
                    {formatCurrency(totalSpent, currency)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>MONTHLY BUDGET</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: overallStatus.color, lineHeight: 1 }}>
                    {formatCurrency(totalBudget, currency)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: 10 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{
                    height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, ${overallStatus.color}, ${overallStatus.color}cc)`,
                    boxShadow: `0 0 10px ${overallStatus.color}60`,
                  }}
                />
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {(() => {
                  const lbl = statusLabel();
                  return lbl ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: lbl.color }}>{lbl.text}</span>
                  ) : <span />;
                })()}
                <span style={{ fontSize: 12, fontWeight: 700, color: totalRemaining >= 0 ? overallStatus.color : "#ef4444" }}>
                  {totalRemaining >= 0
                    ? `${formatCurrency(totalRemaining, currency)} left`
                    : `${formatCurrency(Math.abs(totalRemaining), currency)} over`}
                </span>
              </div>

              {/* 3 stat pills */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                {[
                  { label: "Used", value: `${overallPct.toFixed(0)}%` },
                  { label: "Categories", value: String(budgetedRows.length) },
                  { label: "Remaining", value: formatCurrency(Math.max(totalRemaining, 0), currency) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: "8px 10px", textAlign: "center",
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── EMPTY STATE ── */}
          {budgetedRows.length === 0 && !showCopyPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: 40, borderRadius: 20,
                border: "1.5px dashed var(--bg-border)",
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 24,
                background: "rgba(34,197,94,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 34, marginBottom: 16,
              }}>🎯</div>
              <p className="t-h4" style={{ color: "var(--text-primary)", marginBottom: 6 }}>No budgets for {getMonthLabel(viewMonth)}</p>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
                Set per-category monthly limits.{"\n"}You&apos;ll be alerted at 70% and 90%.
              </p>
              <button onClick={openAdd} className="btn btn-primary btn-md">
                + Set First Budget
              </button>
            </motion.div>
          )}

          {/* ── BUDGETED CATEGORIES ── */}
          {budgetedRows.length > 0 && (
            <div>
              <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 10 }}>
                CATEGORY BUDGETS ({budgetedRows.length})
              </p>
              <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {budgetedRows.map((cat) => {
                  const pct = clamp(cat.status?.percentage || 0);
                  const barColor = cat.status?.color || "#22c55e";
                  const remaining = (cat.budget?.amount || 0) - cat.spent;
                  const isOver = remaining < 0;

                  return (
                    <motion.div
                      key={cat.id}
                      layout
                      style={{
                        borderRadius: 18,
                        background: "var(--bg-surface)",
                        border: `1.5px solid ${
                          cat.status?.status === "exceeded" || cat.status?.status === "danger"
                            ? "rgba(239,68,68,0.3)"
                            : cat.status?.status === "warning"
                            ? "rgba(249,115,22,0.3)"
                            : "var(--bg-border)"
                        }`,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ padding: "14px 14px 12px" }}>
                        {/* Top row: icon + name + actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          {/* Category icon */}
                          <div style={{
                            width: 44, height: 44, minWidth: 44,
                            borderRadius: 14,
                            background: `${cat.color}1a`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22,
                          }}>
                            {cat.icon}
                          </div>

                          {/* Name + status */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 2 }}>
                              {cat.name}
                            </p>
                            <p style={{ fontSize: 11, fontWeight: 600, color: barColor }}>
                              {cat.status?.status === "exceeded"
                                ? "🚨 Over budget"
                                : cat.status?.status === "danger"
                                ? "🔴 90%+ used"
                                : cat.status?.status === "warning"
                                ? "🟠 70%+ used"
                                : "🟢 On track"}
                            </p>
                          </div>

                          {/* Budget amount + actions */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <div style={{ textAlign: "right", marginRight: 4 }}>
                              <p className="t-label" style={{ color: "var(--text-primary)" }}>
                                {formatCurrency(cat.budget!.amount, currency)}
                              </p>
                              <p className="t-micro" style={{ color: "var(--text-muted)" }}>/month</p>
                            </div>
                            {/* Edit button */}
                            <button
                              onClick={() => openEdit(cat.id, cat.budget!.amount)}
                              aria-label={`Edit ${cat.name} budget`}
                              style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: "rgba(59,130,246,0.1)",
                                border: "1px solid rgba(59,130,246,0.2)",
                                color: "#60a5fa",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => deleteBudget(cat.budget!.id)}
                              aria-label={`Delete ${cat.name} budget`}
                              style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.2)",
                                color: "#f87171",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: 8, borderRadius: 99, background: "var(--bg-elevated)", overflow: "hidden", marginBottom: 8 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            style={{
                              height: "100%", borderRadius: 99,
                              background: barColor,
                              boxShadow: `0 0 8px ${barColor}40`,
                            }}
                          />
                        </div>

                        {/* Spent / Remaining row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="t-caption" style={{ color: "var(--text-muted)" }}>
                            Spent: <strong style={{ color: "var(--text-secondary)" }}>{formatCurrency(cat.spent, currency)}</strong>
                          </span>
                          <span className="t-caption" style={{
                            fontWeight: 700,
                            color: isOver ? "#ef4444" : barColor,
                          }}>
                            {isOver
                              ? `${formatCurrency(Math.abs(remaining), currency)} over`
                              : `${formatCurrency(remaining, currency)} left · ${pct.toFixed(0)}%`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── UNBUDGETED SPENDING ── */}
          {unbudgetedSpentRows.length > 0 && (
            <div>
              <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 10 }}>
                SPENDING WITHOUT BUDGET
              </p>
              <div style={{ borderRadius: 16, overflow: "hidden", background: "var(--bg-surface)", border: "1.5px solid var(--bg-border)" }}>
                {unbudgetedSpentRows.map((cat, i) => (
                  <div key={cat.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px",
                    borderBottom: i < unbudgetedSpentRows.length - 1 ? "1px solid var(--bg-border)" : "none",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: `${cat.color}1a`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="t-label" style={{ color: "var(--text-primary)" }}>{cat.name}</p>
                      <p className="t-caption" style={{ color: "var(--text-muted)" }}>No budget set</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span className="t-label" style={{ color: "var(--text-primary)" }}>
                        {formatCurrency(cat.spent, currency)}
                      </span>
                      <button
                        onClick={openAdd}
                        style={{
                          padding: "4px 12px", borderRadius: 8, height: 30,
                          background: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          color: "#22c55e",
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700, fontSize: 12,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Budget
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MONTHLY NOTE ── */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 14px", borderRadius: 14,
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <p className="t-caption" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-secondary)" }}>Budgets are per month.</strong>
              {" "}Each amount applies only to {getMonthLabel(viewMonth)}.
              Use ← → to view or set budgets for other months.
              Alerts fire at 70% and 90% usage.
            </p>
          </div>

        </div>
      </div>

      {/* ── BUDGET SHEET (shared by FAB + header button + edit) ── */}
      <BudgetSheet
        isOpen={budgetSheetOpen}
        onClose={closeBudgetSheet}
        month={viewMonth}
        editCategoryId={editCatId}
        editAmount={editAmt}
      />
    </>
  );
}
