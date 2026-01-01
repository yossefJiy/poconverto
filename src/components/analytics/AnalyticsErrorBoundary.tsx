import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  cardName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console
    console.error(`[AnalyticsErrorBoundary] Error in ${this.props.cardName}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Log error to Supabase (fire-and-forget)
    this.logErrorToBackend(error, errorInfo);
  }

  private async logErrorToBackend(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("security_audit_logs").insert({
        event_type: "analytics_card_crash",
        event_category: "error",
        action: "crash",
        resource_type: "analytics_card",
        resource_id: this.props.cardName,
        user_id: user?.id || null,
        details: {
          card_name: this.props.cardName,
          error_message: error.message,
          error_stack: error.stack?.slice(0, 2000), // Limit stack trace length
          component_stack: errorInfo.componentStack?.slice(0, 2000),
          timestamp: new Date().toISOString(),
          url: window.location.href,
          user_agent: navigator.userAgent,
        },
      });
    } catch (logError) {
      console.error("[AnalyticsErrorBoundary] Failed to log error to backend:", logError);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  שגיאה בטעינת {this.props.cardName}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  אירעה שגיאה בזמן טעינת הנתונים. הכרטיסים האחרים ממשיכים לעבוד כרגיל.
                </p>
                
                {this.state.error && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4 text-xs font-mono text-muted-foreground overflow-x-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="w-3 h-3" />
                      <span className="font-semibold">פרטי שגיאה:</span>
                    </div>
                    {this.state.error.message}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleRetry}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    נסה שוב
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    השגיאה נשמרה בלוגים
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
