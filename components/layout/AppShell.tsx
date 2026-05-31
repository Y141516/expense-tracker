"use client";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useBudgetNotifications } from "@/hooks/useBudgetNotifications";
import { AddExpenseFAB } from "@/components/expenses/AddExpenseFAB";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  useBudgetNotifications();

  return (
    // Outer wrapper — no transforms, no overflow hidden, just position relative
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      {/* Scrollable content area — padded at bottom for nav */}
      <div
        style={{
          paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)",
        }}
      >
        {children}
      </div>

      {/* FAB — fixed, rendered outside flex so fixed positioning works correctly */}
      <AddExpenseFAB />

      {/* Bottom nav — fixed, rendered last so it's on top */}
      <BottomNav />
    </div>
  );
}
