import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Zap, Info, Users, Link2, Link2Off } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Service information - descriptions and capabilities
const SERVICE_INFO: Record<string, {
  description: string;
  capabilities: string[];
  connectedTo: string;
  requiresSetup: boolean;
}> = {
  'shopify-api': {
    description: 'אינטגרציה עם חנויות Shopify לניהול מוצרים, הזמנות ומלאי',
    capabilities: [
      'סנכרון מוצרים והזמנות',
      'מעקב אחר מלאי',
      'ניתוח מכירות',
      'דוחות ביצועים'
    ],
    connectedTo: 'Shopify Store',
    requiresSetup: true
  },
  'google-ads': {
    description: 'ניהול ומעקב אחר קמפיינים בגוגל אדס',
    capabilities: [
      'צפייה בקמפיינים פעילים',
      'מעקב אחר הוצאות ותקציב',
      'ניתוח ביצועי מודעות',
      'דוחות המרות'
    ],
    connectedTo: 'Google Ads Account',
    requiresSetup: true
  },
  'google-analytics': {
    description: 'נתוני אנליטיקס מגוגל לניתוח תנועה ומשתמשים',
    capabilities: [
      'מעקב אחר ביקורים',
      'ניתוח התנהגות משתמשים',
      'דוחות קהלים',
      'מעקב המרות'
    ],
    connectedTo: 'Google Analytics Property',
    requiresSetup: true
  },
  'facebook-ads': {
    description: 'ניהול ומעקב אחר קמפיינים בפייסבוק ואינסטגרם',
    capabilities: [
      'צפייה בקמפיינים פעילים',
      'מעקב אחר הוצאות',
      'ניתוח קהלי יעד',
      'דוחות ביצועים'
    ],
    connectedTo: 'Meta Business Account',
    requiresSetup: true
  },
  'woocommerce-api': {
    description: 'אינטגרציה עם חנויות WooCommerce',
    capabilities: [
      'סנכרון מוצרים והזמנות',
      'מעקב אחר מלאי',
      'ניתוח מכירות',
      'דוחות ביצועים'
    ],
    connectedTo: 'WooCommerce Store',
    requiresSetup: true
  },
  'send-2fa-code': {
    description: 'שירות אימות דו-שלבי לאבטחת חשבונות משתמשים',
    capabilities: [
      'שליחת קודי אימות',
      'אימות התחברות',
      'ניהול מכשירים מהימנים'
    ],
    connectedTo: 'Resend Email Service',
    requiresSetup: false
  },
  'ai-marketing': {
    description: 'מערכת AI לייצור תוכן שיווקי ותובנות',
    capabilities: [
      'יצירת תוכן שיווקי',
      'ניתוח תובנות מנתונים',
      'המלצות אופטימיזציה',
      'יצירת פוסטים לרשתות חברתיות'
    ],
    connectedTo: 'Lovable AI Gateway',
    requiresSetup: false
  },
  'generate-report': {
    description: 'יצירת דוחות PDF אוטומטיים',
    capabilities: [
      'דוחות ביצועים תקופתיים',
      'סיכומי קמפיינים',
      'דוחות לקוחות',
      'ייצוא נתונים'
    ],
    connectedTo: 'Internal Service',
    requiresSetup: false
  }
};

const StatusPage = () => {
  // Reduced polling interval to 60 seconds to minimize API calls
  const { data, loading, error, refetch, lastUpdated } = useHealthCheck(60000);

  // Fetch client integrations - only once on mount
  const { data: clientIntegrations } = useQuery({
    queryKey: ['client-integrations-status'],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name');
      
      const { data: integrations } = await supabase
        .from('integrations')
        .select('client_id, platform, is_connected');
      
      return { clients: clients || [], integrations: integrations || [] };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    const variants = {
      healthy: 'bg-green-500/10 text-green-600 border-green-500/20',
      degraded: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      unhealthy: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    const labels = {
      healthy: 'תקין',
      degraded: 'חלקי',
      unhealthy: 'לא זמין',
    };
    return (
      <Badge variant="outline" className={cn("font-medium", variants[status])}>
        {labels[status]}
      </Badge>
    );
  };

  const getOverallStatusMessage = (status?: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return { text: 'כל המערכות פועלות כראוי', color: 'text-green-600' };
      case 'degraded':
        return { text: 'חלק מהשירותים חווים בעיות', color: 'text-yellow-600' };
      case 'unhealthy':
        return { text: 'ישנן תקלות במערכת', color: 'text-red-600' };
      default:
        return { text: 'בודק סטטוס...', color: 'text-muted-foreground' };
    }
  };

  const getConnectedClients = (serviceName: string) => {
    if (!clientIntegrations) return [];
    
    const platformMap: Record<string, string> = {
      'shopify-api': 'shopify',
      'google-ads': 'google_ads',
      'google-analytics': 'google_analytics',
      'facebook-ads': 'facebook_ads',
      'woocommerce-api': 'woocommerce'
    };
    
    const platform = platformMap[serviceName];
    if (!platform) return [];
    
    const connectedClientIds = clientIntegrations.integrations
      .filter(i => i.platform === platform && i.is_connected)
      .map(i => i.client_id);
    
    return clientIntegrations.clients.filter(c => connectedClientIds.includes(c.id));
  };

  const statusMessage = getOverallStatusMessage(data?.status);

  // Separate services into categories
  const integrationServices = data?.services.filter(s => 
    ['shopify-api', 'google-ads', 'google-analytics', 'facebook-ads', 'woocommerce-api'].includes(s.name)
  ) || [];

  const systemServices = data?.services.filter(s => 
    ['send-2fa-code', 'ai-marketing', 'generate-report'].includes(s.name)
  ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">סטטוס מערכת</h1>
            <p className="text-muted-foreground mt-1">
              מצב השירותים והאינטגרציות
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                עודכן: {lastUpdated.toLocaleTimeString('he-IL')}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 ml-2", loading && "animate-spin")} />
              רענן
            </Button>
          </div>
        </div>

        {/* Overall Status Card */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {loading ? (
                  <Skeleton className="h-12 w-12 rounded-full" />
                ) : data ? (
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    data.status === 'healthy' && "bg-green-500/20",
                    data.status === 'degraded' && "bg-yellow-500/20",
                    data.status === 'unhealthy' && "bg-red-500/20"
                  )}>
                    {getStatusIcon(data.status)}
                  </div>
                ) : null}
                <div>
                  <h2 className={cn("text-xl font-semibold", statusMessage.color)}>
                    {statusMessage.text}
                  </h2>
                  {data && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.summary.healthy} מתוך {data.summary.total} שירותים פעילים
                    </p>
                  )}
                </div>
              </div>
              {data && (
                <div className="text-left">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {data.summary.healthy} תקינים
                    </Badge>
                    {data.summary.degraded > 0 && (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        {data.summary.degraded} חלקיים
                      </Badge>
                    )}
                    {data.summary.unhealthy > 0 && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        {data.summary.unhealthy} לא זמינים
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>שגיאה בטעינת הנתונים: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Services Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            שירותי מערכת
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading && !data ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : systemServices.map((service) => {
              const info = SERVICE_INFO[service.name];
              return (
                <Card 
                  key={service.name}
                  className={cn(
                    "transition-all duration-200",
                    service.status === 'unhealthy' && "border-red-500/30",
                    service.status === 'degraded' && "border-yellow-500/30"
                  )}
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            {getStatusIcon(service.status)}
                            {service.displayName}
                          </CardTitle>
                          {getStatusBadge(service.status)}
                        </div>
                        <CardDescription className="text-sm mt-2">
                          {info?.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Zap className="h-4 w-4" />
                            <span>זמן תגובה: {service.latencyMs}ms</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Link2 className="h-4 w-4" />
                            <span>מחובר ל: {info?.connectedTo}</span>
                          </div>
                          {service.message && (
                            <p className="text-red-500 text-xs mt-2">
                              {service.message}
                            </p>
                          )}
                        </div>
                        <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                          <span className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            פרטים נוספים
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">יכולות:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {info?.capabilities.map((cap, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    {cap}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </CardContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Integration Services Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            אינטגרציות חיצוניות
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading && !data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : integrationServices.map((service) => {
              const info = SERVICE_INFO[service.name];
              const connectedClients = getConnectedClients(service.name);
              const hasConnections = connectedClients.length > 0;
              
              return (
                <Card 
                  key={service.name}
                  className={cn(
                    "transition-all duration-200",
                    service.status === 'unhealthy' && "border-red-500/30",
                    service.status === 'degraded' && "border-yellow-500/30",
                    !hasConnections && "border-dashed opacity-75"
                  )}
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            {hasConnections ? (
                              getStatusIcon(service.status)
                            ) : (
                              <Link2Off className="h-5 w-5 text-muted-foreground" />
                            )}
                            {service.displayName}
                          </CardTitle>
                          {hasConnections ? (
                            getStatusBadge(service.status)
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              לא מחובר
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm mt-2">
                          {info?.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm mb-3">
                          {hasConnections && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Zap className="h-4 w-4" />
                              <span>זמן תגובה: {service.latencyMs}ms</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {hasConnections 
                                ? `${connectedClients.length} לקוחות מחוברים`
                                : 'אין לקוחות מחוברים'
                              }
                            </span>
                          </div>
                          {service.message && (
                            <p className="text-red-500 text-xs mt-2">
                              {service.message}
                            </p>
                          )}
                        </div>
                        <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                          <span className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            פרטים נוספים
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">יכולות:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {info?.capabilities.map((cap, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    {cap}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {hasConnections && (
                              <div>
                                <p className="text-sm font-medium mb-2">לקוחות מחוברים:</p>
                                <div className="flex flex-wrap gap-1">
                                  {connectedClients.map(client => (
                                    <Badge 
                                      key={client.id} 
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {client.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!hasConnections && (
                              <p className="text-sm text-muted-foreground">
                                כדי להשתמש באינטגרציה זו, יש להגדיר חיבור דרך הגדרות הלקוח.
                              </p>
                            )}
                          </div>
                        </AccordionContent>
                      </CardContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מידע נוסף</CardTitle>
            <CardDescription>
              הדף מתעדכן אוטומטית כל 60 שניות. לחץ על "רענן" לעדכון מיידי.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </MainLayout>
  );
};

export default StatusPage;
