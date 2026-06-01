"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-context";
import { useToast } from "@/components/ui/Toaster";
import { autoCategorizee, getProfile } from "@/lib/storage";
import { startVoiceRecognition, parseVoiceInput } from "@/lib/utils";
import { DEFAULT_CATEGORIES, PAYMENT_METHODS, Expense } from "@/types";
import { format } from "date-fns";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

const SYM: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£",
  JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ",
};

const NUMPAD = [["7","8","9"],["4","5","6"],["1","2","3"],[".", "0","⌫"]];

export function AddExpenseModal({ isOpen, onClose, editExpense }: Props) {
  const { addExpense, updateExpense, categories } = useApp();
  const { success, error } = useToast();
  const sym = SYM[getProfile()?.currency || "INR"] || "₹";

  const [step, setStep] = useState<"amount" | "details">("amount");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [catId, setCatId] = useState("others");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [pm, setPm] = useState("upi");
  const [listening, setListening] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);
  const stopVoice = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setDesc(editExpense.description);
      setCatId(editExpense.category_id);
      setDate(editExpense.date);
      setNote(editExpense.note || "");
      setPm(editExpense.payment_method || "upi");
      setStep("details");
    } else {
      setAmount(""); setDesc(""); setCatId("others");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNote(""); setPm("upi"); setStep("amount");
      setShowNote(false);
    }
  }, [isOpen, editExpense]);

  useEffect(() => {
    if (desc && !editExpense) setCatId(autoCategorizee(desc));
  }, [desc, editExpense]);

  const tap = (k: string) => {
    if (k === "⌫") { setAmount(p => p.slice(0, -1)); return; }
    if (k === "." && amount.includes(".")) return;
    if (amount === "0" && k !== ".") { setAmount(k); return; }
    if (amount.length >= 9) return;
    setAmount(p => p + k);
  };

  const toDetails = () => {
    if (!amount || parseFloat(amount) <= 0) { error("Enter a valid amount"); return; }
    setStep("details");
    setTimeout(() => descRef.current?.focus(), 150);
  };

  const handleVoice = () => {
    if (listening) { stopVoice.current?.(); setListening(false); return; }
    setListening(true);
    stopVoice.current = startVoiceRecognition(
      (text) => {
        const p = parseVoiceInput(text);
        if (p.amount > 0) setAmount(p.amount.toString());
        if (p.description) setDesc(p.description);
        setListening(false);
        if (p.amount > 0) setStep("details");
      },
      () => setListening(false),
    );
  };

  const save = useCallback(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { error("Enter a valid amount"); return; }
    if (!desc.trim()) { error("Description is required"); return; }
    const data = {
      amount: num, description: desc.trim(), category_id: catId,
      date, note, payment_method: pm as Expense["payment_method"],
    };
    if (editExpense) { updateExpense(editExpense.id, data); success("Updated!"); }
    else { addExpense(data); success("Added!", `${sym}${num.toLocaleString("en-IN")} saved`); }
    onClose();
  }, [amount, desc, catId, date, note, pm, addExpense, updateExpense, editExpense, onClose, success, error, sym]);

  const selCat = categories.find(c => c.id === catId) || DEFAULT_CATEGORIES[8];
  const canSave = !!desc.trim() && !!amount && parseFloat(amount) > 0;

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
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* ── Sheet wrapper — flex column so footer stays fixed at bottom ── */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 42 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 110,
              background: "var(--bg-surface)",
              borderRadius: "28px 28px 0 0",
              maxHeight: "94dvh",
              display: "flex", flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--bg-border)" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 8px", flexShrink: 0 }}>
              <div>
                <h2 className="t-h3" style={{ color: "var(--text-primary)" }}>
                  {editExpense ? "Edit Expense" : "Add Expense"}
                </h2>
                {step === "details" && (
                  <button onClick={() => setStep("amount")} style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px 0", color: "var(--accent)", fontWeight: 700, fontSize: 12,
                  }}>
                    ← Change amount
                  </button>
                )}
              </div>
              <button onClick={onClose} style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "var(--bg-elevated)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Amount display */}
            <div style={{ textAlign: "center", padding: "4px 20px 14px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                <span className="t-h2" style={{ color: "var(--text-muted)", fontWeight: 700 }}>{sym}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: amount.length > 6 ? "2.6rem" : "3.4rem",
                  fontWeight: 700,
                  color: amount ? "var(--text-primary)" : "var(--text-muted)",
                  letterSpacing: "-2px", lineHeight: 1,
                  transition: "font-size 0.15s",
                }}>
                  {amount || "0"}
                </span>
              </div>
              {listening && (
                <motion.p animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                  className="t-caption" style={{ color: "var(--danger)", marginTop: 6 }}>
                  🎙 Listening… speak now
                </motion.p>
              )}
            </div>

            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
              <AnimatePresence mode="wait">

                {/* ── AMOUNT STEP ── */}
                {step === "amount" && (
                  <motion.div key="amt"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    style={{ padding: "0 16px 16px" }}
                  >
                    {/* Numpad */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 12 }}>
                      {NUMPAD.map((row, ri) => row.map((k) => (
                        <motion.button key={`${ri}-${k}`} whileTap={{ scale: 0.88 }} onClick={() => tap(k)}
                          style={{
                            height: 58, borderRadius: 16,
                            background: k === "⌫" ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)",
                            border: `1.5px solid ${k === "⌫" ? "rgba(239,68,68,0.2)" : "var(--bg-border)"}`,
                            color: k === "⌫" ? "var(--danger)" : "var(--text-primary)",
                            fontSize: k === "⌫" ? 18 : 22, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {k === "⌫" ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                              <line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
                            </svg>
                          ) : k === "." ? (
                            <span style={{ fontSize: 28, lineHeight: 1, marginTop: -4 }}>·</span>
                          ) : k}
                        </motion.button>
                      )))}
                    </div>
                    {/* Voice + Next */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleVoice}
                        style={{
                          flex: 1, height: 52, borderRadius: 16,
                          background: listening ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)",
                          border: `1.5px solid ${listening ? "rgba(239,68,68,0.4)" : "var(--bg-border)"}`,
                          color: listening ? "var(--danger)" : "var(--text-secondary)",
                          fontWeight: 700, fontSize: 14, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        {listening ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                          </svg>
                        )}
                        {listening ? "Stop" : "Voice"}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={toDetails}
                        disabled={!amount || parseFloat(amount) <= 0}
                        style={{
                          flex: 2.5, height: 52, borderRadius: 16,
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer",
                          boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                          opacity: (!amount || parseFloat(amount) <= 0) ? 0.4 : 1,
                        }}
                      >
                        Next →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── DETAILS STEP ── */}
                {step === "details" && (
                  <motion.div key="det"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}
                  >
                    {/* Description */}
                    <div>
                      <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 6 }}>WHAT FOR? *</p>
                      <input
                        ref={descRef} type="text" value={desc}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="e.g. Lunch at Sharma Restaurant"
                        className="input-base"
                        onKeyDown={e => e.key === "Enter" && save()}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 6 }}>CATEGORY</p>
                      <button onClick={() => setShowCatPicker(true)} className="input-base"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${selCat.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                            {selCat.icon}
                          </div>
                          <span className="t-label" style={{ color: "var(--text-primary)" }}>{selCat.name}</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </div>

                    {/* Payment method */}
                    <div>
                      <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 6 }}>PAYMENT</p>
                      <div className="no-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
                        {PAYMENT_METHODS.map(p => (
                          <motion.button key={p.id} whileTap={{ scale: 0.93 }} onClick={() => setPm(p.id)}
                            style={{
                              flexShrink: 0, height: 38, padding: "0 13px", borderRadius: 19,
                              display: "flex", alignItems: "center", gap: 5,
                              fontWeight: 700, fontSize: 13, cursor: "pointer",
                              background: pm === p.id ? "var(--accent-dim)" : "var(--bg-elevated)",
                              border: `1.5px solid ${pm === p.id ? "var(--accent)" : "transparent"}`,
                              color: pm === p.id ? "var(--accent)" : "var(--text-secondary)",
                            }}
                          >
                            <span style={{ fontSize: 14 }}>{p.icon}</span><span>{p.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="t-overline" style={{ color: "var(--text-muted)", marginBottom: 6 }}>DATE</p>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        max={format(new Date(), "yyyy-MM-dd")} className="input-base" />
                    </div>

                    {/* Note toggle */}
                    <button onClick={() => setShowNote(v => !v)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 7,
                      color: showNote ? "var(--accent)" : "var(--text-muted)",
                      fontWeight: 600, fontSize: 13, padding: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {showNote ? "Remove note" : "Add a note (optional)"}
                    </button>

                    <AnimatePresence>
                      {showNote && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                          <textarea value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Any additional notes…" rows={2}
                            className="input-base" style={{ resize: "none" }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── STICKY SAVE BUTTON — always visible, never scrolled away ── */}
            {step === "details" && (
              <div style={{
                padding: "12px 20px 16px", flexShrink: 0,
                borderTop: "1px solid var(--bg-border)",
                background: "var(--bg-surface)",
              }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={!canSave}
                  style={{
                    width: "100%", height: 52, borderRadius: 18,
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer",
                    boxShadow: canSave ? "0 4px 20px rgba(34,197,94,0.35)" : "none",
                    opacity: canSave ? 1 : 0.4,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "opacity 0.15s",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {editExpense ? "Update Expense" : "Save Expense"}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* ── CATEGORY PICKER ── */}
          <AnimatePresence>
            {showCatPicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowCatPicker(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(0,0,0,0.5)" }}
                />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 420, damping: 42 }}
                  style={{
                    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 130,
                    background: "var(--bg-surface)", borderRadius: "28px 28px 0 0",
                    maxHeight: "80dvh", overflowY: "auto",
                    padding: "12px 20px",
                    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--bg-border)" }} />
                  </div>
                  <h3 className="t-h3" style={{ color: "var(--text-primary)", marginBottom: 16 }}>Category</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {categories.map(cat => {
                      const sel = catId === cat.id;
                      return (
                        <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                          onClick={() => { setCatId(cat.id); setShowCatPicker(false); }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            gap: 8, padding: "13px 8px", borderRadius: 18, cursor: "pointer",
                            background: sel ? `${cat.color}15` : "var(--bg-elevated)",
                            border: `2px solid ${sel ? cat.color : "transparent"}`,
                          }}
                        >
                          <div style={{
                            width: 46, height: 46, borderRadius: 15,
                            background: `${cat.color}20`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                          }}>{cat.icon}</div>
                          <span style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? cat.color : "var(--text-secondary)", textAlign: "center", lineHeight: 1.3 }}>
                            {cat.name.split(" ")[0]}
                          </span>
                          {sel && (
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: cat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
