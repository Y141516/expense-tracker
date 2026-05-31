"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/store/app-context";
import {
  getProfile, getCategoryTotals, getMonthlyTrends,
  getDailyTotals, getExpensesByMonth,
} from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel, getPreviousMonth } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/types";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subDays, eachDayOfInterval, subMonths } from "date-fns";

type Tab = "overview" | "trends" | "categories" | "heatmap";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "categories", label: "Categories" },
  { id: "heatmap", label: "Heatmap" },
];

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub: string; color?: string;
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="t-micro" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <p className="t-h4" style={{ color: color || "var(--accent)", marginBottom: 2 }}>{value}</p>
      <p className="t-caption" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { expenses, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(getCurrentMonth());

  const monthExpenses = useMemo(() => getExpensesByMonth(month), [expenses, month]);
  const total = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const catTotals = useMemo(() => getCategoryTotals(month), [expenses, month]);
  const trends = useMemo(() => getMonthlyTrends(6), [expenses]);
  const prevMonth = getPreviousMonth(month);
  const prevCatTotals = useMemo(() => getCategoryTotals(prevMonth), [expenses, prevMonth]);
  const prevTotal = Object.values(prevCatTotals).reduce((s, v) => s + v, 0);
  const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  const pieData = useMemo(() =>
    Object.entries(catTotals)
      .map(([id, amt]) => {
        const cat = categories.find(c => c.id === id) || DEFAULT_CATEGORIES[8];
        return { name: cat.name, value: amt, color: cat.color, icon: cat.icon, id };
      })
      .sort((a, b) => b.value - a.value),
    [catTotals, categories]
  );

  const weeklyData = useMemo(() => {
    return [0, 1, 2, 3].reverse().map(i => {
      const start = subDays(new Date(), (i + 1) * 7 - 1);
      const end = subDays(new Date(), i * 7);
      const amt = expenses
        .filter(e => e.date >= format(start, "yyyy-MM-dd") && e.date <= format(end, "yyyy-MM-dd"))
        .reduce((s, e) => s + e.amount, 0);
      return { week: `W${4 - i}`, amount: amt };
    });
  }, [expenses]);

  const heatData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 34), end: new Date() });
    return days.map(d => {
      const key = format(d, "yyyy-MM-dd");
      return {
        date: key, day: format(d, "d"), wd: d.getDay(),
        amount: expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [expenses]);
  const maxDay = Math.max(...heatData.map(d => d.amount), 1);

  const tipFmt = (v: unknown) => [formatCurrency(Number(v), currency), "Spent"] as [string, string];
  const tipStyle = {
    contentStyle: {
      background: "var(--bg-elevated)", border: "1px solid var(--bg-border)",
      borderRadius: 12, fontSize: 12, fontWeight: 700, color: "var(--text-primary)",
    },
    cursor: false,
  };

  return (
    <div className="page-content">

      {/* ── HEADER ── */}
      <div className="page-header" style={{ borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>Analytics</h1>
            <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              {getMonthLabel(month)}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMonth(format(subMonths(new Date(month + "-01"), 1), "yyyy-MM"))}
              className="btn btn-ghost btn-sm" style={{ width: 32, padding: 0, borderRadius: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => {
              const next = format(subMonths(new Date(month + "-01"), -1), "yyyy-MM");
              if (next <= getCurrentMonth()) setMonth(next);
            }} className="btn btn-ghost btn-sm"
              style={{ width: 32, padding: 0, borderRadius: 10 }}
              disabled={month >= getCurrentMonth()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4,
          background: "var(--bg-elevated)",
          padding: 4, borderRadius: 16,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, height: 34, borderRadius: 12,
                fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? "var(--bg-surface)" : "transparent",
                color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
                border: "none", cursor: "pointer",
                boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard icon="💸" label="Total Spent"
                value={formatCurrency(total, currency)}
                sub={`${monthExpenses.length} transactions`} color="var(--accent)" />
              <StatCard icon="📅" label="Daily Avg"
                value={formatCurrency(total / Math.max(new Date().getDate(), 1), currency)}
                sub="per day this month" color="#06b6d4" />
              <StatCard icon={pieData[0]?.icon || "📊"} label="Top Category"
                value={pieData[0]?.name || "—"}
                sub={pieData[0] ? formatCurrency(pieData[0].value, currency) : "No data"} color="#8b5cf6" />
              <StatCard icon={change > 0 ? "📈" : "📉"} label="vs Last Month"
                value={prevTotal > 0 ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : "—"}
                sub={prevTotal > 0 ? (change > 0 ? "Spending up" : "Spending down") : "No data"}
                color={change > 0 ? "#f87171" : "#4ade80"} />
            </div>

            {/* Donut */}
            {pieData.length > 0 ? (
              <div className="card" style={{ padding: 20 }}>
                <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 16 }}>Category Breakdown</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <PieChart width={130} height={130}>
                      <Pie data={pieData} cx={62} cy={62} innerRadius={38} outerRadius={60}
                        paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <p className="t-micro" style={{ color: "var(--text-muted)" }}>Total</p>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)" }}>
                        {formatCurrency(total, currency)}
                      </p>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {pieData.slice(0, 5).map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 4, background: item.color, flexShrink: 0 }} />
                        <span className="t-caption" style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        <span className="t-caption" style={{ fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                          {Math.round((item.value / total) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <p className="t-label" style={{ color: "var(--text-primary)" }}>No data yet</p>
                <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 4 }}>Add expenses to see breakdown</p>
              </div>
            )}

            {/* 6-month area */}
            <div className="card" style={{ padding: 20 }}>
              <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 4 }}>6-Month Trend</p>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 14 }}>Monthly spending overview</p>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={trends} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <Tooltip {...tipStyle} formatter={tipFmt} />
                  <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2.5} fill="url(#ag)"
                    dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TRENDS ══ */}
        {tab === "trends" && (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Monthly Spending</p>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 14 }}>Last 6 months</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trends} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v, currency)} width={60} />
                  <Tooltip {...tipStyle} formatter={tipFmt} />
                  <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Weekly Spending</p>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 14 }}>Last 4 weeks</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v, currency)} width={60} />
                  <Tooltip {...tipStyle} formatter={tipFmt} />
                  <Line type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2.5}
                    dot={{ fill: "#06b6d4", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ CATEGORIES ══ */}
        {tab === "categories" && (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pieData.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <p className="t-label" style={{ color: "var(--text-primary)" }}>No categories yet</p>
                <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 4 }}>Add expenses to see breakdown</p>
              </div>
            ) : (
              pieData.map((item, i) => {
                const pct = (item.value / total) * 100;
                const prev = prevCatTotals[item.id] || 0;
                const diff = prev > 0 ? ((item.value - prev) / prev) * 100 : null;
                return (
                  <div key={item.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 44, height: 44, minWidth: 44, borderRadius: 14,
                        background: `${item.color}1a`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="t-label" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                        <p className="t-caption" style={{ color: "var(--text-muted)" }}>
                          {monthExpenses.filter(e => e.category_id === item.id).length} transactions
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p className="t-label" style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(item.value, currency)}
                        </p>
                        {diff !== null && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 2 }}>
                            {diff > 0 ? <TrendingUp size={10} color="#f87171" /> : diff < 0 ? <TrendingDown size={10} color="#4ade80" /> : <Minus size={10} color="var(--text-muted)" />}
                            <span className="t-micro" style={{ color: diff > 0 ? "#f87171" : diff < 0 ? "#4ade80" : "var(--text-muted)" }}>
                              {diff > 0 ? "+" : ""}{diff.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                    <p className="t-micro" style={{ color: "var(--text-muted)", marginTop: 6 }}>
                      {pct.toFixed(1)}% of total spending
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ HEATMAP ══ */}
        {tab === "heatmap" && (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Activity Heatmap</p>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 16 }}>Last 35 days — darker = more spent</p>

              {/* Day labels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="t-micro" style={{ textAlign: "center", color: "var(--text-muted)" }}>{d}</div>
                ))}
              </div>

              {/* Grid — offset by first day of week */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: heatData[0]?.wd ?? 0 }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {heatData.map(({ date, day, amount }) => {
                  const intens = amount / maxDay;
                  return (
                    <div key={date} title={`${date}: ${formatCurrency(amount, currency)}`}
                      style={{
                        aspectRatio: "1", borderRadius: 6,
                        background: amount === 0 ? "var(--bg-elevated)" : `rgba(34,197,94,${0.1 + intens * 0.9})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <span style={{ fontSize: 8, color: amount > 0 ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 12 }}>
                <span className="t-micro" style={{ color: "var(--text-muted)" }}>Less</span>
                {[0.1, 0.3, 0.5, 0.75, 1].map(v => (
                  <div key={v} style={{ width: 14, height: 14, borderRadius: 4, background: `rgba(34,197,94,${v})` }} />
                ))}
                <span className="t-micro" style={{ color: "var(--text-muted)" }}>More</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
