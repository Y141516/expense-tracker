"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile, clearAllData } from "@/lib/storage";
import { CURRENCIES, DEFAULT_CATEGORIES } from "@/types";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useToast } from "@/components/ui/Toaster";
import {
  User, Palette, Bell, Coins, Tag, Trash2, ChevronRight,
  Sun, Moon, Monitor, Plus, X, Check, AlertTriangle, Info
} from "lucide-react";
import { requestNotificationPermission } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Section = "main" | "profile" | "currency" | "theme" | "categories" | "notifications" | "danger";

const CATEGORY_ICONS = ["🍽️", "✈️", "🛒", "🛍️", "⚡", "🎬", "❤️", "📚", "📦", "🏠", "🎮", "🐾", "💄", "🍺", "☕", "🎵", "🏋️", "🚗", "💊", "🎓"];
const CATEGORY_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#ec4899", "#eab308", "#8b5cf6", "#ef4444", "#06b6d4", "#6b7280", "#14b8a6"];

export default function SettingsPage() {
  const { profile, setProfile, categories, addCategory, deleteCategory } = useApp();
  const { theme, setTheme } = useTheme();
  const { success, error, info } = useToast();
  const router = useRouter();

  const [section, setSection] = useState<Section>("main");
  const [name, setName] = useState(profile?.full_name || "");
  const [income, setIncome] = useState(profile?.monthly_income?.toString() || "");
  const [selectedCurrency, setSelectedCurrency] = useState(profile?.currency || "INR");
  const [notifBudget, setNotifBudget] = useState(profile?.notification_budget_alerts ?? true);
  const [notifWeekly, setNotifWeekly] = useState(profile?.notification_weekly_summary ?? true);
  const [notifMonthly, setNotifMonthly] = useState(profile?.notification_monthly_report ?? true);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");
  const [newCatColor, setNewCatColor] = useState("#6b7280");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setIncome(profile.monthly_income?.toString() || "");
      setSelectedCurrency(profile.currency || "INR");
      setNotifBudget(profile.notification_budget_alerts ?? true);
      setNotifWeekly(profile.notification_weekly_summary ?? true);
      setNotifMonthly(profile.notification_monthly_report ?? true);
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, [profile]);

  const saveProfile = () => {
    setProfile({ full_name: name, monthly_income: income ? parseFloat(income) : undefined });
    success("Profile saved!");
    setSection("main");
  };

  const saveCurrency = () => {
    setProfile({ currency: selectedCurrency });
    success("Currency updated!");
    setSection("main");
  };

  const saveNotifications = async () => {
    if (notifBudget || notifWeekly || notifMonthly) {
      const granted = await requestNotificationPermission();
      if (!granted) info("Enable notifications in browser settings for alerts");
      else setNotifPermission("granted");
    }
    setProfile({ notification_budget_alerts: notifBudget, notification_weekly_summary: notifWeekly, notification_monthly_report: notifMonthly });
    success("Notification preferences saved!");
    setSection("main");
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) { error("Enter a category name"); return; }
    addCategory({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor, bgColor: `bg-gray-500/20`, isCustom: true });
    setNewCatName(""); setNewCatIcon("📦"); setNewCatColor("#6b7280");
    success("Category added!");
  };

  const handleClearData = () => {
    clearAllData();
    success("All data cleared");
    setShowDeleteConfirm(false);
    setTimeout(() => router.replace("/"), 800);
  };

  const currencyObj = CURRENCIES.find(c => c.code === (profile?.currency || "INR"));
  const customCategories = categories.filter(c => c.isCustom);

  const menuItems = [
    { id: "profile" as Section, icon: User, label: "Profile", desc: profile?.full_name || "Set your name", color: "#22c55e" },
    { id: "currency" as Section, icon: Coins, label: "Currency", desc: `${currencyObj?.symbol} ${currencyObj?.name}`, color: "#f59e0b" },
    { id: "theme" as Section, icon: Palette, label: "Theme", desc: theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light", color: "#8b5cf6" },
    { id: "categories" as Section, icon: Tag, label: "Categories", desc: `${customCategories.length} custom`, color: "#06b6d4" },
    { id: "notifications" as Section, icon: Bell, label: "Notifications", desc: notifPermission === "granted" ? "Enabled" : "Configure alerts", color: "#ec4899" },
  ];

  const SubHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)]">
        <ChevronRight size={18} className="rotate-180 text-[var(--text-secondary)]" />
      </button>
      <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
    </div>
  );

  return (
    <div className="px-4 pt-6 pb-24 page-enter">
      <AnimatePresence mode="wait">

        {/* ── MAIN ── */}
        {section === "main" && (
          <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Settings</h1>

            {/* Profile pill */}
            <div className="card p-4 flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                {(profile?.full_name?.[0] || "U").toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--text-primary)]">{profile?.full_name || "Your Name"}</p>
                <p className="text-sm text-[var(--text-muted)]">{currencyObj?.symbol} · {theme} theme</p>
              </div>
              <button onClick={() => setSection("profile")} className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)]">
                <ChevronRight size={16} className="text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="card divide-y divide-[var(--bg-border)] mb-6">
              {menuItems.map(({ id, icon: Icon, label, desc, color }) => (
                <motion.button key={id} whileTap={{ scale: 0.98 }} onClick={() => setSection(id)}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[var(--bg-elevated)] transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-muted)]" />
                </motion.button>
              ))}
            </div>

            {/* App info */}
            <div className="card p-4 mb-4">
              <div className="flex items-center gap-3 mb-1">
                <Info size={16} className="text-[var(--text-muted)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">About</p>
              </div>
              <p className="text-xs text-[var(--text-muted)] ml-7">Expense Tracker v1.0 · All data is stored locally on your device.</p>
            </div>

            {/* Danger zone */}
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
              <Trash2 size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">Clear All Data</span>
            </button>
          </motion.div>
        )}

        {/* ── PROFILE ── */}
        {section === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SubHeader title="Profile" onBack={() => setSection("main")} />
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="input-base" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Monthly Income (optional)</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="0" className="input-base" inputMode="numeric" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Used to calculate savings percentage</p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile}
                className="w-full h-14 rounded-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                Save Profile
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── CURRENCY ── */}
        {section === "currency" && (
          <motion.div key="currency" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SubHeader title="Currency" onBack={() => setSection("main")} />
            <div className="space-y-2 mb-6">
              {CURRENCIES.map(cur => (
                <motion.button key={cur.code} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCurrency(cur.code)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selectedCurrency === cur.code ? "border-green-500 bg-green-500/10" : "border-[var(--bg-border)] card"}`}
                >
                  <span className="text-2xl font-bold w-8 text-center" style={{ color: selectedCurrency === cur.code ? "#22c55e" : "var(--text-muted)" }}>{cur.symbol}</span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--text-primary)]">{cur.code}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cur.name}</p>
                  </div>
                  {selectedCurrency === cur.code && <Check size={18} className="text-green-500" />}
                </motion.button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={saveCurrency}
              className="w-full h-14 rounded-2xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              Save Currency
            </motion.button>
          </motion.div>
        )}

        {/* ── THEME ── */}
        {section === "theme" && (
          <motion.div key="theme" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SubHeader title="Theme" onBack={() => setSection("main")} />
            <div className="space-y-3">
              {[
                { value: "light", label: "Light", desc: "Bright & clean", icon: Sun, color: "#f59e0b" },
                { value: "dark", label: "Dark", desc: "Easy on the eyes", icon: Moon, color: "#8b5cf6" },
                { value: "system", label: "System", desc: "Follow device setting", icon: Monitor, color: "#06b6d4" },
              ].map(({ value, label, desc, icon: Icon, color }) => (
                <motion.button key={value} whileTap={{ scale: 0.98 }}
                  onClick={() => { setTheme(value as "light" | "dark" | "system"); success(`${label} mode enabled`); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${theme === value ? "border-green-500 bg-green-500/10" : "border-[var(--bg-border)] card"}`}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                  {theme === value && <Check size={18} className="text-green-500" />}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CATEGORIES ── */}
        {section === "categories" && (
          <motion.div key="categories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SubHeader title="Categories" onBack={() => setSection("main")} />

            {/* Default categories */}
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Default Categories</p>
            <div className="card divide-y divide-[var(--bg-border)] mb-5">
              {DEFAULT_CATEGORIES.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${cat.color}20` }}>{cat.icon}</div>
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-1">{cat.name}</span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">Default</span>
                </div>
              ))}
            </div>

            {/* Custom categories */}
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Custom Categories</p>
            {customCategories.length > 0 && (
              <div className="card divide-y divide-[var(--bg-border)] mb-4">
                {customCategories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${cat.color}20` }}>{cat.icon}</div>
                    <span className="text-sm font-medium text-[var(--text-primary)] flex-1">{cat.name}</span>
                    <button onClick={() => { deleteCategory(cat.id); success("Category deleted"); }}
                      className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new category */}
            <div className="card p-4 space-y-3">
              <p className="text-sm font-bold text-[var(--text-primary)]">Add Category</p>
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                placeholder="Category name" className="input-base" />
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Pick icon</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map(ico => (
                    <button key={ico} onClick={() => setNewCatIcon(ico)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newCatIcon === ico ? "ring-2 ring-green-500 bg-green-500/15" : "bg-[var(--bg-elevated)]"}`}
                    >{ico}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Pick color</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map(col => (
                    <button key={col} onClick={() => setNewCatColor(col)}
                      className={`w-8 h-8 rounded-full transition-all ${newCatColor === col ? "ring-2 ring-offset-2 ring-green-500" : ""}`}
                      style={{ background: col }} />
                  ))}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddCategory}
                className="w-full h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                <Plus size={16} /> Add Category
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {section === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SubHeader title="Notifications" onBack={() => setSection("main")} />

            {notifPermission !== "granted" && (
              <div className="card p-4 border-amber-500/30 mb-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications not enabled</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Allow notifications in your browser to receive alerts</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {[
                { label: "Budget Alerts", desc: "Notified at 80% & 100% of budget", icon: "⚠️", value: notifBudget, set: setNotifBudget },
                { label: "Weekly Summary", desc: "Every Sunday — weekly spending recap", icon: "📊", value: notifWeekly, set: setNotifWeekly },
                { label: "Monthly Report", desc: "First of each month — monthly recap", icon: "📅", value: notifMonthly, set: setNotifMonthly },
              ].map(({ label, desc, icon, value, set }) => (
                <div key={label} className="card p-4 flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => set(!value)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${value ? "bg-green-500" : "bg-[var(--bg-elevated)]"}`}>
                    <motion.div animate={{ x: value ? 24 : 2 }}
                      className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </button>
                </div>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={saveNotifications}
              className="w-full h-14 rounded-2xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              Save Preferences
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-60 rounded-t-3xl p-6"
              style={{ background: "var(--bg-card)", zIndex: 70 }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Clear All Data?</h3>
              <p className="text-sm text-[var(--text-muted)] text-center mb-6">This will permanently delete all your expenses, budgets, and settings. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-13 py-3.5 rounded-2xl font-bold border-2 border-[var(--bg-border)] text-[var(--text-secondary)]">Cancel</button>
                <button onClick={handleClearData}
                  className="flex-1 h-13 py-3.5 rounded-2xl font-bold text-white bg-red-500">Delete Everything</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
