"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "user";
export type IconUserId =
  | "Ghost"
  | "Rose"
  | "Rabbit"
  | "Users"
  | "Fish"
  | "Cat"
  | "Skull"
  | "VenetianMask"
  | "Volleyball"
  | "Donut"
  | "HandMetal"
  | "Sticker"
  | "Biohazard";

export interface UserProfile {
  id: number;
  authId?: string;
  name: string;
  email: string;
  role: UserRole;
  iconId: IconUserId;
  team_id?: number;
  isActive: boolean;
  deletedAt: Date | null;
}

const DEFAULT_USER: UserProfile = {
  id: 0,
  name: "Invitado",
  email: "",
  role: "user",
  iconId: "Users",
  team_id: undefined,
  isActive: false,
  deletedAt: null,
};

interface UserContextValue {
  user: UserProfile;
  users: UserProfile[];
  isLoggedIn: boolean;
  authenticate: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  addUser: (user: Omit<UserProfile, "id" | "deletedAt" | "isActive"> & { id?: number }) => UserProfile;
  updateUser: (id: number, updates: Partial<UserProfile>) => void;
  deactivateUser: (id: number) => void;
}

const UserContext = createContext<UserContextValue>({
  user: DEFAULT_USER,
  users: [],
  isLoggedIn: false,
  authenticate: async () => ({ success: false, message: "Autenticación no configurada" }),
  logout: async () => {},
  addUser: () => DEFAULT_USER,
  updateUser: () => {},
  deactivateUser: () => {},
});

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile>(initialUser ?? DEFAULT_USER);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialUser));

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setIsLoggedIn(true);
    }
  }, [initialUser]);

  const authenticate = async (identifier: string, password: string) => {
    return { success: false, message: "Usa el flujo de inicio de sesión de Supabase." };
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setUser(DEFAULT_USER);
      setIsLoggedIn(false);
    }
  };

  const addUser = (incoming: Omit<UserProfile, "id" | "deletedAt" | "isActive"> & { id?: number }) => {
    const newUserId = incoming.id ?? Date.now();
    const newUser: UserProfile = {
      ...incoming,
      id: newUserId,
      isActive: true,
      deletedAt: null,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: number, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );
    if (user.id === id) {
      setUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const deactivateUser = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, isActive: false, deletedAt: new Date() }
          : u,
      ),
    );
    if (user.id === id) {
      setIsLoggedIn(false);
      setUser(DEFAULT_USER);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, users, isLoggedIn, authenticate, logout, addUser, updateUser, deactivateUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}