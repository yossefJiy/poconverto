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
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ClientProfile from "./pages/ClientProfile";
import ClientManagement from "./pages/ClientManagement";
import Analytics from "./pages/Analytics";
import GoogleAdsDetail from "./pages/analytics/GoogleAdsDetail";
import ShopifyDetail from "./pages/analytics/ShopifyDetail";
import FacebookAdsDetail from "./pages/analytics/FacebookAdsDetail";
import MetaSummary from "./pages/analytics/MetaSummary";
import WooCommerceDetail from "./pages/analytics/WooCommerceDetail";
import GoogleAnalyticsDetail from "./pages/analytics/GoogleAnalyticsDetail";
import CampaignDetail from "./pages/analytics/CampaignDetail";
import TikTokAdsDetail from "./pages/analytics/TikTokAdsDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Permissions from "./pages/Permissions";
import ProtectedRoute from "@/components/ProtectedRoute";

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
              <Route path="/dashboard" element={<SimulationProtectedRoute><Dashboard /></SimulationProtectedRoute>} />
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
              <Route path="/settings" element={
                <SimulationProtectedRoute>
                  <DomainErrorBoundary domain="settings">
                    <Settings />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <Analytics />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/google-ads" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <GoogleAdsDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/shopify" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <ShopifyDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/facebook-ads" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <FacebookAdsDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/meta" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <MetaSummary />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/woocommerce" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <WooCommerceDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/tiktok-ads" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <TikTokAdsDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/analytics/google-analytics" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <GoogleAnalyticsDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/campaigns/:campaignId" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <CampaignDetail />
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
