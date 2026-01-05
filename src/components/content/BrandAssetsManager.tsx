// Brand Assets Manager Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Palette, 
  Type, 
  Image, 
  MessageSquare,
  Hash,
  Plus,
  Edit,
  Trash2,
  Star,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BrandAsset } from '@/api/content.api';

interface BrandAssetsManagerProps {
  assets: BrandAsset[];
  onCreate: (type: string, name: string, value: string, description?: string) => void;
  onUpdate: (id: string, data: Partial<BrandAsset>) => void;
  onDelete: (id: string) => void;
}

const ASSET_TYPES = [
  { id: 'color', name: 'צבעים', icon: Palette },
  { id: 'font', name: 'פונטים', icon: Type },
  { id: 'logo', name: 'לוגו', icon: Image },
  { id: 'tone', name: 'טון דיבור', icon: MessageSquare },
  { id: 'keyword', name: 'מילות מפתח', icon: Hash },
];

export function BrandAssetsManager({ assets, onCreate, onUpdate, onDelete }: BrandAssetsManagerProps) {
  const [activeTab, setActiveTab] = useState('color');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<BrandAsset | null>(null);
  const [newAsset, setNewAsset] = useState({ name: '', value: '', description: '' });

  const getAssetsByType = (type: string) => assets.filter(a => a.asset_type === type);

  const handleCreate = () => {
    if (!newAsset.name || !newAsset.value) {
      toast.error('נא למלא שם וערך');
      return;
    }
    onCreate(activeTab, newAsset.name, newAsset.value, newAsset.description);
    setNewAsset({ name: '', value: '', description: '' });
    setShowAddDialog(false);
    toast.success('נכס נוסף בהצלחה');
  };

  const handleUpdate = () => {
    if (!editingAsset) return;
    onUpdate(editingAsset.id, {
      name: newAsset.name || editingAsset.name,
      value: newAsset.value || editingAsset.value,
      description: newAsset.description,
    });
    setEditingAsset(null);
    setNewAsset({ name: '', value: '', description: '' });
    toast.success('נכס עודכן בהצלחה');
  };

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('הועתק');
  };

  const renderColorAsset = (asset: BrandAsset) => (
    <div
      key={asset.id}
      className="flex items-center gap-3 p-3 rounded-lg border group"
    >
      <div
        className="w-10 h-10 rounded-lg border shadow-sm"
        style={{ backgroundColor: asset.value }}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{asset.name}</span>
          {asset.is_primary && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <span className="text-sm text-muted-foreground font-mono">{asset.value}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => copyValue(asset.value)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => {
            setEditingAsset(asset);
            setNewAsset({ name: asset.name, value: asset.value, description: asset.description || '' });
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onDelete(asset.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );

  const renderTextAsset = (asset: BrandAsset) => (
    <div
      key={asset.id}
      className="p-4 rounded-lg border group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{asset.name}</span>
          {asset.is_primary && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => copyValue(asset.value)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setEditingAsset(asset);
              setNewAsset({ name: asset.name, value: asset.value, description: asset.description || '' });
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(asset.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{asset.value}</p>
      {asset.description && (
        <p className="text-xs text-muted-foreground mt-2 italic">{asset.description}</p>
      )}
    </div>
  );

  const renderKeywordAsset = (asset: BrandAsset) => (
    <Badge
      key={asset.id}
      variant={asset.is_primary ? 'default' : 'secondary'}
      className="px-3 py-1 cursor-pointer group"
      onClick={() => copyValue(asset.value)}
    >
      {asset.value}
      <Button 
        variant="ghost" 
        size="icon"
        className="h-4 w-4 mr-1 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(asset.id);
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </Badge>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              נכסי מותג
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 ml-1" />
              הוסף
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              {ASSET_TYPES.map((type) => {
                const Icon = type.icon;
                const count = getAssetsByType(type.id).length;
                return (
                  <TabsTrigger 
                    key={type.id} 
                    value={type.id}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.name}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 justify-center">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {ASSET_TYPES.map((type) => (
              <TabsContent key={type.id} value={type.id} className="mt-4">
                {getAssetsByType(type.id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <type.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>אין {type.name} מוגדרים</p>
                    <Button 
                      variant="link" 
                      onClick={() => setShowAddDialog(true)}
                    >
                      הוסף {type.name.replace('ים', '')} ראשון
                    </Button>
                  </div>
                ) : type.id === 'keyword' ? (
                  <div className="flex flex-wrap gap-2">
                    {getAssetsByType(type.id).map(renderKeywordAsset)}
                  </div>
                ) : type.id === 'color' ? (
                  <div className="space-y-2">
                    {getAssetsByType(type.id).map(renderColorAsset)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAssetsByType(type.id).map(renderTextAsset)}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={showAddDialog || !!editingAsset} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingAsset(null);
            setNewAsset({ name: '', value: '', description: '' });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'עריכת נכס' : 'הוספת נכס חדש'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input
                value={newAsset.name}
                onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                placeholder="שם הנכס"
              />
            </div>

            <div className="space-y-2">
              <Label>ערך</Label>
              {activeTab === 'color' ? (
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newAsset.value || '#000000'}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, value: e.target.value }))}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    value={newAsset.value}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                  />
                </div>
              ) : (
                <Input
                  value={newAsset.value}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="ערך הנכס"
                />
              )}
            </div>

            {activeTab !== 'keyword' && activeTab !== 'color' && (
              <div className="space-y-2">
                <Label>תיאור (אופציונלי)</Label>
                <Input
                  value={newAsset.description}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור קצר..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingAsset(null);
              setNewAsset({ name: '', value: '', description: '' });
            }}>
              ביטול
            </Button>
            <Button onClick={editingAsset ? handleUpdate : handleCreate}>
              {editingAsset ? 'עדכון' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
