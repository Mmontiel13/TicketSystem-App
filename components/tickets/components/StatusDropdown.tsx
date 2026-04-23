"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ticket } from "../tickets.types";

export function StatusDropdown({
  value,
  onChange,
  disabled,
}: {
  value: Ticket["status"];
  onChange: (v: Ticket["status"]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const OPTIONS: Ticket["status"][] = ["Pendiente", "En proceso", "Terminada"];

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors min-w-[120px]",
          "border-input bg-background text-foreground",
          "hover:border-ring",
          disabled && "opacity-60 cursor-not-allowed",
        )}
        type="button"
      >
        {value}
        <ChevronDown size={12} />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-full rounded-xl border border-border bg-popover z-50 overflow-hidden shadow-lg"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors",
                  "hover:bg-accent/50",
                  value === opt
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                type="button"
              >
                {opt}
                {value === opt && (
                  <span className="w-1 h-4 rounded-full bg-foreground inline-block" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}