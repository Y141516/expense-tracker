export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

export type CategoryId =
  | "food"
  | "travel"
  | "grocery"
  | "shopping"
  | "bills"
  | "entertainment"
  | "health"
  | "education"
  | "others";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  isCustom?: boolean;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", icon: "🍽️", color: "#f97316", bgColor: "bg-orange-500/20" },
  { id: "travel", name: "Travel", icon: "✈️", color: "#3b82f6", bgColor: "bg-blue-500/20" },
  { id: "grocery", name: "Grocery", icon: "🛒", color: "#22c55e", bgColor: "bg-green-500/20" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#ec4899", bgColor: "bg-pink-500/20" },
  { id: "bills", name: "Bills & Utilities", icon: "⚡", color: "#eab308", bgColor: "bg-yellow-500/20" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#8b5cf6", bgColor: "bg-violet-500/20" },
  { id: "health", name: "Health", icon: "❤️", color: "#ef4444", bgColor: "bg-red-500/20" },
  { id: "education", name: "Education", icon: "📚", color: "#06b6d4", bgColor: "bg-cyan-500/20" },
  { id: "others", name: "Others", icon: "📦", color: "#6b7280", bgColor: "bg-gray-500/20" },
];

export type Expense = {
  id: string;
  user_id?: string;
  amount: number;
  description: string;
  category_id: string;
  date: string;
  note?: string;
  payment_method?: "cash" | "card" | "upi" | "netbanking" | "other";
  created_at?: string;
  updated_at?: string;
};

export type Budget = {
  id: string;
  user_id?: string;
  category_id: string;
  amount: number;
  month: string; // YYYY-MM format
  spent?: number;
  created_at?: string;
};

export type UserProfile = {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  currency: string;
  theme: "light" | "dark" | "system";
  onboarding_complete: boolean;
  monthly_income?: number;
  savings_goal?: number;
  notification_budget_alerts: boolean;
  notification_weekly_summary: boolean;
  notification_monthly_report: boolean;
  created_at?: string;
};

export type InsightType = "saving" | "warning" | "tip" | "achievement";

export type Insight = {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  category?: string;
  icon: string;
  created_at?: string;
};

export type SpendingData = {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
};

export type DailyExpense = {
  date: string;
  amount: number;
  day: string;
};

export type MonthlyTrend = {
  month: string;
  amount: number;
  savings?: number;
};

export type PaymentMethod = {
  id: string;
  label: string;
  icon: string;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "card", label: "Card", icon: "💳" },
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
  { id: "other", label: "Other", icon: "🔄" },
];
