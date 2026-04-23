"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TEAM_ICONS, type TeamIconId } from "@/lib/team-icons";

export function IconPicker({
  selected,
  onSelect,
}: {
  selected: TeamIconId;
  onSelect: (id: TeamIconId) => void;
}) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
      {TEAM_ICONS.map(({ id, icon: Icon }) => (
        <motion.button
          key={id}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => onSelect(id)}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center border transition-colors",
            selected === id
              ? "bg-primary text-primary-foreground border-border"
              : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-accent",
          )}
          aria-label={id}
          aria-pressed={selected === id}
        >
          <Icon size={14} className={selected === id ? "text-primary-foreground" : ""} />
        </motion.button>
      ))}
    </div>
  );
}