"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile } from "@/lib/storage";
import { formatCurrency, formatDate, groupExpensesByDate } from "@/lib/utils";
import { Search, Filter, X, ChevronLeft, ChevronRight as ChevRight } from "lucide-react";
import { ExpenseItem } from "@/components/expenses/ExpenseItem";
import { DEFAULT_CATEGORIES } from "@/types";
import { format, subMonths, addMonths } from "date-fns";

export default function ExpensesPage() {
  const { expenses, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showFilters, setShowFilters] = useState(false);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchMonth = e.date.startsWith(viewMonth);
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || e.category_id === filterCategory;
      return matchMonth && matchSearch && matchCategory;
    });
  }, [expenses, viewMonth, search, filterCategory]);

  const grouped = useMemo(() => groupExpensesByDate(monthExpenses), [monthExpenses]);
  const totalFiltered = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const prevMonth = () => setViewMonth(format(subMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM"));
  const nextMonth = () => {
    const next = format(addMonths(new Date(viewMonth + "-01"), 1), "yyyy-MM");
    if (next <= format(new Date(), "yyyy-MM")) setViewMonth(next);
  };
  const canGoNext = viewMonth < format(new Date(), "yyyy-MM");

  const monthLabel = format(new Date(viewMonth + "-01"), "MMMM yyyy");

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)] px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Expenses</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${filterCategory || search ? "bg-green-500/15 text-green-500" : "bg-[var(--bg-card)] border border-[var(--bg-border)] text-[var(--text-muted)]"}`}
          >
            <Filter size={14} />
            Filter
          </button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--bg-border)]">
            <ChevronLeft size={16} className="text-[var(--text-secondary)]" />
          </button>
          <h2 className="text-base font-bold text-[var(--text-primary)]">{monthLabel}</h2>
          <button onClick={nextMonth} disabled={!canGoNext} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--bg-border)] disabled:opacity-40">
            <ChevRight size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="input-base pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {/* Category filter */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
          >
            <button
              onClick={() => setFilterCategory(null)}
              className={`category-chip shrink-0 ${!filterCategory ? "bg-green-500/15 text-green-500" : "bg-[var(--bg-card)] border border-[var(--bg-border)] text-[var(--text-muted)]"}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                className={`category-chip shrink-0 ${filterCategory === cat.id ? "ring-2 ring-green-500" : "bg-[var(--bg-card)] border border-[var(--bg-border)] text-[var(--text-secondary)]"}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Summary bar */}
      {monthExpenses.length > 0 && (
        <div className="px-4 pb-3 flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">{monthExpenses.length} expense{monthExpenses.length !== 1 ? "s" : ""}</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(totalFiltered, currency)}</span>
        </div>
      )}

      {/* Expense list */}
      <div className="px-4 pb-24">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-bold text-[var(--text-primary)] mb-1">
              {search || filterCategory ? "No matching expenses" : "No expenses this month"}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {search || filterCategory ? "Try different filters" : "Tap + to add your first expense"}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ date, items, total }) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">{formatDate(date)}</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{formatCurrency(total, currency)}</span>
                </div>
                <div className="card divide-y divide-[var(--bg-border)] overflow-hidden">
                  {items.map((expense) => (
                    <ExpenseItem key={expense.id} expense={expense} />
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
