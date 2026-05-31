"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, clearAllData } from "@/lib/storage";
import { CURRENCIES, DEFAULT_CATEGORIES } from "@/types";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useToast } from "@/components/ui/Toaster";
import { requestNotificationPermission } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

type Section = "main" | "profile" | "currency" | "theme" | "categories" | "notifications";

const ICONS = ["🍽️","✈️","🛒","🛍️","⚡","🎬","❤️","📚","📦","🏠","🎮","🐾","💄","🍺","☕","🎵","🏋️","🚗","💊","🎓"];
const COLORS = ["#f97316","#3b82f6","#22c55e","#ec4899","#eab308","#8b5cf6","#ef4444","#06b6d4","#6b7280","#14b8a6"];

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="page-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm"
          style={{ width: 36, padding: 0, borderRadius: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h2 className="t-h3" style={{ color: "var(--text-primary)" }}>{title}</h2>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="t-overline" style={{ color: "var(--text-muted)", padding: "0 4px 8px" }}>{title}</p>
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon, label, value, onTap, danger = false,
}: { icon: string; label: string; value?: string; onTap: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onTap}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
        textAlign: "left", borderBottom: "1px solid var(--bg-border)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span className="t-label" style={{ flex: 1, color: danger ? "var(--danger)" : "var(--text-primary)" }}>
        {label}
      </span>
      {value && (
        <span className="t-caption" style={{ color: "var(--text-muted)", flexShrink: 0, marginRight: 4 }}>
          {value}
        </span>
      )}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)} role="switch" aria-checked={value}
      style={{
        width: 48, height: 26, borderRadius: 13,
        background: value ? "var(--accent)" : "var(--bg-elevated)",
        border: `1.5px solid ${value ? "var(--accent)" : "var(--bg-border)"}`,
        cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: value ? 22 : 2, width: 18, height: 18,
        borderRadius: 9, background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s cubic-bezier(0.34,1.5,0.64,1)",
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const { profile, setProfile, categories, addCategory, deleteCategory } = useApp();
  const { theme, setTheme } = useTheme();
  const { success, error, info } = useToast();
  const router = useRouter();

  const [section, setSection] = useState<Section>("main");
  const [name, setName] = useState(profile?.full_name || "");
  const [income, setIncome] = useState(profile?.monthly_income?.toString() || "");
  const [currency, setCurrency] = useState(profile?.currency || "INR");
  const [notifBudget, setNotifBudget] = useState(profile?.notification_budget_alerts ?? true);
  const [notifWeekly, setNotifWeekly] = useState(profile?.notification_weekly_summary ?? true);
  const [notifMonthly, setNotifMonthly] = useState(profile?.notification_monthly_report ?? true);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📦");
  const [catColor, setCatColor] = useState("#6b7280");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setIncome(profile.monthly_income?.toString() || "");
      setCurrency(profile.currency || "INR");
      setNotifBudget(profile.notification_budget_alerts ?? true);
      setNotifWeekly(profile.notification_weekly_summary ?? true);
      setNotifMonthly(profile.notification_monthly_report ?? true);
    }
  }, [profile]);

  const currencyObj = CURRENCIES.find(c => c.code === (profile?.currency || "INR"));
  const customCats = categories.filter(c => c.isCustom);

  return (
    <div className="page-content">
      <AnimatePresence mode="wait">

        {/* ══ MAIN ══ */}
        {section === "main" && (
          <motion.div key="main"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
            <div className="page-header" style={{ borderBottom: "none" }}>
              <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>Settings</h1>
            </div>

            <div style={{ padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Profile card */}
              <button
                onClick={() => setSection("profile")}
                className="card"
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: 16,
                  border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 18,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0,
                }}>
                  {(profile?.full_name?.[0] || "U").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t-label" style={{ color: "var(--text-primary)" }}>
                    {profile?.full_name || "Set your name"}
                  </p>
                  <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>
                    {currencyObj?.symbol} {currencyObj?.name} · {theme} theme
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              <SettingsGroup title="Preferences">
                <SettingsRow icon="💱" label="Currency" value={`${currencyObj?.symbol} ${profile?.currency}`} onTap={() => setSection("currency")} />
                <SettingsRow icon="🎨" label="Theme" value={theme.charAt(0).toUpperCase() + theme.slice(1)} onTap={() => setSection("theme")} />
                <div style={{ borderBottom: "none" }}>
                  <SettingsRow icon="🏷️" label="Categories" value={`${customCats.length} custom`} onTap={() => setSection("categories")} />
                </div>
              </SettingsGroup>

              <SettingsGroup title="Notifications">
                <div style={{ borderBottom: "none" }}>
                  <SettingsRow icon="🔔" label="Alert Preferences" onTap={() => setSection("notifications")} />
                </div>
              </SettingsGroup>

              <SettingsGroup title="About">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px" }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>ℹ️</span>
                  <div>
                    <p className="t-label" style={{ color: "var(--text-primary)" }}>Expense Tracker v1.0</p>
                    <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                      All data is stored locally on your device. No server, no account, no ads.
                    </p>
                  </div>
                </div>
              </SettingsGroup>

              <SettingsGroup title="Danger Zone">
                <div style={{ borderBottom: "none" }}>
                  <SettingsRow icon="🗑️" label="Clear All Data" danger onTap={() => setConfirmClear(true)} />
                </div>
              </SettingsGroup>
            </div>
          </motion.div>
        )}

        {/* ══ PROFILE ══ */}
        {section === "profile" && (
          <motion.div key="profile"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <BackHeader title="Profile" onBack={() => setSection("main")} />
            <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 6 }}>YOUR NAME</p>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Enter your name" className="input-base" />
              </div>
              <div>
                <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 6 }}>MONTHLY INCOME (OPTIONAL)</p>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                  placeholder="0" className="input-base" inputMode="numeric" />
                <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 6 }}>
                  Used to calculate savings percentage in insights
                </p>
              </div>
              <button
                onClick={() => {
                  setProfile({ full_name: name, monthly_income: income ? parseFloat(income) : undefined });
                  success("Profile saved!");
                  setSection("main");
                }}
                className="btn btn-primary btn-xl btn-full"
              >
                Save Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ CURRENCY ══ */}
        {section === "currency" && (
          <motion.div key="currency"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <BackHeader title="Currency" onBack={() => setSection("main")} />
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {CURRENCIES.map(cur => (
                  <button key={cur.code} onClick={() => setCurrency(cur.code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                      borderRadius: 16, cursor: "pointer",
                      background: currency === cur.code ? "var(--accent-dim)" : "var(--bg-surface)",
                      border: `1.5px solid ${currency === cur.code ? "var(--accent)" : "var(--bg-border)"}`,
                    }}>
                    <span style={{ fontSize: 22, fontWeight: 800, width: 36, textAlign: "center",
                      color: currency === cur.code ? "var(--accent)" : "var(--text-muted)" }}>
                      {cur.symbol}
                    </span>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p className="t-label" style={{ color: "var(--text-primary)" }}>{cur.code}</p>
                      <p className="t-caption" style={{ color: "var(--text-muted)" }}>{cur.name}</p>
                    </div>
                    {currency === cur.code && <Check size={18} color="var(--accent)" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setProfile({ currency }); success("Currency updated!"); setSection("main"); }}
                className="btn btn-primary btn-xl btn-full">
                Save Currency
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ THEME ══ */}
        {section === "theme" && (
          <motion.div key="theme"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <BackHeader title="Theme" onBack={() => setSection("main")} />
            <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { v: "light" as const, label: "Light", desc: "Bright & clean", icon: "☀️" },
                { v: "dark" as const, label: "Dark", desc: "Easy on the eyes", icon: "🌙" },
                { v: "system" as const, label: "System", desc: "Follow device setting", icon: "📱" },
              ].map(({ v, label, desc, icon }) => (
                <button key={v}
                  onClick={() => { setTheme(v); success(`${label} mode enabled`); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    borderRadius: 16, cursor: "pointer",
                    background: theme === v ? "var(--accent-dim)" : "var(--bg-surface)",
                    border: `1.5px solid ${theme === v ? "var(--accent)" : "var(--bg-border)"}`,
                  }}>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p className="t-label" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="t-caption" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                  {theme === v && <Check size={18} color="var(--accent)" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ CATEGORIES ══ */}
        {section === "categories" && (
          <motion.div key="categories"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <BackHeader title="Categories" onBack={() => setSection("main")} />
            <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 8 }}>DEFAULT CATEGORIES</p>
                <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                  {DEFAULT_CATEGORIES.map((cat, i) => (
                    <div key={cat.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderBottom: i < DEFAULT_CATEGORIES.length - 1 ? "1px solid var(--bg-border)" : "none",
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: `${cat.color}1a`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {cat.icon}
                      </div>
                      <span className="t-label" style={{ flex: 1, color: "var(--text-primary)" }}>{cat.name}</span>
                      <span className="badge badge-neutral">Default</span>
                    </div>
                  ))}
                </div>
              </div>

              {customCats.length > 0 && (
                <div>
                  <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 8 }}>CUSTOM CATEGORIES</p>
                  <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                    {customCats.map((cat, i) => (
                      <div key={cat.id} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                        borderBottom: i < customCats.length - 1 ? "1px solid var(--bg-border)" : "none",
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${cat.color}1a`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {cat.icon}
                        </div>
                        <span className="t-label" style={{ flex: 1, color: "var(--text-primary)" }}>{cat.name}</span>
                        <button onClick={() => { deleteCategory(cat.id); success("Deleted"); }}
                          style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239,68,68,0.1)",
                            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 8 }}>ADD CUSTOM CATEGORY</p>
                <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                  <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                    placeholder="Category name" className="input-base" />
                  <div>
                    <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 8 }}>ICON</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {ICONS.map(ico => (
                        <button key={ico} onClick={() => setCatIcon(ico)}
                          style={{
                            width: 40, height: 40, borderRadius: 12, fontSize: 20,
                            background: catIcon === ico ? "var(--accent-dim)" : "var(--bg-elevated)",
                            border: `1.5px solid ${catIcon === ico ? "var(--accent)" : "transparent"}`,
                            cursor: "pointer",
                          }}>{ico}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="t-micro" style={{ color: "var(--text-muted)", marginBottom: 8 }}>COLOR</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {COLORS.map(col => (
                        <button key={col} onClick={() => setCatColor(col)}
                          style={{
                            width: 32, height: 32, borderRadius: "50%", background: col,
                            border: catColor === col ? "3px solid var(--text-primary)" : "3px solid transparent",
                            cursor: "pointer",
                          }} />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!catName.trim()) { error("Enter a name"); return; }
                      addCategory({ name: catName.trim(), icon: catIcon, color: catColor, bgColor: `bg-gray-500/20`, isCustom: true });
                      setCatName(""); success("Category added!");
                    }}
                    className="btn btn-primary btn-md btn-full">
                    + Add Category
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ NOTIFICATIONS ══ */}
        {section === "notifications" && (
          <motion.div key="notifications"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <BackHeader title="Notifications" onBack={() => setSection("main")} />
            <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {[
                  { label: "Budget Alerts", desc: "At 80% and 100% of budget", icon: "⚠️", val: notifBudget, set: setNotifBudget },
                  { label: "Weekly Summary", desc: "Every Sunday", icon: "📊", val: notifWeekly, set: setNotifWeekly },
                  { label: "Monthly Report", desc: "First of each month", icon: "📅", val: notifMonthly, set: setNotifMonthly },
                ].map(({ label, desc, icon, val, set }, i, arr) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--bg-border)" : "none",
                  }}>
                    <span style={{ fontSize: 22, width: 28, textAlign: "center" }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <p className="t-label" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>{desc}</p>
                    </div>
                    <Toggle value={val} onChange={set} />
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  if (notifBudget || notifWeekly || notifMonthly) {
                    const ok = await requestNotificationPermission();
                    if (!ok) info("Enable notifications in browser settings");
                  }
                  setProfile({ notification_budget_alerts: notifBudget, notification_weekly_summary: notifWeekly, notification_monthly_report: notifMonthly });
                  success("Saved!"); setSection("main");
                }}
                className="btn btn-primary btn-xl btn-full">
                Save Preferences
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── CLEAR DATA CONFIRM ── */}
      <AnimatePresence>
        {confirmClear && (
          <>
            <motion.div className="sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmClear(false)} style={{ zIndex: 100 }} />
            <motion.div className="sheet" style={{ padding: 28, zIndex: 110 }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}>
              <div className="sheet-handle" />
              <div style={{ paddingTop: 16, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 20, background: "rgba(239,68,68,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>
                  🗑️
                </div>
                <h3 className="t-h3" style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                  Clear All Data?
                </h3>
                <p className="t-body-sm" style={{ color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
                  This permanently deletes all expenses, budgets, and settings. This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmClear(false)} className="btn btn-secondary btn-lg" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      clearAllData();
                      setConfirmClear(false);
                      success("All data cleared");
                      setTimeout(() => router.replace("/"), 600);
                    }}
                    className="btn btn-lg btn-danger" style={{ flex: 1 }}>
                    Delete All
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
