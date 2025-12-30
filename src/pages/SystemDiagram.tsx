import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ArrowRight, Lock } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const diagramDefinition = `
flowchart TB
    subgraph Users["👥 משתמשים"]
        Admin["🔐 Admin"]
        Manager["👔 Manager"]
        TeamMember["👤 Team Member"]
        ClientUser["🏢 Client"]
    end

    subgraph Auth["🔒 אימות"]
        EmailAuth["📧 Email/Password"]
        GoogleAuth["🔗 Google OAuth"]
        TwoFA["📱 2FA + SMS"]
    end

    subgraph Frontend["🖥️ Frontend (React + Vite)"]
        Dashboard["📊 Dashboard"]
        Analytics["📈 Analytics"]
        Campaigns["🎯 Campaigns"]
        Tasks["✅ Tasks"]
        Marketing["📢 Marketing"]
        Ecommerce["🛒 E-commerce"]
        Team["👥 Team"]
        Status["🔔 System Status"]
    end

    subgraph Backend["⚙️ Backend"]
        subgraph EdgeFunctions["☁️ Edge Functions"]
            AIMarketing["🤖 AI Marketing"]
            DataAPI["📡 Data API"]
            GoogleAnalytics["📊 Google Analytics"]
            ShopifyAPI["🛍️ Shopify API"]
            ReportGen["📄 Report Generator"]
            HealthCheck["🔔 Health Monitor"]
            SMSService["📱 SMS Service"]
            EmailService["📧 Email Service"]
        end
        
        subgraph Database["🗄️ Database"]
            Clients["👥 Clients"]
            CampaignsDB["🎯 Campaigns"]
            TasksDB["✅ Tasks"]
            TeamDB["👤 Team"]
            IntegrationsDB["🔌 Integrations"]
            AnalyticsDB["📊 Analytics Snapshots"]
            MonitoringPrefs["🔔 Monitoring Prefs"]
        end
    end

    subgraph ExternalAPIs["🌐 External APIs"]
        GA["📈 Google Analytics"]
        GAds["📢 Google Ads"]
        Shopify["🛍️ Shopify"]
        WooCommerce["🛒 WooCommerce"]
        Twilio["📱 Twilio SMS"]
        Resend["📧 Resend Email"]
        AI["🤖 AI Models"]
    end

    %% User Authentication Flow
    Users --> Auth
    Auth --> Frontend
    
    %% Frontend to Backend
    Frontend --> EdgeFunctions
    EdgeFunctions --> Database
    
    %% External API Connections
    GoogleAnalytics --> GA
    DataAPI --> GAds
    ShopifyAPI --> Shopify
    ShopifyAPI --> WooCommerce
    SMSService --> Twilio
    EmailService --> Resend
    AIMarketing --> AI
    
    %% Internal Connections
    Analytics --> AnalyticsDB
    Campaigns --> CampaignsDB
    Tasks --> TasksDB
    Team --> TeamDB
    Dashboard --> AnalyticsDB
    Status --> HealthCheck
    
    %% Data Flow Relationships
    CampaignsDB --> AnalyticsDB
    TasksDB --> CampaignsDB
    TeamDB --> Clients
    IntegrationsDB --> Clients
`;

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#6366f1",
    primaryTextColor: "#fff",
    primaryBorderColor: "#818cf8",
    lineColor: "#94a3b8",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
  },
});

export default function SystemDiagram() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const { isAdmin } = usePermissions();

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const renderDiagram = async () => {
      if (diagramRef.current) {
        try {
          const { svg } = await mermaid.render("system-diagram", diagramDefinition);
          diagramRef.current.innerHTML = svg;
          setIsRendered(true);
        } catch (error) {
          console.error("Failed to render diagram:", error);
        }
      }
    };
    renderDiagram();
  }, []);

  const downloadPDF = async () => {
    if (!diagramRef.current) return;
    
    setIsLoading(true);
    try {
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save("JIY-System-Architecture.pdf");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              ארכיטקטורת מערכת
            </h1>
            <p className="text-muted-foreground mt-1">
              תרשים הקשרים והחיבורים בין רכיבי המערכת
            </p>
          </div>
          <Button onClick={downloadPDF} disabled={isLoading || !isRendered}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            הורד PDF
          </Button>
        </div>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">מקרא</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-500" />
                <span>רכיבים ראשיים</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>זרימת נתונים</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-700" />
                <span>שירותים חיצוניים</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections Info */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">קשרי נתונים</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>• Analytics ← Dashboard (מציג נתונים)</p>
              <p>• Campaigns ← Analytics (סנכרון ביצועים)</p>
              <p>• Tasks ← Campaigns (משימות לקמפיינים)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">קשרי לקוחות</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>• Team ← Clients (צוות משויך ללקוח)</p>
              <p>• Integrations ← Clients (חיבורים per client)</p>
              <p>• Campaigns ← Clients (קמפיינים per client)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">שירותים חיצוניים</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>• Resend - שליחת מיילים</p>
              <p>• Twilio - שליחת SMS</p>
              <p>• Lovable AI - יצירת תוכן</p>
            </CardContent>
          </Card>
        </div>

        {/* Diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תרשים מערכת מלא</CardTitle>
            <CardDescription>
              לחץ על "הורד PDF" לייצוא התרשים
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto">
            <div ref={diagramRef} className="flex justify-center min-h-[600px]" />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}