import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientProvider } from "@/hooks/useClient";
import { ImpersonationProvider } from "@/hooks/useImpersonation";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Marketing from "./pages/Marketing";
import Campaigns from "./pages/Campaigns";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import ProductLandingPages from "./pages/ProductLandingPages";
import ProductEcommerce from "./pages/ProductEcommerce";
import ProductDashboard from "./pages/ProductDashboard";
import CreditManagement from "./pages/CreditManagement";

import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfile";
import ApiDocs from "./pages/ApiDocs";
import Analytics from "./pages/Analytics";
import GoogleAdsDetail from "./pages/analytics/GoogleAdsDetail";
import ShopifyDetail from "./pages/analytics/ShopifyDetail";
import FacebookAdsDetail from "./pages/analytics/FacebookAdsDetail";
import MetaSummary from "./pages/analytics/MetaSummary";
import WooCommerceDetail from "./pages/analytics/WooCommerceDetail";
import GoogleAnalyticsDetail from "./pages/analytics/GoogleAnalyticsDetail";
import CampaignDetail from "./pages/analytics/CampaignDetail";
import Ecommerce from "./pages/Ecommerce";
import SystemDiagram from "./pages/SystemDiagram";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import StatusPage from "./pages/StatusPage";
import CodeHealth from "./pages/CodeHealth";
import AIAgents from "./pages/AIAgents";
import AgentAlerts from "./pages/AgentAlerts";
import ClientInsights from "./pages/ClientInsights";
import Reports from "./pages/Reports";
import Permissions from "./pages/Permissions";
import ClientManagement from "./pages/ClientManagement";
import KPIDashboard from "./pages/KPIDashboard";
import Competitors from "./pages/Competitors";
import SocialMedia from "./pages/SocialMedia";
import ContentStudio from "./pages/ContentStudio";
import AgencyDashboard from "./pages/AgencyDashboard";
import Projects from "./pages/Projects";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ClientProvider>
        <ImpersonationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ImpersonationBanner />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products/landing-pages" element={<ProductLandingPages />} />
              <Route path="/products/ecommerce" element={<ProductEcommerce />} />
              <Route path="/products/dashboard" element={<ProductDashboard />} />
              <Route path="/client/:clientId" element={<ClientDashboard />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
              <Route path="/marketing" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="marketing">
                    <Marketing />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="campaigns">
                    <Campaigns />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="tasks">
                    <Tasks />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="team">
                    <Team />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="settings">
                    <Settings />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/credits" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <CreditManagement />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <Analytics />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/google-ads" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <GoogleAdsDetail />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/shopify" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <ShopifyDetail />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/facebook-ads" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <FacebookAdsDetail />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/meta" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <MetaSummary />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/woocommerce" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <WooCommerceDetail />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics/google-analytics" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="analytics">
                    <GoogleAnalyticsDetail />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/campaigns/:campaignId" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="campaigns">
                    <CampaignDetail />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ecommerce" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="ecommerce">
                    <Ecommerce />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ai-agents" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="ai">
                    <AIAgents />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/agent-alerts" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="ai">
                    <AgentAlerts />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/insights" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="ai">
                    <ClientInsights />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/system-diagram" element={<SystemDiagram />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/status" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <StatusPage />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/code-health" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <CodeHealth />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="reports">
                    <Reports />
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
              <Route path="/kpis" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="marketing">
                    <KPIDashboard />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/competitors" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="marketing">
                    <Competitors />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/social" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="social">
                    <SocialMedia />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/agency" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="agency">
                    <AgencyDashboard />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="projects">
                    <Projects />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/content-studio" element={
                <ProtectedRoute>
                  <DomainErrorBoundary domain="content">
                    <ContentStudio />
                  </DomainErrorBoundary>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ImpersonationProvider>
      </ClientProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
