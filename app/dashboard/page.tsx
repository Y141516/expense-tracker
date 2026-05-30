"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import {
  getProfile, getMonthlyTrends, getCategoryTotals,
  getExpensesByMonth, generateInsights,
} from "@/lib/storage";
import {
  formatCurrency, getGreeting, getCurrentMonth,
  getMonthLabel, getPreviousMonth,
} from "@/lib/utils";
import { TrendingUp, TrendingDown, ChevronRight, Bell } from "lucide-react";
import {
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { DEFAULT_CATEGORIES } from "@/types";
import Link from "next/link";
import { format, subDays } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

export default function DashboardPage() {
  const { expenses, budgets, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const name = profile?.full_name?.split(" ")[0] || "there";

  const currentMonth = getCurrentMonth();
  const monthExpenses = useMemo(
    () => getExpensesByMonth(currentMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, currentMonth]
  );
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = useMemo(() => getCategoryTotals(currentMonth), [expenses, currentMonth]);
  const prevMonth = getPreviousMonth(currentMonth);
  const prevTotal = useMemo(
    () => getExpensesByMonth(prevMonth).reduce((s, e) => s + e.amount, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, prevMonth]
  );
  const monthBudgets = useMemo(
    () => budgets.filter(b => b.month === currentMonth),
    [budgets, currentMonth]
  );
  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const change = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

  const pieData = useMemo(() =>
    Object.entries(categoryTotals)
      .map(([id, amt]) => {
        const cat = categories.find(c => c.id === id) || DEFAULT_CATEGORIES[8];
        return { name: cat.name, value: amt, color: cat.color, icon: cat.icon, id };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    [categoryTotals, categories]
  );

  const last7 = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "yyyy-MM-dd");
      return {
        day: format(d, "EEE"),
        amount: expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0),
      };
    }),
    [expenses]
  );

  const insights = useMemo(
    () => generateInsights(currentMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, budgets, currentMonth]
  );

  const todayTotal = expenses
    .filter(e => e.date === format(new Date(), "yyyy-MM-dd"))
    .reduce((s, e) => s + e.amount, 0);
  const weekTotal = last7.reduce((s, d) => s + d.amount, 0);
  const barColor = budgetPct >= 100 ? "#ef4444" : budgetPct >= 80 ? "#f59e0b" : "#22c55e";

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">

      {/* ── HEADER ── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {getGreeting()},
          </p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            {name} 👋
          </h1>
        </div>
        {insights.length > 0 && (
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 z-10 ring-2 ring-[var(--bg-primary)]" />
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-card)", border: "1.5px solid var(--bg-border)" }}>
              <Bell size={18} style={{ color: "var(--text-secondary)" }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* ── MAIN HERO CARD ── */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0a1f14 0%, #080f1e 55%, #120826 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Glow blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.18), transparent)" }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12), transparent)" }} />

        <div className="relative z-10">
          {/* Label + change badge */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(34,197,94,0.75)" }}>
              {getMonthLabel(currentMonth)}
            </p>
            {prevTotal > 0 && (
              <span
                className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full"
                style={{
                  background: change > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                  color: change > 0 ? "#fca5a5" : "#86efac",
                }}
              >
                {change > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {Math.abs(change).toFixed(1)}% vs last mo
              </span>
            )}
          </div>

          {/* Big amount */}
          <p
            className="text-5xl font-black text-white mb-4"
            style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "-2px" }}
          >
            {formatCurrency(totalSpent, currency)}
          </p>

          {/* Budget bar */}
          {totalBudget > 0 ? (
            <>
              <div className="flex justify-between text-xs mb-1.5"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>Monthly budget used</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>
                  {formatCurrency(totalSpent, currency)} / {formatCurrency(totalBudget, currency)}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetPct, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)`,
                    boxShadow: `0 0 12px ${barColor}50`,
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {budgetPct >= 100
                  ? "🚨 Over budget!"
                  : budgetPct >= 80
                  ? `⚠️ ${Math.round(100 - budgetPct)}% remaining — slow down`
                  : `${Math.round(100 - budgetPct)}% budget remaining`}
              </p>
            </>
          ) : (
            <Link href="/budgets">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <span className="text-xs font-bold" style={{ color: "#86efac" }}>
                  + Set monthly budgets
                </span>
              </div>
            </Link>
          )}

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { label: "Today", value: formatCurrency(todayTotal, currency) },
              { label: "This Week", value: formatCurrency(weekTotal, currency) },
              { label: "Transactions", value: monthExpenses.length.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl px-2 py-2.5 text-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm font-black text-white leading-none">{value}</p>
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── INSIGHTS ── */}
      {insights.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-xs font-black uppercase tracking-widest mb-2.5 flex items-center gap-1.5"
            style={{ color: "var(--text-muted)" }}>
            💡 Smart Insights
          </p>
          <div className="space-y-2">
            {insights.slice(0, 2).map(insight => {
              const isWarn = (insight as { type: string }).type === "warning";
              return (
                <div
                  key={insight.id}
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{
                    background: "var(--bg-card)",
                    border: `1.5px solid ${isWarn ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.2)"}`,
                  }}
                >
                  <span className="text-2xl flex-shrink-0 leading-none">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {insight.title}
                    </p>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── 7-DAY CHART ── */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-2xl p-4"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--bg-border)" }}>
        <p className="text-sm font-black mb-4" style={{ color: "var(--text-primary)" }}>
          Last 7 Days
        </p>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={last7} margin={{ top: 5, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day"
              tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }}
              axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}
              formatter={(v: unknown) => [formatCurrency(Number(v), currency), "Spent"]}
            />
            <Area
              type="monotone" dataKey="amount"
              stroke="#22c55e" strokeWidth={2.5}
              fill="url(#g1)" dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#22c55e" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── SPENDING BREAKDOWN ── */}
      {pieData.length > 0 && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-2xl p-4"
          style={{ background: "var(--bg-card)", border: "1.5px solid var(--bg-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
              Spending by Category
            </p>
            <Link href="/analytics"
              className="text-xs font-bold flex items-center gap-0.5"
              style={{ color: "#22c55e" }}>
              See all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <PieChart width={120} height={120}>
                <Pie data={pieData} cx={58} cy={58} innerRadius={36} outerRadius={55}
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs font-black" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(totalSpent, currency)}
                  </p>
                  <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>total</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {pieData.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs flex-1 truncate font-semibold"
                    style={{ color: "var(--text-secondary)" }}>
                    {item.name}
                  </span>
                  <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>
                    {Math.round((item.value / totalSpent) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── RECENT EXPENSES ── */}
      {expenses.length > 0 ? (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
              Recent Expenses
            </p>
            <Link href="/expenses"
              className="text-xs font-bold flex items-center gap-0.5"
              style={{ color: "#22c55e" }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1.5px solid var(--bg-border)" }}>
            {expenses.slice(0, 5).map((exp, i) => {
              const cat = categories.find(c => c.id === exp.category_id) || DEFAULT_CATEGORIES[8];
              return (
                <div
                  key={exp.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{
                    borderBottom: i < 4 ? "1px solid var(--bg-border)" : "none",
                  }}
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${cat.color}20`, minWidth: 40 }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {exp.description}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{cat.name}</p>
                  </div>
                  <p className="text-sm font-black flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(exp.amount, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-2xl p-8 flex flex-col items-center text-center"
          style={{ background: "var(--bg-card)", border: "1.5px dashed var(--bg-border)" }}>
          <div className="text-4xl mb-3">💳</div>
          <p className="font-black" style={{ color: "var(--text-primary)" }}>No expenses yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Tap the <strong style={{ color: "#22c55e" }}>+</strong> button to log your first expense
          </p>
        </motion.div>
      )}

    </div>
  );
}
