import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Trophy, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface Test {
  id: string;
  name: string;
  description?: string;
  variant_a: any;
  variant_b: any;
  status: string;
  winner?: string;
  results?: any;
  campaigns?: { name: string };
  sample_size?: number;
  confidence_level?: number;
}

interface Props {
  tests: Test[];
  onStatusChange: (params: { id: string; status: string }) => void;
}

export function ABTestManager({ tests, onStatusChange }: Props) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      draft: { variant: "outline", label: "טיוטה" },
      running: { variant: "default", label: "פעיל" },
      paused: { variant: "secondary", label: "מושהה" },
      completed: { variant: "default", label: "הושלם" },
    };
    return configs[status] || configs.draft;
  };

  // Mock performance data
  const getVariantPerformance = () => ({
    a: {
      clicks: Math.floor(Math.random() * 1000 + 500),
      conversions: Math.floor(Math.random() * 100 + 20),
      ctr: (Math.random() * 3 + 1).toFixed(2),
    },
    b: {
      clicks: Math.floor(Math.random() * 1000 + 500),
      conversions: Math.floor(Math.random() * 100 + 20),
      ctr: (Math.random() * 3 + 1).toFixed(2),
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tests.map((test) => {
        const statusConfig = getStatusConfig(test.status);
        const perf = getVariantPerformance();
        const aWinning = Number(perf.a.ctr) > Number(perf.b.ctr);

        return (
          <Card key={test.id} className="relative overflow-hidden">
            {test.winner && (
              <div className="absolute top-2 left-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {test.campaigns && (
                    <p className="text-sm text-muted-foreground">
                      {(test.campaigns as any)?.name}
                    </p>
                  )}
                </div>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {test.description && (
                <p className="text-sm text-muted-foreground">{test.description}</p>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      וריאנט A
                      {aWinning && <TrendingUp className="h-3 w-3 text-green-500" />}
                    </span>
                    <span className="font-mono">{perf.a.ctr}% CTR</span>
                  </div>
                  <Progress 
                    value={Number(perf.a.ctr) * 20} 
                    className={aWinning ? "bg-green-100" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {perf.a.clicks} קליקים · {perf.a.conversions} המרות
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      וריאנט B
                      {!aWinning && <TrendingUp className="h-3 w-3 text-green-500" />}
                    </span>
                    <span className="font-mono">{perf.b.ctr}% CTR</span>
                  </div>
                  <Progress 
                    value={Number(perf.b.ctr) * 20} 
                    className={!aWinning ? "bg-green-100" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {perf.b.clicks} קליקים · {perf.b.conversions} המרות
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">רמת ביטחון: </span>
                  <span className="font-medium">{test.confidence_level || 95}%</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  {test.status === "running" ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onStatusChange({ id: test.id, status: "paused" })}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : test.status !== "completed" && (
                    <Button 
                      size="sm"
                      onClick={() => onStatusChange({ id: test.id, status: "running" })}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
