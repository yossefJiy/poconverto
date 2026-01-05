// Hashtag Manager Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Hash, 
  Plus, 
  Copy, 
  Trash2,
  Edit,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface HashtagGroup {
  id: string;
  name: string;
  hashtags: string[];
  category: string | null;
  usage_count: number;
}

interface HashtagManagerProps {
  groups: HashtagGroup[];
  onCreateGroup: (name: string, hashtags: string[], category?: string) => void;
  onDeleteGroup: (id: string) => void;
  onUseGroup: (hashtags: string[]) => void;
}

export function HashtagManager({ 
  groups, 
  onCreateGroup, 
  onDeleteGroup, 
  onUseGroup 
}: HashtagManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHashtags, setNewHashtags] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleCreate = () => {
    if (!newName || !newHashtags) return;

    const hashtags = newHashtags
      .split(/[\s,#]+/)
      .filter(Boolean)
      .map(tag => tag.replace(/^#/, ''));

    onCreateGroup(newName, hashtags, newCategory || undefined);
    setIsDialogOpen(false);
    setNewName('');
    setNewHashtags('');
    setNewCategory('');
    toast.success('הקבוצה נוצרה בהצלחה');
  };

  const copyToClipboard = async (hashtags: string[]) => {
    const text = hashtags.map(h => `#${h}`).join(' ');
    await navigator.clipboard.writeText(text);
    toast.success('ההאשטגים הועתקו ללוח');
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            קבוצות האשטגים
          </CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-1" />
            קבוצה חדשה
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>עדיין אין קבוצות האשטגים</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => setIsDialogOpen(true)}
              >
                צור קבוצה ראשונה
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      {group.category && (
                        <Badge variant="secondary" className="mt-1">
                          {group.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(group.hashtags)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => onDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {group.hashtags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                    {group.hashtags.length > 8 && (
                      <span className="px-2 py-1 text-muted-foreground text-sm">
                        +{group.hashtags.length - 8} נוספים
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      {group.usage_count} שימושים
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onUseGroup(group.hashtags)}
                    >
                      השתמש
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>קבוצת האשטגים חדשה</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם הקבוצה</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="לדוגמה: מבצעים"
              />
            </div>

            <div className="space-y-2">
              <Label>קטגוריה (אופציונלי)</Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="לדוגמה: שיווק"
              />
            </div>

            <div className="space-y-2">
              <Label>האשטגים (מופרדים בפסיקים או רווחים)</Label>
              <Input
                value={newHashtags}
                onChange={(e) => setNewHashtags(e.target.value)}
                placeholder="#מבצע, #הנחה, #קניות"
              />
              <p className="text-sm text-muted-foreground">
                הקלד האשטגים מופרדים בפסיקים, רווחים או שורות
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreate} disabled={!newName || !newHashtags}>
              צור קבוצה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
