// Drafts Manager Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Clock,
  Send,
  MoreVertical,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { ContentDraft } from '@/api/content.api';

interface DraftsManagerProps {
  drafts: ContentDraft[];
  onSelect: (draft: ContentDraft) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'טיוטה', variant: 'secondary' },
  review: { label: 'בבדיקה', variant: 'outline' },
  approved: { label: 'מאושר', variant: 'default' },
  published: { label: 'פורסם', variant: 'default' },
};

const PLATFORM_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

export function DraftsManager({ 
  drafts, 
  onSelect, 
  onCreate, 
  onDelete,
  onStatusChange
}: DraftsManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = !search || 
      draft.title.toLowerCase().includes(search.toLowerCase()) ||
      (draft.content?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || draft.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groupedDrafts = {
    draft: filteredDrafts.filter(d => d.status === 'draft'),
    review: filteredDrafts.filter(d => d.status === 'review'),
    approved: filteredDrafts.filter(d => d.status === 'approved'),
    published: filteredDrafts.filter(d => d.status === 'published'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            טיוטות תוכן
          </CardTitle>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 ml-2" />
            טיוטה חדשה
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש טיוטות..."
              className="pr-10"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={!statusFilter ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              הכל ({drafts.length})
            </Button>
            {Object.entries(STATUS_MAP).map(([status, config]) => {
              const count = drafts.filter(d => d.status === status).length;
              if (count === 0) return null;
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Drafts List */}
        {filteredDrafts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>אין טיוטות</p>
            <Button variant="link" onClick={onCreate}>
              צור טיוטה ראשונה
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => onSelect(draft)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{draft.title}</h4>
                    <Badge variant={STATUS_MAP[draft.status]?.variant || 'secondary'}>
                      {STATUS_MAP[draft.status]?.label || draft.status}
                    </Badge>
                  </div>
                  
                  {draft.content && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {draft.content}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(draft.updated_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </span>
                    
                    {draft.platforms.length > 0 && (
                      <div className="flex items-center gap-1">
                        {draft.platforms.slice(0, 3).map((platform) => {
                          const Icon = PLATFORM_ICONS[platform] || FileText;
                          return <Icon key={platform} className="h-3 w-3" />;
                        })}
                      </div>
                    )}
                    
                    {draft.scheduled_for && (
                      <span className="flex items-center gap-1 text-primary">
                        <Send className="h-3 w-3" />
                        מתוזמן ל-{format(new Date(draft.scheduled_for), 'dd/MM', { locale: he })}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(draft); }}>
                      <Edit className="h-4 w-4 ml-2" />
                      עריכה
                    </DropdownMenuItem>
                    {draft.status === 'draft' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(draft.id, 'review'); }}>
                        <Send className="h-4 w-4 ml-2" />
                        שלח לבדיקה
                      </DropdownMenuItem>
                    )}
                    {draft.status === 'review' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(draft.id, 'approved'); }}>
                        <Send className="h-4 w-4 ml-2" />
                        אשר לפרסום
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(draft.id); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחיקה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DraftsManager;
