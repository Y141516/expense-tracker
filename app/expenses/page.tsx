"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/store/app-context";
import { getProfile } from "@/lib/storage";
import { formatCurrency, formatDate, groupExpensesByDate } from "@/lib/utils";
import { ExpenseItem } from "@/components/expenses/ExpenseItem";
import { format, subMonths, addMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpensesPage() {
  const { expenses, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showFilters, setShowFilters] = useState(false);

  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const mok = e.date.startsWith(viewMonth);
      const sok = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const cok = !filterCat || e.category_id === filterCat;
      return mok && sok && cok;
    }),
    [expenses, viewMonth, search, filterCat]
  );

  const grouped = useMemo(() => groupExpensesByDate(monthExpenses), [monthExpenses]);
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const canNext = viewMonth < format(new Date(), "yyyy-MM");
  const monthLabel = format(new Date(viewMonth + "-01"), "MMMM yyyy");

  const prevMonth = () => setViewMonth(format(subMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM"));
  const nextMonth = () => {
    if (!canNext) return;
    setViewMonth(format(addMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM"));
  };

  return (
    <div className="page-content">

      {/* ── STICKY HEADER ── */}
      <div className="page-header">
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>Expenses</h1>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="btn btn-sm btn-secondary"
            style={{
              borderColor: (filterCat || search) ? "var(--accent)" : undefined,
              color: (filterCat || search) ? "var(--accent)" : undefined,
              background: (filterCat || search) ? "var(--accent-dim)" : undefined,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filter {(filterCat || search) ? "•" : ""}
          </button>
        </div>

        {/* Month picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <button onClick={prevMonth} className="btn btn-ghost btn-sm" style={{ width: 36, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="t-label" style={{ color: "var(--text-primary)", flex: 1, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={nextMonth} disabled={!canNext} className="btn btn-ghost btn-sm" style={{ width: 36, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses…"
            className="input-base"
            style={{ paddingLeft: 38, paddingRight: search ? 38 : 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Category filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", marginTop: 10 }}
            >
              <div className="no-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {[null, ...categories].map(cat => {
                  const active = filterCat === (cat?.id ?? null);
                  return (
                    <button key={cat?.id ?? "all"}
                      onClick={() => setFilterCat(cat?.id ?? null)}
                      className="btn btn-sm"
                      style={{
                        flexShrink: 0,
                        borderRadius: 20,
                        background: active ? "var(--accent-dim)" : "var(--bg-elevated)",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        border: `1.5px solid ${active ? "var(--accent)" : "transparent"}`,
                        height: 32,
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {cat ? `${cat.icon} ${cat.name.split(" ")[0]}` : "All"}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SUMMARY STRIP ── */}
      {monthExpenses.length > 0 && (
        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="t-caption" style={{ color: "var(--text-muted)" }}>
            {monthExpenses.length} transaction{monthExpenses.length !== 1 ? "s" : ""}
          </span>
          <span className="t-label" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(total, currency)}
          </span>
        </div>
      )}

      {/* ── EXPENSE GROUPS ── */}
      <div style={{ padding: "0 16px 8px" }}>
        {grouped.length === 0 ? (
          <div style={{ paddingTop: 64, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 24, background: "var(--bg-elevated)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16,
            }}>🔍</div>
            <p className="t-h4" style={{ color: "var(--text-primary)", marginBottom: 6 }}>
              {search || filterCat ? "No results" : "No expenses"}
            </p>
            <p className="t-body-sm" style={{ color: "var(--text-muted)" }}>
              {search || filterCat ? "Try different filters" : "Tap + to add your first expense"}
            </p>
          </div>
        ) : (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {grouped.map(({ date, items, total: dayTotal }) => (
              <div key={date}>
                {/* Date header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <span className="t-overline" style={{ color: "var(--text-muted)" }}>
                    {formatDate(date)}
                  </span>
                  <span className="t-caption" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                    {formatCurrency(dayTotal, currency)}
                  </span>
                </div>
                {/* Items card */}
                <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                  {items.map((expense, i) => (
                    <div key={expense.id}
                      style={{ borderBottom: i < items.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
                      <ExpenseItem expense={expense} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
