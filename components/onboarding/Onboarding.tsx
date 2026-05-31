"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { CURRENCIES, DEFAULT_CATEGORIES } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props { onComplete: () => void; }

const STEPS = ["welcome", "currency", "income", "budgets", "notifications", "done"] as const;
type Step = typeof STEPS[number];

const SYM: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ",
};

const PRESETS: Record<string, Record<string, number>> = {
  INR: { food: 4000, grocery: 3000, travel: 2500, shopping: 2500, bills: 2000, entertainment: 1500, health: 1000, education: 1000 },
  USD: { food: 300, grocery: 250, travel: 200, shopping: 150, bills: 120, entertainment: 100, health: 80, education: 60 },
};

export function Onboarding({ onComplete }: Props) {
  const { setProfile, setBudget } = useApp();
  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [income, setIncome] = useState("");
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);

  const stepIdx = STEPS.indexOf(step);
  const pct = (stepIdx / (STEPS.length - 1)) * 100;
  const sym = SYM[currency] || "₹";

  const go = (s: Step) => { setDir(STEPS.indexOf(s) > stepIdx ? 1 : -1); setStep(s); };

  const applyPreset = (mult: number) => {
    const base = PRESETS[currency] || PRESETS.INR;
    const result: Record<string, string> = {};
    DEFAULT_CATEGORIES.filter(c => c.id !== "others").forEach(c => {
      result[c.id] = Math.round((base[c.id] || 500) * mult).toString();
    });
    setBudgets(result);
  };

  const handleComplete = () => {
    setProfile({
      full_name: name || "Friend",
      currency,
      monthly_income: income ? parseFloat(income) : undefined,
      onboarding_complete: true,
      notification_budget_alerts: notifBudget,
      notification_weekly_summary: notifWeekly,
      notification_monthly_report: true,
    });
    const month = new Date().toISOString().slice(0, 7);
    Object.entries(budgets).forEach(([id, amt]) => {
      if (amt && parseFloat(amt) > 0) setBudget(id, parseFloat(amt), month);
    });
    onComplete();
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  const Btn = ({ onClick, children, secondary = false, disabled = false }: {
    onClick: () => void; children: React.ReactNode; secondary?: boolean; disabled?: boolean;
  }) => (
    <motion.button whileTap={{ scale: 0.96 }} onClick={onClick} disabled={disabled}
      style={{
        height: 52, borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer",
        border: secondary ? "1.5px solid var(--bg-border)" : "none",
        background: secondary ? "var(--bg-elevated)" : "linear-gradient(135deg, #22c55e, #16a34a)",
        color: secondary ? "var(--text-secondary)" : "#fff",
        opacity: disabled ? 0.4 : 1,
        padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >{children}</motion.button>
  );

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      {/* Progress */}
      {step !== "welcome" && step !== "done" && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 3, background: "var(--bg-elevated)" }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: "100%", background: "#22c55e", borderRadius: "0 99px 99px 0" }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        {/* ── WELCOME ── */}
        {step === "welcome" && (
          <motion.div key="welcome" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 28px 40px", textAlign: "center" }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, delay: 0.1 }}
              style={{ width: 96, height: 96, borderRadius: 32, background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 28, boxShadow: "0 8px 32px rgba(34,197,94,0.4)" }}>
              💰
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="t-h1 g-text-green" style={{ marginBottom: 12 }}>
              Expense Tracker
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="t-body" style={{ color: "var(--text-secondary)", marginBottom: 36, maxWidth: 300, lineHeight: 1.6 }}>
              Your personal finance assistant. Track every rupee, set budgets, and build better money habits.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {[
                { icon: "⚡", text: "Add an expense in under 5 seconds" },
                { icon: "🎯", text: "Monthly budgets with smart alerts" },
                { icon: "📊", text: "Beautiful charts and spending insights" },
                { icon: "📄", text: "Export PDF/Excel reports anytime" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                  <span style={{ fontSize: 20, width: 32, textAlign: "center" }}>{icon}</span>
                  <span className="t-body-sm" style={{ color: "var(--text-secondary)" }}>{text}</span>
                </div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)" className="input-base" />
              <Btn onClick={() => go("currency")}>Get Started →</Btn>
            </motion.div>
          </motion.div>
        )}

        {/* ── CURRENCY ── */}
        {step === "currency" && (
          <motion.div key="currency" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3 }}
            style={{ flex: 1, padding: "56px 20px 32px", overflowY: "auto" }}
          >
            <p className="t-overline" style={{ color: "var(--accent)", marginBottom: 6 }}>Step 1 of 4</p>
            <h2 className="t-h2" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Your Currency</h2>
            <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Which currency do you primarily use?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {CURRENCIES.map(cur => (
                <button key={cur.code} onClick={() => setCurrency(cur.code)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, cursor: "pointer",
                    background: currency === cur.code ? "var(--accent-dim)" : "var(--bg-surface)",
                    border: `1.5px solid ${currency === cur.code ? "var(--accent)" : "var(--bg-border)"}`,
                  }}>
                  <span style={{ fontSize: 22, fontWeight: 800, width: 36, textAlign: "center",
                    color: currency === cur.code ? "var(--accent)" : "var(--text-muted)" }}>{cur.symbol}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p className="t-label" style={{ color: "var(--text-primary)" }}>{cur.code}</p>
                    <p className="t-caption" style={{ color: "var(--text-muted)" }}>{cur.name}</p>
                  </div>
                  {currency === cur.code && <Check size={18} color="var(--accent)" />}
                </button>
              ))}
            </div>
            <Btn onClick={() => go("income")}>Continue →</Btn>
          </motion.div>
        )}

        {/* ── INCOME ── */}
        {step === "income" && (
          <motion.div key="income" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3 }}
            style={{ flex: 1, padding: "56px 20px 32px" }}
          >
            <p className="t-overline" style={{ color: "var(--accent)", marginBottom: 6 }}>Step 2 of 4</p>
            <h2 className="t-h2" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Monthly Income</h2>
            <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Optional — helps calculate your savings rate. You can skip this.
            </p>
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-muted)" }}>{sym}</span>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                  placeholder="0" inputMode="numeric"
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    fontSize: 28, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
                  }} />
              </div>
              {income && parseFloat(income) > 0 && (
                <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 12 }}>
                  Suggested 20% savings: {formatCurrency(parseFloat(income) * 0.2, currency)}/month
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn secondary onClick={() => go("budgets")}>Skip</Btn>
              <div style={{ flex: 2 }}><Btn onClick={() => go("budgets")}>Continue →</Btn></div>
            </div>
          </motion.div>
        )}

        {/* ── BUDGETS ── */}
        {step === "budgets" && (
          <motion.div key="budgets" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3 }}
            style={{ flex: 1, padding: "56px 20px 32px", overflowY: "auto" }}
          >
            <p className="t-overline" style={{ color: "var(--accent)", marginBottom: 6 }}>Step 3 of 4</p>
            <h2 className="t-h2" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Monthly Budgets</h2>
            <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              Set <strong>per-month</strong> limits. Resets every month automatically.
            </p>

            {/* Quick presets */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ l: "Tight", m: 0.5 }, { l: "Moderate", m: 0.75 }, { l: "Comfortable", m: 1 }].map(({ l, m }) => (
                <button key={l} onClick={() => applyPreset(m)}
                  style={{
                    flex: 1, height: 36, borderRadius: 10, fontWeight: 700, fontSize: 12,
                    background: "var(--bg-elevated)", border: "1.5px solid var(--bg-border)",
                    color: "var(--text-secondary)", cursor: "pointer",
                  }}>{l}</button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {DEFAULT_CATEGORIES.filter(c => c.id !== "others").map(cat => (
                <div key={cat.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${cat.color}1a`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <span className="t-label" style={{ flex: 1, color: "var(--text-primary)" }}>{cat.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span className="t-caption" style={{ color: "var(--text-muted)" }}>{sym}</span>
                    <input type="number" value={budgets[cat.id] || ""} inputMode="numeric"
                      onChange={e => setBudgets(p => ({ ...p, [cat.id]: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: 72, textAlign: "right",
                        background: "var(--bg-elevated)", border: "1.5px solid var(--bg-border)",
                        borderRadius: 8, padding: "6px 8px",
                        fontSize: 14, fontWeight: 700, color: "var(--text-primary)", outline: "none",
                      }} />
                    <span className="t-micro" style={{ color: "var(--accent)" }}>/mo</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn secondary onClick={() => go("notifications")}>Skip</Btn>
              <div style={{ flex: 2 }}><Btn onClick={() => go("notifications")}>Continue →</Btn></div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {step === "notifications" && (
          <motion.div key="notifications" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3 }}
            style={{ flex: 1, padding: "56px 20px 32px" }}
          >
            <p className="t-overline" style={{ color: "var(--accent)", marginBottom: 6 }}>Step 4 of 4</p>
            <h2 className="t-h2" style={{ color: "var(--text-primary)", marginBottom: 4 }}>Stay on Track</h2>
            <p className="t-body-sm" style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Get notified when you're overspending.
            </p>
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
              {[
                { label: "Budget Alerts", desc: "When you reach 80% or 100%", icon: "⚠️", val: notifBudget, set: setNotifBudget },
                { label: "Weekly Summary", desc: "Your spending recap every Sunday", icon: "📊", val: notifWeekly, set: setNotifWeekly },
              ].map(({ label, desc, icon, val, set }, i) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px",
                  borderBottom: i === 0 ? "1px solid var(--bg-border)" : "none",
                }}>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <p className="t-label" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 2 }}>{desc}</p>
                  </div>
                  <button onClick={() => set(!val)} role="switch" aria-checked={val}
                    style={{
                      width: 46, height: 26, borderRadius: 13, position: "relative", flexShrink: 0,
                      background: val ? "var(--accent)" : "var(--bg-elevated)",
                      border: `1.5px solid ${val ? "var(--accent)" : "var(--bg-border)"}`,
                      cursor: "pointer", transition: "background 0.2s",
                    }}>
                    <span style={{
                      position: "absolute", top: 3, left: val ? 21 : 3, width: 16, height: 16,
                      borderRadius: 8, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s cubic-bezier(0.34,1.5,0.64,1)",
                    }} />
                  </button>
                </div>
              ))}
            </div>
            <Btn onClick={() => go("done")}>Continue →</Btn>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <motion.div key="done" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", textAlign: "center" }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280 }}
              style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 24,
                boxShadow: "0 8px 32px rgba(34,197,94,0.4)" }}>
              🎉
            </motion.div>
            <h2 className="t-h1" style={{ color: "var(--text-primary)", marginBottom: 12 }}>
              You&apos;re all set{name ? `, ${name}` : ""}!
            </h2>
            <p className="t-body" style={{ color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
              Tap the <strong style={{ color: "var(--accent)" }}>green + button</strong> anywhere to log an expense in under 5 seconds.
            </p>
            <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 36 }}>
              Your data is saved locally on this device.
            </p>
            <Btn onClick={handleComplete}>Go to Dashboard 🚀</Btn>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
