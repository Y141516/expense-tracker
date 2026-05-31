"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/dashboard", label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor"/>
        <path d="M9 21V12h6v9" stroke="currentColor"/>
      </svg>
    ),
    iconActive: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L3 9.5V20a1 1 0 001 1h5v-9h6v9h5a1 1 0 001-1V9.5L12 3z"/>
      </svg>
    ),
  },
  {
    href: "/expenses", label: "Expenses",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="13" rx="2" stroke="currentColor"/>
        <path d="M2 10h20" stroke="currentColor"/>
        <path d="M6 15h4M14 15h4" stroke="currentColor"/>
      </svg>
    ),
    iconActive: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="6" width="20" height="13" rx="2"/>
        <rect x="2" y="6" width="20" height="5" rx="2" fill="rgba(0,0,0,0.3)"/>
      </svg>
    ),
  },
  {
    href: "/analytics", label: "Analytics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
        <path d="M6 20V14M10 20V10M14 20V6M18 20V12" stroke="currentColor"/>
      </svg>
    ),
    iconActive: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="4.5" y="14" width="3" height="6" rx="1"/>
        <rect x="8.5" y="10" width="3" height="10" rx="1"/>
        <rect x="12.5" y="6" width="3" height="14" rx="1"/>
        <rect x="16.5" y="12" width="3" height="8" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/budgets", label: "Budgets",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" stroke="currentColor"/>
        <path d="M12 7v5l3 3" stroke="currentColor"/>
      </svg>
    ),
    iconActive: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 15.5h-1v-6l-3 1.72-.5-.87 3.5-2.35h1v7.5z"/>
      </svg>
    ),
  },
  {
    href: "/settings", label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="2.5" stroke="currentColor"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor"/>
      </svg>
    ),
    iconActive: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.01 7.01 0 00-1.62-.94l-.36-2.54A.484.484 0 0014 3h-4c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.65 9.27a.47.47 0 00.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94L2.77 14.92a.47.47 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h4c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 00-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--bg-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -1px 0 var(--bg-border), 0 -8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 64,
        }}
      >
        {NAV.map(({ href, label, icon, iconActive }) => {
          const active = pathname === href || (pathname.startsWith(href + "/") && href !== "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? "var(--accent)" : "var(--text-muted)",
                position: "relative",
                transition: "color 0.15s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* Active indicator line at top */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 3,
                    borderRadius: "0 0 3px 3px",
                    background: "var(--accent)",
                  }}
                />
              )}

              {/* Background pill */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    width: 48,
                    height: 36,
                    borderRadius: 12,
                    background: "rgba(34,197,94,0.1)",
                  }}
                />
              )}

              <span style={{ position: "relative", zIndex: 1 }}>
                {active ? iconActive : icon}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.02em",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
