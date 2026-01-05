import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock,
  User,
  Loader2
} from "lucide-react";
import { ApprovalItem, useApprovals } from "@/hooks/useApprovals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ApprovalDetailDialogProps {
  item: ApprovalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApprovalDetailDialog({ item, open, onOpenChange }: ApprovalDetailDialogProps) {
  const { makeDecision } = useApprovals();
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: decisions = [] } = useQuery({
    queryKey: ["approval-decisions", item?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_decisions")
        .select("*")
        .eq("approval_item_id", item?.id)
        .order("decided_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!item?.id,
  });

  const { data: itemComments = [] } = useQuery({
    queryKey: ["approval-comments", item?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_comments")
        .select("*")
        .eq("approval_item_id", item?.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!item?.id,
  });

  const handleDecision = async (decision: 'approved' | 'rejected' | 'request_changes') => {
    if (!item) return;
    
    setIsSubmitting(true);
    try {
      makeDecision({
        itemId: item.id,
        decision,
        comments: comments || undefined,
      });
      onOpenChange(false);
      setComments("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  const isPending = ["pending", "in_review"].includes(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">פרטים</TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
            <TabsTrigger value="comments">
              תגובות
              {itemComments.length > 0 && (
                <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 flex items-center justify-center">
                  {itemComments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">סוג</p>
                    <p className="font-medium">{item.item_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">עדיפות</p>
                    <p className="font-medium">{item.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">שלב נוכחי</p>
                    <p className="font-medium">{item.current_step} מתוך {item.total_steps}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">נשלח ב</p>
                    <p className="font-medium">
                      {format(new Date(item.submitted_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </p>
                  </div>
                </div>

                {item.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">תיאור</p>
                    <p className="bg-muted p-3 rounded-lg">{item.description}</p>
                  </div>
                )}

                {Object.keys(item.data || {}).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">נתונים נוספים</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="max-h-[400px]">
              {decisions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">אין היסטוריית החלטות</p>
              ) : (
                <div className="space-y-3">
                  {decisions.map((decision) => (
                    <div key={decision.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {decision.decision === "approved" && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                          {decision.decision === "rejected" && (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          {decision.decision === "request_changes" && (
                            <MessageSquare className="w-4 h-4 text-warning" />
                          )}
                          <span className="font-medium">
                            {decision.decision === "approved" ? "אושר" : 
                             decision.decision === "rejected" ? "נדחה" : "בקשת שינויים"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          שלב {decision.step_number}
                        </span>
                      </div>
                      {decision.comments && (
                        <p className="text-sm text-muted-foreground">{decision.comments}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(decision.decided_at), "dd/MM/yyyy HH:mm", { locale: he })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <ScrollArea className="max-h-[400px]">
              {itemComments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">אין תגובות</p>
              ) : (
                <div className="space-y-3">
                  {itemComments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        </span>
                        {comment.is_internal && (
                          <Badge variant="outline" className="text-xs">פנימי</Badge>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {isPending && (
          <>
            <div className="space-y-2 pt-4 border-t border-border">
              <Label>הערות (אופציונלי)</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="הוסף הערה להחלטה..."
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleDecision("request_changes")}
                disabled={isSubmitting}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                בקש שינויים
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDecision("rejected")}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                דחה
              </Button>
              <Button 
                className="bg-success hover:bg-success/90"
                onClick={() => handleDecision("approved")}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                אשר
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
