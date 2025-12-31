import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFeatureRequests, FeatureRequest } from "@/hooks/useFeatureRequests";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Trash2, 
  Check, 
  Archive, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const priorityConfig = {
  high: { label: "גבוהה", className: "bg-destructive/20 text-destructive border-destructive/30" },
  medium: { label: "בינונית", className: "bg-warning/20 text-warning border-warning/30" },
  low: { label: "נמוכה", className: "bg-muted text-muted-foreground border-muted" },
};

const statusConfig = {
  pending: { label: "ממתין", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "בביצוע", className: "bg-primary/20 text-primary" },
  completed: { label: "הושלם", className: "bg-green-500/20 text-green-600" },
  archived: { label: "בארכיון", className: "bg-muted text-muted-foreground" },
};

const categoryOptions = [
  { value: "general", label: "כללי" },
  { value: "technical", label: "טכני" },
  { value: "business", label: "עסקי" },
  { value: "ui", label: "ממשק משתמש" },
  { value: "integration", label: "אינטגרציה" },
];

export function FeatureRequestsManager() {
  const { 
    features, 
    archivedFeatures, 
    isLoading, 
    addFeature, 
    deleteFeature,
    markCompleted,
    archiveFeature,
    restoreFeature,
    convertToTask,
    isAdding 
  } = useFeatureRequests();

  const [showArchive, setShowArchive] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFeature, setNewFeature] = useState({ title: "", description: "", category: "general", priority: "medium" });

  const handleAddFeature = () => {
    if (!newFeature.title.trim()) return;
    addFeature(newFeature);
    setNewFeature({ title: "", description: "", category: "general", priority: "medium" });
    setShowAddDialog(false);
  };

  const renderFeatureItem = (feature: FeatureRequest, isArchived = false) => (
    <div 
      key={feature.id}
      className={cn(
        "p-4 border rounded-lg transition-colors",
        feature.status === "completed" && "bg-green-500/5 border-green-500/20",
        feature.status === "in_progress" && "bg-primary/5 border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className={cn(
              "font-medium",
              feature.status === "completed" && "line-through text-muted-foreground"
            )}>
              {feature.title}
            </h4>
            <Badge className={cn("text-xs", priorityConfig[feature.priority].className)}>
              {priorityConfig[feature.priority].label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {categoryOptions.find(c => c.value === feature.category)?.label || feature.category}
            </Badge>
            {feature.converted_task_id && (
              <Badge className="text-xs bg-blue-500/20 text-blue-600">
                הומר למשימה
              </Badge>
            )}
          </div>
          {feature.description && (
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isArchived ? (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => restoreFeature(feature.id)}
              title="שחזר מארכיון"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          ) : (
            <>
              {feature.status !== "completed" && !feature.converted_task_id && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => convertToTask(feature)}
                  title="המר למשימה"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {feature.status !== "completed" && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => markCompleted(feature.id)}
                  title="סמן כהושלם"
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => archiveFeature(feature.id)}
                title="העבר לארכיון"
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => deleteFeature(feature.id)}
                title="מחק"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              ניהול פיצ'רים
            </CardTitle>
            <CardDescription>
              {features.length} פיצ'רים פעילים • {features.filter(f => f.status === "completed").length} הושלמו
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowArchive(!showArchive)}
              className="gap-1"
            >
              <Archive className="w-4 h-4" />
              ארכיון ({archivedFeatures.length})
              {showArchive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  הוסף פיצ'ר
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הוספת פיצ'ר חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Input
                      placeholder="שם הפיצ'ר"
                      value={newFeature.title}
                      onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="תיאור (אופציונלי)"
                      value={newFeature.description}
                      onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={newFeature.category}
                      onValueChange={(value) => setNewFeature({ ...newFeature, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newFeature.priority}
                      onValueChange={(value) => setNewFeature({ ...newFeature, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="עדיפות" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">גבוהה</SelectItem>
                        <SelectItem value="medium">בינונית</SelectItem>
                        <SelectItem value="low">נמוכה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddFeature} 
                    disabled={!newFeature.title.trim() || isAdding}
                    className="w-full"
                  >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    הוסף פיצ'ר
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showArchive && archivedFeatures.length > 0 && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">ארכיון</h4>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {archivedFeatures.map((feature) => renderFeatureItem(feature, true))}
              </div>
            </ScrollArea>
          </div>
        )}

        {features.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין פיצ'רים פעילים</p>
            <p className="text-sm">לחצו על "הוסף פיצ'ר" להתחיל</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {features.map((feature) => renderFeatureItem(feature))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
