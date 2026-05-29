"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AddExpenseModal } from "./AddExpenseModal";

export function AddExpenseFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        className="fab"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Add expense"
      >
        <Plus size={26} className="text-white" strokeWidth={2.5} />
      </motion.button>
      <AddExpenseModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
