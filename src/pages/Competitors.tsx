// Competitors Page

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Globe, ExternalLink, MoreVertical, Trash2, Edit, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useClient } from '@/hooks/useClient';
import { competitorAPI, type Competitor, type CreateCompetitorInput } from '@/api/competitor.api';
import { toast } from '@/hooks/use-toast';

export default function Competitors() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [formData, setFormData] = useState<Partial<CreateCompetitorInput>>({});

  const { data: competitorsResult, isLoading } = useQuery({
    queryKey: ['competitors', selectedClient?.id],
    queryFn: () => competitorAPI.list(selectedClient!.id),
    enabled: !!selectedClient?.id,
  });

  const competitors = competitorsResult?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateCompetitorInput) => competitorAPI.create(data),
    onSuccess: () => {
      toast({ title: 'מתחרה נוסף בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setCreateDialogOpen(false);
      setFormData({});
    },
    onError: () => {
      toast({ title: 'שגיאה', description: 'לא ניתן להוסיף מתחרה', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => competitorAPI.delete(id),
    onSuccess: () => {
      toast({ title: 'מתחרה הוסר' });
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !selectedClient) return;
    
    createMutation.mutate({
      client_id: selectedClient.id,
      name: formData.name,
      website: formData.website,
      industry: formData.industry,
      description: formData.description,
      social_links: formData.social_links,
    });
  };

  const openCreateDialog = () => {
    setFormData({});
    setEditingCompetitor(null);
    setCreateDialogOpen(true);
  };

  if (!selectedClient) {
    return (
      <MainLayout>
        <PageHeader title="ניתוח מתחרים" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">נא לבחור לקוח לצפייה במתחרים</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader 
        title="ניתוח מתחרים" 
        description={`מעקב ומשלוח תחרותי עבור ${selectedClient.name}`}
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף מתחרה
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{competitors.length}</p>
            <p className="text-sm text-muted-foreground">מתחרים במעקב</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {competitors.filter(c => c.website).length}
            </p>
            <p className="text-sm text-muted-foreground">עם אתר</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ExternalLink className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">
              {competitors.filter(c => Object.keys(c.social_links || {}).length > 0).length}
            </p>
            <p className="text-sm text-muted-foreground">עם סושיאל</p>
          </CardContent>
        </Card>
      </div>

      {/* Competitors Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין מתחרים במעקב</h3>
            <p className="text-muted-foreground mb-4">
              הוסף מתחרים כדי לעקוב אחרי הביצועים שלהם
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף מתחרה ראשון
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map(competitor => (
            <Card key={competitor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={competitor.logo_url || undefined} />
                      <AvatarFallback>
                        {competitor.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{competitor.name}</CardTitle>
                      {competitor.industry && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {competitor.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingCompetitor(competitor)}>
                        <Edit className="h-4 w-4 ml-2" />
                        ערוך
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(competitor.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        מחק
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {competitor.description && (
                  <CardDescription className="mb-3 line-clamp-2">
                    {competitor.description}
                  </CardDescription>
                )}
                
                {competitor.website && (
                  <a 
                    href={competitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {new URL(competitor.website).hostname}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {competitor.social_links && Object.keys(competitor.social_links).length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {Object.entries(competitor.social_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompetitor ? 'עריכת מתחרה' : 'הוספת מתחרה חדש'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם המתחרה *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="שם החברה או המותג"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">אתר אינטרנט</Label>
              <Input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">תעשייה</Label>
              <Input
                id="industry"
                value={formData.industry || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="לדוגמה: קמעונאות, טכנולוגיה"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של המתחרה..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {editingCompetitor ? 'שמור שינויים' : 'הוסף מתחרה'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
