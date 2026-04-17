"use client";

import { useState } from "react";
import { Ghost, Rose, Rabbit, Fish, Cat, Skull, VenetianMask, Volleyball, Donut, HandMetal, Sticker, Biohazard } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser, type IconUserId } from "@/lib/user-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const USER_ICONS = [
  { id: "Ghost", icon: Ghost },
  { id: "Rose", icon: Rose },
  { id: "Rabbit", icon: Rabbit },
  { id: "Skull", icon: Skull },
  { id: "Fish", icon: Fish },
  { id: "Cat", icon: Cat },
  { id: "VenetianMask", icon: VenetianMask },
  { id: "Volleyball", icon: Volleyball },
  { id: "Donut", icon: Donut },
  { id: "HandMetal", icon: HandMetal },
  { id: "Sticker", icon: Sticker },
  { id: "Biohazard", icon: Biohazard },
] as const;

function userIconById(id: IconUserId) {
  const iconMap = USER_ICONS.reduce((acc, { id: iconId, icon }) => {
    acc[iconId] = icon;
    return acc;
  }, {} as Record<string, React.ElementType>);
  return iconMap[id] ?? Ghost;
}

export { userIconById };

interface UserAvatarEditorProps {
  showTitle?: boolean;
}

export function UserAvatarEditor({ showTitle = true }: UserAvatarEditorProps) {
  const { user, updateUser } = useUser();
  const [selectedIcon, setSelectedIcon] = useState<IconUserId | null>(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

  function handleIconSelect(iconId: IconUserId) {
    setSelectedIcon(iconId);
    setConfirmEditOpen(true);
  }

  async function confirmIconUpdate() {
    if (!selectedIcon) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ avatar_icon: selectedIcon })
        .eq("id", user.id);

      if (error) throw error;

      updateUser(user.id, { iconId: selectedIcon });
      setConfirmEditOpen(false);
      setSelectedIcon(null);
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  }

  return (
    <>
      <div className="py-4">
        {showTitle && <p className="text-sm text-muted-foreground mb-4">Selecciona un icono:</p>}
        <div className="grid grid-cols-4 gap-2">
          {USER_ICONS.map(({ id, icon: IconComponent }) => (
            <button
              key={id}
              className={cn(
                "p-3 border rounded-lg hover:bg-accent flex items-center justify-center transition-colors",
                user.iconId === id
                  ? "border-primary bg-primary/10"
                  : "border-border"
              )}
              onClick={() => handleIconSelect(id as IconUserId)}
            >
              <IconComponent size={20} className="text-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Confirmación de cambio de icono ── */}
      <AlertDialog open={confirmEditOpen} onOpenChange={setConfirmEditOpen}>
        <AlertDialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Confirmar cambio de avatar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas cambiar tu avatar a este icono?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            {selectedIcon && (
              <div className="p-4 border border-border rounded-lg">
                {(() => {
                  const IconComponent = userIconById(selectedIcon);
                  return <IconComponent size={32} className="text-foreground" />;
                })()}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmIconUpdate}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
