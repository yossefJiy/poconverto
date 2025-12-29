import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Zap } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { cn } from "@/lib/utils";

const StatusPage = () => {
  const { data, loading, error, refetch, lastUpdated } = useHealthCheck(30000);

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

  const statusMessage = getOverallStatusMessage(data?.status);

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

        {/* Services Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && !data ? (
            Array.from({ length: 7 }).map((_, i) => (
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
          ) : data?.services.map((service) => (
            <Card 
              key={service.name}
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                service.status === 'unhealthy' && "border-red-500/30",
                service.status === 'degraded' && "border-yellow-500/30"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    {service.displayName}
                  </CardTitle>
                  {getStatusBadge(service.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>זמן תגובה: {service.latencyMs}ms</span>
                  </div>
                  {service.version && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>גרסה: {service.version}</span>
                    </div>
                  )}
                  {service.message && (
                    <p className="text-red-500 text-xs mt-2">
                      {service.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מידע נוסף</CardTitle>
            <CardDescription>
              הדף מתעדכן אוטומטית כל 30 שניות. לחץ על "רענן" לעדכון מיידי.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </MainLayout>
  );
};

export default StatusPage;
