import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { PlatformTabs } from "@/components/analytics/PlatformTabs";
import { Button } from "@/components/ui/button";
import { 
  Plug, 
  ArrowRight, 
  AlertCircle,
  Calendar,
  Download,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function Analytics() {
  const { selectedClient } = useClient();
  const [dateRange, setDateRange] = useState("30");
  
  const { 
    analyticsData, 
    platformsData, 
    aggregatedAdsData, 
    integrations,
    isLoading,
    hasAnalytics,
    hasAds
  } = useAnalyticsData(selectedClient?.id);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="אנליטיקס" description="בחר לקוח כדי לצפות בנתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח כדי להתחיל</h3>
            <p className="text-muted-foreground mb-4">
              כדי לצפות בנתוני אנליטיקס, יש לבחור לקוח מהתפריט בסרגל הצד
            </p>
            <div className="flex items-center justify-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-primary font-medium">בחר לקוח מהתפריט בצד שמאל</span>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const noIntegrations = integrations.length === 0;

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader 
            title={`אנליטיקס - ${selectedClient.name}`}
            description="הצלבת נתוני אתר מול מערכות פרסום"
          />
          
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 ימים</SelectItem>
                <SelectItem value="14">14 ימים</SelectItem>
                <SelectItem value="30">30 ימים</SelectItem>
                <SelectItem value="90">90 ימים</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            <Button variant="outline">
              <Download className="w-4 h-4 ml-2" />
              ייצוא
            </Button>
          </div>
        </div>

        {/* No Integrations Warning */}
        {noIntegrations && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>אין חיבורים פעילים</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>חבר את Google Analytics ופלטפורמות הפרסום שלך כדי לראות נתונים אמיתיים</span>
              <Button asChild size="sm" className="mr-4">
                <Link to="/integrations">
                  <Plug className="w-4 h-4 ml-2" />
                  חבר כעת
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Data Notice */}
        {!noIntegrations && (!hasAnalytics || !hasAds) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>נתונים חלקיים</AlertTitle>
            <AlertDescription>
              {!hasAnalytics && "Google Analytics לא מחובר - נתוני תנועה מוצגים להדגמה. "}
              {!hasAds && "אין פלטפורמות פרסום מחוברות - נתוני פרסום מוצגים להדגמה."}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Section */}
            <AnalyticsSummary 
              websiteData={{
                sessions: analyticsData.sessions,
                users: analyticsData.users,
                pageviews: analyticsData.pageviews,
                bounceRate: analyticsData.bounceRate,
              }}
              adsData={aggregatedAdsData}
            />

            {/* Platform Tabs */}
            <div className="glass rounded-xl p-6 card-shadow">
              <h2 className="text-xl font-bold mb-6">פירוט לפי פלטפורמה</h2>
              <PlatformTabs 
                platforms={platformsData}
                analyticsData={analyticsData}
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
