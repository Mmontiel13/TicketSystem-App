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
    description: "Gestiona tu perfil, contraseña y preferencias personales.",
    guide: [
      "1. Haz clic en tu avatar en la esquina inferior izquierda",
      "2. Selecciona 'Mi Cuenta' del menú",
      "3. Edita tu información personal o avatar",
      "4. Guarda los cambios para actualizar tu perfil",
    ],
    keywords: ["password", "contraseña", "nombre", "correo", "email", "perfil", "avatar", "preferencias"],
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: Ticket,
    description: "Crea y gestiona tickets de soporte técnico.",
    guide: [
      "1. Ve a la sección de Tickets desde el menú principal",
      "2. Haz clic en 'Crear nuevo' para abrir el formulario",
      "3. Completa descripción, tipo, prioridad y asigna a miembros",
      "4. Haz clic en 'Crear' para enviar el ticket",
      "5. Visualiza el estado en tiempo real en la tabla",
    ],
    keywords: ["soporte", "problema", "reporte", "incidente", "crear", "formulario", "prioridad"],
  },
  {
    id: "equipos",
    title: "Equipos",
    icon: Users,
    description: "Crea y administra equipos de trabajo.",
    guide: [
      "1. Accede a Equipos desde el menú (solo admin)",
      "2. Haz clic en 'Agregar' para crear un nuevo equipo",
      "3. Define el nombre e icono del equipo",
      "4. Agrega miembros usando 'Agregar integrante'",
      "5. Los miembros aparecerán en la lista del equipo",
    ],
    keywords: ["equipo", "grupo", "miembros", "integrante", "admin", "crear"],
  },
  {
    id: "admin",
    title: "Administración",
    icon: ActivitySquare,
    description: "Panel administrativo para gestionar usuarios y equipos.",
    guide: [
      "1. Accede a Administración (solo admin)",
      "2. Crea y edita usuarios con emails únicos",
      "3. Asigna roles (admin o user) según necesidad",
      "4. Gestiona equipos y sus integrantes",
      "5. Desactiva usuarios innecesarios en lugar de eliminar",
    ],
    keywords: ["admin", "administrador", "usuario", "roles", "permisos", "gestión"],
  },
  {
    id: "kanban",
    title: "Tablero Kanban",
    icon: LayoutGrid,
    description: "Visualiza y gestiona tareas en tablero interactivo.",
    guide: [
      "1. Ve al Tablero Kanban desde el menú",
      "2. Arrastra tareas entre columnas (Estados)",
      "3. Haz clic en + para crear una nueva tarea",
      "4. Las tareas vacías pueden recibir arrastres",
      "5. Edita o elimina tareas desde el icono de menú",
    ],
    keywords: ["kanban", "tablero", "tarea", "arrastrar", "columna", "estado"],
  },
  {
    id: "otras",
    title: "Otras",
    icon: SmilePlus,
    description: "Encuentra información adicional y soporte general.",
    guide: [
      "1. Esta sección contiene ayuda general del sistema",
      "2. Usa la búsqueda para encontrar temas específicos",
      "3. Consulta la 'Política de privacidad' en el pie",
      "4. Para soporte técnico, contacta al equipo de Sistemas",
      "5. Reporta problemas o sugerencias al administrador",
    ],
    keywords: ["ayuda", "soporte", "problema", "privacidad", "contacto"],
  },
];

export function AyudaRapidaView() {
  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<typeof HELP_CARDS[0] | null>(null);

  const filtered = HELP_CARDS.filter((card) => {
    const searchTerm = query.toLowerCase();
    const titleMatch = card.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = card.description.toLowerCase().includes(searchTerm);
    const guideMatch = card.guide.some((step) =>
      step.toLowerCase().includes(searchTerm)
    );
    const keywordsMatch = card.keywords.some((keyword) =>
      keyword.toLowerCase().includes(searchTerm)
    );
    return titleMatch || descriptionMatch || guideMatch || keywordsMatch;
  });

  return (
    <>
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border">
        <h1 className="text-base font-semibold text-foreground tracking-wide">
          Sección de ayuda
        </h1>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 flex flex-col items-center px-8 py-12 gap-10 overflow-y-auto">
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
                onClick={() => setSelectedCard(card)}
                className="flex flex-col items-center text-center gap-3 rounded-lg border border-border bg-card px-6 py-8 hover:bg-accent transition-colors group cursor-pointer"
              >
                <Icon
                  size={52}
                  strokeWidth={1.25}
                  className="text-foreground group-hover:scale-105 transition-transform"
                />
                <span className="text-sm font-semibold text-foreground">
                  {card.title}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 flex flex-col items-center gap-4 py-12">
              <p className="text-sm text-muted-foreground text-center">
                No se encontraron guías para &ldquo;<span className="font-medium">{query}</span>&rdquo;.
              </p>
              <button
                onClick={() => setQuery("")}
                className="px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                Limpiar búsqueda
              </button>
            </div>
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

    {/* Manual de Usuario Modal */}
    {selectedCard && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl border border-border max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = selectedCard.icon;
                return <Icon size={28} className="text-foreground" />;
              })()}
              <h2 className="text-2xl font-semibold text-foreground">
                {selectedCard.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <p className="text-foreground text-base leading-relaxed">
                {selectedCard.description}
              </p>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Pasos para usar esta función:
                </h3>
                <ol className="space-y-2">
                  {selectedCard.guide.map((step, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground leading-relaxed flex gap-3"
                    >
                      <span className="font-medium text-foreground min-w-fit">
                        {(idx + 1).toString()}
                      </span>
                      <span>{step.substring(3)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={() => setSelectedCard(null)}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
