"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Receipt, BarChart3, Wallet, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/budgets", icon: Wallet, label: "Budgets" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 card rounded-none border-b-0 border-x-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl relative touch-feedback min-w-[60px]">
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-green-500/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={isActive ? "text-green-500 relative z-10" : "text-[var(--text-muted)] relative z-10"}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className={`text-[10px] font-medium relative z-10 ${isActive ? "text-green-500" : "text-[var(--text-muted)]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
