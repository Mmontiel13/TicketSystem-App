import {
  ListTodo,
  Loader,
  MinusCircle,
  CheckCircle2,
  UserCircle,
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  VenetianMask,
  Volleyball,
  Donut,
  HandMetal,
  Sticker,
  Biohazard,
  Skull,
} from "lucide-react";

import type { ColumnConfig, IconUserId } from "./kanban.types";

export const ICON_MAP: Record<IconUserId, React.ElementType> = {
  Ghost,
  Rose,
  Rabbit,
  Users: UserCircle,
  Fish,
  Cat,
  VenetianMask,
  Volleyball,
  Donut,
  "Hand-metal": HandMetal,
  Sticker,
  Biohazard,
  skulls: Skull,
};

export const COLUMNS: ColumnConfig[] = [
  { id: "Tareas", icon: ListTodo, iconClass: "text-foreground" },
  { id: "En proceso", icon: Loader, iconClass: "text-foreground animate-spin" },
  { id: "Pendiente", icon: MinusCircle, iconClass: "text-foreground" },
  {
    id: "Terminada",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
];

// Clases compartidas que hoy están en kanban-view.tsx
export const headerButtonClass =
  "flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 py-2 transition-colors hover:opacity-90";

export const sidebarSurfaceClass =
  "fixed right-0 top-0 z-50 h-full w-full sm:w-80 border-l border-border p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto " +
  "bg-popover/90 backdrop-blur-xl text-popover-foreground";

export const inputClass =
  "w-full rounded-md border border-input bg-background text-foreground text-xs px-3 py-2 outline-none " +
  "placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

export const checkboxClass =
  "w-4 h-4 rounded border-border accent-primary cursor-pointer";