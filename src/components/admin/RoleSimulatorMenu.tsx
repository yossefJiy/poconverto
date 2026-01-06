import { useAuth } from "@/hooks/useAuth";
import { useRoleSimulation, ROLE_LABELS } from "@/hooks/useRoleSimulation";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Eye, Check, X } from "lucide-react";

interface RoleSimulatorMenuProps {
  onOpenDialog: () => void;
}

export function RoleSimulatorMenu({ onOpenDialog }: RoleSimulatorMenuProps) {
  const { role: actualRole } = useAuth();
  const { canSimulate, isSimulating, stopSimulation } = useRoleSimulation();

  if (!canSimulate) return null;

  return (
    <>
      <DropdownMenuSeparator />

      <DropdownMenuItem
        onSelect={() => {
          // פותחים דיאלוג מחוץ לעץ של הדרופדאון כדי שלא ייסגר/ייעלם
          setTimeout(() => onOpenDialog(), 0);
        }}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Eye className="w-4 h-4" />
        <span className="flex-1">סימולציית הרשאות</span>
        {isSimulating ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <span className="text-xs text-muted-foreground">
            {actualRole ? ROLE_LABELS[actualRole] : ""}
          </span>
        )}
      </DropdownMenuItem>

      {isSimulating && (
        <DropdownMenuItem
          onSelect={() => {
            stopSimulation();
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>חזרה לתפקיד האמיתי</span>
        </DropdownMenuItem>
      )}
    </>
  );
}
