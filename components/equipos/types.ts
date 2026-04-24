import type { IconUserId } from "@/lib/user-context";
import type { TeamIconId } from "@/lib/team-icons";

export type IconId = TeamIconId;

export type EditingUser = {
  id: string | number;
  full_name: string;
  email: string;
  avatar_icon: IconUserId;
};

export type TeamMember = {
  id: string | number;
  name: string;
  full_name?: string;
  email: string;
  iconId: IconUserId;
  role: "user" | "admin";
  isActive: boolean;
  deletedAt: Date | null;
};

export interface Team {
  id: number;
  name: string;
  area: string;
  iconId: IconId;
  members: TeamMember[];
}