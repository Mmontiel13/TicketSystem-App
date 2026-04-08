"use client";

import { useState } from "react";
import { X, Plus, Monitor, Printer, Wifi, HelpCircle, UserCircle, Users, Briefcase, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";
import { TicketType } from "@/lib/mock-tickets";
import { ICON_MAP, type IconUserId } from "@/components/kanban-view";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const TICKET_TYPES = [
  { id: "computo", label: "PC", icon: Monitor },
  { id: "impresora", label: "Impresora", icon: Printer },
  { id: "red", label: "Red", icon: Wifi },
  { id: "crm", label: "CRM", icon: Users },
  { id: "programas", label: "Progra", icon: Code },
  { id: "otro", label: "Otro", icon: HelpCircle },
] as const;

const WAIT_STEPS = [
  { label: "10m", value: 10 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
];

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ticket: {
    description: string;
    type: TicketType;
    assignedMemberIds: number[];
    allArea: boolean;
    maxWaitMinutes: number;
  }) => void;
  members: { id: number; full_name: string; avatar_icon?: string }[];
}

export function CreateTicketModal({ open, onClose, onAdd, members }: CreateTicketModalProps) {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [allArea, setAllArea] = useState(false);
  const [waitIndex, setWaitIndex] = useState(1); // default 30mins
  const [errors, setErrors] = useState<{ description?: string; type?: string }>({});

  if (!open) return null;

  const toggleMember = (m: number) => {
    setSelectedMembers((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  };

  const handleAdd = () => {
    const newErrors: { description?: string; type?: string } = {};

    if (!description.trim()) {
      newErrors.description = "La descripción es requerida";
    }
    if (!selectedType) {
      newErrors.type = "Debes seleccionar un tipo de error";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    onAdd({
      description,
      type: selectedType as TicketType,
      assignedMemberIds: allArea ? members.map((m) => m.id) : selectedMembers,
      allArea,
      maxWaitMinutes: WAIT_STEPS[waitIndex].value,
    });

    setDescription("");
    setSelectedType(null);
    setSelectedMembers([]);
    setAllArea(false);
    setWaitIndex(1);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative w-full max-w-sm rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 flex flex-col gap-3 sm:gap-5",
            "bg-popover/80 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
          )}
        >
          {/* Close — círculo con X */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </button>

          {/* Header */}
          <div className="pr-8">
            <h2 className="text-foreground font-semibold text-base sm:text-lg">Agregando un nuevo Ticket</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              El ticket será resuelto según la disponibilidad y urgencia.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block font-medium">
              Descripción del Problema
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe el problema..."
              className={cn(
                "w-full rounded-lg border border-input bg-background text-foreground text-xs sm:text-sm px-3 py-2 resize-none",
                "placeholder:text-muted-foreground/70",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors",
                errors.description && "border-destructive focus:ring-destructive focus:border-destructive"
              )}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          {/* Type - Responsive grid */}
          <div>
            <label className="text-xs sm:text-sm text-muted-foreground mb-2 block font-medium">Tipo de error:</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              {TICKET_TYPES.map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedType(id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-lg border transition-all",
                    "text-[8px] sm:text-[10px] font-medium",
                    selectedType === id
                      ? "border-ring bg-accent text-foreground shadow-md"
                      : "border-border bg-card text-muted-foreground hover:border-ring hover:text-foreground hover:bg-accent/50",
                    errors.type && !selectedType && "border-destructive"
                  )}
                  type="button"
                >
                  <ResponsiveIcon icon={Icon} smSize={16} mdSize={20} />
                  <span className="leading-tight text-center truncate">{label}</span>
                </motion.button>
              ))}
            </div>
            {errors.type && (
              <p className="text-xs text-destructive mt-1">{errors.type}</p>
            )}
          </div>

          {/* Members - Responsive */}
          <div className="max-h-48 sm:max-h-56 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                Integrante Afectado
              </label>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Toda el Área
                <input
                  type="checkbox"
                  checked={allArea}
                  onChange={(e) => setAllArea(e.target.checked)}
                  className="accent-[color:var(--color-primary)] cursor-pointer"
                />
              </label>
            </div>

            <p className="text-xs text-muted-foreground mb-2">Integrantes:</p>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No hay integrantes en el área.
                </p>
              ) : (
                members.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const MemberIcon = ICON_MAP[(m.avatar_icon || "Users") as IconUserId] || UserCircle;
                        return <ResponsiveIcon icon={MemberIcon} smSize={18} mdSize={24} className="text-muted-foreground shrink-0" />;
                      })()}
                      <span className="text-xs sm:text-sm text-foreground truncate">
                        {m.full_name}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allArea || selectedMembers.includes(m.id)}
                      disabled={allArea}
                      onChange={() => toggleMember(m.id)}
                      className="accent-[color:var(--color-primary)] cursor-pointer shrink-0"
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Wait time slider - Responsive */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm text-muted-foreground block text-center font-medium">
              Tiempo Máximo que puedes esperar
            </label>
            <div className="px-1">
              <input
                type="range"
                min={0}
                max={WAIT_STEPS.length - 1}
                step={1}
                value={waitIndex}
                onChange={(e) => setWaitIndex(Number(e.target.value))}
                className="w-full accent-[color:var(--color-primary)] cursor-pointer"
              />
            </div>
            <div className="flex justify-between px-1">
              {WAIT_STEPS.map((s, i) => (
                <span
                  key={s.value}
                  className={cn(
                    "text-[8px] sm:text-[10px] font-medium transition-colors",
                    i === waitIndex ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              ))}
            </div>
            {/* Display current value */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Máximo: <span className="text-foreground font-semibold">{WAIT_STEPS[waitIndex].value} minutos</span>
              </p>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            disabled={!description.trim() || !selectedType}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2 sm:py-2.5 rounded-lg",
              "bg-primary text-primary-foreground text-xs sm:text-sm font-medium",
              "hover:opacity-90 transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed mt-2 sm:mt-0"
            )}
            type="button"
          >
            <ResponsiveIcon icon={Plus} smSize={14} mdSize={16} />
            Agregar
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}