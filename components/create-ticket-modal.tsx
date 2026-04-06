"use client";

import { useState } from "react";
import { X, Plus, Monitor, Printer, Wifi, HelpCircle, UserCircle, Users, Briefcase, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketType } from "@/lib/mock-tickets";
import { ICON_MAP, type IconUserId } from "@/components/kanban-view";
import { useToast } from "@/hooks/use-toast";

const TICKET_TYPES = [
  { id: "computo", label: "PC", icon: Monitor },
  { id: "impresora", label: "Impresora", icon: Printer },
  { id: "red", label: "Red", icon: Wifi },
  { id: "crm", label: "CRM", icon: Users },
  { id: "programas", label: "Progra", icon: Code },
  { id: "otro", label: "Otro", icon: HelpCircle },
] as const;

const WAIT_STEPS = [
  { label: "10mins", value: 10 },
  { label: "30mins", value: 30 },
  { label: "1Hrs", value: 60 },
  { label: "Puede Esperar", value: 120 },
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
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-sm rounded-2xl border border-border p-6 flex flex-col gap-5",
          // “glass” effect compatible con ambos temas
          "bg-popover/80 backdrop-blur-xl"
        )}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-foreground font-semibold text-base">Agregando un nuevo Ticket</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            El ticket será resuelto según la disponibilidad y urgencia.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Descripción del Problema
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe el problema..."
            className={cn(
              "w-full rounded-lg border border-input bg-background text-foreground text-sm px-3 py-2 resize-none",
              "placeholder:text-muted-foreground/70",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors",
              errors.description && "border-destructive focus:ring-destructive focus:border-destructive"
            )}
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">{errors.description}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Tipo de error:</label>
          <div className="flex gap-3">
            {TICKET_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors text-[10px]",
                  selectedType === id
                    ? "border-ring bg-accent text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-ring hover:text-foreground",
                  errors.type && "border-destructive"
                )}
                type="button"
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
          {errors.type && (
            <p className="text-xs text-destructive mt-1">{errors.type}</p>
          )}
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Integrante Afectado</label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              Toda el Área
              <input
                type="checkbox"
                checked={allArea}
                onChange={(e) => setAllArea(e.target.checked)}
                className="accent-[color:var(--color-primary)]"
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground mb-2">Integrantes:</p>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay integrantes en el área.</p>
            ) : (
              members.map((m) => (
                <label key={m.id} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ICON_MAP[(m.avatar_icon || "Users") as IconUserId] || UserCircle;
                      return <Icon size={24} className="text-muted-foreground" />;
                    })()}
                    <span className="text-sm text-foreground">{m.full_name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allArea || selectedMembers.includes(m.id)}
                    disabled={allArea}
                    onChange={() => toggleMember(m.id)}
                    className="accent-[color:var(--color-primary)]"
                  />
                </label>
              ))
            )}
          </div>
        </div>

        {/* Wait time slider */}
        <div>
          <label className="text-xs text-muted-foreground mb-3 block text-center">
            Tiempo Máximo que puedes esperar
          </label>
          <input
            type="range"
            min={0}
            max={WAIT_STEPS.length - 1}
            step={1}
            value={waitIndex}
            onChange={(e) => setWaitIndex(Number(e.target.value))}
            className="w-full accent-[color:var(--color-primary)]"
          />
          <div className="flex justify-between mt-1">
            {WAIT_STEPS.map((s, i) => (
              <span
                key={s.value}
                className={cn(
                  "text-[10px]",
                  i === waitIndex ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleAdd}
          disabled={!description.trim() || !selectedType}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2 rounded-lg",
            "bg-primary text-primary-foreground text-sm font-medium",
            "hover:opacity-90 transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          type="button"
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>
    </div>
  );
}