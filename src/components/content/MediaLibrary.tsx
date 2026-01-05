// Media Library Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Image, 
  Video, 
  FileText, 
  Upload, 
  Search, 
  Grid, 
  List,
  FolderOpen,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Copy,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/api/content.api';

interface MediaLibraryProps {
  media: MediaItem[];
  folders: string[];
  onUpload: () => void;
  onSelect?: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: string[];
}

export function MediaLibrary({ 
  media, 
  folders,
  onUpload, 
  onSelect, 
  onDelete,
  selectionMode = false,
  selectedIds = []
}: MediaLibraryProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    return FileText;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesFolder = !activeFolder || item.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('הקישור הועתק');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              ספריית מדיה
            </CardTitle>
            <Button onClick={onUpload}>
              <Upload className="h-4 w-4 ml-2" />
              העלאה
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and View Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש קבצים..."
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Folders */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={!activeFolder ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setActiveFolder(null)}
            >
              <FolderOpen className="h-4 w-4 ml-1" />
              הכל
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder}
                variant={activeFolder === folder ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActiveFolder(folder)}
              >
                {folder}
              </Button>
            ))}
          </div>

          {/* Media Grid/List */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין קבצים בספרייה</p>
              <Button variant="link" onClick={onUpload}>
                העלה קובץ ראשון
              </Button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMedia.map((item) => {
                const Icon = getFileIcon(item.file_type);
                const isSelected = selectedIds.includes(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary",
                      isSelected && "ring-2 ring-primary bg-primary/10"
                    )}
                    onClick={() => selectionMode ? onSelect?.(item) : setPreviewItem(item)}
                  >
                    {item.file_type.startsWith('image/') ? (
                      <img
                        src={item.thumbnail_url || item.file_url}
                        alt={item.alt_text || item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {selectionMode && isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-white text-xs truncate">{item.name}</span>
                    </div>
                    
                    {/* Actions menu */}
                    {!selectionMode && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => copyUrl(item.file_url)}>
                              <Copy className="h-4 w-4 ml-2" />
                              העתק קישור
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(item.file_url, '_blank')}>
                              <Download className="h-4 w-4 ml-2" />
                              הורדה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPreviewItem(item)}>
                              <Edit className="h-4 w-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((item) => {
                const Icon = getFileIcon(item.file_type);
                const isSelected = selectedIds.includes(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && "bg-primary/10 border-primary"
                    )}
                    onClick={() => selectionMode ? onSelect?.(item) : setPreviewItem(item)}
                  >
                    {item.file_type.startsWith('image/') ? (
                      <img
                        src={item.thumbnail_url || item.file_url}
                        alt={item.alt_text || item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(item.file_size)} • {item.folder}
                      </div>
                    </div>
                    
                    {item.tags.length > 0 && (
                      <div className="flex gap-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {!selectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyUrl(item.file_url)}>
                            <Copy className="h-4 w-4 ml-2" />
                            העתק קישור
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(item.file_url, '_blank')}>
                            <Download className="h-4 w-4 ml-2" />
                            הורדה
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            מחיקה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            {filteredMedia.length} קבצים
            {activeFolder && ` בתיקייה "${activeFolder}"`}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              {previewItem.file_type.startsWith('image/') ? (
                <img
                  src={previewItem.file_url}
                  alt={previewItem.alt_text || previewItem.name}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              ) : previewItem.file_type.startsWith('video/') ? (
                <video
                  src={previewItem.file_url}
                  controls
                  className="w-full max-h-[60vh] rounded-lg"
                />
              ) : (
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">סוג קובץ:</span>
                  <span className="mr-2">{previewItem.file_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">גודל:</span>
                  <span className="mr-2">{formatFileSize(previewItem.file_size)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">תיקייה:</span>
                  <span className="mr-2">{previewItem.folder}</span>
                </div>
                {previewItem.alt_text && (
                  <div>
                    <span className="text-muted-foreground">טקסט חלופי:</span>
                    <span className="mr-2">{previewItem.alt_text}</span>
                  </div>
                )}
              </div>
              
              {previewItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previewItem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => copyUrl(previewItem.file_url)} className="flex-1">
                  <Copy className="h-4 w-4 ml-2" />
                  העתק קישור
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(previewItem.file_url, '_blank')}
                >
                  <Download className="h-4 w-4 ml-2" />
                  הורדה
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
