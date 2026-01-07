import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Edit, ExternalLink, MoreHorizontal, Settings2, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ModuleCreator } from '@/components/dynamic-modules/ModuleCreator';
import { useDynamicModules, useDynamicModuleMutations } from '@/hooks/useDynamicModules';
import { useAuth } from '@/hooks/useAuth';

const categoryLabels: Record<string, string> = {
  content: 'תוכן',
  code: 'קוד',
  analysis: 'ניתוח',
  planning: 'תכנון'
};

export default function ModuleManagement() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: modules, isLoading: modulesLoading } = useDynamicModules();
  const { deleteModule } = useDynamicModuleMutations();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = role === 'super_admin' || role === 'admin';

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteModule.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="ניהול מודולים"
        description="צור ונהל מודולי AI מותאמים אישית"
        actions={<ModuleCreator />}
      />

      {modulesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules?.map((module) => (
            <Card key={module.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: module.color + '20', color: module.color }}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <CardDescription className="text-xs">/{module.slug}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/modules/${module.slug}`)}>
                        <ExternalLink className="w-4 h-4 ml-2" />
                        פתח מודול
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 ml-2" />
                        ערוך
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteId(module.id)}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        מחק
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {module.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {module.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {categoryLabels[module.category] || module.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {module.ai_model.split('/')[1]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!modules || modules.length === 0) && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">עדיין אין מודולים</p>
                <ModuleCreator />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את המודול?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תארכב את כל השיחות הקשורות למודול. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
