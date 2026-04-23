"use client";

import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getTeamIcon } from "@/lib/team-icons";
import { ResponsiveIcon } from "@/components/responsive-icon";
import type { Team } from "./types";

export function TeamCard({
  team,
  active,
  onClick,
}: {
  team: Team;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = getTeamIcon(team.iconId);

  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 rounded-lg border text-left transition-colors gap-2",
        "border-border bg-card hover:bg-accent/60",
        active && "bg-accent",
      )}
      type="button"
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
          <ResponsiveIcon icon={Icon} smSize={16} mdSize={20} className="text-foreground" />
        </div>
        <span className="text-foreground text-xs sm:text-sm font-medium truncate">{team.name}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
        <Users size={12} className="sm:block hidden" />
        <span className="hidden sm:inline">Integrantes:</span>
        <span className="text-foreground font-semibold">{team.members.filter((m) => m.isActive).length}</span>
      </div>
    </motion.button>
  );
}