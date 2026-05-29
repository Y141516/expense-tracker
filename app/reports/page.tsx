"use client";
import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, getExpensesByMonth, getCategoryTotals, getMonthlyTrends } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, getMonthLabel, getPreviousMonth } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/types";
import { Download, FileText, Table, ChevronLeft, ChevronRight, Share2, CheckCircle } from "lucide-react";
import { format, subMonths } from "date-fns";

export default function ReportsPage() {
  const { expenses, budgets, categories } = useApp();
  const profile = getProfile();
  const currency = profile?.currency || "INR";

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [generating, setGenerating] = useState<"pdf" | "excel" | null>(null);
  const [done, setDone] = useState<"pdf" | "excel" | null>(null);

  const monthExpenses = useMemo(() => getExpensesByMonth(selectedMonth), [expenses, selectedMonth]);
  const categoryTotals = useMemo(() => getCategoryTotals(selectedMonth), [expenses, selectedMonth]);
  const monthBudgets = useMemo(() => budgets.filter(b => b.month === selectedMonth), [budgets, selectedMonth]);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const trends = useMemo(() => getMonthlyTrends(6), [expenses]);

  const prevMonth = () => setSelectedMonth(format(subMonths(new Date(selectedMonth + "-01"), 1), "yyyy-MM"));
  const nextMonth = () => {
    const next = format(new Date(new Date(selectedMonth + "-01").setMonth(new Date(selectedMonth + "-01").getMonth() + 1)), "yyyy-MM");
    if (next <= getCurrentMonth()) setSelectedMonth(next);
  };

  const canGoNext = selectedMonth < getCurrentMonth();
  const monthLabel = getMonthLabel(selectedMonth);

  // Category breakdown rows
  const categoryRows = useMemo(() =>
    Object.entries(categoryTotals).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId) || DEFAULT_CATEGORIES.find(c => c.id === catId) || DEFAULT_CATEGORIES[8];
      const budget = monthBudgets.find(b => b.category_id === catId);
      const pct = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : "0";
      return { name: cat.name, icon: cat.icon, amount, budget: budget?.amount || 0, pct };
    }).sort((a, b) => b.amount - a.amount),
    [categoryTotals, categories, monthBudgets, totalSpent]);

  const flashDone = (type: "pdf" | "excel") => {
    setGenerating(null);
    setDone(type);
    setTimeout(() => setDone(null), 2500);
  };

  // ── PDF export ──────────────────────────────────────────────────────────────
  const handlePDF = async () => {
    setGenerating("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, margin = 15;
      let y = margin;

      // Header
      doc.setFillColor(15, 45, 31);
      doc.rect(0, 0, W, 38, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Expense Report", margin, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(monthLabel, margin, 27);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, margin, 34);
      y = 50;

      // Summary box
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3);
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", margin + 4, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Total Spent:  ${formatCurrency(totalSpent, currency)}`, margin + 4, y + 15);
      doc.text(`Total Budget: ${totalBudget > 0 ? formatCurrency(totalBudget, currency) : "Not set"}`, margin + 4, y + 21);
      doc.text(`Transactions: ${monthExpenses.length}`, margin + 4, y + 27);
      if (totalBudget > 0) {
        doc.text(`Budget Used: ${((totalSpent / totalBudget) * 100).toFixed(1)}%`, W / 2, y + 15);
        doc.text(`Remaining:   ${formatCurrency(Math.max(totalBudget - totalSpent, 0), currency)}`, W / 2, y + 21);
      }
      y += 42;

      // Category table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text("Category Breakdown", margin, y);
      y += 6;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, W - margin * 2, 7, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("Category", margin + 2, y + 5);
      doc.text("Amount", 120, y + 5);
      doc.text("% of Total", 150, y + 5);
      doc.text("Budget", 175, y + 5);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      categoryRows.forEach((row, i) => {
        if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 1, W - margin * 2, 7, "F"); }
        doc.setFontSize(8);
        doc.text(`${row.icon} ${row.name}`, margin + 2, y + 4);
        doc.text(formatCurrency(row.amount, currency), 120, y + 4);
        doc.text(`${row.pct}%`, 155, y + 4);
        doc.text(row.budget > 0 ? formatCurrency(row.budget, currency) : "—", 175, y + 4);
        y += 7;
        if (y > 260) { doc.addPage(); y = margin; }
      });
      y += 6;

      // Transactions table
      if (monthExpenses.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Transactions", margin, y);
        y += 6;

        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, W - margin * 2, 7, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text("Date", margin + 2, y + 5);
        doc.text("Description", 40, y + 5);
        doc.text("Category", 110, y + 5);
        doc.text("Amount", 165, y + 5);
        y += 9;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        monthExpenses.slice(0, 50).forEach((exp, i) => {
          if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 1, W - margin * 2, 7, "F"); }
          const cat = categories.find(c => c.id === exp.category_id) || DEFAULT_CATEGORIES[8];
          doc.text(exp.date, margin + 2, y + 4);
          doc.text(exp.description.slice(0, 30), 40, y + 4);
          doc.text(cat.name.slice(0, 18), 110, y + 4);
          doc.text(formatCurrency(exp.amount, currency), 165, y + 4);
          y += 7;
          if (y > 270) { doc.addPage(); y = margin; }
        });
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Generated by Expense Tracker App", margin, 292);
        doc.text(`Page ${i} of ${pages}`, W - margin - 16, 292);
      }

      doc.save(`expense-report-${selectedMonth}.pdf`);
      flashDone("pdf");
    } catch (err) {
      console.error(err);
      setGenerating(null);
    }
  };

  // ── Excel export ────────────────────────────────────────────────────────────
  const handleExcel = async () => {
    setGenerating("excel");
    try {
      const XLSX = await import("xlsx");

      // Sheet 1 – Transactions
      const txData = monthExpenses.map(exp => {
        const cat = categories.find(c => c.id === exp.category_id) || DEFAULT_CATEGORIES[8];
        return {
          Date: exp.date,
          Description: exp.description,
          Category: cat.name,
          Amount: exp.amount,
          "Payment Method": exp.payment_method || "",
          Note: exp.note || "",
        };
      });
      const txSheet = XLSX.utils.json_to_sheet(txData);
      txSheet["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 25 }];

      // Sheet 2 – Category Summary
      const catData = categoryRows.map(r => ({
        Category: r.name,
        "Amount Spent": r.amount,
        "% of Total": parseFloat(r.pct),
        "Budget": r.budget || "",
        "Remaining": r.budget > 0 ? r.budget - r.amount : "",
      }));
      const catSheet = XLSX.utils.json_to_sheet(catData);
      catSheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

      // Sheet 3 – Monthly Trends
      const trendSheet = XLSX.utils.json_to_sheet(trends.map(t => ({ Month: t.month, "Total Spent": t.amount })));

      // Sheet 4 – Summary
      const summaryData = [
        { Metric: "Report Month", Value: monthLabel },
        { Metric: "Total Spent", Value: formatCurrency(totalSpent, currency) },
        { Metric: "Total Budget", Value: totalBudget > 0 ? formatCurrency(totalBudget, currency) : "Not set" },
        { Metric: "Budget Used %", Value: totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : "—" },
        { Metric: "Transactions", Value: monthExpenses.length },
        { Metric: "Generated On", Value: format(new Date(), "dd MMM yyyy, hh:mm a") },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 20 }, { wch: 25 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");
      XLSX.utils.book_append_sheet(wb, catSheet, "By Category");
      XLSX.utils.book_append_sheet(wb, trendSheet, "Monthly Trends");

      XLSX.writeFile(wb, `expense-report-${selectedMonth}.xlsx`);
      flashDone("excel");
    } catch (err) {
      console.error(err);
      setGenerating(null);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div className="px-4 pt-6 pb-24 page-enter" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Download your expense data</p>
      </motion.div>

      {/* Month selector */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5 card p-3">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)]">
          <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
        </button>
        <span className="text-base font-bold text-[var(--text-primary)]">{monthLabel}</span>
        <button onClick={nextMonth} disabled={!canGoNext} className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)] disabled:opacity-40">
          <ChevronRight size={18} className="text-[var(--text-secondary)]" />
        </button>
      </motion.div>

      {/* Report preview card */}
      <motion.div variants={itemVariants} className="card p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center">
            <FileText size={20} className="text-green-500" />
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">{monthLabel} Report</p>
            <p className="text-xs text-[var(--text-muted)]">{monthExpenses.length} transactions</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Total Spent", value: formatCurrency(totalSpent, currency), color: "#22c55e" },
            { label: "Budget", value: totalBudget > 0 ? formatCurrency(totalBudget, currency) : "Not set", color: "#06b6d4" },
            { label: "Transactions", value: String(monthExpenses.length), color: "#8b5cf6" },
            { label: "Categories", value: String(Object.keys(categoryTotals).length), color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[var(--bg-elevated)] rounded-xl p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-semibold">{label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Category mini-breakdown */}
        {categoryRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Top Categories</p>
            {categoryRows.slice(0, 5).map(row => (
              <div key={row.name} className="flex items-center gap-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{row.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{row.pct}%</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{formatCurrency(row.amount, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Export buttons */}
      <motion.div variants={itemVariants} className="space-y-3 mb-5">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Export As</p>

        {/* PDF */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePDF}
          disabled={!!generating || monthExpenses.length === 0}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-[var(--bg-border)] card disabled:opacity-50 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
            {done === "pdf" ? <CheckCircle size={24} className="text-green-500" /> : generating === "pdf" ? (
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : <FileText size={24} className="text-red-400" />}
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[var(--text-primary)]">{done === "pdf" ? "Downloaded!" : "PDF Report"}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Full report with charts · .pdf</p>
          </div>
          <Download size={18} className="text-[var(--text-muted)] shrink-0" />
        </motion.button>

        {/* Excel */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleExcel}
          disabled={!!generating || monthExpenses.length === 0}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-[var(--bg-border)] card disabled:opacity-50 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.12)" }}>
            {done === "excel" ? <CheckCircle size={24} className="text-green-500" /> : generating === "excel" ? (
              <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : <Table size={24} className="text-green-500" />}
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[var(--text-primary)]">{done === "excel" ? "Downloaded!" : "Excel Spreadsheet"}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">All transactions + category data · .xlsx</p>
          </div>
          <Download size={18} className="text-[var(--text-muted)] shrink-0" />
        </motion.button>
      </motion.div>

      {monthExpenses.length === 0 && (
        <motion.div variants={itemVariants} className="card p-6 text-center">
          <div className="text-3xl mb-2">📭</div>
          <p className="font-semibold text-[var(--text-primary)]">No data for {monthLabel}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Add expenses to generate a report</p>
        </motion.div>
      )}

      {/* Previous months */}
      <motion.div variants={itemVariants}>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Quick Access</p>
        <div className="space-y-2">
          {[0, 1, 2].map(i => {
            const m = format(subMonths(new Date(), i), "yyyy-MM");
            const mLabel = format(subMonths(new Date(), i), "MMMM yyyy");
            const cnt = expenses.filter(e => e.date.startsWith(m)).length;
            const total = expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
            return (
              <button key={m} onClick={() => setSelectedMonth(m)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${selectedMonth === m ? "border-green-500 bg-green-500/8" : "border-[var(--bg-border)] card"}`}
              >
                <span className="text-lg">{i === 0 ? "📅" : "🗓️"}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{mLabel}</p>
                  <p className="text-xs text-[var(--text-muted)]">{cnt} transactions</p>
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(total, currency)}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
