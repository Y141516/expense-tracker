"use client";
import { BottomNav } from "./BottomNav";
import { AddExpenseFAB } from "@/components/expenses/AddExpenseFAB";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useBudgetNotifications } from "@/hooks/useBudgetNotifications";

export function AppShell({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  useBudgetNotifications();

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <AddExpenseFAB />
      <BottomNav />
    </div>
  );
}
