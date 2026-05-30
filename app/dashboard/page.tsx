"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getMonthlyTrends, getCategoryTotals, getExpensesByMonth, generateInsights } from "@/lib/storage";
import { formatCurrency, getGreeting, getCurrentMonth, getMonthLabel, getPreviousMonth, getBudgetStatus } from "@/lib/utils";
import { TrendingUp, TrendingDown, Bell, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DEFAULT_CATEGORIES } from "@/types";
import Link from "next/link";
import { format, subDays } from "date-fns";

export default function DashboardPage() {
  const { expenses, budgets, categories, currentMonth } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const name = profile?.full_name || "Friend";

  const monthExpenses = useMemo(() => getExpensesByMonth(currentMonth), [expenses, currentMonth]);
  const totalSpent = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const categoryTotals = useMemo(() => getCategoryTotals(currentMonth), [expenses, currentMonth]);
  const prevMonth = getPreviousMonth(currentMonth);
  const prevTotal = useMemo(() => {
    const prevExpenses = getExpensesByMonth(prevMonth);
    return prevExpenses.reduce((s, e) => s + e.amount, 0);
  }, [expenses, prevMonth]);
  const trends = useMemo(() => getMonthlyTrends(6), [expenses]);
  const insights = useMemo(() => generateInsights(currentMonth), [expenses, budgets, currentMonth]);

  // Pie data
  const pieData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId) || DEFAULT_CATEGORIES.find(c => c.id === catId);
        return { name: cat?.name || catId, value: amount, color: cat?.color || "#6b7280", icon: cat?.icon || "📦" };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [categoryTotals, categories]);

  // Last 7 days
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const dayLabel = format(subDays(new Date(), 6 - i), "EEE");
      const amount = expenses.filter(e => e.date === date).reduce((s, e) => s + e.amount, 0);
      return { day: dayLabel, amount };
    });
  }, [expenses]);

  const monthBudgets = useMemo(() => budgets.filter(b => b.month === currentMonth), [budgets, currentMonth]);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const change = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;
  const recentExpenses = expenses.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="px-4 pt-6 pb-4 space-y-5 page-enter"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{name} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          {insights.length > 0 && (
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 z-10" />
              <button className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--bg-border)]">
                <Bell size={18} className="text-[var(--text-secondary)]" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main balance card */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0d2518 0%, #0a1a2e 50%, #150d2a 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(34,197,94,0.8)" }}>
              {getMonthLabel(currentMonth)} Spending
            </p>
            {prevTotal > 0 && (
              <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${change > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {change > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
          </div>

          <h2 className="text-5xl font-black text-white mb-4" style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "-2px" }}>
            {formatCurrency(totalSpent, currency)}
          </h2>

          {/* Budget progress */}
          {totalBudget > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span>Budget used</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  {formatCurrency(totalSpent, currency)} / {formatCurrency(totalBudget, currency)}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: budgetUsed >= 100
                      ? "linear-gradient(90deg, #ef4444, #dc2626)"
                      : budgetUsed >= 80
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #22c55e, #16a34a)",
                    boxShadow: budgetUsed >= 100 ? "0 0 10px rgba(239,68,68,0.5)" : "0 0 10px rgba(34,197,94,0.4)",
                  }}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {budgetUsed >= 100 ? "⚠️ Over budget!" : `${Math.round(100 - budgetUsed)}% budget remaining`}
              </p>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Today", value: formatCurrency(expenses.filter(e => e.date === format(new Date(), "yyyy-MM-dd")).reduce((s, e) => s + e.amount, 0), currency) },
              { label: "This Week", value: formatCurrency(last7Days.reduce((s, d) => s + d.amount, 0), currency) },
              { label: "Transactions", value: monthExpenses.length.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl px-3 py-3 text-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-bold text-white leading-tight">{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💡</span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Smart Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.slice(0, 2).map((insight) => {
              const isWarning = (insight as { type: string }).type === "warning";
              return (
              <div key={insight.id} className={`card p-3.5 flex items-start gap-3 ${isWarning ? "border-amber-500/30" : "border-green-500/20"}`}>
                <span className="text-xl">{insight.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{insight.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            );
            })}
          </div>
        </motion.div>
      )}

      {/* Last 7 days chart */}
      <motion.div variants={itemVariants} className="card p-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={last7Days} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "10px", fontSize: 12 }}
              formatter={(value: unknown) => [formatCurrency(Number(value), currency), "Spent"]}
            />
            <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#colorAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Category breakdown */}
      {pieData.length > 0 && (
        <motion.div variants={itemVariants} className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Spending by Category</h3>
            <Link href="/analytics" className="text-xs text-green-500 font-semibold">See All →</Link>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0">
              <PieChart width={120} height={120}>
                <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {pieData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{item.name}</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] shrink-0">{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent expenses */}
      {recentExpenses.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Recent Expenses</h3>
            <Link href="/expenses" className="text-xs text-green-500 font-semibold flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="card divide-y divide-[var(--bg-border)]">
            {recentExpenses.map((expense) => {
              const cat = categories.find(c => c.id === expense.category_id) || DEFAULT_CATEGORIES[8];
              return (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{expense.description}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cat.name}</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(expense.amount, currency)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {monthExpenses.length === 0 && (
        <motion.div variants={itemVariants} className="card p-8 text-center">
          <div className="text-4xl mb-3">💳</div>
          <h3 className="font-bold text-[var(--text-primary)] mb-1">No expenses yet</h3>
          <p className="text-sm text-[var(--text-muted)]">Tap the + button to add your first expense!</p>
        </motion.div>
      )}
    </motion.div>
  );
}
