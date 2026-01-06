import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientProvider } from "@/hooks/useClient";
import { RoleSimulationProvider } from "@/hooks/useRoleSimulation";
import ProtectedRoute from "@/components/ProtectedRoute";
import SimulationProtectedRoute from "@/components/SimulationProtectedRoute";
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
import LeadManagement from "./pages/LeadManagement";
import BillingManagement from "./pages/BillingManagement";
import ApprovalsDashboard from "./pages/ApprovalsDashboard";
import Programmatic from "./pages/Programmatic";
import ABTests from "./pages/ABTests";
import GoogleShopping from "./pages/GoogleShopping";
import AIInsights from "./pages/AIInsights";

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
              <Route path="/products/landing-pages" element={<ProductLandingPages />} />
              <Route path="/products/ecommerce" element={<ProductEcommerce />} />
              <Route path="/products/dashboard" element={<ProductDashboard />} />
              <Route path="/client/:clientId" element={<ClientDashboard />} />
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
              <Route path="/marketing" element={
                <SimulationProtectedRoute moduleKey="marketing">
                  <DomainErrorBoundary domain="marketing">
                    <Marketing />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <SimulationProtectedRoute moduleKey="campaigns">
                  <DomainErrorBoundary domain="campaigns">
                    <Campaigns />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/tasks" element={
                <SimulationProtectedRoute moduleKey="tasks">
                  <DomainErrorBoundary domain="tasks">
                    <Tasks />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/team" element={
                <SimulationProtectedRoute moduleKey="team">
                  <DomainErrorBoundary domain="team">
                    <Team />
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
              <Route path="/credits" element={
                <SimulationProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <CreditManagement />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
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
              <Route path="/analytics/google-analytics" element={
                <SimulationProtectedRoute moduleKey="analytics">
                  <DomainErrorBoundary domain="analytics">
                    <GoogleAnalyticsDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/campaigns/:campaignId" element={
                <SimulationProtectedRoute moduleKey="campaigns">
                  <DomainErrorBoundary domain="campaigns">
                    <CampaignDetail />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/ecommerce" element={
                <SimulationProtectedRoute moduleKey="ecommerce">
                  <DomainErrorBoundary domain="ecommerce">
                    <Ecommerce />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/ai-agents" element={
                <SimulationProtectedRoute moduleKey="ai_agent">
                  <DomainErrorBoundary domain="ai">
                    <AIAgents />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/agent-alerts" element={
                <SimulationProtectedRoute moduleKey="ai_agent">
                  <DomainErrorBoundary domain="ai">
                    <AgentAlerts />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/insights" element={
                <SimulationProtectedRoute moduleKey="insights">
                  <DomainErrorBoundary domain="ai">
                    <ClientInsights />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/system-diagram" element={<SimulationProtectedRoute><SystemDiagram /></SimulationProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/status" element={
                <SimulationProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <StatusPage />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/code-health" element={
                <SimulationProtectedRoute>
                  <DomainErrorBoundary domain="admin">
                    <CodeHealth />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/reports" element={
                <SimulationProtectedRoute moduleKey="reports">
                  <DomainErrorBoundary domain="reports">
                    <Reports />
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
              <Route path="/kpis" element={
                <SimulationProtectedRoute moduleKey="marketing">
                  <DomainErrorBoundary domain="marketing">
                    <KPIDashboard />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/competitors" element={
                <SimulationProtectedRoute moduleKey="marketing">
                  <DomainErrorBoundary domain="marketing">
                    <Competitors />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/social" element={
                <SimulationProtectedRoute moduleKey="marketing">
                  <DomainErrorBoundary domain="social">
                    <SocialMedia />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/agency" element={
                <SimulationProtectedRoute>
                  <DomainErrorBoundary domain="agency">
                    <AgencyDashboard />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/projects" element={
                <SimulationProtectedRoute moduleKey="tasks">
                  <DomainErrorBoundary domain="projects">
                    <Projects />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/content-studio" element={
                <SimulationProtectedRoute moduleKey="marketing">
                  <DomainErrorBoundary domain="content">
                    <ContentStudio />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/leads" element={
                <SimulationProtectedRoute moduleKey="leads">
                  <DomainErrorBoundary domain="leads">
                    <LeadManagement />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/billing" element={
                <SimulationProtectedRoute moduleKey="billing">
                  <DomainErrorBoundary domain="billing">
                    <BillingManagement />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/approvals" element={
                <SimulationProtectedRoute moduleKey="approvals">
                  <DomainErrorBoundary domain="approvals">
                    <ApprovalsDashboard />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/programmatic" element={
                <SimulationProtectedRoute moduleKey="campaigns">
                  <DomainErrorBoundary domain="campaigns">
                    <Programmatic />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/ab-tests" element={
                <SimulationProtectedRoute moduleKey="campaigns">
                  <DomainErrorBoundary domain="campaigns">
                    <ABTests />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/google-shopping" element={
                <SimulationProtectedRoute moduleKey="ecommerce">
                  <DomainErrorBoundary domain="ecommerce">
                    <GoogleShopping />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              <Route path="/ai-insights" element={
                <SimulationProtectedRoute moduleKey="ai_agent">
                  <DomainErrorBoundary domain="ai">
                    <AIInsights />
                  </DomainErrorBoundary>
                </SimulationProtectedRoute>
              } />
              
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