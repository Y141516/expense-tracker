"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getCategoryTotals, getMonthlyTrends, getDailyTotals, getExpensesByMonth } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel, getPreviousMonth } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/types";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subDays, eachDayOfInterval, subMonths } from "date-fns";

type Tab = "overview" | "trends" | "categories" | "heatmap";

export default function AnalyticsPage() {
  const { expenses, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const monthExpenses = useMemo(() => getExpensesByMonth(selectedMonth), [expenses, selectedMonth]);
  const totalSpent = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const categoryTotals = useMemo(() => getCategoryTotals(selectedMonth), [expenses, selectedMonth]);
  const monthlyTrends = useMemo(() => getMonthlyTrends(6), [expenses]);

  // Pie chart data
  const pieData = useMemo(() =>
    Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId) || DEFAULT_CATEGORIES.find(c => c.id === catId) || DEFAULT_CATEGORIES[8];
        return { name: cat.name, value: amount, color: cat.color, icon: cat.icon, id: catId };
      })
      .sort((a, b) => b.value - a.value),
    [categoryTotals, categories]);

  // Daily data for heatmap (last 35 days)
  const dailyTotals = useMemo(() => getDailyTotals(selectedMonth), [expenses, selectedMonth]);
  const heatmapData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 34), end: new Date() });
    return days.map(d => {
      const key = format(d, "yyyy-MM-dd");
      return { date: key, day: format(d, "d"), weekday: format(d, "EEE"), amount: expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0) };
    });
  }, [expenses]);

  const maxDaily = Math.max(...heatmapData.map(d => d.amount), 1);

  // Week-over-week trend
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const start = subDays(new Date(), (i + 1) * 7 - 1);
      const end = subDays(new Date(), i * 7);
      const total = expenses.filter(e => e.date >= format(start, "yyyy-MM-dd") && e.date <= format(end, "yyyy-MM-dd")).reduce((s, e) => s + e.amount, 0);
      weeks.push({ week: `W${4 - i}`, amount: total, label: `${format(start, "MMM d")} – ${format(end, "d")}` });
    }
    return weeks;
  }, [expenses]);

  // Compare last 2 months by category
  const prevMonth = getPreviousMonth(selectedMonth);
  const prevCategoryTotals = useMemo(() => getCategoryTotals(prevMonth), [expenses, prevMonth]);
  const comparisonData = useMemo(() =>
    DEFAULT_CATEGORIES.filter(c => c.id !== "others").map(cat => ({
      name: cat.name.split(" ")[0],
      icon: cat.icon,
      current: categoryTotals[cat.id] || 0,
      previous: prevCategoryTotals[cat.id] || 0,
      color: cat.color,
    })).filter(d => d.current > 0 || d.previous > 0).slice(0, 6),
    [categoryTotals, prevCategoryTotals]);

  // Stats
  const avgDaily = totalSpent / (new Date().getDate());
  const mostExpensiveDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
  const topCat = pieData[0];
  const prevTotal = Object.values(prevCategoryTotals).reduce((s, v) => s + v, 0);
  const change = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "trends", label: "Trends" },
    { id: "categories", label: "Categories" },
    { id: "heatmap", label: "Heatmap" },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color: string }[] }) => {
    if (active && payload?.length) {
      return (
        <div className="card p-2 text-xs shadow-lg">
          <p className="font-semibold text-[var(--text-primary)]">{formatCurrency(payload[0].value, currency)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)]">{getMonthLabel(selectedMonth)}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: "var(--bg-elevated)" }}
        >
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative"
              style={{
                color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
                background: tab === t.id ? "var(--bg-card)" : "transparent",
                boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="tab-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--bg-card)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24 space-y-4">

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Spent", value: formatCurrency(totalSpent, currency), sub: `${monthExpenses.length} transactions`, icon: "💸", color: "#22c55e" },
                { label: "Daily Average", value: formatCurrency(avgDaily, currency), sub: "per day this month", icon: "📅", color: "#06b6d4" },
                { label: "Top Category", value: topCat?.name || "—", sub: topCat ? formatCurrency(topCat.value, currency) : "No data", icon: topCat?.icon || "📊", color: "#8b5cf6" },
                {
                  label: "vs Last Month",
                  value: prevTotal > 0 ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : "—",
                  sub: prevTotal > 0 ? (change > 0 ? "Spending up" : "Spending down") : "No prior data",
                  icon: change > 0 ? "📈" : "📉",
                  color: change > 0 ? "#ef4444" : "#22c55e"
                },
              ].map(({ label, value, sub, icon, color }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
                  </div>
                  <p className="text-base font-bold" style={{ color }}>{value}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Donut chart */}
            {pieData.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Spending Breakdown</h3>
                <div className="flex items-center gap-4">
                  <div className="shrink-0 relative">
                    <PieChart width={140} height={140}>
                      <Pie data={pieData} cx={65} cy={65} innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs font-bold text-[var(--text-primary)]">{formatCurrency(totalSpent, currency)}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieData.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{item.name}</span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{Math.round((item.value / totalSpent) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly trend mini */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">6-Month Trend</h3>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* TRENDS TAB */}
        {tab === "trends" && (
          <>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Monthly Spending</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Last 6 months</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyTrends} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Weekly Spending</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Last 4 weeks</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {weeklyData.map(w => (
                  <div key={w.week} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{w.label}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(w.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Month comparison */}
            {comparisonData.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Month Comparison</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">Current vs last month by category</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={comparisonData} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="current" name="This month" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" name="Last month" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* CATEGORIES TAB */}
        {tab === "categories" && (
          <>
            {pieData.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="font-bold text-[var(--text-primary)]">No data this month</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Add some expenses to see category analysis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pieData.map((item, i) => {
                  const prev = prevCategoryTotals[item.id] || 0;
                  const catChange = prev > 0 ? ((item.value - prev) / prev) * 100 : 0;
                  const pct = (item.value / totalSpent) * 100;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${item.color}20` }}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{monthExpenses.filter(e => e.category_id === item.id).length} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[var(--text-primary)]">{formatCurrency(item.value, currency)}</p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            {prev > 0 ? (
                              catChange > 0
                                ? <TrendingUp size={10} className="text-red-400" />
                                : catChange < 0
                                ? <TrendingDown size={10} className="text-green-400" />
                                : <Minus size={10} className="text-[var(--text-muted)]" />
                            ) : null}
                            <span className={`text-[10px] font-semibold ${catChange > 0 ? "text-red-400" : catChange < 0 ? "text-green-400" : "text-[var(--text-muted)]"}`}>
                              {prev > 0 ? `${catChange > 0 ? "+" : ""}${catChange.toFixed(0)}%` : "New"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          style={{ background: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1.5">{pct.toFixed(1)}% of total spending</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* HEATMAP TAB */}
        {tab === "heatmap" && (
          <>
            <div className="card p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Spending Heatmap</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Last 35 days — darker = more spent</p>
              <div className="grid grid-cols-7 gap-1.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <p key={d} className="text-[10px] text-[var(--text-muted)] text-center font-medium">{d}</p>
                ))}
                {/* Offset first day */}
                {Array.from({ length: new Date(heatmapData[0]?.date || "").getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {heatmapData.map(({ date, day, amount }) => {
                  const intensity = amount / maxDaily;
                  return (
                    <div
                      key={date}
                      title={`${date}: ${formatCurrency(amount, currency)}`}
                      className="aspect-square rounded-md flex items-center justify-center relative group"
                      style={{
                        background: amount === 0 ? "var(--bg-elevated)" : `rgba(34, 197, 94, ${0.15 + intensity * 0.85})`,
                        border: amount === 0 ? "none" : "1px solid rgba(34,197,94,0.2)"
                      }}
                    >
                      <span className="text-[9px] font-medium text-[var(--text-muted)]">{day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-4 justify-end">
                <span className="text-[10px] text-[var(--text-muted)]">Less</span>
                {[0.1, 0.3, 0.5, 0.75, 1].map(v => (
                  <div key={v} className="w-4 h-4 rounded" style={{ background: `rgba(34,197,94,${v})` }} />
                ))}
                <span className="text-[10px] text-[var(--text-muted)]">More</span>
              </div>
            </div>

            {/* Insights from heatmap */}
            {mostExpensiveDay && mostExpensiveDay[1] > 0 && (
              <div className="card p-4 border-amber-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Highest spending day</p>
                    <p className="text-xs text-[var(--text-muted)]">{mostExpensiveDay[0]} — {formatCurrency(mostExpensiveDay[1], currency)}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
