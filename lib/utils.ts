import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { CURRENCIES } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode: string = "INR"): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol || "₹";
  if (amount >= 10000000) return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyFull(amount: number, currencyCode: string = "INR"): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol || "₹";
  return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM, yyyy");
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), "d MMM");
}

export function formatTimeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return format(date, "MMMM yyyy");
}

export function getPreviousMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 2, 1);
  return format(date, "yyyy-MM");
}

export function getBudgetStatus(spent: number, budget: number): {
  percentage: number;
  status: "safe" | "warning" | "danger" | "exceeded";
  color: string;
} {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  if (percentage >= 100) return { percentage, status: "exceeded", color: "#ef4444" };
  if (percentage >= 90)  return { percentage, status: "danger",   color: "#ef4444" };
  if (percentage >= 70)  return { percentage, status: "warning",  color: "#f97316" };
  return { percentage, status: "safe", color: "#22c55e" };
}

export function groupExpensesByDate(expenses: import("@/types").Expense[]) {
  const groups: Record<string, typeof expenses> = {};
  expenses.forEach((expense) => {
    const key = expense.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(expense);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      items,
      total: items.reduce((sum, e) => sum + e.amount, 0),
    }));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getSavingsPercentage(income: number, spent: number): number {
  if (income <= 0) return 0;
  return Math.max(0, Math.round(((income - spent) / income) * 100));
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// Voice recognition helper
export function startVoiceRecognition(
  onResult: (text: string) => void,
  onError: (err: string) => void
): (() => void) | null {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    onError("Voice input not supported in this browser");
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event: { results: { transcript: string }[][] }) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };
  recognition.onerror = (event: { error: string }) => {
    onError(`Voice error: ${event.error}`);
  };
  recognition.start();
  return () => recognition.stop();
}

// Parse voice input to extract amount and description
export function parseVoiceInput(text: string): { amount: number; description: string } {
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹)?/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  const description = text.replace(/\d+(?:\.\d+)?\s*(?:rupees?|rs\.?|₹)?/gi, "").trim() || text;
  return { amount, description };
}

export function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  return Notification.requestPermission().then((perm) => perm === "granted");
}

export function sendLocalNotification(title: string, body: string, icon = "/icons/icon-192.png") {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon });
  }
}
