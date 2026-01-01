import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Target, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform?: string;
  connectedPlatforms?: string[];
}

const platformConfig: Record<string, { 
  color: string; 
  name: string; 
  canCreate: boolean;
  icon: string;
}> = {
  google_ads: { color: "bg-[#4285F4]", name: "Google Ads", canCreate: true, icon: "🎯" },
  facebook_ads: { color: "bg-[#1877F2]", name: "Facebook Ads", canCreate: true, icon: "📘" },
  instagram: { color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]", name: "Instagram", canCreate: false, icon: "📸" },
  linkedin: { color: "bg-[#0A66C2]", name: "LinkedIn", canCreate: false, icon: "💼" },
  tiktok: { color: "bg-black", name: "TikTok", canCreate: false, icon: "🎵" },
};

export function CreateCampaignDialog({
  open,
  onOpenChange,
  defaultPlatform,
  connectedPlatforms = [],
}: CreateCampaignDialogProps) {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<"platform" | "details">("platform");
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform || "");
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
    startDate: "",
    endDate: "",
    description: "",
    objective: "conversions",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("בחר לקוח");
      
      const { error } = await supabase.from("campaigns").insert({
        client_id: selectedClient.id,
        name: formData.name,
        platform: selectedPlatform,
        budget: parseFloat(formData.budget) || 0,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        description: formData.description,
        status: "draft",
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("הקמפיין נוצר בהצלחה!");
      onOpenChange(false);
      resetForm();
      navigate("/campaigns");
    },
    onError: () => {
      toast.error("שגיאה ביצירת הקמפיין");
    },
  });

  const resetForm = () => {
    setStep("platform");
    setSelectedPlatform(defaultPlatform || "");
    setFormData({
      name: "",
      budget: "",
      startDate: "",
      endDate: "",
      description: "",
      objective: "conversions",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const availablePlatforms = Object.entries(platformConfig).filter(
    ([key]) => connectedPlatforms.includes(key)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {step === "platform" ? "בחר פלטפורמה" : "פרטי הקמפיין"}
          </DialogTitle>
          <DialogDescription>
            {step === "platform" 
              ? "בחר את הפלטפורמה שבה תרצה ליצור קמפיין חדש"
              : "הזן את פרטי הקמפיין"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "platform" ? (
          <div className="space-y-4 mt-4">
            {availablePlatforms.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  אין פלטפורמות מחוברות שתומכות ביצירת קמפיינים
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  חבר Google Ads או Facebook Ads כדי ליצור קמפיינים
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availablePlatforms.map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (config.canCreate) {
                        setSelectedPlatform(key);
                        setStep("details");
                      }
                    }}
                    disabled={!config.canCreate}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all text-right",
                      selectedPlatform === key 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50",
                      !config.canCreate && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl", config.color)}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="font-medium">{config.name}</p>
                        {config.canCreate ? (
                          <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-600">
                            ניתן ליצור
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            בקרוב
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedPlatform === key && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Selected Platform Badge */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                platformConfig[selectedPlatform]?.color
              )}>
                {platformConfig[selectedPlatform]?.icon}
              </div>
              <span className="font-medium">{platformConfig[selectedPlatform]?.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-auto"
                onClick={() => setStep("platform")}
              >
                שנה
              </Button>
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label>שם הקמפיין *</Label>
              <Input
                placeholder="למשל: קמפיין קיץ 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Objective */}
            <div className="space-y-2">
              <Label>מטרת הקמפיין</Label>
              <Select
                value={formData.objective}
                onValueChange={(v) => setFormData({ ...formData, objective: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversions">המרות</SelectItem>
                  <SelectItem value="traffic">תנועה לאתר</SelectItem>
                  <SelectItem value="awareness">מודעות למותג</SelectItem>
                  <SelectItem value="leads">לידים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                תקציב יומי (₪)
              </Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  תאריך התחלה
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך סיום</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>תיאור (אופציונלי)</Label>
              <Textarea
                placeholder="תאר את מטרות הקמפיין..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep("platform")}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                חזרה
              </Button>
              <Button 
                className="flex-1"
                onClick={() => createMutation.mutate()}
                disabled={!formData.name || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "צור קמפיין"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
