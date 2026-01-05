import { useState, useEffect } from 'react';
import { FileText, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { reportsAPI, ReportTemplate } from '@/api/reports.api';

interface ReportTemplateSelectorProps {
  clientId?: string;
  selectedTemplateId?: string;
  onSelect: (template: ReportTemplate) => void;
}

export function ReportTemplateSelector({ 
  clientId, 
  selectedTemplateId, 
  onSelect 
}: ReportTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await reportsAPI.listTemplates(clientId);
        setTemplates(data);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            selectedTemplateId === template.id && 'ring-2 ring-primary'
          )}
          onClick={() => onSelect(template)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{template.name}</CardTitle>
              </div>
              {selectedTemplateId === template.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
            {template.is_default && (
              <Badge variant="secondary" className="w-fit text-xs">
                <Sparkles className="w-3 h-3 ml-1" />
                ברירת מחדל
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <CardDescription>{template.description}</CardDescription>
            <div className="flex flex-wrap gap-1 mt-2">
              {template.sections
                .filter((s) => s.enabled)
                .map((section) => (
                  <Badge key={section.id} variant="outline" className="text-xs">
                    {section.title}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
