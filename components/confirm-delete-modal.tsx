"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const modalSurfaceClass =
  "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border p-5 sm:p-6 shadow-2xl " +
  "bg-popover/90 backdrop-blur-xl text-popover-foreground w-[90vw] sm:w-[380px]";

const closeButtonClass =
  "w-7 h-7 flex items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";

export function ConfirmDeleteModal({
  open,
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className={modalSurfaceClass}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Close */}
            <button
              onClick={onCancel}
              className={cn(closeButtonClass, "absolute top-3 right-3")}
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>

            {/* Icon + Text */}
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                <AlertTriangle size={22} className="text-destructive" />
              </div>
              <h2 className="text-foreground font-semibold text-base">{title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Eliminando..." : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}