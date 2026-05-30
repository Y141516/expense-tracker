"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { CURRENCIES, DEFAULT_CATEGORIES } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Check, ChevronRight, Wallet, Target, Bell, Sparkles } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = ["welcome", "currency", "income", "budgets", "notifications", "done"] as const;
type OnboardingStep = typeof STEPS[number];

export function Onboarding({ onComplete }: OnboardingProps) {
  const { setProfile, setBudget } = useApp();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [income, setIncome] = useState("");
  const [budgets, setBudgetAmounts] = useState<Record<string, string>>({});
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);

  const currencySymbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ"
  };
  const symbol = currencySymbols[currency] || "₹";

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

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

    // Save budgets
    const month = new Date().toISOString().slice(0, 7);
    Object.entries(budgets).forEach(([catId, amount]) => {
      if (amount && parseFloat(amount) > 0) {
        setBudget(catId, parseFloat(amount), month);
      }
    });

    onComplete();
  };

  const quickBudgets = [
    { label: "Tight", multiplier: 0.5 },
    { label: "Moderate", multiplier: 0.7 },
    { label: "Comfortable", multiplier: 1 },
  ];

  const suggestedBudgets: Record<string, Record<string, number>> = {
    INR: { food: 5000, grocery: 4000, travel: 3000, shopping: 3000, bills: 2500, entertainment: 2000, health: 1500, education: 1000 },
    USD: { food: 400, grocery: 300, travel: 200, shopping: 200, bills: 150, entertainment: 150, health: 100, education: 50 },
  };
  const suggested = suggestedBudgets[currency] || suggestedBudgets["INR"];

  const applyQuickBudget = (multiplier: number) => {
    const newBudgets: Record<string, string> = {};
    DEFAULT_CATEGORIES.filter(c => c.id !== "others").forEach(cat => {
      const base = suggested[cat.id] || 1000;
      newBudgets[cat.id] = Math.round(base * multiplier).toString();
    });
    setBudgetAmounts(newBudgets);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg-primary)]">
      {/* Progress bar */}
      {step !== "welcome" && step !== "done" && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-[var(--bg-elevated)]">
            <motion.div
              className="h-full bg-green-500 rounded-r-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Logo */}
            <motion.div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
              style={{ background: "linear-gradient(135deg, #22c55e20, #06b6d420)" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              <span className="text-5xl">💰</span>
            </motion.div>

            <motion.h1
              className="text-3xl font-bold mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="gradient-text">Expense Tracker</span>
            </motion.h1>
            <motion.p
              className="text-[var(--text-secondary)] text-base leading-relaxed mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Your smart personal finance assistant. Track every rupee, manage budgets, and build better money habits.
            </motion.p>

            <motion.div
              className="w-full space-y-3 mt-8 mb-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { icon: "⚡", text: "Add expenses in under 5 seconds" },
                { icon: "🎯", text: "Set budgets & get smart alerts" },
                { icon: "📊", text: "Visualize spending with charts" },
                { icon: "🤖", text: "Get personalized money insights" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{item.text}</span>
                </div>
              ))}
            </motion.div>

            <div className="w-full space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="input-base"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("currency")}
                className="w-full h-14 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Get Started <ChevronRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "currency" && (
          <motion.div
            key="currency"
            className="flex-1 px-6 py-16"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <div className="mb-8">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-2">Step 1 of 4</p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Your Currency</h2>
              <p className="text-[var(--text-secondary)] text-sm">Which currency do you primarily use?</p>
            </div>

            <div className="space-y-2 mb-8">
              {CURRENCIES.map((cur) => (
                <motion.button
                  key={cur.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrency(cur.code)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    currency === cur.code
                      ? "border-green-500 bg-green-500/10"
                      : "border-[var(--bg-border)] bg-[var(--bg-card)]"
                  }`}
                >
                  <span className="text-2xl font-bold w-8 text-center" style={{ color: currency === cur.code ? "#22c55e" : "var(--text-muted)" }}>
                    {cur.symbol}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--text-primary)]">{cur.code}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cur.name}</p>
                  </div>
                  {currency === cur.code && <Check size={18} className="text-green-500" />}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("income")}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              Continue <ChevronRight size={20} className="inline" />
            </motion.button>
          </motion.div>
        )}

        {step === "income" && (
          <motion.div
            key="income"
            className="flex-1 px-6 py-16"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <div className="mb-8">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-2">Step 2 of 4</p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Monthly Income</h2>
              <p className="text-[var(--text-secondary)] text-sm">Helps us give better savings insights. You can skip this.</p>
            </div>

            <div className="card p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="text-green-500" size={22} />
                <span className="font-semibold text-[var(--text-primary)]">Monthly Take-home</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[var(--text-muted)]">{symbol}</span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="0"
                  className="input-base text-2xl font-bold font-mono"
                  inputMode="numeric"
                />
              </div>
              {income && parseFloat(income) > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-3">
                  Suggested savings (20%): {formatCurrency(parseFloat(income) * 0.2, currency)}/month
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("budgets")}
                className="flex-1 h-14 rounded-2xl font-semibold border-2 border-[var(--bg-border)] text-[var(--text-secondary)]"
              >
                Skip
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("budgets")}
                className="flex-[2] h-14 rounded-2xl font-bold text-white text-lg"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Continue →
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "budgets" && (
          <motion.div
            key="budgets"
            className="flex-1 px-6 py-16 overflow-y-auto"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <div className="mb-6">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-2">Step 3 of 4</p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Monthly Budgets</h2>
              <p className="text-[var(--text-secondary)] text-sm">Each amount = <strong>per month only</strong> — resets automatically. E.g. enter ₹3,000 for Food to allow ₹3,000/month on food.</p>
            </div>

            {/* Quick preset */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Quick presets</p>
              <div className="flex gap-2">
                {quickBudgets.map((qb) => (
                  <button
                    key={qb.label}
                    onClick={() => applyQuickBudget(qb.multiplier)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 border-[var(--bg-border)] text-[var(--text-secondary)] hover:border-green-500/50 hover:text-green-500 transition-all"
                  >
                    {qb.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {DEFAULT_CATEGORIES.filter(c => c.id !== "others").map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 card p-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{cat.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-[var(--text-muted)]">{symbol}</span>
                    <input
                      type="number"
                      value={budgets[cat.id] || ""}
                      onChange={(e) => setBudgetAmounts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder="0"
                      className="w-20 text-right bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-green-500"
                      inputMode="numeric"
                    />
                    <span className="text-[10px] font-bold text-green-500">/mo</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("notifications")}
                className="flex-1 h-14 rounded-2xl font-semibold border-2 border-[var(--bg-border)] text-[var(--text-secondary)]"
              >
                Skip
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("notifications")}
                className="flex-[2] h-14 rounded-2xl font-bold text-white text-lg"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Continue →
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "notifications" && (
          <motion.div
            key="notifications"
            className="flex-1 px-6 py-16"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <div className="mb-8">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-2">Step 4 of 4</p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Stay on Track</h2>
              <p className="text-[var(--text-secondary)] text-sm">Enable smart alerts to never overspend.</p>
            </div>

            <div className="space-y-4 mb-10">
              {[
                { key: "budget", label: "Budget Alerts", desc: "When you're close to or exceed a budget", icon: "⚠️", value: notifBudget, set: setNotifBudget },
                { key: "weekly", label: "Weekly Summary", desc: "Your spending overview every Sunday", icon: "📊", value: notifWeekly, set: setNotifWeekly },
              ].map(({ key, label, desc, icon, value, set }) => (
                <div key={key} className="card p-4 flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => set(!value)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${value ? "bg-green-500" : "bg-[var(--bg-elevated)]"}`}
                  >
                    <motion.div
                      animate={{ x: value ? 24 : 2 }}
                      className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("done")}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-28 h-28 rounded-full flex items-center justify-center mb-8"
              style={{ background: "linear-gradient(135deg, #22c55e30, #16a34a20)" }}
            >
              <Sparkles size={52} className="text-green-500" />
            </motion.div>
            <motion.h2
              className="text-3xl font-bold mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              You&apos;re all set{name ? `, ${name}` : ""}! 🎉
            </motion.h2>
            <motion.p
              className="text-[var(--text-secondary)] mb-10 text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Start tracking your expenses now. Hit the <strong className="text-green-500">+ button</strong> anytime to log a new expense — it takes just 5 seconds!
            </motion.p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleComplete}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              Go to Dashboard 🚀
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
