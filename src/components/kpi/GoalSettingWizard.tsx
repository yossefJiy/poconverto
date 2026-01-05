// Goal Setting Wizard Component
// Step-by-step wizard for creating KPIs

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Target, 
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  MousePointer,
  Heart,
  Sparkles
} from 'lucide-react';

interface GoalSettingWizardProps {
  clientId: string;
  onComplete: (data: GoalData) => void;
  onCancel: () => void;
}

interface GoalData {
  name: string;
  description: string;
  category: string;
  metric_type: string;
  target_value: number;
  unit: string;
  period: string;
  threshold_warning: number;
  threshold_critical: number;
}

const CATEGORIES = [
  { id: 'revenue', label: 'הכנסות', icon: DollarSign, description: 'יעדי מכירות והכנסות' },
  { id: 'traffic', label: 'תנועה', icon: MousePointer, description: 'ביקורים ותנועה לאתר' },
  { id: 'engagement', label: 'מעורבות', icon: Heart, description: 'אינטראקציות ומעורבות' },
  { id: 'conversion', label: 'המרות', icon: TrendingUp, description: 'יחסי המרה' },
  { id: 'brand', label: 'מותג', icon: Sparkles, description: 'מודעות ותפיסת מותג' },
];

const PERIODS = [
  { id: 'daily', label: 'יומי' },
  { id: 'weekly', label: 'שבועי' },
  { id: 'monthly', label: 'חודשי' },
  { id: 'quarterly', label: 'רבעוני' },
  { id: 'yearly', label: 'שנתי' },
];

const METRIC_TYPES: Record<string, Array<{ id: string; label: string; unit: string }>> = {
  revenue: [
    { id: 'total_revenue', label: 'הכנסות כוללות', unit: '₪' },
    { id: 'average_order', label: 'הזמנה ממוצעת', unit: '₪' },
    { id: 'new_customers', label: 'לקוחות חדשים', unit: '' },
  ],
  traffic: [
    { id: 'sessions', label: 'סשנים', unit: '' },
    { id: 'page_views', label: 'צפיות בדף', unit: '' },
    { id: 'unique_visitors', label: 'מבקרים ייחודיים', unit: '' },
  ],
  engagement: [
    { id: 'bounce_rate', label: 'שיעור נטישה', unit: '%' },
    { id: 'time_on_site', label: 'זמן באתר', unit: 'דקות' },
    { id: 'pages_per_session', label: 'דפים לסשן', unit: '' },
  ],
  conversion: [
    { id: 'conversion_rate', label: 'יחס המרה', unit: '%' },
    { id: 'cart_abandonment', label: 'נטישת עגלה', unit: '%' },
    { id: 'leads', label: 'לידים', unit: '' },
  ],
  brand: [
    { id: 'followers', label: 'עוקבים', unit: '' },
    { id: 'mentions', label: 'אזכורים', unit: '' },
    { id: 'sentiment_score', label: 'ציון סנטימנט', unit: '' },
  ],
};

export function GoalSettingWizard({ clientId, onComplete, onCancel }: GoalSettingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<GoalData>>({
    category: '',
    metric_type: '',
    name: '',
    description: '',
    target_value: 0,
    unit: '',
    period: 'monthly',
    threshold_warning: 80,
    threshold_critical: 60,
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateData = (updates: Partial<GoalData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data as GoalData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.category;
      case 2:
        return !!data.metric_type && !!data.name;
      case 3:
        return data.target_value! > 0 && !!data.period;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const selectedMetrics = data.category ? METRIC_TYPES[data.category] || [] : [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            הגדרת יעד חדש
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            שלב {step} מתוך {totalSteps}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="min-h-[300px]">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">בחר קטגוריה</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateData({ category: cat.id, metric_type: '', unit: '' })}
                  className={`flex items-start gap-3 p-4 rounded-lg border text-right transition-colors ${
                    data.category === cat.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <cat.icon className={`h-5 w-5 mt-0.5 ${
                    data.category === cat.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <div className="font-medium">{cat.label}</div>
                    <div className="text-sm text-muted-foreground">{cat.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Metric Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">בחר מדד</h3>
            
            <RadioGroup
              value={data.metric_type}
              onValueChange={(value) => {
                const metric = selectedMetrics.find(m => m.id === value);
                updateData({ 
                  metric_type: value, 
                  unit: metric?.unit || '',
                  name: metric?.label || '',
                });
              }}
              className="space-y-2"
            >
              {selectedMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <RadioGroupItem value={metric.id} id={metric.id} />
                  <Label htmlFor={metric.id} className="flex-1 cursor-pointer">
                    {metric.label}
                    {metric.unit && (
                      <span className="text-muted-foreground mr-2">({metric.unit})</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2 pt-4">
              <Label htmlFor="name">שם היעד</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                placeholder="לדוגמה: הגדלת הכנסות ב-20%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">תיאור (אופציונלי)</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                placeholder="תאר את היעד בקצרה..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Step 3: Target & Timeline */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">הגדר יעד וזמן</h3>

            <div className="space-y-2">
              <Label htmlFor="target">ערך יעד</Label>
              <div className="flex gap-2">
                <Input
                  id="target"
                  type="number"
                  value={data.target_value}
                  onChange={(e) => updateData({ target_value: Number(e.target.value) })}
                  placeholder="0"
                  className="flex-1"
                />
                {data.unit && (
                  <div className="flex items-center px-3 bg-muted rounded-md text-muted-foreground">
                    {data.unit}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>תקופה</Label>
              <RadioGroup
                value={data.period}
                onValueChange={(value) => updateData({ period: value })}
                className="flex flex-wrap gap-2"
              >
                {PERIODS.map((period) => (
                  <div key={period.id}>
                    <RadioGroupItem
                      value={period.id}
                      id={period.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={period.id}
                      className="flex cursor-pointer px-4 py-2 rounded-full border peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      {period.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 4: Thresholds & Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">הגדרות התראות וסיכום</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warning">סף אזהרה (%)</Label>
                <Input
                  id="warning"
                  type="number"
                  value={data.threshold_warning}
                  onChange={(e) => updateData({ threshold_warning: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="critical">סף קריטי (%)</Label>
                <Input
                  id="critical"
                  type="number"
                  value={data.threshold_critical}
                  onChange={(e) => updateData({ threshold_critical: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 mt-4">
              <h4 className="font-medium">סיכום היעד</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">שם:</div>
                <div>{data.name}</div>
                <div className="text-muted-foreground">קטגוריה:</div>
                <div>{CATEGORIES.find(c => c.id === data.category)?.label}</div>
                <div className="text-muted-foreground">יעד:</div>
                <div>{data.target_value} {data.unit}</div>
                <div className="text-muted-foreground">תקופה:</div>
                <div>{PERIODS.find(p => p.id === data.period)?.label}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
        >
          <ChevronRight className="h-4 w-4 ml-1" />
          {step === 1 ? 'ביטול' : 'חזרה'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === totalSteps ? (
            <>
              <Check className="h-4 w-4 ml-1" />
              צור יעד
            </>
          ) : (
            <>
              המשך
              <ChevronLeft className="h-4 w-4 mr-1" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default GoalSettingWizard;
