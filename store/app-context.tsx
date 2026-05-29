"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserProfile, Expense, Budget, Category } from "@/types";
import * as storage from "@/lib/storage";
import { getCurrentMonth } from "@/lib/utils";

interface AppState {
  profile: UserProfile | null;
  expenses: Expense[];
  budgets: Budget[];
  categories: Category[];
  currentMonth: string;
  isLoading: boolean;
  setProfile: (p: Partial<UserProfile>) => void;
  addExpense: (e: Omit<Expense, "id" | "created_at">) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  setBudget: (categoryId: string, amount: number, month?: string) => void;
  deleteBudget: (id: string) => void;
  addCategory: (cat: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  setCurrentMonth: (month: string) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentMonth, setCurrentMonthState] = useState(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(() => {
    setProfileState(storage.getProfile());
    setExpenses(storage.getExpenses());
    setBudgets(storage.getBudgets());
    setCategories(storage.getCategories());
  }, []);

  useEffect(() => {
    refreshData();
    setIsLoading(false);
  }, [refreshData]);

  const setProfile = useCallback((p: Partial<UserProfile>) => {
    const updated = storage.saveProfile(p);
    setProfileState(updated);
  }, []);

  const addExpense = useCallback((e: Omit<Expense, "id" | "created_at">) => {
    const newExpense = storage.addExpense(e);
    setExpenses(storage.getExpenses());
    return newExpense;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    storage.updateExpense(id, updates);
    setExpenses(storage.getExpenses());
  }, []);

  const deleteExpense = useCallback((id: string) => {
    storage.deleteExpense(id);
    setExpenses(storage.getExpenses());
  }, []);

  const setBudget = useCallback((categoryId: string, amount: number, month?: string) => {
    storage.setBudget(categoryId, amount, month || currentMonth);
    setBudgets(storage.getBudgets());
  }, [currentMonth]);

  const deleteBudget = useCallback((id: string) => {
    storage.deleteBudget(id);
    setBudgets(storage.getBudgets());
  }, []);

  const addCategory = useCallback((cat: Omit<Category, "id">) => {
    storage.saveCustomCategory(cat);
    setCategories(storage.getCategories());
  }, []);

  const deleteCategory = useCallback((id: string) => {
    storage.deleteCustomCategory(id);
    setCategories(storage.getCategories());
  }, []);

  const setCurrentMonth = useCallback((month: string) => {
    setCurrentMonthState(month);
  }, []);

  return (
    <AppContext.Provider value={{
      profile, expenses, budgets, categories, currentMonth, isLoading,
      setProfile, addExpense, updateExpense, deleteExpense,
      setBudget, deleteBudget, addCategory, deleteCategory,
      setCurrentMonth, refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
