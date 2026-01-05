// Create KPI Dialog Component

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { kpiAPI, type CreateKPIInput } from '@/api/kpi.api';
import { Loader2 } from 'lucide-react';

interface CreateKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

const categories = [
  { value: 'revenue', label: 'הכנסות' },
  { value: 'traffic', label: 'תנועה' },
  { value: 'engagement', label: 'אינטראקציה' },
  { value: 'conversion', label: 'המרות' },
  { value: 'brand', label: 'מותג' },
  { value: 'custom', label: 'מותאם אישית' },
];

const metricTypes = [
  { value: 'number', label: 'מספר' },
  { value: 'percentage', label: 'אחוזים' },
  { value: 'currency', label: 'מטבע (₪)' },
  { value: 'ratio', label: 'יחס' },
];

const periods = [
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' },
  { value: 'quarterly', label: 'רבעוני' },
  { value: 'yearly', label: 'שנתי' },
];

const dataSources = [
  { value: 'manual', label: 'הזנה ידנית' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'google_analytics', label: 'Google Analytics' },
  { value: 'shopify', label: 'Shopify' },
];

export function CreateKPIDialog({ open, onOpenChange, clientId, onSuccess }: CreateKPIDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateKPIInput>>({
    category: 'custom',
    metric_type: 'number',
    period: 'monthly',
    data_source: 'manual',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target_value) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await kpiAPI.create({
        client_id: clientId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        metric_type: formData.metric_type,
        target_value: formData.target_value,
        current_value: formData.current_value || 0,
        unit: formData.unit,
        period: formData.period,
        data_source: formData.data_source,
      });

      if (result.success) {
        toast({
          title: 'היעד נוצר בהצלחה',
          description: `${formData.name} נוסף לרשימת היעדים`,
        });
        onOpenChange(false);
        onSuccess?.();
        setFormData({
          category: 'custom',
          metric_type: 'number',
          period: 'monthly',
          data_source: 'manual',
        });
      } else {
        throw new Error(result.error || 'Failed to create KPI');
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור את היעד',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>יצירת יעד חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם היעד *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="לדוגמה: הגדלת מכירות חודשיות"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור קצר של היעד..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>סוג מדד</Label>
              <Select
                value={formData.metric_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_value">ערך יעד *</Label>
              <Input
                id="target_value"
                type="number"
                value={formData.target_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">ערך נוכחי</Label>
              <Input
                id="current_value"
                type="number"
                value={formData.current_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, current_value: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תקופה</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>מקור נתונים</Label>
              <Select
                value={formData.data_source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, data_source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map(ds => (
                    <SelectItem key={ds.value} value={ds.value}>
                      {ds.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.metric_type !== 'percentage' && formData.metric_type !== 'currency' && (
            <div className="space-y-2">
              <Label htmlFor="unit">יחידת מידה</Label>
              <Input
                id="unit"
                value={formData.unit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="לדוגמה: לידים, הזמנות, ביקורים"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              יצירת יעד
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateKPIDialog;
