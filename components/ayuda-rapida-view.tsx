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
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";

const HELP_CARDS = [
  {
    id: "cuenta",
    title: "Mi Cuenta",
    icon: UserCircle,
    description: "Gestiona tu perfil, contraseña y preferencias personales.",
    guide: [
      "Haz clic en tu avatar en la esquina inferior izquierda",
      "Selecciona 'Mi Cuenta' del menú",
      "Edita tu información personal o avatar",
      "Guarda los cambios para actualizar tu perfil",
    ],
    keywords: ["password", "contraseña", "nombre", "correo", "email", "perfil", "avatar", "preferencias"],
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: Ticket,
    description: "Crea y gestiona tickets de soporte técnico.",
    guide: [
      "Ve a la sección de Tickets desde el menú principal",
      "Haz clic en 'Crear nuevo' para abrir el formulario",
      "Completa descripción, tipo, prioridad y asigna a miembros",
      "Haz clic en 'Crear' para enviar el ticket",
      "Visualiza el estado en tiempo real en la tabla",
    ],
    keywords: ["soporte", "problema", "reporte", "incidente", "crear", "formulario", "prioridad"],
  },
  {
    id: "equipos",
    title: "Equipos",
    icon: Users,
    description: "Crea y administra equipos de trabajo.",
    guide: [
      "Accede a Equipos desde el menú (solo admin)",
      "Haz clic en 'Agregar' para crear un nuevo equipo",
      "Define el nombre e icono del equipo",
      "Agrega miembros usando 'Agregar integrante'",
      "Los miembros aparecerán en la lista del equipo",
    ],
    keywords: ["equipo", "grupo", "miembros", "integrante", "admin", "crear"],
  },
  {
    id: "admin",
    title: "Administración",
    icon: ActivitySquare,
    description: "Panel administrativo para gestionar usuarios y equipos.",
    guide: [
      "Accede a Administración (solo admin)",
      "Crea y edita usuarios con emails únicos",
      "Asigna roles (admin o user) según necesidad",
      "Gestiona equipos y sus integrantes",
      "Desactiva usuarios innecesarios en lugar de eliminar",
    ],
    keywords: ["admin", "administrador", "usuario", "roles", "permisos", "gestión"],
  },
  {
    id: "kanban",
    title: "Tablero Kanban",
    icon: LayoutGrid,
    description: "Visualiza y gestiona tareas en tablero interactivo.",
    guide: [
      "Ve al Tablero Kanban desde el menú",
      "Arrastra tareas entre columnas (Estados)",
      "Haz clic en + para crear una nueva tarea",
      "Las tareas vacías pueden recibir arrastres",
      "Edita o elimina tareas desde el icono de menú",
    ],
    keywords: ["kanban", "tablero", "tarea", "arrastrar", "columna", "estado"],
  },
  {
    id: "otras",
    title: "Otras",
    icon: SmilePlus,
    description: "Encuentra información adicional y soporte general.",
    guide: [
      "Esta sección contiene ayuda general del sistema",
      "Usa la búsqueda para encontrar temas específicos",
      "Consulta la 'Política de privacidad' en el pie",
      "Para soporte técnico, contacta al equipo de Sistemas",
      "Reporta problemas o sugerencias al administrador",
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
        <header className="flex items-center justify-between px-3 sm:px-4 md:px-8 py-3 sm:py-4 border-b border-border shrink-0">
          <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-wide">
            Sección de ayuda
          </h1>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 flex flex-col items-center px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-12 gap-6 sm:gap-8 md:gap-10 overflow-y-auto">
          {/* Hero search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5 w-full max-w-xs sm:max-w-sm md:max-w-xl"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground text-balance text-center">
              Estamos aqui para Ayudar
            </h2>
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar"
                className="w-full rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-ring transition"
              />
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none sm:block hidden"
              />
              <Search
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none sm:hidden"
              />
            </div>
          </motion.div>

          {/* Cards grid - responsive */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full max-w-xs sm:max-w-2xl md:max-w-4xl"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCard(card)}
                    className={cn(
                      "flex flex-col items-center text-center gap-2 sm:gap-3 rounded-lg border border-border bg-card px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8",
                      "hover:bg-accent transition-colors group cursor-pointer"
                    )}
                  >
                    <Icon
                      size={32}
                      strokeWidth={1.25}
                      className="text-foreground group-hover:scale-105 transition-transform sm:hidden"
                    />
                    <Icon
                      size={40}
                      strokeWidth={1.25}
                      className="text-foreground group-hover:scale-105 transition-transform hidden sm:block md:hidden"
                    />
                    <Icon
                      size={52}
                      strokeWidth={1.25}
                      className="text-foreground group-hover:scale-105 transition-transform hidden md:block"
                    />
                    <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground">
                      {card.title}
                    </span>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {/* Empty state */}
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center gap-3 sm:gap-4 py-8 sm:py-12"
              >
                <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                  No se encontraron guías para <span className="font-medium">&quot;{query}&quot;</span>.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuery("")}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border bg-card text-foreground text-xs sm:text-sm font-medium hover:bg-accent transition-colors"
                >
                  Limpiar búsqueda
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 md:px-8 py-3 sm:py-4 border-t border-border text-center sm:text-left shrink-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Un proyecto del{" "}
            <span className="font-semibold text-foreground">
              Equipo de Sistemas
            </span>
          </p>
          <a
            href="#"
            className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline whitespace-nowrap"
          >
            Política de privacidad
          </a>
        </footer>
      </div>

      {/* Manual de Usuario Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg sm:rounded-xl border border-border max-w-xs sm:max-w-md md:max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-border shrink-0 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <ResponsiveIcon icon={selectedCard.icon} smSize={20} mdSize={28} className="text-foreground shrink-0" />
                  <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-foreground truncate">
                    {selectedCard.title}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedCard(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-lg shrink-0"
                  aria-label="Cerrar"
                >
                  <ResponsiveIcon icon={X} smSize={16} mdSize={20} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <p className="text-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                    {selectedCard.description}
                  </p>
                  <div className="border-t border-border pt-3 sm:pt-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">
                      Pasos para usar esta función:
                    </h3>
                    <ol className="space-y-1.5 sm:space-y-2">
                      {selectedCard.guide.map((step, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex gap-2 sm:gap-3"
                        >
                          <span className="font-medium text-foreground min-w-fit shrink-0">
                            {(idx + 1).toString()}
                          </span>
                          <span className="text-left">{step}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-border shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCard(null)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border bg-card text-foreground text-xs sm:text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}