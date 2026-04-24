"use client";

import type React from "react";
import {
  HelpCircle,
  BadgeDollarSign,
  Computer,
  ShoppingCart,
  BookUser,
  Clapperboard,
  Car,
  EthernetPort,
  Siren,
  Scale,
  ConciergeBell,
  Calculator,
  Trophy,
  PackageOpen,
  SolarPanel,
} from "lucide-react";

// 1) Lista única (para pickers y para map)
export const TEAM_ICONS = [
  { id: "BadgeDollarSign", icon: BadgeDollarSign },
  { id: "Computer", icon: Computer },
  { id: "ShoppingCart", icon: ShoppingCart },
  { id: "BookUser", icon: BookUser },
  { id: "Clapperboard", icon: Clapperboard },
  { id: "Car", icon: Car },
  { id: "EthernetPort", icon: EthernetPort },
  { id: "Siren", icon: Siren },
  { id: "Scale", icon: Scale },
  { id: "ConciergeBell", icon: ConciergeBell },
  { id: "Calculator", icon: Calculator },
  { id: "Trophy", icon: Trophy },
  { id: "PackageOpen", icon: PackageOpen },
  { id: "SolarPanel", icon: SolarPanel },
] as const;

export type TeamIconId = (typeof TEAM_ICONS)[number]["id"];

// 2) Map rápido
export const TEAM_ICON_MAP: Record<TeamIconId, React.ElementType> = TEAM_ICONS.reduce(
  (acc, { id, icon }) => {
    acc[id] = icon;
    return acc;
  },
  {} as Record<TeamIconId, React.ElementType>,
);

// 3) Resolver con fallback (para cuando venga string desde DB)
export function getTeamIcon(iconId?: string): React.ElementType {
  if (!iconId) return HelpCircle;
  return (TEAM_ICON_MAP as Record<string, React.ElementType>)[iconId] ?? HelpCircle;
}