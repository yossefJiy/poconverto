import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Calculator, Clock, Coins, Zap } from "lucide-react";
import { creditsToCost } from "@/hooks/useClientCredits";

interface CreditFormula {
  id: string;
  name: string;
  description: string | null;
  base_credits: number;
  time_multiplier: number;
  complexity_multiplier: number;
  is_default: boolean;
}

interface CreditCalculatorProps {
  onCalculate?: (credits: number, hours: number) => void;
  className?: string;
}

export function CreditCalculator({ onCalculate, className }: CreditCalculatorProps) {
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [complexity, setComplexity] = useState(1);
  const [selectedFormula, setSelectedFormula] = useState<string>("");

  const { data: formulas = [] } = useQuery({
    queryKey: ["credit-formulas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_formulas")
        .select("*")
        .order("is_default", { ascending: false });
      
      if (error) throw error;
      return data as CreditFormula[];
    },
  });

  useEffect(() => {
    if (formulas.length > 0 && !selectedFormula) {
      const defaultFormula = formulas.find(f => f.is_default) || formulas[0];
      setSelectedFormula(defaultFormula.id);
    }
  }, [formulas, selectedFormula]);

  const currentFormula = formulas.find(f => f.id === selectedFormula);
  
  const totalMinutes = hours * 60 + minutes;
  const totalHours = totalMinutes / 60;
  
  const calculatedCredits = currentFormula
    ? Math.ceil(
        (totalHours * currentFormula.base_credits) * 
        currentFormula.time_multiplier * 
        (complexity > 1 ? currentFormula.complexity_multiplier * complexity : 1)
      )
    : Math.ceil(totalHours * 60);

  const cost = creditsToCost(calculatedCredits);

  useEffect(() => {
    onCalculate?.(calculatedCredits, totalHours);
  }, [calculatedCredits, totalHours, onCalculate]);

  const complexityLabels = ["פשוט", "רגיל", "מורכב", "מאוד מורכב"];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          מחשבון קרדיטים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formula Selection */}
        <div className="space-y-2">
          <Label>נוסחת חישוב</Label>
          <Select value={selectedFormula} onValueChange={setSelectedFormula}>
            <SelectTrigger>
              <SelectValue placeholder="בחר נוסחה" />
            </SelectTrigger>
            <SelectContent>
              {formulas.map((formula) => (
                <SelectItem key={formula.id} value={formula.id}>
                  <div className="flex items-center gap-2">
                    <span>{formula.name}</span>
                    {formula.is_default && (
                      <span className="text-xs text-muted-foreground">(ברירת מחדל)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentFormula?.description && (
            <p className="text-xs text-muted-foreground">{currentFormula.description}</p>
          )}
        </div>

        {/* Time Input */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              שעות
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>דקות</Label>
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            />
          </div>
        </div>

        {/* Complexity Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              רמת מורכבות
            </Label>
            <span className="text-sm font-medium text-primary">
              {complexityLabels[complexity - 1]}
            </span>
          </div>
          <Slider
            value={[complexity]}
            min={1}
            max={4}
            step={1}
            onValueChange={([value]) => setComplexity(value)}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {complexityLabels.map((label, i) => (
              <span key={i} className={cn(complexity === i + 1 && "text-primary font-medium")}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-lg bg-primary/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">זמן משוער:</span>
            <span className="font-medium">
              {hours > 0 && `${hours} שעות`} {minutes > 0 && `${minutes} דקות`}
              {hours === 0 && minutes === 0 && "0 דקות"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Coins className="w-4 h-4" />
              קרדיטים:
            </span>
            <span className="text-2xl font-bold text-primary">{calculatedCredits}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
            <span className="text-muted-foreground">עלות משוערת:</span>
            <span className="font-bold text-lg">₪{cost.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
