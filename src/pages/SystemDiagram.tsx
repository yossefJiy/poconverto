import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const diagramDefinition = `
flowchart TB
    subgraph Users["👥 Users"]
        Admin["🔐 Admin"]
        Manager["👔 Manager"]
        TeamMember["👤 Team Member"]
        Client["🏢 Client"]
    end

    subgraph Auth["🔒 Authentication"]
        EmailAuth["📧 Email/Password"]
        GoogleAuth["🔗 Google OAuth"]
        PhoneAuth["📱 Phone OTP"]
    end

    subgraph Frontend["🖥️ Frontend (React + Vite)"]
        Dashboard["📊 Dashboard"]
        Analytics["📈 Analytics"]
        Campaigns["🎯 Campaigns"]
        Tasks["✅ Tasks"]
        Marketing["📢 Marketing"]
        Ecommerce["🛒 E-commerce"]
        Team["👥 Team"]
        Integrations["🔌 Integrations"]
    end

    subgraph Backend["⚙️ Backend"]
        subgraph EdgeFunctions["☁️ Edge Functions"]
            AIMarketing["🤖 AI Marketing"]
            DataAPI["📡 Data API"]
            GoogleAnalytics["📊 Google Analytics"]
            ShopifyAPI["🛍️ Shopify API"]
            ReportGen["📄 Report Generator"]
            WebhookReceiver["🔗 Webhook Receiver"]
            MCPServer["🔌 MCP Server"]
        end
        
        subgraph Database["🗄️ Database"]
            Clients["👥 Clients"]
            CampaignsDB["🎯 Campaigns"]
            TasksDB["✅ Tasks"]
            TeamDB["👤 Team"]
            IntegrationsDB["🔌 Integrations"]
            MarketingData["📊 Marketing Data"]
        end
    end

    subgraph ExternalAPIs["🌐 External APIs"]
        GA["📈 Google Analytics"]
        GAds["📢 Google Ads"]
        Shopify["🛍️ Shopify"]
        AI["🤖 AI Models"]
    end

    subgraph AIAssistants["🤖 AI Assistants"]
        Claude["💬 Claude / MCP Client"]
        AIInsights["💡 AI Marketing Insights"]
    end

    Users --> Auth
    Auth --> Frontend
    Frontend --> EdgeFunctions
    EdgeFunctions --> Database
    EdgeFunctions --> ExternalAPIs
    MCPServer <--> Claude
    AIMarketing --> AI
    AIMarketing --> AIInsights
    GoogleAnalytics --> GA
    ShopifyAPI --> Shopify
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">System Architecture</h1>
          <Button onClick={downloadPDF} disabled={isLoading || !isRendered}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6 overflow-auto">
          <div ref={diagramRef} className="flex justify-center min-h-[600px]" />
        </div>
      </div>
    </div>
  );
}
