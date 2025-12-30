import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Table
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedTask {
  title: string;
  description?: string;
  due_date?: string;
  assignee?: string;
  priority?: string;
  category?: string;
  valid: boolean;
  error?: string;
}

interface BulkTaskImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (tasks: Array<{ title: string; description?: string; due_date?: string; assignee?: string; priority?: string; category?: string }>) => void;
  teamMembers?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

const categoryOptions = [
  "אסטרטגיה ותכנון",
  "קריאייטיב ועיצוב",
  "קמפיינים ופרסום",
  "ניתוח נתונים",
  "תפעול וניהול",
  "פיתוח ומערכות",
  "תוכן ו-SEO",
  "לקוחות ומכירות",
  "מנהל מוצר",
];

export function BulkTaskImport({ open, onOpenChange, onImport, teamMembers = [], isLoading }: BulkTaskImportProps) {
  const [activeTab, setActiveTab] = useState<"text" | "file" | "url">("text");
  const [textInput, setTextInput] = useState("");
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [defaultPriority, setDefaultPriority] = useState("medium");
  const [defaultAssignee, setDefaultAssignee] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const tasks = parseCSVContent(content);
      setParsedTasks(tasks);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  // Parse text input - each line is a task
  const parseTextInput = useCallback((text: string): ParsedTask[] => {
    const lines = text.split("\n").filter(line => line.trim());
    return lines.map(line => {
      const trimmed = line.trim();
      // Check if line has CSV-like format (title, description, date, assignee)
      const parts = trimmed.split(/[,\t]/).map(p => p.trim());
      
      if (parts.length >= 2) {
        return {
          title: parts[0],
          description: parts[1] || undefined,
          due_date: parts[2] || undefined,
          assignee: parts[3] || defaultAssignee || undefined,
          priority: defaultPriority,
          category: defaultCategory || undefined,
          valid: !!parts[0],
          error: !parts[0] ? "חסרה כותרת" : undefined,
        };
      }
      
      return {
        title: trimmed,
        priority: defaultPriority,
        assignee: defaultAssignee || undefined,
        category: defaultCategory || undefined,
        valid: !!trimmed,
        error: !trimmed ? "שורה ריקה" : undefined,
      };
    });
  }, [defaultPriority, defaultAssignee, defaultCategory]);

  // Parse CSV/Excel content
  const parseCSVContent = useCallback((content: string): ParsedTask[] => {
    const lines = content.split("\n");
    if (lines.length === 0) return [];

    // Try to detect header row
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("title") || firstLine.includes("כותרת") || 
                      firstLine.includes("name") || firstLine.includes("שם");
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    return dataLines.filter(line => line.trim()).map(line => {
      const parts = line.split(/[,\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      return {
        title: parts[0] || "",
        description: parts[1] || undefined,
        due_date: parts[2] ? formatDate(parts[2]) : undefined,
        assignee: parts[3] || defaultAssignee || undefined,
        priority: parts[4] || defaultPriority,
        category: parts[5] || defaultCategory || undefined,
        valid: !!parts[0],
        error: !parts[0] ? "חסרה כותרת" : undefined,
      };
    });
  }, [defaultPriority, defaultAssignee, defaultCategory]);

  // Format date to YYYY-MM-DD
  const formatDate = (dateStr: string): string | undefined => {
    try {
      // Try parsing various formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
      // Try DD/MM/YYYY format
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      }
    } catch {
      return undefined;
    }
    return undefined;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Validate task fields
  const validateTask = useCallback((task: ParsedTask): ParsedTask => {
    const errors: string[] = [];
    
    if (!task.title.trim()) {
      errors.push("כותרת חובה");
    } else if (task.title.length > 200) {
      errors.push("כותרת ארוכה מדי (מקסימום 200 תווים)");
    }
    
    if (task.description && task.description.length > 1000) {
      errors.push("תיאור ארוך מדי (מקסימום 1000 תווים)");
    }
    
    if (task.due_date) {
      const date = new Date(task.due_date);
      if (isNaN(date.getTime())) {
        errors.push("תאריך לא תקין");
      }
    }
    
    return {
      ...task,
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join(", ") : undefined
    };
  }, []);

  // Update task with validation
  const updateTaskWithValidation = useCallback((index: number, field: keyof ParsedTask, value: string) => {
    setParsedTasks(prev => prev.map((task, i) => {
      if (i !== index) return task;
      const updatedTask = { ...task, [field]: value };
      return validateTask(updatedTask);
    }));
  }, [validateTask]);

  // Handle text parse
  const handleParseText = () => {
    const tasks = parseTextInput(textInput);
    setParsedTasks(tasks);
    setShowPreview(true);
  };

  // Handle Google Docs URL
  const handleGoogleDocsUrl = () => {
    if (!googleDocsUrl.includes("docs.google.com")) {
      setUrlError("נא להזין קישור תקין ל-Google Docs");
      return;
    }
    setUrlError("אינטגרציית Google Docs דורשת חיבור חשבון Google. התכונה תהיה זמינה בקרוב.");
  };

  // Remove task from preview
  const removeTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, i) => i !== index));
  };

  // Update task in preview
  const updateTask = (index: number, field: keyof ParsedTask, value: string) => {
    setParsedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value, valid: field === "title" ? !!value : task.valid } : task
    ));
  };

  // Handle import
  const handleImport = () => {
    const validTasks = parsedTasks.filter(t => t.valid).map(t => ({
      title: t.title,
      description: t.description,
      due_date: t.due_date,
      assignee: t.assignee,
      priority: t.priority,
      category: t.category,
    }));
    onImport(validTasks);
    resetState();
  };

  const resetState = () => {
    setTextInput("");
    setParsedTasks([]);
    setShowPreview(false);
    setGoogleDocsUrl("");
    setUrlError("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const validCount = parsedTasks.filter(t => t.valid).length;
  const invalidCount = parsedTasks.filter(t => !t.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            ייבוא משימות בכמות
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  טקסט חופשי
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel / CSV
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Google Docs
                </TabsTrigger>
              </TabsList>

              {/* Default values section */}
              <div className="grid grid-cols-3 gap-3 py-4 border-b border-border">
                <div>
                  <Label className="text-xs text-muted-foreground">עדיפות ברירת מחדל</Label>
                  <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="medium">בינונית</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">אחראי ברירת מחדל</Label>
                  <Select value={defaultAssignee || "none"} onValueChange={(v) => setDefaultAssignee(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="לא נבחר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">לא נבחר</SelectItem>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">קטגוריה ברירת מחדל</Label>
                  <Select value={defaultCategory || "none"} onValueChange={(v) => setDefaultCategory(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="לא נבחרה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">לא נבחרה</SelectItem>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="text" className="flex-1 mt-4">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    הדביקו רשימת משימות - כל שורה תהפוך למשימה נפרדת.
                    <br />
                    <span className="text-xs">פורמט אופציונלי: כותרת, תיאור, תאריך, אחראי (מופרדים בפסיק או טאב)</span>
                  </div>
                  <Textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="משימה ראשונה&#10;משימה שנייה, תיאור, 25/12/2024, שם העובד&#10;משימה שלישית"
                    className="min-h-[200px] font-mono text-sm"
                    dir="rtl"
                  />
                  <Button onClick={handleParseText} disabled={!textInput.trim()} className="w-full">
                    <Table className="w-4 h-4 mr-2" />
                    ניתוח והצגת תצוגה מקדימה
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="file" className="flex-1 mt-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    העלו קובץ Excel או CSV עם העמודות הבאות:
                    <br />
                    <Badge variant="outline" className="mt-2 text-xs">כותרת (חובה)</Badge>
                    <Badge variant="outline" className="mr-1 text-xs">תיאור</Badge>
                    <Badge variant="outline" className="mr-1 text-xs">תאריך</Badge>
                    <Badge variant="outline" className="mr-1 text-xs">אחראי</Badge>
                    <Badge variant="outline" className="mr-1 text-xs">עדיפות</Badge>
                    <Badge variant="outline" className="mr-1 text-xs">קטגוריה</Badge>
                  </div>
                  
                  <div 
                    ref={dropZoneRef}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <FileSpreadsheet className={cn(
                      "w-12 h-12 mx-auto mb-4 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                    <p className={cn(
                      "text-sm transition-colors",
                      isDragging ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {isDragging ? "שחררו את הקובץ כאן" : "לחצו לבחירת קובץ או גררו לכאן"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, XLS, XLSX</p>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.xls,.xlsx,.txt" 
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="url" className="flex-1 mt-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    הדביקו קישור למסמך Google Docs שמכיל רשימת משימות
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={googleDocsUrl}
                      onChange={(e) => { setGoogleDocsUrl(e.target.value); setUrlError(""); }}
                      placeholder="https://docs.google.com/document/d/..."
                      dir="ltr"
                    />
                    <Button onClick={handleGoogleDocsUrl} disabled={!googleDocsUrl.trim()}>
                      ייבוא
                    </Button>
                  </div>
                  {urlError && (
                    <div className="text-sm text-warning bg-warning/10 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {urlError}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    💡 אינטגרציה מלאה עם Google Workspace (Docs, Sheets, Drive, Calendar) תתאפשר לאחר חיבור חשבון Google
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-success/20 text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {validCount} תקינות
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {invalidCount} עם שגיאות
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                חזרה לעריכה
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {parsedTasks.map((task, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "border rounded-lg p-3 transition-colors",
                      task.valid ? "border-border bg-card" : "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={task.title}
                          onChange={(e) => updateTaskWithValidation(index, "title", e.target.value)}
                          placeholder="כותרת משימה"
                          className={cn("font-medium", !task.valid && "border-destructive")}
                          maxLength={200}
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <Input 
                            value={task.description || ""}
                            onChange={(e) => updateTaskWithValidation(index, "description", e.target.value)}
                            placeholder="תיאור"
                            className="text-sm"
                            maxLength={1000}
                          />
                          <Input 
                            type="date"
                            value={task.due_date || ""}
                            onChange={(e) => updateTaskWithValidation(index, "due_date", e.target.value)}
                            className="text-sm"
                          />
                          <Select 
                            value={task.assignee || "none"} 
                            onValueChange={(v) => updateTaskWithValidation(index, "assignee", v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="אחראי" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">לא נבחר</SelectItem>
                              {teamMembers.map(m => (
                                <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select 
                            value={task.priority || "medium"} 
                            onValueChange={(v) => updateTaskWithValidation(index, "priority", v)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">נמוכה</SelectItem>
                              <SelectItem value="medium">בינונית</SelectItem>
                              <SelectItem value="high">גבוהה</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {task.error && (
                          <p className="text-xs text-destructive">{task.error}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeTask(index)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => handleClose(false)}>
            ביטול
          </Button>
          {showPreview && (
            <Button onClick={handleImport} disabled={validCount === 0 || isLoading}>
              {isLoading ? "מייבא..." : `ייבוא ${validCount} משימות`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
