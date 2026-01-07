import { useState } from 'react';
import { Check, ChevronDown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTaskTypeDefinitions } from '@/hooks/useDynamicModules';

interface TaskTypeSelectorProps {
  category: string;
  currentType: string;
  aiClassifiedType?: string | null;
  onCorrect: (newType: string) => void;
  readOnly?: boolean;
}

const categoryLabels: Record<string, string> = {
  content: 'תוכן',
  code: 'קוד',
  analysis: 'ניתוח',
  planning: 'תכנון'
};

const complexityLabels: Record<string, { label: string; color: string }> = {
  simple: { label: 'פשוט', color: 'bg-green-500/10 text-green-600' },
  medium: { label: 'בינוני', color: 'bg-yellow-500/10 text-yellow-600' },
  complex: { label: 'מורכב', color: 'bg-red-500/10 text-red-600' }
};

export function TaskTypeSelector({
  category,
  currentType,
  aiClassifiedType,
  onCorrect,
  readOnly = false
}: TaskTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: taskTypes } = useTaskTypeDefinitions();

  const filteredTypes = taskTypes?.filter(t => t.category === category) || [];
  const currentTypeData = filteredTypes.find(t => t.type_key === currentType);
  const wasAutoClassified = aiClassifiedType && aiClassifiedType === currentType;

  if (readOnly) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="text-xs">
          {categoryLabels[category] || category}
        </Badge>
        {currentTypeData && (
          <Badge variant="secondary" className="text-xs">
            {currentTypeData.type_label_he}
          </Badge>
        )}
        {wasAutoClassified && (
          <span className="text-xs text-muted-foreground">(אוטומטי)</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="text-xs">
        {categoryLabels[category] || category}
      </Badge>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 gap-1 text-xs"
          >
            {currentTypeData?.type_label_he || currentType || 'בחר סוג'}
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" align="start">
          <Command>
            <CommandInput placeholder="חפש סוג משימה..." className="h-8" />
            <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
            <CommandGroup>
              {filteredTypes.map((type) => (
                <CommandItem
                  key={type.type_key}
                  value={type.type_key}
                  onSelect={(value) => {
                    onCorrect(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentType === type.type_key ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{type.type_label_he}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {wasAutoClassified && (
        <span className="text-xs text-muted-foreground">(אוטומטי)</span>
      )}
    </div>
  );
}

interface ComplexityBadgeProps {
  complexity: 'simple' | 'medium' | 'complex' | null;
}

export function ComplexityBadge({ complexity }: ComplexityBadgeProps) {
  if (!complexity) return null;
  
  const config = complexityLabels[complexity];
  if (!config) return null;

  return (
    <Badge variant="outline" className={cn('text-xs', config.color)}>
      {config.label}
    </Badge>
  );
}
