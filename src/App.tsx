import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Marketing from "./pages/Marketing";
import Campaigns from "./pages/Campaigns";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import ClientDashboard from "./pages/ClientDashboard";
import ClientSettings from "./pages/ClientSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/client/td-tamar-drory" element={<ClientDashboard />} />
          <Route path="/client-settings" element={<ClientSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
