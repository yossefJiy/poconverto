import { useState, useMemo } from "react";
import { Building2, ChevronDown, Check, X, Plus, Loader2, Crown, Search, Eye } from "lucide-react";
import { useClient } from "@/hooks/useClient";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import { CreateClientDialog } from "@/components/client/CreateClientDialog";
import logoIcon from "@/assets/logo-icon.svg";
import logoText from "@/assets/logo-text.svg";

interface ClientSwitcherProps {
  collapsed?: boolean;
}

export function ClientSwitcher({ collapsed = false }: ClientSwitcherProps) {
  const { selectedClient, setSelectedClient, clients, isLoading } = useClient();
  const { isSimulating, simulatedClientName, simulatedContactName } = useRoleSimulation();
  const [searchQuery, setSearchQuery] = useState("");

  // Check if selected client is the master account (JIY)
  const { data: masterClient } = useQuery({
    queryKey: ["master-client-switcher"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("is_master_account", true)
        .single();
      return data;
    },
  });

  const isClientMasterAccount = (client: { id: string; name?: string }) => {
    return client.id === masterClient?.id || 
           client.name?.toLowerCase().includes("jiy") ||
           client.name?.includes("סוכנות");
  };

  // Sort clients: master account always first, then filter by search
  const sortedAndFilteredClients = useMemo(() => {
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
      const aIsMaster = isClientMasterAccount(a);
      const bIsMaster = isClientMasterAccount(b);
      if (aIsMaster && !bIsMaster) return -1;
      if (!aIsMaster && bIsMaster) return 1;
      return a.name.localeCompare(b.name, 'he');
    });
  }, [clients, searchQuery, masterClient]);

  const isJiySelected = selectedClient?.id === masterClient?.id ||
                        selectedClient?.name?.toLowerCase().includes("jiy") ||
                        selectedClient?.name?.includes("סוכנות");

  // When simulating, show locked simulation display
  if (isSimulating && simulatedClientName) {
    return (
      <div className={cn(
        "w-full h-auto px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-md flex items-center gap-3",
        collapsed && "px-2 justify-center"
      )}>
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <Eye className="w-4 h-4 text-blue-500" />
        </div>
        {!collapsed && (
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{simulatedClientName}</span>
            </div>
            {simulatedContactName && (
              <span className="text-xs text-blue-500 truncate">
                👤 {simulatedContactName}
              </span>
            )}
            <span className="text-[10px] text-blue-500/70 font-medium">
              מצב סימולציה
            </span>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(
        "w-full h-12 px-3 bg-muted/30 border border-border/50 rounded-md flex items-center gap-3",
        collapsed && "px-2 justify-center"
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
          <img src={logoIcon} alt="" className="w-5 h-5 animate-fade-in" />
        </div>
        {!collapsed && (
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">טוען...</span>
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            </div>
            <span className="text-xs text-muted-foreground/60">
              קמפיינים, משימות, צוות ולקוחות
            </span>
          </div>
        )}
      </div>
    );
  }

  // Premium JIY display when selected
  if (isJiySelected && !collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto p-3 justify-between gap-2 jiy-gold-border bg-gradient-to-br from-[hsl(var(--jiy-gold))]/10 to-[hsl(var(--jiy-gold-light))]/5 hover:from-[hsl(var(--jiy-gold))]/20 hover:to-[hsl(var(--jiy-gold-light))]/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--jiy-gold))] to-[hsl(var(--jiy-gold-light))] flex items-center justify-center shadow-lg">
                  <img src={logoIcon} alt="JIY" className="w-7 h-7" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--jiy-gold))] flex items-center justify-center shadow-md">
                  <Crown className="w-3 h-3 text-black" />
                </div>
              </div>
              <div className="flex flex-col items-start text-right">
                <div className="flex items-center gap-2">
                  <img src={logoText} alt="Converto" className="h-4" />
                </div>
                <span className="text-[10px] font-medium text-[hsl(var(--jiy-gold))] tracking-wider uppercase mt-1">
                  switch to converting
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[hsl(var(--jiy-gold))] shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>לקוחות</span>
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
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Search Input */}
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לקוח..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {sortedAndFilteredClients.map((client) => {
              const isClientMaster = isClientMasterAccount(client);
              return (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer",
                    isClientMaster && "bg-[hsl(var(--jiy-gold))]/10"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                    isClientMaster 
                      ? "bg-gradient-to-br from-[hsl(var(--jiy-gold))] to-[hsl(var(--jiy-gold-light))] text-black" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {isClientMaster ? <Crown className="w-4 h-4" /> : client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                    {client.industry && (
                      <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
                    )}
                  </div>
                  {selectedClient?.id === client.id && (
                    <Check className="w-4 h-4 text-[hsl(var(--jiy-gold))] shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
            {sortedAndFilteredClients.length === 0 && searchQuery && (
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                לא נמצאו לקוחות
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="p-1">
            <CreateClientDialog 
              trigger={
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-primary">
                  <Plus className="w-4 h-4" />
                  לקוח חדש
                </Button>
              }
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
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
        {/* Search Input */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לקוח..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8 h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        {clients.length === 0 ? (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            אין לקוחות עדיין
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {sortedAndFilteredClients.map((client) => {
              const isClientMaster = isClientMasterAccount(client);
              return (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer",
                    isClientMaster && "bg-[hsl(var(--jiy-gold))]/5"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                    isClientMaster 
                      ? "bg-gradient-to-br from-[hsl(var(--jiy-gold))] to-[hsl(var(--jiy-gold-light))] text-black" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {isClientMaster ? <Crown className="w-4 h-4" /> : client.name.charAt(0)}
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
              );
            })}
            {sortedAndFilteredClients.length === 0 && searchQuery && (
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                לא נמצאו לקוחות
              </div>
            )}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="p-1">
          <CreateClientDialog 
            trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-primary">
                <Plus className="w-4 h-4" />
                לקוח חדש
              </Button>
            }
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
