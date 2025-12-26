import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TranslationProvider } from "@/hooks/useTranslation";
import { EditModeProvider } from "@/hooks/useEditMode";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Marketing from "./pages/Marketing";
import Campaigns from "./pages/Campaigns";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import ClientDashboard from "./pages/ClientDashboard";
import ClientSettings from "./pages/ClientSettings";
import ClientProfile from "./pages/ClientProfile";
import Translations from "./pages/Translations";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Backlog from "./pages/Backlog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <EditModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
                <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/translations" element={<ProtectedRoute><Translations /></ProtectedRoute>} />
                <Route path="/client-dashboard/:clientId" element={<ClientDashboard />} />
                <Route path="/client/:clientId" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
                <Route path="/client/:clientId/settings" element={<ProtectedRoute><ClientSettings /></ProtectedRoute>} />
                <Route path="/backlog" element={<ProtectedRoute><Backlog /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </EditModeProvider>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
