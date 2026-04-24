"use client";

import { cn } from "@/lib/utils";
import { type IconUserId } from "@/lib/user-context";
import { USER_ICON_MAP } from "@/lib/user-icons";

// ✅ Lista para render (picker) desde el mapa unificado
const USER_ICON_LIST = Object.entries(USER_ICON_MAP).map(([id, icon]) => ({
  id: id as IconUserId,
  icon,
}));

export function UserIconPicker({
  selected,
  onSelect,
}: {
  selected: IconUserId;
  onSelect: (id: IconUserId) => void;
}) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5">
      {USER_ICON_LIST.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
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
        </button>
      ))}
    </div>
  );
}