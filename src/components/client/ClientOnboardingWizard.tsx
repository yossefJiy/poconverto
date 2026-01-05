import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ClientTemplateSelector } from "./ClientTemplateSelector";
import { DefaultModulesSelector, DefaultModules } from "./DefaultModulesSelector";
import { 
  ArrowLeft, ArrowRight, Check, Loader2, Sparkles, 
  Building2, Settings, Users, Rocket 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  modules_enabled: Record<string, boolean>;
  default_settings: Record<string, unknown>;
  integrations_suggested: string[];
}

const steps = [
  { id: 1, title: "בחר תבנית", icon: Sparkles, description: "התחל עם תבנית מתאימה לעסק שלך" },
  { id: 2, title: "פרטי הלקוח", icon: Building2, description: "הגדר את פרטי החברה" },
  { id: 3, title: "מודולים", icon: Settings, description: "התאם אישית את המודולים" },
  { id: 4, title: "סיום", icon: Rocket, description: "הלקוח מוכן!" },
];

export function ClientOnboardingWizard({ open, onOpenChange }: ClientOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ClientTemplate | null>(null);
  const [clientData, setClientData] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
  });
  const [selectedModules, setSelectedModules] = useState<DefaultModules>({
    dashboard: true,
    analytics: false,
    ecommerce: false,
    marketing: false,
    campaigns: false,
    tasks: true,
    team: false,
    leads: true,
    billing: true,
    approvals: true,
  });
  
  const { setSelectedClient } = useClient();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const insertData = {
        name: clientData.name,
        industry: clientData.industry || selectedTemplate?.industry || null,
        website: clientData.website || null,
        description: clientData.description || null,
        modules_enabled: selectedModules as unknown as Record<string, boolean>,
      };
      
      const { data, error } = await supabase
        .from("clients")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      setSelectedClient(data);
      toast.success(`לקוח "${data.name}" נוצר בהצלחה!`);
      handleClose();
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת הלקוח: " + error.message);
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedTemplate(null);
    setClientData({ name: "", industry: "", website: "", description: "" });
    setSelectedModules({
      dashboard: true,
      analytics: false,
      ecommerce: false,
      marketing: false,
      campaigns: false,
      tasks: true,
      team: false,
      leads: true,
      billing: true,
      approvals: true,
    });
    onOpenChange(false);
  };

  const handleTemplateSelect = (template: ClientTemplate) => {
    setSelectedTemplate(template);
    setClientData(prev => ({ ...prev, industry: template.industry }));
    // Map template modules to our DefaultModules structure
    const templateModules = template.modules_enabled as Record<string, boolean>;
    setSelectedModules({
      dashboard: templateModules.dashboard ?? true,
      analytics: templateModules.analytics ?? false,
      ecommerce: templateModules.ecommerce ?? false,
      marketing: templateModules.marketing ?? false,
      campaigns: templateModules.campaigns ?? false,
      tasks: templateModules.tasks ?? true,
      team: templateModules.team ?? false,
      leads: templateModules.leads ?? true,
      billing: templateModules.billing ?? true,
      approvals: templateModules.approvals ?? true,
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedTemplate) {
      toast.error("אנא בחר תבנית להמשך");
      return;
    }
    if (currentStep === 2 && !clientData.name.trim()) {
      toast.error("אנא הזן שם לקוח");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      createMutation.mutate();
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">אשף יצירת לקוח חדש</DialogTitle>
          <DialogDescription>
            צור לקוח חדש בתהליך פשוט ומודרך
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all",
                    isActive && "scale-110",
                    !isActive && !isCompleted && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary/20 text-primary ring-2 ring-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center hidden sm:block",
                    isActive && "text-primary"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] py-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">בחר תבנית עסקית</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  בחר את סוג העסק שמתאים ללקוח שלך. ניתן להתאים את ההגדרות בהמשך.
                </p>
              </div>
              <ClientTemplateSelector
                selectedTemplateId={selectedTemplate?.id || null}
                onSelect={handleTemplateSelect}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <h3 className="text-lg font-semibold mb-2">פרטי הלקוח</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  הזן את הפרטים הבסיסיים של הלקוח
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">שם הלקוח *</Label>
                  <Input
                    id="name"
                    value={clientData.name}
                    onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                    placeholder="לדוגמה: חברת אקמה בע״מ"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry">תעשייה</Label>
                  <Input
                    id="industry"
                    value={clientData.industry}
                    onChange={(e) => setClientData({ ...clientData, industry: e.target.value })}
                    placeholder={selectedTemplate?.industry || "לדוגמה: מסחר אלקטרוני"}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">אתר אינטרנט</Label>
                  <Input
                    id="website"
                    value={clientData.website}
                    onChange={(e) => setClientData({ ...clientData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-1"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    value={clientData.description}
                    onChange={(e) => setClientData({ ...clientData, description: e.target.value })}
                    placeholder="תיאור קצר של הלקוח והפעילות שלו..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">התאמת מודולים</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  בחר אילו מודולים יהיו זמינים עבור לקוח זה
                </p>
              </div>
              
              <DefaultModulesSelector
                modules={selectedModules}
                onChange={setSelectedModules}
              />
              
              {selectedTemplate?.integrations_suggested && selectedTemplate.integrations_suggested.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">אינטגרציות מומלצות</h4>
                  <p className="text-sm text-muted-foreground">
                    בהתבסס על התבנית שבחרת, אנו ממליצים לחבר את האינטגרציות הבאות:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.integrations_suggested.map((integration) => (
                      <span key={integration} className="px-2 py-1 bg-background rounded text-sm">
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">הכל מוכן!</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                הלקוח "{clientData.name}" מוכן ליצירה עם כל ההגדרות שבחרת.
                לחץ על "צור לקוח" כדי לסיים.
              </p>
              
              <div className="bg-muted rounded-lg p-4 text-right w-full max-w-md">
                <h4 className="font-medium mb-3">סיכום:</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dd>{clientData.name}</dd>
                    <dt className="text-muted-foreground">שם:</dt>
                  </div>
                  <div className="flex justify-between">
                    <dd>{clientData.industry || selectedTemplate?.industry}</dd>
                    <dt className="text-muted-foreground">תעשייה:</dt>
                  </div>
                  <div className="flex justify-between">
                    <dd>{Object.values(selectedModules).filter(Boolean).length} מודולים</dd>
                    <dt className="text-muted-foreground">מודולים:</dt>
                  </div>
                  <div className="flex justify-between">
                    <dd>{selectedTemplate?.name}</dd>
                    <dt className="text-muted-foreground">תבנית:</dt>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : handleClose()}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            {currentStep > 1 ? "הקודם" : "ביטול"}
          </Button>
          
          <Button onClick={handleNext} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                יוצר...
              </>
            ) : currentStep === 4 ? (
              <>
                <Check className="h-4 w-4 ml-2" />
                צור לקוח
              </>
            ) : (
              <>
                הבא
                <ArrowLeft className="h-4 w-4 mr-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
