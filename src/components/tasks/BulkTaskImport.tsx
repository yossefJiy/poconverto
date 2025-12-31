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
  Table,
  LayoutTemplate,
  Megaphone,
  Users,
  Calendar,
  Target,
  Sparkles,
  Clock,
  Package,
  PartyPopper,
  RefreshCcw,
  Plus,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Task templates
const defaultTaskTemplates = [
  {
    id: "campaign-launch",
    name: "השקת קמפיין",
    icon: Megaphone,
    description: "רשימת משימות להשקת קמפיין פרסומי",
    isCustom: false,
    tasks: [
      { title: "הגדרת יעדי קמפיין ו-KPIs", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "בחירת קהלי יעד וסגמנטציה", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "הכנת קריאייטיבים (תמונות/וידאו)", category: "קריאייטיב ועיצוב", priority: "high" },
      { title: "כתיבת טקסטים ומסרים", category: "תוכן ו-SEO", priority: "medium" },
      { title: "הגדרת תקציב יומי/כולל", category: "קמפיינים ופרסום", priority: "high" },
      { title: "בניית מבנה קמפיין בפלטפורמה", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "הגדרת טראקינג והמרות", category: "ניתוח נתונים", priority: "high" },
      { title: "בדיקות A/B לקריאייטיב", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "אישור והפעלת קמפיין", category: "קמפיינים ופרסום", priority: "high" },
      { title: "ניטור ביצועים יום ראשון", category: "ניתוח נתונים", priority: "high" },
    ]
  },
  {
    id: "product-launch",
    name: "השקת מוצר",
    icon: Package,
    description: "תהליך מלא להשקת מוצר חדש",
    isCustom: false,
    tasks: [
      { title: "מחקר שוק ותחרות", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "הגדרת USP ומסרים", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "צילום מוצר מקצועי", category: "קריאייטיב ועיצוב", priority: "high" },
      { title: "עיצוב דף נחיתה למוצר", category: "קריאייטיב ועיצוב", priority: "high" },
      { title: "כתיבת תיאורי מוצר", category: "תוכן ו-SEO", priority: "medium" },
      { title: "הכנת קמפיין לונצ'", category: "קמפיינים ופרסום", priority: "high" },
      { title: "יצירת תוכן לסושיאל", category: "תוכן ו-SEO", priority: "medium" },
      { title: "הכנת מיילים לרשימת תפוצה", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "הגדרת מבצע השקה", category: "לקוחות ומכירות", priority: "high" },
      { title: "בניית funnel המכירה", category: "קמפיינים ופרסום", priority: "high" },
      { title: "תיאום עם משפיענים", category: "לקוחות ומכירות", priority: "medium" },
      { title: "מעקב אחרי ביצועי לונצ'", category: "ניתוח נתונים", priority: "high" },
    ]
  },
  {
    id: "event",
    name: "אירוע",
    icon: PartyPopper,
    description: "ניהול וקידום אירוע",
    isCustom: false,
    tasks: [
      { title: "הגדרת מטרות ויעדי האירוע", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "קביעת תאריך ומיקום", category: "תפעול וניהול", priority: "high" },
      { title: "בניית תקציב אירוע", category: "תפעול וניהול", priority: "high" },
      { title: "עיצוב זמנת אירוע", category: "קריאייטיב ועיצוב", priority: "high" },
      { title: "בניית דף הרשמה", category: "פיתוח ומערכות", priority: "high" },
      { title: "קמפיין פרסום לאירוע", category: "קמפיינים ופרסום", priority: "high" },
      { title: "שליחת הזמנות במייל", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "פרסום בסושיאל", category: "תוכן ו-SEO", priority: "medium" },
      { title: "תזכורת למשתתפים", category: "תפעול וניהול", priority: "medium" },
      { title: "הכנת חומרים לאירוע", category: "קריאייטיב ועיצוב", priority: "medium" },
      { title: "צילום ותיעוד האירוע", category: "קריאייטיב ועיצוב", priority: "medium" },
      { title: "סיכום ופולואפ למשתתפים", category: "לקוחות ומכירות", priority: "high" },
    ]
  },
  {
    id: "remarketing",
    name: "קמפיין רימרקטינג",
    icon: RefreshCcw,
    description: "הקמת קמפיין רימרקטינג אפקטיבי",
    isCustom: false,
    tasks: [
      { title: "הגדרת קהלי רימרקטינג", category: "קמפיינים ופרסום", priority: "high" },
      { title: "בדיקת פיקסלים וטאגים", category: "ניתוח נתונים", priority: "high" },
      { title: "יצירת קהלים לפי התנהגות", category: "קמפיינים ופרסום", priority: "high" },
      { title: "עיצוב באנרים לרימרקטינג", category: "קריאייטיב ועיצוב", priority: "high" },
      { title: "כתיבת מסרים מותאמים", category: "תוכן ו-SEO", priority: "medium" },
      { title: "הגדרת תקציב ובידים", category: "קמפיינים ופרסום", priority: "high" },
      { title: "הגדרת סיקוונס מודעות", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "קביעת תדירות הצגה", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "הגדרת המרות ו-attribution", category: "ניתוח נתונים", priority: "high" },
      { title: "מעקב ואופטימיזציה", category: "ניתוח נתונים", priority: "high" },
    ]
  },
  {
    id: "new-client",
    name: "הקמת לקוח חדש",
    icon: Users,
    description: "תהליך אונבורדינג ללקוח חדש",
    isCustom: false,
    tasks: [
      { title: "פגישת היכרות ובריף", category: "לקוחות ומכירות", priority: "high" },
      { title: "איסוף נכסים דיגיטליים (לוגו, צבעים, פונטים)", category: "קריאייטיב ועיצוב", priority: "high" },
      { title: "קבלת גישה לחשבונות פרסום", category: "תפעול וניהול", priority: "high" },
      { title: "חיבור Google Analytics", category: "ניתוח נתונים", priority: "high" },
      { title: "חיבור חשבונות סושיאל", category: "תפעול וניהול", priority: "medium" },
      { title: "הגדרת דוחות אוטומטיים", category: "ניתוח נתונים", priority: "medium" },
      { title: "בניית אסטרטגיה שיווקית", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "הכנת לוח שנה ותוכן", category: "תוכן ו-SEO", priority: "medium" },
    ]
  },
  {
    id: "monthly-report",
    name: "דו״ח חודשי",
    icon: Calendar,
    description: "הכנת דו״ח ביצועים חודשי",
    isCustom: false,
    tasks: [
      { title: "איסוף נתוני קמפיינים", category: "ניתוח נתונים", priority: "high" },
      { title: "ניתוח Google Analytics", category: "ניתוח נתונים", priority: "high" },
      { title: "סיכום המרות ו-ROAS", category: "ניתוח נתונים", priority: "high" },
      { title: "השוואה לחודש קודם", category: "ניתוח נתונים", priority: "medium" },
      { title: "זיהוי תובנות ומסקנות", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "הכנת המלצות לחודש הבא", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "עיצוב הדו״ח", category: "קריאייטיב ועיצוב", priority: "medium" },
      { title: "שליחה ללקוח", category: "לקוחות ומכירות", priority: "high" },
    ]
  },
  {
    id: "website-launch",
    name: "השקת אתר",
    icon: Target,
    description: "רשימת בדיקות להשקת אתר",
    isCustom: false,
    tasks: [
      { title: "בדיקת תאימות מובייל", category: "פיתוח ומערכות", priority: "high" },
      { title: "בדיקת מהירות טעינה", category: "פיתוח ומערכות", priority: "high" },
      { title: "התקנת Google Analytics & GTM", category: "ניתוח נתונים", priority: "high" },
      { title: "הגדרת Search Console", category: "תוכן ו-SEO", priority: "high" },
      { title: "בדיקת SEO בסיסי (title, meta)", category: "תוכן ו-SEO", priority: "high" },
      { title: "בדיקת טפסי יצירת קשר", category: "פיתוח ומערכות", priority: "high" },
      { title: "הגדרת Pixel פייסבוק", category: "קמפיינים ופרסום", priority: "medium" },
      { title: "יצירת sitemap.xml", category: "תוכן ו-SEO", priority: "medium" },
      { title: "בדיקת SSL ואבטחה", category: "פיתוח ומערכות", priority: "high" },
    ]
  },
  {
    id: "content-plan",
    name: "תוכנית תוכן",
    icon: Sparkles,
    description: "הכנת תוכנית תוכן לסושיאל",
    isCustom: false,
    tasks: [
      { title: "מחקר מתחרים", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "הגדרת נושאי תוכן מרכזיים", category: "אסטרטגיה ותכנון", priority: "high" },
      { title: "יצירת לוח תוכן חודשי", category: "תוכן ו-SEO", priority: "high" },
      { title: "כתיבת פוסטים", category: "תוכן ו-SEO", priority: "medium" },
      { title: "הכנת קריאייטיבים", category: "קריאייטיב ועיצוב", priority: "medium" },
      { title: "תכנון סטוריז ורילס", category: "קריאייטיב ועיצוב", priority: "medium" },
      { title: "תיאום צילומים", category: "תפעול וניהול", priority: "low" },
      { title: "אישור לקוח", category: "לקוחות ומכירות", priority: "high" },
    ]
  }
];

interface ParsedTask {
  title: string;
  description?: string;
  due_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  assignee?: string;
  priority?: string;
  category?: string;
  valid: boolean;
  error?: string;
}

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  isCustom: true;
  tasks: Array<{ title: string; category?: string; priority?: string }>;
}

interface BulkTaskImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (tasks: Array<{ 
    title: string; 
    description?: string; 
    due_date?: string; 
    scheduled_time?: string;
    duration_minutes?: number;
    assignee?: string; 
    priority?: string; 
    category?: string 
  }>) => void;
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

const durationOptions = [
  { value: 15, label: "15 דקות" },
  { value: 30, label: "30 דקות" },
  { value: 45, label: "45 דקות" },
  { value: 60, label: "שעה" },
  { value: 90, label: "שעה וחצי" },
  { value: 120, label: "שעתיים" },
  { value: 180, label: "3 שעות" },
  { value: 240, label: "4 שעות" },
];

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

const CUSTOM_TEMPLATES_KEY = "jiy-custom-task-templates";

export function BulkTaskImport({ open, onOpenChange, onImport, teamMembers = [], isLoading }: BulkTaskImportProps) {
  const [activeTab, setActiveTab] = useState<"templates" | "text" | "file" | "url">("templates");
  const [textInput, setTextInput] = useState("");
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [defaultPriority, setDefaultPriority] = useState("medium");
  const [defaultAssignee, setDefaultAssignee] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultDuration, setDefaultDuration] = useState<number>(60);
  const [defaultTime, setDefaultTime] = useState("");
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateTasks, setNewTemplateTasks] = useState("");

  // Save custom templates to localStorage
  const saveCustomTemplates = (templates: CustomTemplate[]) => {
    setCustomTemplates(templates);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  };

  const handleCreateCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateTasks.trim()) return;

    const tasks = newTemplateTasks.split("\n").filter(line => line.trim()).map(line => {
      const parts = line.split(",").map(p => p.trim());
      return {
        title: parts[0],
        category: parts[1] || undefined,
        priority: parts[2] || "medium"
      };
    });

    const newTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription || "תבנית מותאמת אישית",
      isCustom: true,
      tasks
    };

    saveCustomTemplates([...customTemplates, newTemplate]);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateTasks("");
    setShowCreateTemplate(false);
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    saveCustomTemplates(customTemplates.filter(t => t.id !== templateId));
  };

  // All templates combined
  const allTemplates = [...defaultTaskTemplates, ...customTemplates];

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
  // Format: כותרת, תיאור, תאריך, שעה, אחראי, עדיפות, קטגוריה, משך
  const parseTextInput = useCallback((text: string): ParsedTask[] => {
    const lines = text.split("\n").filter(line => line.trim());
    return lines.map(line => {
      const trimmed = line.trim();
      // Check if line has CSV-like format
      const parts = trimmed.split(/[,\t]/).map(p => p.trim());
      
      if (parts.length >= 2) {
        const priority = parts[5] || defaultPriority;
        const validPriority = ["low", "medium", "high"].includes(priority) ? priority : defaultPriority;
        const duration = parts[7] ? parseInt(parts[7]) : defaultDuration;
        
        return {
          title: parts[0],
          description: parts[1] || undefined,
          due_date: parts[2] ? formatDate(parts[2]) : undefined,
          scheduled_time: parts[3] || defaultTime || undefined,
          assignee: parts[4] || defaultAssignee || undefined,
          priority: validPriority,
          category: parts[6] || defaultCategory || undefined,
          duration_minutes: isNaN(duration) ? defaultDuration : duration,
          valid: !!parts[0],
          error: !parts[0] ? "חסרה כותרת" : undefined,
        };
      }
      
      return {
        title: trimmed,
        priority: defaultPriority,
        assignee: defaultAssignee || undefined,
        category: defaultCategory || undefined,
        scheduled_time: defaultTime || undefined,
        duration_minutes: defaultDuration,
        valid: !!trimmed,
        error: !trimmed ? "שורה ריקה" : undefined,
      };
    });
  }, [defaultPriority, defaultAssignee, defaultCategory, defaultDuration, defaultTime]);

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
      const priority = parts[5] || defaultPriority;
      const validPriority = ["low", "medium", "high"].includes(priority) ? priority : defaultPriority;
      const duration = parts[7] ? parseInt(parts[7]) : defaultDuration;
      
      return {
        title: parts[0] || "",
        description: parts[1] || undefined,
        due_date: parts[2] ? formatDate(parts[2]) : undefined,
        scheduled_time: parts[3] || defaultTime || undefined,
        assignee: parts[4] || defaultAssignee || undefined,
        priority: validPriority,
        category: parts[6] || defaultCategory || undefined,
        duration_minutes: isNaN(duration) ? defaultDuration : duration,
        valid: !!parts[0],
        error: !parts[0] ? "חסרה כותרת" : undefined,
      };
    });
  }, [defaultPriority, defaultAssignee, defaultCategory, defaultDuration, defaultTime]);

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
  const updateTaskWithValidation = useCallback((index: number, field: keyof ParsedTask, value: string | number) => {
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

  // Handle import
  const handleImport = () => {
    const validTasks = parsedTasks.filter(t => t.valid).map(t => ({
      title: t.title,
      description: t.description,
      due_date: t.due_date,
      scheduled_time: t.scheduled_time,
      duration_minutes: t.duration_minutes,
      assignee: t.assignee,
      priority: t.priority,
      category: t.category,
    }));
    onImport(validTasks);
    // Keep the preview state until the parent closes the dialog on success.
    // This prevents losing the parsed tasks if the import fails.
  };

  const resetState = () => {
    setTextInput("");
    setParsedTasks([]);
    setShowPreview(false);
    setGoogleDocsUrl("");
    setUrlError("");
    setShowCreateTemplate(false);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateTasks("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const validCount = parsedTasks.filter(t => t.valid).length;
  const invalidCount = parsedTasks.filter(t => !t.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Upload className="w-5 h-5" />
            ייבוא משימות בכמות
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="h-full flex flex-col" dir="rtl">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  תבניות
                </TabsTrigger>
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

              {/* Templates section */}
              <TabsContent value="templates" className="flex-1 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      בחרו תבנית מוכנה להתחלה מהירה
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowCreateTemplate(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      צור תבנית חדשה
                    </Button>
                  </div>

                  {/* Create Custom Template Form */}
                  {showCreateTemplate && (
                    <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <Plus className="w-4 h-4 text-primary" />
                          יצירת תבנית מותאמת אישית
                        </h4>
                        <Button variant="ghost" size="icon" onClick={() => setShowCreateTemplate(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">שם התבנית</Label>
                          <Input 
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="למשל: השקת קולקציה"
                            className="mt-1 text-right"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">תיאור (אופציונלי)</Label>
                          <Input 
                            value={newTemplateDescription}
                            onChange={(e) => setNewTemplateDescription(e.target.value)}
                            placeholder="תיאור קצר של התבנית"
                            className="mt-1 text-right"
                            dir="rtl"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">משימות (שורה לכל משימה, אפשר להוסיף קטגוריה ועדיפות מופרדות בפסיק)</Label>
                        <Textarea 
                          value={newTemplateTasks}
                          onChange={(e) => setNewTemplateTasks(e.target.value)}
                          placeholder={"פגישת תכנון\nעיצוב קריאייטיב, קריאייטיב ועיצוב, high\nכתיבת תוכן, תוכן ו-SEO"}
                          className="mt-1 min-h-[100px] font-mono text-sm text-right"
                          dir="rtl"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateCustomTemplate} 
                        disabled={!newTemplateName.trim() || !newTemplateTasks.trim()}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 ml-2" />
                        שמור תבנית
                      </Button>
                    </div>
                  )}

                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 gap-3 pl-2">
                      {allTemplates.map((template) => {
                        const Icon = 'icon' in template ? template.icon : Sparkles;
                        const isCustom = 'isCustom' in template && template.isCustom;
                        return (
                          <div
                            key={template.id}
                            className={cn(
                              "border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer",
                              isCustom ? "border-primary/30 bg-primary/5" : "border-border"
                            )}
                            onClick={() => {
                              const tasks = template.tasks.map(t => ({
                                ...t,
                                valid: true,
                                assignee: defaultAssignee || undefined,
                                scheduled_time: defaultTime || undefined,
                                duration_minutes: defaultDuration,
                              }));
                              setParsedTasks(tasks);
                              setShowPreview(true);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                isCustom ? "bg-primary/30" : "bg-primary/20"
                              )}>
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{template.name}</h4>
                                    {isCustom && (
                                      <Badge variant="secondary" className="text-xs">מותאם</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {template.tasks.length} משימות
                                    </Badge>
                                    {isCustom && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCustomTemplate(template.id);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {template.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.tasks.slice(0, 3).map((t, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {t.title.length > 20 ? t.title.slice(0, 20) + "..." : t.title}
                                    </Badge>
                                  ))}
                                  {template.tasks.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{template.tasks.length - 3} נוספות
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Default values section */}
              <div className="grid grid-cols-5 gap-3 py-4 border-b border-border" dir="rtl">
                <div>
                  <Label className="text-xs text-muted-foreground text-right block">עדיפות</Label>
                  <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                    <SelectTrigger className="h-9 mt-1 text-right" dir="rtl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="medium">בינונית</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground text-right block">אחראי</Label>
                  <Select value={defaultAssignee || "none"} onValueChange={(v) => setDefaultAssignee(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 mt-1 text-right" dir="rtl">
                      <SelectValue placeholder="לא נבחר" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="none">לא נבחר</SelectItem>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground text-right block">קטגוריה</Label>
                  <Select value={defaultCategory || "none"} onValueChange={(v) => setDefaultCategory(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 mt-1 text-right" dir="rtl">
                      <SelectValue placeholder="לא נבחרה" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="none">לא נבחרה</SelectItem>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground text-right block">שעה</Label>
                  <Select value={defaultTime || "none"} onValueChange={(v) => setDefaultTime(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 mt-1 text-right" dir="rtl">
                      <SelectValue placeholder="לא נבחרה" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="none">לא נבחרה</SelectItem>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground text-right block">משך</Label>
                  <Select value={String(defaultDuration)} onValueChange={(v) => setDefaultDuration(parseInt(v))}>
                    <SelectTrigger className="h-9 mt-1 text-right" dir="rtl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {durationOptions.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="text" className="flex-1 mt-4">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground text-right">
                    הדביקו רשימת משימות - כל שורה תהפוך למשימה נפרדת.
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 text-right" dir="rtl">
                    <div className="font-medium text-foreground mb-2">פורמט אופציונלי (מופרדים בפסיק או טאב):</div>
                    <div className="text-muted-foreground">כותרת, תיאור, תאריך, שעה, אחראי, עדיפות, קטגוריה, משך</div>
                    <div className="text-muted-foreground mt-2">דוגמאות:</div>
                    <div className="font-mono text-xs bg-background rounded p-2 mt-1 text-right" dir="rtl">
                      <div>פגישת לקוח</div>
                      <div>בדיקת קמפיין, בדיקת ביצועים, 25/12/2024, 10:00, יוסי, high, קמפיינים ופרסום, 60</div>
                      <div>עדכון אתר, שינויי עיצוב, 26/12/2024</div>
                    </div>
                  </div>
                  <Textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="משימה ראשונה&#10;משימה שנייה, תיאור, 25/12/2024, 10:00, שם העובד&#10;משימה שלישית"
                    className="min-h-[180px] font-mono text-sm text-right"
                    dir="rtl"
                  />
                  <Button onClick={handleParseText} disabled={!textInput.trim()} className="w-full">
                    <Table className="w-4 h-4 ml-2" />
                    ניתוח והצגת תצוגה מקדימה
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="file" className="flex-1 mt-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground text-right">
                    העלו קובץ Excel או CSV עם העמודות הבאות:
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end" dir="rtl">
                    <Badge variant="outline" className="text-xs">כותרת (חובה)</Badge>
                    <Badge variant="outline" className="text-xs">תיאור</Badge>
                    <Badge variant="outline" className="text-xs">תאריך</Badge>
                    <Badge variant="outline" className="text-xs">שעה</Badge>
                    <Badge variant="outline" className="text-xs">אחראי</Badge>
                    <Badge variant="outline" className="text-xs">עדיפות</Badge>
                    <Badge variant="outline" className="text-xs">קטגוריה</Badge>
                    <Badge variant="outline" className="text-xs">משך (דקות)</Badge>
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
                  <div className="text-sm text-muted-foreground text-right">
                    הדביקו קישור למסמך Google Docs שמכיל רשימת משימות
                  </div>
                  <div className="flex gap-2" dir="rtl">
                    <Input 
                      value={googleDocsUrl}
                      onChange={(e) => { setGoogleDocsUrl(e.target.value); setUrlError(""); }}
                      placeholder="https://docs.google.com/document/d/..."
                      dir="ltr"
                      className="text-left"
                    />
                    <Button onClick={handleGoogleDocsUrl} disabled={!googleDocsUrl.trim()}>
                      ייבוא
                    </Button>
                  </div>
                  {urlError && (
                    <div className="text-sm text-warning bg-warning/10 rounded-lg p-3 flex items-start gap-2 text-right" dir="rtl">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {urlError}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-right" dir="rtl">
                    💡 אינטגרציה מלאה עם Google Workspace (Docs, Sheets, Drive, Calendar) תתאפשר לאחר חיבור חשבון Google
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0" dir="rtl">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-success/20 text-success">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  {validCount} תקינות
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                    <AlertCircle className="w-3 h-3 ml-1" />
                    {invalidCount} עם שגיאות
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                חזרה לעריכה
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pl-4" dir="rtl">
                  {parsedTasks.map((task, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "border rounded-lg p-3 transition-colors",
                        task.valid ? "border-border bg-card" : "border-destructive/50 bg-destructive/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          {/* Row 1: Title */}
                          <Input 
                            value={task.title}
                            onChange={(e) => updateTaskWithValidation(index, "title", e.target.value)}
                            placeholder="כותרת משימה"
                            className={cn("font-medium text-right", !task.valid && "border-destructive")}
                            maxLength={200}
                            dir="rtl"
                          />
                          
                          {/* Row 2: Description */}
                          <Input 
                            value={task.description || ""}
                            onChange={(e) => updateTaskWithValidation(index, "description", e.target.value)}
                            placeholder="תיאור"
                            className="text-sm text-right"
                            maxLength={1000}
                            dir="rtl"
                          />
                          
                          {/* Row 3: Date, Time, Duration */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground text-right block">תאריך</Label>
                              <Input 
                                type="date"
                                value={task.due_date || ""}
                                onChange={(e) => updateTaskWithValidation(index, "due_date", e.target.value)}
                                className="text-sm mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground text-right block">שעה</Label>
                              <Select 
                                value={task.scheduled_time || "none"} 
                                onValueChange={(v) => updateTaskWithValidation(index, "scheduled_time", v === "none" ? "" : v)}
                              >
                                <SelectTrigger className="text-sm mt-1 text-right" dir="rtl">
                                  <SelectValue placeholder="לא נבחרה" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  <SelectItem value="none">לא נבחרה</SelectItem>
                                  {timeOptions.map(time => (
                                    <SelectItem key={time} value={time}>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {time}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground text-right block">משך</Label>
                              <Select 
                                value={String(task.duration_minutes || 60)} 
                                onValueChange={(v) => updateTaskWithValidation(index, "duration_minutes", parseInt(v))}
                              >
                                <SelectTrigger className="text-sm mt-1 text-right" dir="rtl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {durationOptions.map(opt => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Row 4: Assignee, Priority, Category */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground text-right block">אחראי</Label>
                              <Select 
                                value={task.assignee || "none"} 
                                onValueChange={(v) => updateTaskWithValidation(index, "assignee", v === "none" ? "" : v)}
                              >
                                <SelectTrigger className="text-sm mt-1 text-right" dir="rtl">
                                  <SelectValue placeholder="אחראי" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  <SelectItem value="none">לא נבחר</SelectItem>
                                  {teamMembers.map(m => (
                                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground text-right block">עדיפות</Label>
                              <Select 
                                value={task.priority || "medium"} 
                                onValueChange={(v) => updateTaskWithValidation(index, "priority", v)}
                              >
                                <SelectTrigger className="text-sm mt-1 text-right" dir="rtl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  <SelectItem value="low">נמוכה</SelectItem>
                                  <SelectItem value="medium">בינונית</SelectItem>
                                  <SelectItem value="high">גבוהה</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground text-right block">קטגוריה</Label>
                              <Select 
                                value={task.category || "none"} 
                                onValueChange={(v) => updateTaskWithValidation(index, "category", v === "none" ? "" : v)}
                              >
                                <SelectTrigger className="text-sm mt-1 text-right" dir="rtl">
                                  <SelectValue placeholder="קטגוריה" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  <SelectItem value="none">לא נבחרה</SelectItem>
                                  {categoryOptions.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {task.error && (
                            <p className="text-xs text-destructive text-right">{task.error}</p>
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
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t border-border flex-shrink-0 flex-row-reverse gap-2" dir="rtl">
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
