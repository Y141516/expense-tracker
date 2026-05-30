"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, ChevronDown, Calendar, StickyNote, Check } from "lucide-react";
import { useApp } from "@/store/app-context";
import { useToast } from "@/components/ui/Toaster";
import { autoCategorizee, getProfile } from "@/lib/storage";
import { startVoiceRecognition, parseVoiceInput } from "@/lib/utils";
import { DEFAULT_CATEGORIES, PAYMENT_METHODS, Expense } from "@/types";
import { format } from "date-fns";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

type Step = "amount" | "details";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£",
  JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ",
};

export function AddExpenseModal({ isOpen, onClose, editExpense }: AddExpenseModalProps) {
  const { addExpense, updateExpense, categories } = useApp();
  const { success, error } = useToast();
  const profile = getProfile();
  const symbol = CURRENCY_SYMBOLS[profile?.currency || "INR"] || "₹";

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("others");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isListening, setIsListening] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);
  const stopVoice = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setDescription(editExpense.description);
      setCategoryId(editExpense.category_id);
      setDate(editExpense.date);
      setNote(editExpense.note || "");
      setPaymentMethod(editExpense.payment_method || "upi");
      setStep("details");
    } else {
      setAmount(""); setDescription(""); setCategoryId("others");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNote(""); setPaymentMethod("upi"); setStep("amount");
    }
  }, [isOpen, editExpense]);

  useEffect(() => {
    if (description && !editExpense) {
      setCategoryId(autoCategorizee(description));
    }
  }, [description, editExpense]);

  const handleAmountNext = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { error("Enter a valid amount"); return; }
    setStep("details");
    setTimeout(() => descRef.current?.focus(), 150);
  };

  const handleVoice = () => {
    if (isListening) { stopVoice.current?.(); setIsListening(false); return; }
    setIsListening(true);
    stopVoice.current = startVoiceRecognition(
      (text) => {
        const parsed = parseVoiceInput(text);
        if (parsed.amount > 0) setAmount(parsed.amount.toString());
        if (parsed.description) setDescription(parsed.description);
        setCategoryId(autoCategorizee(parsed.description));
        setIsListening(false);
        if (parsed.amount > 0) setStep("details");
      },
      (err) => { error("Voice error", err); setIsListening(false); }
    );
  };

  const handleNumpad = (val: string) => {
    if (val === "." && amount.includes(".")) return;
    if (val === "backspace") { setAmount(p => p.slice(0, -1)); return; }
    if (amount === "0" && val !== ".") { setAmount(val); return; }
    if (amount.length >= 9) return;
    setAmount(p => p + val);
  };

  const handleSave = useCallback(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { error("Enter a valid amount"); return; }
    if (!description.trim()) { error("Description is required"); return; }
    if (editExpense) {
      updateExpense(editExpense.id, {
        amount: num, description: description.trim(),
        category_id: categoryId, date, note,
        payment_method: paymentMethod as Expense["payment_method"],
      });
      success("Expense updated!");
    } else {
      addExpense({
        amount: num, description: description.trim(),
        category_id: categoryId, date, note,
        payment_method: paymentMethod as Expense["payment_method"],
      });
      success("Added!", `${symbol}${num.toLocaleString("en-IN")} saved`);
    }
    onClose();
  }, [amount, description, categoryId, date, note, paymentMethod, addExpense, updateExpense, editExpense, onClose, success, error, symbol]);

  const selectedCategory = categories.find(c => c.id === categoryId) || DEFAULT_CATEGORIES[8];

  const numpadRows = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [".", "0", "backspace"],
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60"
            style={{ backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Main Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] overflow-hidden"
            style={{ background: "var(--bg-card)", maxHeight: "96dvh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--bg-border)" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {editExpense ? "Edit Expense" : "Add Expense"}
                </h2>
                {step === "details" && (
                  <button
                    onClick={() => setStep("amount")}
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: "#22c55e" }}
                  >
                    ← Change amount
                  </button>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-elevated)" }}
              >
                <X size={17} style={{ color: "var(--text-muted)" }} />
              </motion.button>
            </div>

            {/* Amount display */}
            <div className="px-5 pb-3 text-center">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold" style={{ color: "var(--text-muted)" }}>{symbol}</span>
                <span
                  className="font-mono font-bold transition-all"
                  style={{
                    fontSize: amount.length > 6 ? "2.4rem" : "3.2rem",
                    color: amount ? "var(--text-primary)" : "var(--text-muted)",
                    letterSpacing: "-1px",
                  }}
                >
                  {amount || "0"}
                </span>
              </div>
              {isListening && (
                <motion.p
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                  className="text-xs font-semibold mt-1"
                  style={{ color: "#ef4444" }}
                >
                  🎙 Listening… speak now
                </motion.p>
              )}
            </div>

            <AnimatePresence mode="wait">

              {/* ── AMOUNT STEP ── */}
              {step === "amount" && (
                <motion.div
                  key="amount"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  className="px-4 pb-6"
                >
                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {numpadRows.map((row, ri) =>
                      row.map((key) => (
                        <motion.button
                          key={`${ri}-${key}`}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleNumpad(key)}
                          className="h-[3.75rem] rounded-2xl flex items-center justify-center font-bold text-xl transition-colors"
                          style={{
                            background: key === "backspace"
                              ? "rgba(239,68,68,0.1)"
                              : "var(--bg-elevated)",
                            color: key === "backspace"
                              ? "#ef4444"
                              : "var(--text-primary)",
                            border: "1.5px solid var(--bg-border)",
                          }}
                        >
                          {key === "backspace" ? (
                            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                              <path d="M8 1L1 9l7 8H21V1H8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(239,68,68,0.12)"/>
                              <path d="M13 6l4 6M17 6l-4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          ) : key === "." ? (
                            <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>•</span>
                          ) : key}
                        </motion.button>
                      ))
                    )}
                  </div>

                  {/* Voice + Next */}
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoice}
                      className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border-2 transition-all"
                      style={{
                        borderColor: isListening ? "#ef4444" : "var(--bg-border)",
                        background: isListening ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)",
                        color: isListening ? "#ef4444" : "var(--text-secondary)",
                      }}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      {isListening ? "Stop" : "Voice"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleAmountNext}
                      disabled={!amount || parseFloat(amount) <= 0}
                      className="flex-[2.5] h-14 rounded-2xl font-bold text-white text-lg disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      Next →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── DETAILS STEP ── */}
              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="px-5 pb-8 overflow-y-auto"
                  style={{ maxHeight: "65dvh" }}
                >
                  <div className="space-y-4">

                    {/* Description */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>
                        What for? *
                      </label>
                      <input
                        ref={descRef}
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. Lunch at Sharma Restaurant"
                        className="input-base text-base"
                        onKeyDown={e => e.key === "Enter" && handleSave()}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>
                        Category
                      </label>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCategoryPicker(true)}
                        className="input-base flex items-center justify-between"
                        style={{ cursor: "pointer" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: `${selectedCategory.color}22` }}
                          >
                            {selectedCategory.icon}
                          </span>
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            {selectedCategory.name}
                          </span>
                        </div>
                        <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                      </motion.button>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>
                        Payment
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                        {PAYMENT_METHODS.map(pm => (
                          <motion.button
                            key={pm.id}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setPaymentMethod(pm.id)}
                            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all"
                            style={{
                              borderColor: paymentMethod === pm.id ? "#22c55e" : "var(--bg-border)",
                              background: paymentMethod === pm.id ? "rgba(34,197,94,0.12)" : "var(--bg-elevated)",
                              color: paymentMethod === pm.id ? "#22c55e" : "var(--text-secondary)",
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>{pm.icon}</span>
                            <span>{pm.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                        <Calendar size={11} /> Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input-base"
                        max={format(new Date(), "yyyy-MM-dd")}
                      />
                    </div>

                    {/* Note toggle */}
                    <button
                      onClick={() => setShowNote(!showNote)}
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: showNote ? "#22c55e" : "var(--text-muted)" }}
                    >
                      <StickyNote size={15} />
                      {showNote ? "Remove note" : "Add a note (optional)"}
                    </button>

                    <AnimatePresence>
                      {showNote && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Any extra notes…"
                            rows={2}
                            className="input-base resize-none"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Save */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      className="w-full h-14 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      <Check size={20} strokeWidth={3} />
                      {editExpense ? "Update Expense" : "Save Expense"}
                    </motion.button>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── CATEGORY PICKER (own layer above modal) ── */}
          <AnimatePresence>
            {showCategoryPicker && (
              <>
                <motion.div
                  className="fixed inset-0 z-[80] bg-black/50"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowCategoryPicker(false)}
                />
                <motion.div
                  className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-[2rem] p-5"
                  style={{ background: "var(--bg-card)", maxHeight: "80dvh", overflowY: "auto" }}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 420, damping: 40 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--bg-border)" }} />
                  </div>
                  <h3 className="text-lg font-bold mb-5" style={{ color: "var(--text-primary)" }}>
                    Select Category
                  </h3>
                  <div className="grid grid-cols-3 gap-3 pb-6">
                    {categories.map(cat => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
                          className="flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all"
                          style={{
                            background: isSelected ? `${cat.color}22` : "var(--bg-elevated)",
                            border: `2px solid ${isSelected ? cat.color : "transparent"}`,
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: `${cat.color}20` }}
                          >
                            {cat.icon}
                          </div>
                          <span
                            className="text-xs font-bold text-center leading-tight"
                            style={{ color: isSelected ? cat.color : "var(--text-secondary)" }}
                          >
                            {cat.name.replace(" & ", "\n& ")}
                          </span>
                          {isSelected && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: cat.color }}
                            >
                              <Check size={11} className="text-white" strokeWidth={3} />
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
