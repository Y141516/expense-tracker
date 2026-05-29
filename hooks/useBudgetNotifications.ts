"use client";
import { useEffect, useRef } from "react";
import { useApp } from "@/store/app-context";
import { getCategoryTotals } from "@/lib/storage";
import { sendLocalNotification, getCurrentMonth } from "@/lib/utils";

export function useBudgetNotifications() {
  const { expenses, budgets, categories, profile } = useApp();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.notification_budget_alerts) return;
    if (typeof window === "undefined" || Notification.permission !== "granted") return;

    const currentMonth = getCurrentMonth();
    const monthBudgets = budgets.filter(b => b.month === currentMonth);
    if (!monthBudgets.length) return;

    const categoryTotals = getCategoryTotals(currentMonth);

    monthBudgets.forEach(budget => {
      const spent = categoryTotals[budget.category_id] || 0;
      const pct = (spent / budget.amount) * 100;
      const cat = categories.find(c => c.id === budget.category_id);
      const catName = cat?.name || budget.category_id;

      const key80 = `${budget.category_id}-80-${currentMonth}`;
      const key100 = `${budget.category_id}-100-${currentMonth}`;

      if (pct >= 100 && !notifiedRef.current.has(key100)) {
        notifiedRef.current.add(key100);
        sendLocalNotification(
          `⚠️ ${catName} Budget Exceeded!`,
          `You've spent more than your ${catName} budget this month.`
        );
      } else if (pct >= 80 && pct < 100 && !notifiedRef.current.has(key80)) {
        notifiedRef.current.add(key80);
        sendLocalNotification(
          `🔔 ${catName} Budget Alert`,
          `You've used ${Math.round(pct)}% of your ${catName} budget.`
        );
      }
    });
  }, [expenses, budgets, categories, profile]);
}
