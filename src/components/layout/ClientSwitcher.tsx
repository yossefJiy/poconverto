import { Building2, ChevronDown, Check, X } from "lucide-react";
import { useClient } from "@/hooks/useClient";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientSwitcherProps {
  collapsed?: boolean;
}

export function ClientSwitcher({ collapsed = false }: ClientSwitcherProps) {
  const { selectedClient, setSelectedClient, clients, isLoading } = useClient();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between gap-2 h-12 px-3 bg-muted/30 hover:bg-muted/50 border border-border/50",
            collapsed && "px-2 justify-center"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              selectedClient ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {selectedClient ? (
                <span className="font-bold text-sm">{selectedClient.name.charAt(0)}</span>
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col items-start text-right truncate">
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {selectedClient?.name || "בחר לקוח"}
                </span>
                {selectedClient?.industry && (
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {selectedClient.industry}
                  </span>
                )}
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>לקוחות</span>
          {selectedClient && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                setSelectedClient(null);
              }}
            >
              <X className="w-3 h-3 ml-1" />
              נקה
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clients.length === 0 ? (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            אין לקוחות עדיין
          </div>
        ) : (
          clients.map((client) => (
            <DropdownMenuItem
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{client.name}</p>
                {client.industry && (
                  <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
                )}
              </div>
              {selectedClient?.id === client.id && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
