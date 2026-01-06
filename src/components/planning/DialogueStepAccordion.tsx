import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  Edit2,
  X,
  Check
} from "lucide-react";

interface DialoguePart {
  id: number;
  title: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  response?: string;
  keyPoints?: string[];
}

interface DialogueStepAccordionProps {
  parts: DialoguePart[];
  onRunPart: (index: number, customPrompt?: string) => void;
  isRunning: boolean;
  currentPartIndex: number | null;
}

export const DialogueStepAccordion = ({
  parts,
  onRunPart,
  isRunning,
  currentPartIndex
}: DialogueStepAccordionProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");

  const getStatusIcon = (status: DialoguePart['status'], index: number) => {
    if (currentPartIndex === index) {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DialoguePart['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">הושלם</Badge>;
      case 'running':
        return <Badge variant="secondary">פעיל</Badge>;
      case 'error':
        return <Badge variant="destructive">שגיאה</Badge>;
      default:
        return <Badge variant="outline">ממתין</Badge>;
    }
  };

  const handleStartEdit = (index: number, prompt: string) => {
    setEditingIndex(index);
    setEditedPrompt(prompt);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedPrompt("");
  };

  const handleRunWithEdit = (index: number) => {
    onRunPart(index, editedPrompt);
    setEditingIndex(null);
    setEditedPrompt("");
  };

  return (
    <Accordion type="multiple" className="space-y-2">
      {parts.map((part, index) => (
        <AccordionItem 
          key={part.id} 
          value={`part-${part.id}`}
          className={`border rounded-lg px-4 transition-colors ${
            part.status === 'completed' 
              ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
              : part.status === 'running' || currentPartIndex === index
              ? 'bg-primary/5 border-primary'
              : 'bg-muted/30'
          }`}
        >
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3 w-full">
              {getStatusIcon(part.status, index)}
              <span className="font-medium flex-1 text-right">{part.title}</span>
              {getStatusBadge(part.status)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">שאלה:</span>
                  {part.status !== 'completed' && part.status !== 'running' && editingIndex !== index && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(index, part.prompt)}
                    >
                      <Edit2 className="h-3 w-3 ml-1" />
                      ערוך
                    </Button>
                  )}
                </div>
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRunWithEdit(index)}
                        disabled={isRunning}
                      >
                        <Check className="h-4 w-4 ml-1" />
                        הרץ עם השינויים
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 ml-1" />
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {part.prompt}
                  </p>
                )}
              </div>

              {/* Response */}
              {part.response && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">תשובה:</span>
                  <div className="text-sm bg-background p-3 rounded-lg border max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {part.response}
                  </div>
                </div>
              )}

              {/* Key Points */}
              {part.keyPoints && part.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">נקודות מפתח:</span>
                  <ul className="space-y-1 text-sm">
                    {part.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Run Button */}
              {part.status !== 'completed' && part.status !== 'running' && editingIndex !== index && (
                <Button
                  onClick={() => onRunPart(index)}
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 ml-2" />
                  הרץ שלב זה
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
