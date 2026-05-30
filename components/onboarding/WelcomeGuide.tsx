"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    emoji: "⚡",
    gradient: "from-green-500/20 to-emerald-600/10",
    accent: "#22c55e",
    title: "Add expenses instantly",
    desc: "Tap the green + button anywhere. Enter amount, describe it, done. Takes under 5 seconds.",
    hint: "Amount → Description → Save ✓",
  },
  {
    emoji: "🎯",
    gradient: "from-violet-500/20 to-purple-600/10",
    accent: "#8b5cf6",
    title: "Set monthly budgets",
    desc: "Go to Budgets → Set a limit per category. The app alerts you at 80% and 100%. Budgets reset every month automatically.",
    hint: "Each budget = that month only",
  },
  {
    emoji: "📊",
    gradient: "from-cyan-500/20 to-blue-600/10",
    accent: "#06b6d4",
    title: "Track & analyse spending",
    desc: "Dashboard shows today, this week, and this month at a glance. Analytics gives charts, trends, and a heatmap.",
    hint: "Home · Expenses · Analytics · Budgets",
  },
  {
    emoji: "📄",
    gradient: "from-amber-500/20 to-orange-600/10",
    accent: "#f59e0b",
    title: "Export reports anytime",
    desc: "Tap Reports to download a PDF or Excel file for any month. Great for tax time or reviewing the year.",
    hint: "Reports → pick month → Download",
  },
  {
    emoji: "🔒",
    gradient: "from-rose-500/20 to-pink-600/10",
    accent: "#f43f5e",
    title: "Your data stays private",
    desc: "Everything is saved on this device only. Nothing is sent to a server. Clear data anytime from Settings.",
    hint: "Local-first · 100% private",
  },
];

interface WelcomeGuideProps {
  onDone: () => void;
}

export function WelcomeGuide({ onDone }: WelcomeGuideProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const isLast = current === SLIDES.length - 1;

  const go = (next: number) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  };

  const slide = SLIDES[current];

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Skip */}
      <div className="flex justify-end px-5 pt-5 pb-2">
        <button
          onClick={onDone}
          className="text-sm font-semibold px-3 py-1.5 rounded-xl"
          style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
        >
          Skip
        </button>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 60 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -60 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Icon bubble */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className={`w-28 h-28 rounded-3xl flex items-center justify-center text-6xl mb-8 bg-gradient-to-br ${slide.gradient}`}
              style={{
                boxShadow: `0 8px 32px ${slide.accent}30`,
                border: `1.5px solid ${slide.accent}30`,
              }}
            >
              {slide.emoji}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-black mb-3 leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {slide.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base leading-relaxed mb-5"
              style={{ color: "var(--text-secondary)", maxWidth: 320 }}
            >
              {slide.desc}
            </motion.p>

            {/* Hint chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 }}
              className="px-4 py-2 rounded-full text-xs font-bold"
              style={{
                background: `${slide.accent}18`,
                color: slide.accent,
                border: `1px solid ${slide.accent}30`,
              }}
            >
              {slide.hint}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-10 flex flex-col items-center gap-5">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => go(i)}>
              <motion.div
                animate={{
                  width: i === current ? 22 : 7,
                  background: i === current ? slide.accent : "var(--bg-border)",
                }}
                className="h-2 rounded-full"
                transition={{ duration: 0.25 }}
              />
            </button>
          ))}
        </div>

        {/* CTA button */}
        <div className="flex w-full gap-3">
          {current > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => go(current - 1)}
              className="flex-1 h-14 rounded-2xl font-bold text-sm border-2"
              style={{
                borderColor: "var(--bg-border)",
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
              }}
            >
              ← Back
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => (isLast ? onDone() : go(current + 1))}
            className="flex-[2] h-14 rounded-2xl font-black text-white text-base"
            style={{
              background: isLast
                ? `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: `0 4px 20px ${isLast ? slide.accent : "#22c55e"}40`,
            }}
          >
            {isLast ? "Let's start! 🚀" : "Next →"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
