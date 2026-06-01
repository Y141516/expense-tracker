"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import {
  getProfile, getMonthlyTrends, getCategoryTotals,
  getExpensesByMonth, generateInsights,
} from "@/lib/storage";
import { formatCurrency, getGreeting, getCurrentMonth, getMonthLabel, getPreviousMonth, getBudgetStatus } from "@/lib/utils";
import { TrendingUp, TrendingDown, ChevronRight, Bell } from "lucide-react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
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

  const monthExpenses = useMemo(() => getExpensesByMonth(currentMonth), [expenses, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = useMemo(() => getCategoryTotals(currentMonth), [expenses, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevMonth = getPreviousMonth(currentMonth);
  const prevTotal = useMemo(() => getExpensesByMonth(prevMonth).reduce((s, e) => s + e.amount, 0), [expenses, prevMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  const monthBudgets = useMemo(() => budgets.filter(b => b.month === currentMonth), [budgets, currentMonth]);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const budgetStatus = getBudgetStatus(totalSpent, totalBudget);
  const change = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

  const pieData = useMemo(() =>
    Object.entries(categoryTotals)
      .map(([id, amt]) => {
        const cat = categories.find(c => c.id === id) || DEFAULT_CATEGORIES[8];
        return { name: cat.name, value: amt, color: cat.color, icon: cat.icon, id };
      })
      .sort((a, b) => b.value - a.value).slice(0, 5),
    [categoryTotals, categories]
  );

  const last7 = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "yyyy-MM-dd");
      return { day: format(d, "EEE"), amount: expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0) };
    }), [expenses]
  );

  const insights = useMemo(() => generateInsights(currentMonth), [expenses, budgets, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  const todayTotal = expenses.filter(e => e.date === format(new Date(), "yyyy-MM-dd")).reduce((s, e) => s + e.amount, 0);
  const weekTotal = last7.reduce((s, d) => s + d.amount, 0);
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="page-content" style={{ padding: "0 16px" }}>
      <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── HEADER ── */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="t-caption" style={{ color: "var(--text-muted)" }}>{getGreeting()},</p>
            <h1 className="t-h2" style={{ color: "var(--text-primary)", marginTop: 2 }}>{name} 👋</h1>
          </div>
          {insights.length > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", top: -2, right: -2, width: 10, height: 10,
                borderRadius: "50%", background: "#f59e0b",
                border: "2px solid var(--bg-base)", zIndex: 1,
              }} />
              <div style={{
                width: 40, height: 40, borderRadius: 14,
                background: "var(--bg-surface)", border: "1.5px solid var(--bg-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bell size={18} style={{ color: "var(--text-secondary)" }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* ── HERO CARD ── */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
          style={{
            borderRadius: 24, padding: "20px 20px 18px", position: "relative", overflow: "hidden",
            background: "linear-gradient(145deg, #0a1f14 0%, #080f1e 55%, #100820 100%)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.2), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Label + change badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(34,197,94,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {getMonthLabel(currentMonth)}
              </p>
              {prevTotal > 0 && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800,
                  padding: "3px 10px", borderRadius: 99,
                  background: change > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                  color: change > 0 ? "#fca5a5" : "#86efac",
                }}>
                  {change > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
            </div>

            {/* Big amount */}
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.75rem", fontWeight: 800, color: "#fff", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16 }}>
              {formatCurrency(totalSpent, currency)}
            </p>

            {/* Budget bar */}
            {totalBudget > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Monthly budget used</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
                    {formatCurrency(totalSpent, currency)} / {formatCurrency(totalBudget, currency)}
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    style={{
                      height: "100%", borderRadius: 99,
                      background: `linear-gradient(90deg, ${budgetStatus.color}, ${budgetStatus.color}bb)`,
                      boxShadow: `0 0 10px ${budgetStatus.color}50`,
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                  {budgetPct >= 100 ? "🚨 Over budget" : budgetPct >= 90 ? "🔴 Almost at limit" : budgetPct >= 70 ? `🟠 ${(100 - budgetPct).toFixed(0)}% remaining` : `🟢 ${(100 - budgetPct).toFixed(0)}% remaining`}
                </p>
              </div>
            ) : (
              <Link href="/budgets" style={{ textDecoration: "none" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#86efac" }}>+ Set monthly budgets</span>
                </div>
              </Link>
            )}

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Today", value: formatCurrency(todayTotal, currency) },
                { label: "This Week", value: formatCurrency(weekTotal, currency) },
                { label: "Transactions", value: String(monthExpenses.length) },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "8px 10px", textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── SMART INSIGHTS ── */}
        {insights.length > 0 && (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 10 }}>💡 Smart Insights</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.slice(0, 2).map(insight => {
                const isWarn = (insight as { type: string }).type === "warning";
                return (
                  <div key={insight.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 14px",
                    borderRadius: 16,
                    background: "var(--bg-surface)",
                    border: `1.5px solid ${isWarn ? "rgba(249,115,22,0.25)" : "rgba(34,197,94,0.2)"}`,
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{insight.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 3 }}>{insight.title}</p>
                      <p className="t-caption" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{insight.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── 7-DAY CHART ── */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
          style={{ borderRadius: 18, padding: "16px", background: "var(--bg-surface)", border: "1.5px solid var(--bg-border)" }}>
          <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 14 }}>Last 7 Days</p>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={last7} margin={{ top: 5, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="g7" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}
                formatter={(v: unknown) => [formatCurrency(Number(v), currency), "Spent"]}
              />
              <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2.5} fill="url(#g7)"
                dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#22c55e" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── CATEGORY BREAKDOWN ── */}
        {pieData.length > 0 && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
            style={{ borderRadius: 18, padding: "16px", background: "var(--bg-surface)", border: "1.5px solid var(--bg-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="t-label" style={{ color: "var(--text-primary)" }}>Spending by Category</p>
              <Link href="/analytics" style={{ display: "flex", alignItems: "center", gap: 2, textDecoration: "none", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                See all <ChevronRight size={13} />
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <PieChart width={130} height={130}>
                  <Pie data={pieData} cx={62} cy={62} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-primary)", textAlign: "center", lineHeight: 1.2 }}>{formatCurrency(totalSpent, currency)}</p>
                  <p style={{ fontSize: 9, color: "var(--text-muted)" }}>total</p>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {pieData.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    <span className="t-caption" style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", flexShrink: 0 }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p className="t-label" style={{ color: "var(--text-primary)" }}>Recent Expenses</p>
              <Link href="/expenses" style={{ display: "flex", alignItems: "center", gap: 2, textDecoration: "none", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <div style={{ borderRadius: 18, overflow: "hidden", background: "var(--bg-surface)", border: "1.5px solid var(--bg-border)" }}>
              {expenses.slice(0, 5).map((exp, i) => {
                const cat = categories.find(c => c.id === exp.category_id) || DEFAULT_CATEGORIES[8];
                return (
                  <div key={exp.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderBottom: i < 4 ? "1px solid var(--bg-border)" : "none",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 13, fontSize: 18, flexShrink: 0,
                      background: `${cat.color}1a`, display: "flex", alignItems: "center", justifyContent: "center",
                      minWidth: 40,
                    }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="t-label" style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</p>
                      <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 1 }}>{cat.name}</p>
                    </div>
                    <p className="t-label" style={{ color: "var(--text-primary)", flexShrink: 0 }}>{formatCurrency(exp.amount, currency)}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
            style={{ padding: "40px 20px", borderRadius: 18, border: "1.5px dashed var(--bg-border)", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
            <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 4 }}>No expenses yet</p>
            <p className="t-caption" style={{ color: "var(--text-muted)" }}>Tap the <strong style={{ color: "var(--accent)" }}>+</strong> button to log your first expense</p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
