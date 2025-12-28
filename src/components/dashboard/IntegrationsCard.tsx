import { Link } from "react-router-dom";
import { Plug, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Integration {
  id: string;
  platform: string;
  is_connected: boolean;
}

interface IntegrationsCardProps {
  integrations: Integration[];
}

export function IntegrationsCard({ integrations }: IntegrationsCardProps) {
  const connectedIntegrations = integrations.filter(i => i.is_connected);

  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            אינטגרציות
          </span>
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
            <Link to="/integrations">הגדר</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {connectedIntegrations.length > 0 ? (
          connectedIntegrations.map(integration => (
            <div key={integration.id} className="flex items-center justify-between p-2 rounded-lg bg-success/10">
              <span className="font-medium capitalize text-sm">{integration.platform.replace(/_/g, " ")}</span>
              <Badge variant="outline" className="bg-success/20 text-success border-success/30 text-xs">מחובר</Badge>
            </div>
          ))
        ) : (
          <div className="text-center py-3">
            <Plug className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm mb-2">אין אינטגרציות מחוברות</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/integrations">חבר עכשיו</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
