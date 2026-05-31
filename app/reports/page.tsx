"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getExpensesByMonth, getCategoryTotals, getMonthlyTrends } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/types";
import { format, subMonths } from "date-fns";

export default function ReportsPage() {
  const { expenses, budgets, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";

  const [selMonth, setSelMonth] = useState(getCurrentMonth());
  const [gen, setGen] = useState<"pdf" | "excel" | null>(null);
  const [done, setDone] = useState<"pdf" | "excel" | null>(null);

  const monthExp = useMemo(() => getExpensesByMonth(selMonth), [expenses, selMonth]);
  const catTotals = useMemo(() => getCategoryTotals(selMonth), [expenses, selMonth]);
  const monthBudgets = useMemo(() => budgets.filter(b => b.month === selMonth), [budgets, selMonth]);
  const totalSpent = monthExp.reduce((s, e) => s + e.amount, 0);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const trends = useMemo(() => getMonthlyTrends(6), [expenses]);

  const catRows = useMemo(() =>
    Object.entries(catTotals).map(([id, amt]) => {
      const cat = categories.find(c => c.id === id) || DEFAULT_CATEGORIES[8];
      const bud = monthBudgets.find(b => b.category_id === id);
      return { name: cat.name, icon: cat.icon, amount: amt, budget: bud?.amount || 0, pct: totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : "0" };
    }).sort((a, b) => b.amount - a.amount),
    [catTotals, categories, monthBudgets, totalSpent]
  );

  const flash = (t: "pdf" | "excel") => { setGen(null); setDone(t); setTimeout(() => setDone(null), 3000); };

  const makePDF = async () => {
    setGen("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, M = 14;
      let y = M;

      // Header bar
      doc.setFillColor(10, 30, 20);
      doc.rect(0, 0, W, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("Expense Report", M, 14);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(getMonthLabel(selMonth), M, 22);
      doc.text(`Generated ${format(new Date(), "dd MMM yyyy, HH:mm")}`, M, 29);
      y = 44;

      // Summary box
      doc.setDrawColor(34, 197, 94); doc.setLineWidth(0.5);
      doc.roundedRect(M, y, W - M * 2, 28, 3, 3, "D");
      doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", M + 4, y + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.text(`Total Spent:   ${formatCurrency(totalSpent, currency)}`, M + 4, y + 14);
      doc.text(`Budget Set:    ${totalBudget > 0 ? formatCurrency(totalBudget, currency) : "Not set"}`, M + 4, y + 20);
      doc.text(`Transactions:  ${monthExp.length}`, M + 4, y + 26);
      if (totalBudget > 0) {
        doc.text(`Used:  ${((totalSpent / totalBudget) * 100).toFixed(1)}%`, 110, y + 14);
        doc.text(`Left:  ${formatCurrency(Math.max(totalBudget - totalSpent, 0), currency)}`, 110, y + 20);
      }
      y += 36;

      // Category table
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
      doc.text("By Category", M, y); y += 6;
      doc.setFillColor(240, 242, 245); doc.rect(M, y, W - M * 2, 7, "F");
      doc.setFontSize(8); doc.setTextColor(80, 80, 80);
      ["Category", "Amount", "% Total", "Budget"].forEach((h, i) => doc.text(h, M + [2, 80, 110, 145][i], y + 5));
      y += 9;
      doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
      catRows.forEach((r, i) => {
        if (i % 2 === 0) { doc.setFillColor(250, 250, 252); doc.rect(M, y - 1, W - M * 2, 7, "F"); }
        doc.text(`${r.icon} ${r.name}`, M + 2, y + 4);
        doc.text(formatCurrency(r.amount, currency), M + 80, y + 4);
        doc.text(`${r.pct}%`, M + 110, y + 4);
        doc.text(r.budget > 0 ? formatCurrency(r.budget, currency) : "—", M + 145, y + 4);
        y += 7;
        if (y > 265) { doc.addPage(); y = M; }
      });
      y += 4;

      // Transactions
      if (monthExp.length > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Transactions", M, y); y += 6;
        doc.setFillColor(240, 242, 245); doc.rect(M, y, W - M * 2, 7, "F");
        doc.setFontSize(8); doc.setTextColor(80, 80, 80);
        ["Date", "Description", "Category", "Amount"].forEach((h, i) => doc.text(h, M + [2, 32, 110, 165][i], y + 5));
        y += 9;
        doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
        monthExp.slice(0, 60).forEach((e, i) => {
          if (i % 2 === 0) { doc.setFillColor(250, 250, 252); doc.rect(M, y - 1, W - M * 2, 7, "F"); }
          const cat = categories.find(c => c.id === e.category_id) || DEFAULT_CATEGORIES[8];
          doc.text(e.date, M + 2, y + 4);
          doc.text(e.description.slice(0, 32), M + 32, y + 4);
          doc.text(cat.name.slice(0, 18), M + 110, y + 4);
          doc.text(formatCurrency(e.amount, currency), M + 165, y + 4);
          y += 7;
          if (y > 265) { doc.addPage(); y = M; }
        });
      }

      // Footer
      for (let i = 1; i <= doc.getNumberOfPages(); i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(160, 160, 160);
        doc.text("Expense Tracker", M, 292);
        doc.text(`Page ${i} of ${doc.getNumberOfPages()}`, W - M - 14, 292);
      }

      doc.save(`expense-report-${selMonth}.pdf`);
      flash("pdf");
    } catch { setGen(null); }
  };

  const makeExcel = async () => {
    setGen("excel");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const summary = [
        ["Metric", "Value"],
        ["Month", getMonthLabel(selMonth)],
        ["Total Spent", formatCurrency(totalSpent, currency)],
        ["Budget", totalBudget > 0 ? formatCurrency(totalBudget, currency) : "Not set"],
        ["Transactions", monthExp.length],
        ["Generated", format(new Date(), "dd MMM yyyy HH:mm")],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

      const txSheet = XLSX.utils.json_to_sheet(monthExp.map(e => ({
        Date: e.date,
        Description: e.description,
        Category: categories.find(c => c.id === e.category_id)?.name || "Others",
        Amount: e.amount,
        Payment: e.payment_method || "",
        Note: e.note || "",
      })));
      XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");

      const catSheet = XLSX.utils.json_to_sheet(catRows.map(r => ({
        Category: r.name,
        Spent: r.amount,
        "% of Total": parseFloat(r.pct),
        Budget: r.budget || "—",
      })));
      XLSX.utils.book_append_sheet(wb, catSheet, "By Category");

      const trendSheet = XLSX.utils.json_to_sheet(trends.map(t => ({ Month: t.month, Spent: t.amount })));
      XLSX.utils.book_append_sheet(wb, trendSheet, "Trends");

      XLSX.writeFile(wb, `expense-report-${selMonth}.xlsx`);
      flash("excel");
    } catch { setGen(null); }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ borderBottom: "none" }}>
        <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>Reports</h1>
        <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
          Download expense data as PDF or Excel
        </p>
      </div>

      <div style={{ padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 20 }} className="stagger">

        {/* Month selector */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {[0, 1, 2].map(i => {
            const m = format(subMonths(new Date(), i), "yyyy-MM");
            const mLabel = format(subMonths(new Date(), i), "MMMM yyyy");
            const cnt = expenses.filter(e => e.date.startsWith(m)).length;
            const tot = expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
            const active = selMonth === m;
            return (
              <button key={m} onClick={() => setSelMonth(m)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px",
                  background: active ? "var(--accent-dim)" : "none",
                  border: "none", cursor: "pointer", textAlign: "left",
                  borderBottom: i < 2 ? "1px solid var(--bg-border)" : "none",
                  transition: "background 0.15s",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 14, flexShrink: 0,
                  background: active ? "var(--accent)" : "var(--bg-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {i === 0 ? "📅" : "🗓️"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t-label" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>{mLabel}</p>
                  <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>{cnt} transactions</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="t-label" style={{ color: "var(--text-primary)" }}>{formatCurrency(tot, currency)}</p>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(34,197,94,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>📋</div>
            <div>
              <p className="t-label" style={{ color: "var(--text-primary)" }}>{getMonthLabel(selMonth)}</p>
              <p className="t-caption" style={{ color: "var(--text-muted)" }}>{monthExp.length} transactions</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Spent", value: formatCurrency(totalSpent, currency), color: "var(--accent)" },
              { label: "Budget", value: totalBudget > 0 ? formatCurrency(totalBudget, currency) : "—", color: "#06b6d4" },
              { label: "Transactions", value: String(monthExp.length), color: "#8b5cf6" },
              { label: "Categories", value: String(Object.keys(catTotals).length), color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, background: "var(--bg-elevated)" }}>
                <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label.toUpperCase()}</p>
                <p className="t-h4" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {catRows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {catRows.slice(0, 4).map(r => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <span className="t-caption" style={{ flex: 1, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span className="t-caption" style={{ color: "var(--text-muted)", flexShrink: 0 }}>{r.pct}%</span>
                  <span className="t-label" style={{ color: "var(--text-primary)", flexShrink: 0 }}>{formatCurrency(r.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              id: "pdf" as const, label: "PDF Report", sub: "Full report with all transactions",
              icon: "📄", iconColor: "#ef4444", iconBg: "rgba(239,68,68,0.1)",
              action: makePDF,
            },
            {
              id: "excel" as const, label: "Excel Spreadsheet", sub: "4 sheets: summary, transactions, categories, trends",
              icon: "📊", iconColor: "#22c55e", iconBg: "rgba(34,197,94,0.1)",
              action: makeExcel,
            },
          ].map(({ id, label, sub, icon, iconColor, iconBg, action }) => (
            <motion.button key={id} whileTap={{ scale: 0.97 }}
              onClick={action}
              disabled={!!gen || monthExp.length === 0}
              className="card"
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: 16,
                cursor: monthExp.length === 0 ? "not-allowed" : "pointer",
                opacity: monthExp.length === 0 ? 0.5 : 1,
                border: "none", textAlign: "left", width: "100%",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 16, background: iconBg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {done === id ? "✅" : gen === id ? (
                  <div className="anim-spin" style={{ width: 20, height: 20, border: `2px solid ${iconColor}`, borderTopColor: "transparent", borderRadius: "50%" }} />
                ) : icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="t-label" style={{ color: done === id ? "var(--accent)" : "var(--text-primary)" }}>
                  {done === id ? "Downloaded!" : label}
                </p>
                <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>{sub}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </motion.button>
          ))}
        </div>

        {monthExp.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <p className="t-label" style={{ color: "var(--text-muted)" }}>No expenses in {getMonthLabel(selMonth)}</p>
          </div>
        )}

      </div>
    </div>
  );
}
