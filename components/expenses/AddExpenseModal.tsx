"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, ChevronDown, Calendar, StickyNote, CreditCard, Check } from "lucide-react";
import { useApp } from "@/store/app-context";
import { useToast } from "@/components/ui/Toaster";
import { autoCategorizee, getProfile } from "@/lib/storage";
import { startVoiceRecognition, parseVoiceInput, formatDate } from "@/lib/utils";
import { DEFAULT_CATEGORIES, PAYMENT_METHODS, Expense } from "@/types";
import { format } from "date-fns";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

type Step = "amount" | "details";

export function AddExpenseModal({ isOpen, onClose, editExpense }: AddExpenseModalProps) {
  const { addExpense, updateExpense, categories } = useApp();
  const { success, error } = useToast();
  const profile = getProfile();
  const currency = profile?.currency || "INR";
  const currencySymbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ"
  };
  const symbol = currencySymbols[currency] || "₹";

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("others");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isListening, setIsListening] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const stopVoice = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("amount");
      if (editExpense) {
        setAmount(editExpense.amount.toString());
        setDescription(editExpense.description);
        setCategoryId(editExpense.category_id);
        setDate(editExpense.date);
        setNote(editExpense.note || "");
        setPaymentMethod(editExpense.payment_method || "upi");
        setStep("details");
      } else {
        setAmount("");
        setDescription("");
        setCategoryId("others");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setNote("");
        setPaymentMethod("upi");
      }
      setTimeout(() => amountRef.current?.focus(), 200);
    }
  }, [isOpen, editExpense]);

  // Auto-categorize when description changes
  useEffect(() => {
    if (description && !editExpense) {
      const suggested = autoCategorizee(description);
      setCategoryId(suggested);
    }
  }, [description, editExpense]);

  const handleAmountNext = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { error("Invalid amount", "Please enter a valid amount"); return; }
    setStep("details");
    setTimeout(() => descRef.current?.focus(), 100);
  };

  const handleVoice = () => {
    if (isListening) {
      stopVoice.current?.();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    stopVoice.current = startVoiceRecognition(
      (text) => {
        const parsed = parseVoiceInput(text);
        if (parsed.amount > 0) setAmount(parsed.amount.toString());
        if (parsed.description) setDescription(parsed.description);
        const suggestedCat = autoCategorizee(parsed.description);
        setCategoryId(suggestedCat);
        setIsListening(false);
        if (parsed.amount > 0) setStep("details");
      },
      (err) => { error("Voice error", err); setIsListening(false); }
    );
  };

  const handleNumpad = (val: string) => {
    if (val === "." && amount.includes(".")) return;
    if (val === "backspace") { setAmount((prev) => prev.slice(0, -1)); return; }
    if (amount.length >= 10) return;
    setAmount((prev) => prev + val);
  };

  const handleSave = useCallback(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { error("Invalid amount"); return; }
    if (!description.trim()) { error("Description required"); return; }

    if (editExpense) {
      updateExpense(editExpense.id, { amount: num, description: description.trim(), category_id: categoryId, date, note, payment_method: paymentMethod as Expense["payment_method"] });
      success("Expense updated!");
    } else {
      addExpense({ amount: num, description: description.trim(), category_id: categoryId, date, note, payment_method: paymentMethod as Expense["payment_method"] });
      success("Expense added!", `${symbol}${num.toLocaleString("en-IN")} added`);
    }
    onClose();
  }, [amount, description, categoryId, date, note, paymentMethod, addExpense, updateExpense, editExpense, onClose, success, error, symbol]);

  const selectedCategory = categories.find((c) => c.id === categoryId) || DEFAULT_CATEGORIES[8];

  const numpadKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "backspace"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="bottom-sheet"
            style={{ background: "var(--bg-card)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--bg-border)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {editExpense ? "Edit Expense" : "Add Expense"}
                </h2>
                {step === "details" && (
                  <button onClick={() => setStep("amount")} className="text-xs text-green-500 font-medium mt-0.5">
                    ← Change amount
                  </button>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                <X size={16} />
              </button>
            </div>

            {/* Amount display */}
            <div className="px-5 pb-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-[var(--text-secondary)]">{symbol}</span>
                <span className={`font-mono font-semibold transition-all ${amount ? "text-4xl text-[var(--text-primary)]" : "text-4xl text-[var(--text-muted)]"}`}>
                  {amount || "0"}
                </span>
              </div>
              {isListening && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-xs text-red-400 mt-1 font-medium"
                >
                  🎙 Listening...
                </motion.div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {step === "amount" ? (
                <motion.div
                  key="amount-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-4 pb-4"
                >
                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {numpadKeys.map((key) => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleNumpad(key)}
                        className="h-14 rounded-2xl font-semibold text-xl flex items-center justify-center transition-colors"
                        style={{
                          background: key === "backspace" ? "var(--bg-elevated)" : "var(--bg-elevated)",
                          color: key === "backspace" ? "var(--text-secondary)" : "var(--text-primary)"
                        }}
                      >
                        {key === "backspace" ? (
                          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                            <path d="M7 1L1 8L7 15H19V1H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                            <path d="M12 5L16 11M16 5L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        ) : key}
                      </motion.button>
                    ))}
                  </div>

                  {/* Voice + Next */}
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoice}
                      className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold border-2 ${isListening ? "border-red-500 bg-red-500/10 text-red-400" : "border-[var(--bg-border)] text-[var(--text-secondary)]"}`}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                      <span>{isListening ? "Stop" : "Voice"}</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAmountNext}
                      disabled={!amount || parseFloat(amount) <= 0}
                      className="flex-[2] h-14 rounded-2xl font-bold text-white text-lg disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      Next →
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="details-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 pb-6 space-y-4"
                >
                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">
                      What for? *
                    </label>
                    <input
                      ref={descRef}
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Lunch at Sharma Restaurant"
                      className="input-base"
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  </div>

                  {/* Category picker */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">
                      Category
                    </label>
                    <button
                      onClick={() => setShowCategoryPicker(true)}
                      className="input-base flex items-center justify-between text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{selectedCategory.icon}</span>
                        <span className="font-medium text-[var(--text-primary)]">{selectedCategory.name}</span>
                      </span>
                      <ChevronDown size={16} className="text-[var(--text-muted)]" />
                    </button>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">
                      Payment Method
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {PAYMENT_METHODS.map((pm) => (
                        <motion.button
                          key={pm.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            paymentMethod === pm.id
                              ? "bg-green-500/15 border-2 border-green-500 text-green-500"
                              : "border-2 border-[var(--bg-border)] text-[var(--text-secondary)]"
                          }`}
                        >
                          <span>{pm.icon}</span>
                          <span>{pm.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                      <Calendar size={11} />Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-base"
                      max={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>

                  {/* Note (optional) */}
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="text-sm text-[var(--text-muted)] flex items-center gap-1"
                  >
                    <StickyNote size={14} />
                    {showMore ? "Hide note" : "Add a note (optional)"}
                  </button>

                  <AnimatePresence>
                    {showMore && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Any additional notes..."
                          rows={2}
                          className="input-base resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Save button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="w-full h-14 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                  >
                    <Check size={20} />
                    {editExpense ? "Update Expense" : "Save Expense"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Category Picker Sheet */}
          <AnimatePresence>
            {showCategoryPicker && (
              <>
                <motion.div
                  className="fixed inset-0 z-[80] bg-black/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCategoryPicker(false)}
                />
                <motion.div
                  className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto"
                  style={{ background: "var(--bg-card)" }}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 38 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 rounded-full bg-[var(--bg-border)]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Select Category</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                          categoryId === cat.id ? "ring-2 ring-green-500" : ""
                        }`}
                        style={{ background: categoryId === cat.id ? `${cat.color}20` : "var(--bg-elevated)" }}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-[var(--text-secondary)] text-center leading-tight">{cat.name}</span>
                        {categoryId === cat.id && (
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </motion.button>
                    ))}
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
