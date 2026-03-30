"use client";

import { useState } from "react";
import {
  Search,
  UserCircle,
  Ticket,
  Users,
  ActivitySquare,
  LayoutGrid,
  SmilePlus,
} from "lucide-react";

const HELP_CARDS = [
  {
    id: "cuenta",
    title: "Mi Cuenta",
    icon: UserCircle,
    description:
      "Lorem ipsum dolor sit amet consectetur. Elementum tortor vestibulum eget quis.",
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: Ticket,
    description:
      "Lorem ipsum dolor sit amet consectetur. Elementum tortor vestibulum eget quis.",
  },
  {
    id: "equipos",
    title: "Equipos",
    icon: Users,
    description:
      "Lorem ipsum dolor sit amet consectetur. Elementum tortor vestibulum eget quis.",
  },
  {
    id: "admin",
    title: "Administración",
    icon: ActivitySquare,
    description:
      "Lorem ipsum dolor sit amet consectetur. Elementum tortor vestibulum eget quis.",
  },
  {
    id: "kanban",
    title: "Tablero Kanban",
    icon: LayoutGrid,
    description:
      "Lorem ipsum dolor sit amet consectetur. Elementum tortor vestibulum eget quis.",
  },
  {
    id: "otras",
    title: "Otras",
    icon: SmilePlus,
    description:
      "Lorem ipsum dolor sit amet consectetur. Elementum tortor vestibulum eget quis.",
  },
];

export function AyudaRapidaView() {
  const [query, setQuery] = useState("");

  const filtered = HELP_CARDS.filter((card) =>
    card.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border">
        <h1 className="text-base font-semibold text-foreground tracking-wide">
          Sección de ayuda
        </h1>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 flex flex-col items-center px-8 py-12 gap-10">
        {/* Hero search */}
        <div className="flex flex-col items-center gap-5 w-full max-w-xl">
          <h2 className="text-2xl font-semibold text-foreground text-balance text-center">
            Estamos aqui para Ayudar
          </h2>
          <div className="relative w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition"
            />
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* 3×2 cards grid */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
          {filtered.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                className="flex flex-col items-center text-center gap-3 rounded-lg border border-border bg-card px-6 py-8 hover:bg-accent transition-colors group"
              >
                <Icon
                  size={52}
                  strokeWidth={1.25}
                  className="text-foreground group-hover:scale-105 transition-transform"
                />
                <span className="text-sm font-semibold text-foreground">
                  {card.title}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground py-10">
              No se encontraron resultados para &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-8 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Un proyecto del{" "}
          <span className="font-semibold text-foreground">
            Equipo de Sistemas
          </span>
        </p>
        <a
          href="#"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          Política de privacidad
        </a>
      </footer>
    </div>
  );
}
