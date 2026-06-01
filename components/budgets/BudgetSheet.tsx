"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { getProfile } from "@/lib/storage";
import { getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/Toaster";

interface BudgetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected month — defaults to current month */
  month?: string;
  /** Pre-selected category for editing */
  editCategoryId?: string;
  /** Existing amount when editing */
  editAmount?: number;
}

const SYM: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£",
  JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ",
};

export function BudgetSheet({
  isOpen,
  onClose,
  month,
  editCategoryId,
  editAmount,
}: BudgetSheetProps) {
  const { categories, budgets, setBudget } = useApp();
  const { success, error } = useToast();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const symbol = SYM[currency] || "₹";
  const targetMonth = month || getCurrentMonth();

  const monthBudgets = budgets.filter((b) => b.month === targetMonth);
  const catsWithoutBudget = categories.filter(
    (c) => !monthBudgets.find((b) => b.category_id === c.id)
  );

  // When editing, start with the existing category selected
  const defaultCatId = editCategoryId || catsWithoutBudget[0]?.id || categories[0]?.id || "food";
  const [selectedCatId, setSelectedCatId] = useState(defaultCatId);
  const [amount, setAmount] = useState(editAmount?.toString() || "");

  // Reset when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCatId(editCategoryId || catsWithoutBudget[0]?.id || categories[0]?.id || "food");
      setAmount(editAmount?.toString() || "");
    }
  }, [isOpen, editCategoryId, editAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableCats = editCategoryId
    ? categories // When editing, show all categories
    : catsWithoutBudget; // When adding, only show ones without budgets

  const isEditing = !!editCategoryId;
  const allHaveBudgets = !isEditing && catsWithoutBudget.length === 0;

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { error("Enter a valid amount"); return; }
    if (!selectedCatId) { error("Select a category"); return; }
    setBudget(selectedCatId, num, targetMonth);
    success(
      isEditing ? "Budget updated!" : "Budget set!",
      `${getMonthLabel(targetMonth)}`
    );
    onClose();
  };

  const selectedCat = categories.find((c) => c.id === selectedCatId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 42 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 110,
              background: "var(--bg-surface)",
              borderRadius: "28px 28px 0 0",
              maxHeight: "92dvh",
              overflowY: "auto",
              overscrollBehavior: "contain",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--bg-border)" }} />
            </div>

            <div style={{ padding: "16px 20px 24px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h3 className="t-h3" style={{ color: "var(--text-primary)" }}>
                  {isEditing ? "Edit Budget" : "Set Budget"}
                </h3>
                <button onClick={onClose} style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "var(--bg-elevated)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <p className="t-caption" style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                Applies only to{" "}
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                  {getMonthLabel(targetMonth)}
                </span>
                {" "}· resets each month
              </p>

              {allHaveBudgets ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <p className="t-label" style={{ color: "var(--text-primary)", marginBottom: 6 }}>
                    All categories budgeted!
                  </p>
                  <p className="t-caption" style={{ color: "var(--text-muted)" }}>
                    Use the ✏️ button on a card to edit existing budgets.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Category selector */}
                  {!isEditing && (
                    <div>
                      <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 10 }}>
                        CATEGORY
                      </p>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 10,
                      }}>
                        {availableCats.map((cat) => {
                          const sel = selectedCatId === cat.id;
                          return (
                            <motion.button
                              key={cat.id}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => setSelectedCatId(cat.id)}
                              style={{
                                display: "flex", flexDirection: "column",
                                alignItems: "center", gap: 8,
                                padding: "12px 8px", borderRadius: 16, cursor: "pointer",
                                background: sel ? `${cat.color}15` : "var(--bg-elevated)",
                                border: `2px solid ${sel ? cat.color : "transparent"}`,
                                transition: "all 0.15s ease",
                              }}
                            >
                              <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: `${cat.color}20`,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 22,
                              }}>
                                {cat.icon}
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: sel ? 700 : 500,
                                color: sel ? cat.color : "var(--text-secondary)",
                                textAlign: "center", lineHeight: 1.3,
                              }}>
                                {cat.name.split(" ")[0]}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* When editing — show which category */}
                  {isEditing && selectedCat && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: 16,
                      background: `${selectedCat.color}12`,
                      border: `1.5px solid ${selectedCat.color}30`,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: `${selectedCat.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {selectedCat.icon}
                      </div>
                      <div>
                        <p className="t-label" style={{ color: "var(--text-primary)" }}>
                          {selectedCat.name}
                        </p>
                        <p className="t-caption" style={{ color: "var(--text-muted)" }}>
                          Editing budget for {getMonthLabel(targetMonth)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Amount input */}
                  <div>
                    <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 10 }}>
                      MONTHLY LIMIT
                    </p>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", borderRadius: 16,
                      background: "var(--bg-elevated)",
                      border: "1.5px solid var(--bg-border)",
                      transition: "border-color 0.15s",
                    }}
                      onFocus={() => {}}
                    >
                      <span style={{
                        fontSize: 24, fontWeight: 800,
                        color: "var(--text-muted)", flexShrink: 0,
                      }}>
                        {symbol}
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        inputMode="numeric"
                        autoFocus={!isEditing}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        style={{
                          flex: 1, background: "none", border: "none", outline: "none",
                          fontSize: 28, fontWeight: 800,
                          color: "var(--text-primary)",
                          fontFamily: "'JetBrains Mono', monospace",
                          width: "100%",
                        }}
                      />
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: "var(--accent)",
                        background: "rgba(34,197,94,0.12)",
                        padding: "4px 10px", borderRadius: 8, flexShrink: 0,
                      }}>
                        / month
                      </span>
                    </div>
                    <p className="t-caption" style={{ color: "var(--text-muted)", marginTop: 8 }}>
                      You&apos;ll be alerted at 70% and 90% usage
                    </p>
                  </div>

                  {/* Save button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={!amount || parseFloat(amount) <= 0}
                    style={{
                      width: "100%", height: 54, borderRadius: 18,
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: "#fff", fontWeight: 800, fontSize: 16,
                      border: "none", cursor: "pointer",
                      boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
                      opacity: !amount || parseFloat(amount) <= 0 ? 0.4 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {isEditing ? "Update Budget" : `Save Budget`}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
