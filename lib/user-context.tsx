"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "admin" | "user";
export type IconUserId = "Ghost" | "Rose" | "Rabbit" | "Users" | "Fish" | "Cat";

export interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  iconId: IconUserId;
  isActive: boolean;
  deletedAt: Date | null;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: 1,
    name: "Admin Principal",
    email: "admin@asiatech.com",
    password: "Admin123!",
    role: "admin",
    iconId: "Users",
    isActive: true,
    deletedAt: null,
  },
  {
    id: 2,
    name: "Usuario Estandar",
    email: "user@asiatech.com",
    password: "User123!",
    role: "user",
    iconId: "Cat",
    isActive: true,
    deletedAt: null,
  },
  {
    id: 3,
    name: "Usuario Inactivo",
    email: "disabled@asiatech.com",
    password: "Disable123!",
    role: "user",
    iconId: "Rabbit",
    isActive: false,
    deletedAt: new Date(),
  },
];

const DEFAULT_USER: MockUser = INITIAL_USERS[0];

interface UserContextValue {
  user: MockUser;
  users: MockUser[];
  isLoggedIn: boolean;
  authenticate: (identifier: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (user: Omit<MockUser, "id" | "deletedAt" | "isActive"> & { id?: number }) => MockUser;
  deactivateUser: (id: number) => void;
}

const UserContext = createContext<UserContextValue>({
  user: DEFAULT_USER,
  users: INITIAL_USERS,
  isLoggedIn: false,
  authenticate: () => ({ success: false, message: "No auth configured" }),
  logout: () => {},
  addUser: () => DEFAULT_USER,
  deactivateUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [user, setUser] = useState<MockUser>(DEFAULT_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const authenticate = (identifier: string, password: string) => {
    const normalized = identifier.trim().toLowerCase();
    const candidate = users.find(
      (u) =>
        (u.email.toLowerCase() === normalized || u.name.toLowerCase() === normalized) &&
        u.password === password,
    );

    if (!candidate) {
      return { success: false, message: "Credenciales incorrectas" };
    }

    if (!candidate.isActive) {
      return { success: false, message: "Usuario inactivo" };
    }

    setUser(candidate);
    setIsLoggedIn(true);

    return { success: true };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(DEFAULT_USER);
  };

  const addUser = (incoming: Omit<MockUser, "id" | "deletedAt" | "isActive"> & { id?: number }) => {
    const newUserId = incoming.id ?? Date.now();
    const newUser: MockUser = {
      ...incoming,
      id: newUserId,
      isActive: true,
      deletedAt: null,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
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
      value={{ user, users, isLoggedIn, authenticate, logout, addUser, deactivateUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
