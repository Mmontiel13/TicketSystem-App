"use client";

import type React from "react";
import {
  UserCircle,
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  Skull,
  VenetianMask,
  Volleyball,
  Donut,
  HandMetal,
  Sticker,
  Biohazard,
} from "lucide-react";

import type { IconUserId } from "@/lib/user-context";

export const USER_ICON_MAP: Record<IconUserId, React.ElementType> = {
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  Skull,
  VenetianMask,
  Volleyball,
  Donut,
  HandMetal,
  Sticker,
  Biohazard,
  Users: UserCircle,
};

export function getUserIcon(iconId?: IconUserId): React.ElementType {
  return USER_ICON_MAP[iconId ?? "Users"] ?? UserCircle;
}