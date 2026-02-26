import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientProvider } from "@/hooks/useClient";
import { RoleSimulationProvider } from "@/hooks/useRoleSimulation";
import SimulationProtectedRoute from "@/components/SimulationProtectedRoute";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AnalyticsOverview from "./pages/AnalyticsOverview";
import CampaignPerformance from "./pages/CampaignPerformance";
import OfflineRevenue from "./pages/OfflineRevenue";
import ClientProfile from "./pages/ClientProfile";
import ClientManagement from "./pages/ClientManagement";
import Settings from "./pages/Settings";
import Permissions from "./pages/Permissions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ClientProvider>
        <RoleSimulationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />

                {/* Analytics — MVP screens */}
                <Route path="/dashboard" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="analytics">
                      <AnalyticsOverview />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="analytics">
                      <AnalyticsOverview />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />
                <Route path="/analytics/campaigns" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="analytics">
                      <CampaignPerformance />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />
                <Route path="/analytics/offline-revenue" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="analytics">
                      <OfflineRevenue />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />

                {/* Client Management */}
                <Route path="/clients" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="clients">
                      <ClientProfile />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />
                <Route path="/client-management" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="clients">
                      <ClientManagement />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />

                {/* Settings & Admin */}
                <Route path="/settings" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="settings">
                      <Settings />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />
                <Route path="/permissions" element={
                  <SimulationProtectedRoute>
                    <DomainErrorBoundary domain="admin">
                      <Permissions />
                    </DomainErrorBoundary>
                  </SimulationProtectedRoute>
                } />

                {/* Legal */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RoleSimulationProvider>
      </ClientProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
