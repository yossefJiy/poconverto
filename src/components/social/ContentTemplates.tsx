// Content Templates Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Search,
  Copy,
  Star,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';
import { toast } from 'sonner';

interface TemplateVariable {
  name: string;
  label: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: string;
  platforms: string[];
  variables: TemplateVariable[];
  is_global: boolean;
  usage_count: number;
}

interface ContentTemplatesProps {
  templates: ContentTemplate[];
  onUseTemplate: (content: string) => void;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

const CATEGORY_LABELS: Record<string, string> = {
  promotion: 'מבצע',
  educational: 'חינוכי',
  announcement: 'הכרזה',
  engagement: 'מעורבות',
  general: 'כללי',
};

export function ContentTemplates({ templates, onUseTemplate }: ContentTemplatesProps) {
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectTemplate = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    // Initialize variables
    const vars: Record<string, string> = {};
    template.variables.forEach(v => {
      vars[v.name] = '';
    });
    setVariables(vars);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.content;
    
    // Replace variables
    Object.entries(variables).forEach(([name, value]) => {
      content = content.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    });

    onUseTemplate(content);
    setSelectedTemplate(null);
    toast.success('התבנית הועתקה לעורך');
  };

  const handleCopyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('הועתק ללוח');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            תבניות תוכן
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש תבנית..."
              className="pr-10"
            />
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                  </div>
                  {template.is_global && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[template.category] || template.category}
                  </Badge>
                  <div className="flex gap-1">
                    {template.platforms.slice(0, 3).map((platform) => {
                      const Icon = PLATFORM_ICONS[platform];
                      return Icon ? (
                        <Icon key={platform} className="h-4 w-4 text-muted-foreground" />
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  שימושים: {template.usage_count}
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              לא נמצאו תבניות
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Variables Input */}
            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-3">
                <Label>מלא את המשתנים:</Label>
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.name} className="space-y-1">
                    <Label className="text-sm">{variable.label}</Label>
                    <Input
                      value={variables[variable.name] || ''}
                      onChange={(e) => setVariables(prev => ({
                        ...prev,
                        [variable.name]: e.target.value,
                      }))}
                      placeholder={`הזן ${variable.label}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="space-y-2">
              <Label>תצוגה מקדימה:</Label>
              <Textarea
                value={selectedTemplate?.content.replace(
                  /\{(\w+)\}/g,
                  (_, name) => variables[name] || `{${name}}`
                ) || ''}
                readOnly
                rows={6}
                className="bg-muted"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopyToClipboard(
                selectedTemplate?.content.replace(
                  /\{(\w+)\}/g,
                  (_, name) => variables[name] || `{${name}}`
                ) || ''
              )}
            >
              <Copy className="h-4 w-4 ml-1" />
              העתק
            </Button>
            <Button onClick={handleUseTemplate}>
              השתמש בתבנית
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
