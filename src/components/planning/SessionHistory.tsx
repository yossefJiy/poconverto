import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { History, Search, Trash2, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanningSession {
  id: string;
  title: string;
  session_type: string;
  status: string;
  created_at: string;
  completed_parts?: number;
  total_parts?: number;
}

interface SessionHistoryProps {
  sessions: PlanningSession[];
  onSessionSelect: (sessionId: string) => void;
  onSessionsChange: () => void;
}

export const SessionHistory = ({ 
  sessions, 
  onSessionSelect, 
  onSessionsChange 
}: SessionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.session_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      // Delete dialogue parts first
      await supabase
        .from('planning_dialogue_parts')
        .delete()
        .eq('session_id', sessionId);

      // Then delete session
      const { error } = await supabase
        .from('planning_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success("המפגש נמחק בהצלחה");
      onSessionsChange();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error("שגיאה במחיקת המפגש");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">הושלם</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">בתהליך</Badge>;
      default:
        return <Badge variant="outline">טיוטה</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          מפגשי תכנון קודמים
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש מפגשים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredSessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{searchTerm ? "לא נמצאו תוצאות" : "אין מפגשים קודמים"}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString('he-IL')}
                      </p>
                      {session.completed_parts !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          ({session.completed_parts}/{session.total_parts} חלקים)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(session.status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSessionSelect(session.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
                          {deletingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת מפגש</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את המפגש "{session.title}"?
                            פעולה זו אינה הפיכה.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
