import { Expense, Budget, UserProfile, Category, DEFAULT_CATEGORIES } from "@/types";
import { format } from "date-fns";

const KEYS = {
  EXPENSES: "et_expenses",
  BUDGETS: "et_budgets",
  PROFILE: "et_profile",
  CATEGORIES: "et_categories",
  ONBOARDING: "et_onboarding_done",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Profile
export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(KEYS.PROFILE);
  if (!data) return null;
  return JSON.parse(data);
}

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = getProfile();
  const updated: UserProfile = {
    id: existing?.id || generateId(),
    currency: "INR",
    theme: "system",
    onboarding_complete: false,
    notification_budget_alerts: true,
    notification_weekly_summary: true,
    notification_monthly_report: true,
    ...existing,
    ...profile,
  };
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

// Categories
export function getCategories(): Category[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  const data = localStorage.getItem(KEYS.CATEGORIES);
  const custom: Category[] = data ? JSON.parse(data) : [];
  return [...DEFAULT_CATEGORIES, ...custom];
}

export function saveCustomCategory(category: Omit<Category, "id">): Category {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  const custom: Category[] = data ? JSON.parse(data) : [];
  const newCat: Category = { ...category, id: generateId(), isCustom: true };
  custom.push(newCat);
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(custom));
  return newCat;
}

export function deleteCustomCategory(id: string): void {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  const custom: Category[] = data ? JSON.parse(data) : [];
  const updated = custom.filter((c) => c.id !== id);
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(updated));
}

// Expenses
export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.EXPENSES);
  return data ? JSON.parse(data) : [];
}

export function getExpensesByMonth(month: string): Expense[] {
  return getExpenses().filter((e) => e.date.startsWith(month));
}

export function getExpensesByDateRange(start: string, end: string): Expense[] {
  return getExpenses().filter((e) => e.date >= start && e.date <= end);
}

export function addExpense(expense: Omit<Expense, "id" | "created_at">): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    created_at: new Date().toISOString(),
    date: expense.date || format(new Date(), "yyyy-MM-dd"),
  };
  expenses.unshift(newExpense);
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const expenses = getExpenses();
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  expenses[idx] = { ...expenses[idx], ...updates };
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  return expenses[idx];
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter((e) => e.id !== id);
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
}

// Budgets
export function getBudgets(): Budget[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.BUDGETS);
  return data ? JSON.parse(data) : [];
}

export function getBudgetsByMonth(month: string): Budget[] {
  return getBudgets().filter((b) => b.month === month);
}

export function setBudget(categoryId: string, amount: number, month: string): Budget {
  const budgets = getBudgets();
  const existingIdx = budgets.findIndex(
    (b) => b.category_id === categoryId && b.month === month
  );
  if (existingIdx !== -1) {
    budgets[existingIdx].amount = amount;
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
    return budgets[existingIdx];
  }
  const newBudget: Budget = {
    id: generateId(),
    category_id: categoryId,
    amount,
    month,
    created_at: new Date().toISOString(),
  };
  budgets.push(newBudget);
  localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  return newBudget;
}

export function deleteBudget(id: string): void {
  const budgets = getBudgets().filter((b) => b.id !== id);
  localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
}

// Analytics helpers
export function getMonthlyTotal(month: string): number {
  return getExpensesByMonth(month).reduce((sum, e) => sum + e.amount, 0);
}

export function getCategoryTotals(month: string): Record<string, number> {
  const expenses = getExpensesByMonth(month);
  const totals: Record<string, number> = {};
  expenses.forEach((e) => {
    totals[e.category_id] = (totals[e.category_id] || 0) + e.amount;
  });
  return totals;
}

export function getDailyTotals(month: string): Record<string, number> {
  const expenses = getExpensesByMonth(month);
  const totals: Record<string, number> = {};
  expenses.forEach((e) => {
    totals[e.date] = (totals[e.date] || 0) + e.amount;
  });
  return totals;
}

export function getWeeklyTotals(): { week: string; amount: number }[] {
  const expenses = getExpenses();
  const weeks: Record<string, number> = {};
  expenses.slice(0, 200).forEach((e) => {
    const date = new Date(e.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = format(weekStart, "MMM d");
    weeks[weekKey] = (weeks[weekKey] || 0) + e.amount;
  });
  return Object.entries(weeks)
    .map(([week, amount]) => ({ week, amount }))
    .slice(-8);
}

export function getMonthlyTrends(months: number = 6): { month: string; amount: number }[] {
  const result = [];
  const now = new Date();
  // Pin to 1st of current month to avoid day-overflow bugs (e.g. May 31 - 3 months ≠ Feb)
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const monthKey = format(date, "yyyy-MM");
    const monthLabel = format(date, "MMM yy");
    result.push({ month: monthLabel, amount: getMonthlyTotal(monthKey) });
  }
  return result;
}

// Smart auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["restaurant", "cafe", "coffee", "lunch", "dinner", "breakfast", "pizza", "burger", "swiggy", "zomato", "food", "eat", "meal", "biryani", "dosa", "chai", "tea", "snack", "hotel", "dhaba"],
  travel: ["uber", "ola", "rapido", "metro", "bus", "train", "flight", "petrol", "fuel", "diesel", "cab", "taxi", "auto", "rickshaw", "irctc", "makemytrip", "travel", "trip"],
  grocery: ["grocery", "vegetables", "fruits", "milk", "bread", "eggs", "supermarket", "big bazaar", "dmart", "reliance", "fresh", "kirana", "vegetables"],
  shopping: ["amazon", "flipkart", "myntra", "meesho", "clothes", "shirt", "shoes", "shopping", "mall", "purchase", "buy", "order"],
  bills: ["electricity", "water", "gas", "internet", "wifi", "mobile", "recharge", "dth", "rent", "emi", "insurance", "bill", "payment", "postpaid"],
  entertainment: ["netflix", "hotstar", "amazon prime", "spotify", "movie", "cinema", "game", "gaming", "concert", "show", "ticket", "youtube", "entertainment"],
  health: ["medicine", "pharmacy", "hospital", "doctor", "medical", "health", "gym", "fitness", "yoga", "clinic", "chemist", "apollo", "medplus"],
  education: ["school", "college", "course", "book", "stationery", "tuition", "fees", "library", "udemy", "coursera", "education", "class"],
};

export function autoCategorizee(description: string): string {
  const lower = description.toLowerCase();
  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return categoryId;
    }
  }
  return "others";
}

// Generate smart insights
export function generateInsights(month: string) {
  const expenses = getExpensesByMonth(month);
  const budgets = getBudgetsByMonth(month);
  const categories = getCategories();
  const categoryTotals = getCategoryTotals(month);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const insights = [];

  // Budget warnings
  budgets.forEach((budget) => {
    const spent = categoryTotals[budget.category_id] || 0;
    const percentage = (spent / budget.amount) * 100;
    const cat = categories.find((c) => c.id === budget.category_id);
    if (percentage >= 100) {
      insights.push({
        id: `over_${budget.category_id}`,
        type: "warning" as const,
        title: `${cat?.name || budget.category_id} Over Budget!`,
        message: `You've exceeded your ${cat?.name} budget by ₹${(spent - budget.amount).toLocaleString("en-IN")}. Consider reducing spending in this category.`,
        category: budget.category_id,
        icon: "🚨",
      });
    } else if (percentage >= 80) {
      insights.push({
        id: `warn_${budget.category_id}`,
        type: "warning" as const,
        title: `${cat?.name || budget.category_id} Budget Alert`,
        message: `You've used ${Math.round(percentage)}% of your ${cat?.name} budget. Only ₹${(budget.amount - spent).toLocaleString("en-IN")} remaining.`,
        category: budget.category_id,
        icon: "⚠️",
      });
    }
  });

  // Top spending category
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const cat = categories.find((c) => c.id === topCategory[0]);
    const pct = Math.round((topCategory[1] / totalSpent) * 100);
    if (pct > 40) {
      insights.push({
        id: "top_category",
        type: "tip" as const,
        title: `High ${cat?.name} Spending`,
        message: `${cat?.name} accounts for ${pct}% of your total expenses this month (₹${topCategory[1].toLocaleString("en-IN")}). Look for ways to optimize.`,
        category: topCategory[0],
        icon: cat?.icon || "💡",
      });
    }
  }

  // Saving tip
  if (totalSpent > 0) {
    insights.push({
      id: "saving_tip",
      type: "saving" as const,
      title: "Smart Saving Tip",
      message: "Try the 50/30/20 rule: 50% on needs, 30% on wants, and 20% on savings. Review your spending categories to align with this goal.",
      icon: "💰",
    });
  }

  return insights;
}

export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

// ── Budget copy helpers ────────────────────────────────────────
export function hasBudgetsForMonth(month: string): boolean {
  return getBudgets().some((b) => b.month === month);
}

export function copyBudgetsToMonth(fromMonth: string, toMonth: string): void {
  const source = getBudgets().filter((b) => b.month === fromMonth);
  source.forEach((b) => setBudget(b.category_id, b.amount, toMonth));
}

export function getPreviousMonthKey(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2, 1); // m-2 because months are 0-indexed
  return format(date, "yyyy-MM");
}

