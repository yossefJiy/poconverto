import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientProvider } from "@/hooks/useClient";
import ProtectedRoute from "@/components/ProtectedRoute";
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />

              {/* Analytics — MVP screens */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <AnalyticsOverview />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <AnalyticsOverview />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/campaigns" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <CampaignPerformance />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/offline-revenue" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <OfflineRevenue />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />

              {/* Client Management */}
              <Route path="/clients" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="clients">
                    <ClientProfile />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/client-management" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="clients">
                    <ClientManagement />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />

              {/* Settings & Admin */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="settings">
                    <Settings />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/permissions" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <Permissions />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />

              {/* Legal */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClientProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
