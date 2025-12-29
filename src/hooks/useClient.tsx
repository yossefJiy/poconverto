import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
}

interface ClientContextType {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  clients: Client[];
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<Client | null>(null);
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Refetch clients when user changes
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
    }
  }, [user, queryClient]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["all-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
    enabled: !authLoading && !!user,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedClientId");
    if (saved && clients.length > 0) {
      const client = clients.find(c => c.id === saved);
      if (client) {
        setSelectedClientState(client);
      }
    }
  }, [clients]);

  const setSelectedClient = (client: Client | null) => {
    setSelectedClientState(client);
    if (client) {
      localStorage.setItem("selectedClientId", client.id);
    } else {
      localStorage.removeItem("selectedClientId");
    }
  };

  return (
    <ClientContext.Provider value={{ selectedClient, setSelectedClient, clients, isLoading: isLoading || authLoading }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within ClientProvider");
  }
  return context;
}
