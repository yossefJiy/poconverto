// Content Studio Page

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DomainErrorBoundary } from '@/components/shared/DomainErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MediaLibrary, 
  ContentEditor, 
  BrandAssetsManager, 
  AIContentGenerator,
  DraftsManager,
  ClaudeStudioChat
} from '@/components/content';
import { useClient } from '@/hooks/useClient';
import { toast } from 'sonner';
import { 
  Palette, 
  Image, 
  FileText, 
  Sparkles, 
  Edit3,
  Bot
} from 'lucide-react';
import type { MediaItem, ContentDraft, AIContentHistory, BrandAsset } from '@/api/content.api';

// Mock data for demonstration
const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    client_id: '1',
    name: 'hero-banner.jpg',
    file_type: 'image/jpeg',
    file_size: 245000,
    file_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200',
    alt_text: 'באנר ראשי',
    folder: 'banners',
    tags: ['hero', 'main'],
    metadata: {},
    uploaded_by: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    client_id: '1',
    name: 'product-shot.jpg',
    file_type: 'image/jpeg',
    file_size: 180000,
    file_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
    alt_text: 'תמונת מוצר',
    folder: 'products',
    tags: ['product', 'featured'],
    metadata: {},
    uploaded_by: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    client_id: '1',
    name: 'team-photo.jpg',
    file_type: 'image/jpeg',
    file_size: 320000,
    file_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200',
    alt_text: 'תמונת צוות',
    folder: 'team',
    tags: ['team', 'about'],
    metadata: {},
    uploaded_by: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_DRAFTS: ContentDraft[] = [
  {
    id: '1',
    client_id: '1',
    title: 'פוסט השקה למוצר החדש',
    content: 'אנחנו שמחים להציג את המוצר החדש שלנו! לאחר חודשים של פיתוח...',
    content_type: 'post',
    status: 'draft',
    platforms: ['facebook', 'instagram'],
    media_ids: [],
    scheduled_for: null,
    metadata: {},
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    client_id: '1',
    title: 'מבצע סוף שנה',
    content: '🎉 מבצע סוף שנה! 30% הנחה על כל המוצרים',
    content_type: 'ad',
    status: 'review',
    platforms: ['facebook'],
    media_ids: [],
    scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {},
    created_by: null,
    updated_by: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_AI_HISTORY: AIContentHistory[] = [
  {
    id: '1',
    client_id: '1',
    prompt: 'כתוב פוסט על יתרונות השירות שלנו',
    generated_content: 'חווית לקוח מושלמת מתחילה בשירות מעולה! 🌟 אנחנו כאן בשבילכם 24/7...',
    content_type: 'social_post',
    model_used: 'gpt-4',
    rating: 1,
    used_in_draft_id: null,
    metadata: {},
    created_by: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_BRAND_ASSETS: BrandAsset[] = [
  {
    id: '1',
    client_id: '1',
    asset_type: 'color',
    name: 'ראשי',
    value: '#3B82F6',
    description: 'צבע ראשי של המותג',
    is_primary: true,
    sort_order: 0,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    client_id: '1',
    asset_type: 'color',
    name: 'משני',
    value: '#10B981',
    description: 'צבע משני',
    is_primary: false,
    sort_order: 1,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    client_id: '1',
    asset_type: 'font',
    name: 'כותרות',
    value: 'Heebo',
    description: 'פונט לכותרות',
    is_primary: true,
    sort_order: 0,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    client_id: '1',
    asset_type: 'tone',
    name: 'טון כללי',
    value: 'מקצועי אך נגיש, ידידותי ומזמין. משתמשים בשפה ברורה ופשוטה.',
    description: null,
    is_primary: true,
    sort_order: 0,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    client_id: '1',
    asset_type: 'keyword',
    name: 'מילת מפתח',
    value: 'איכות',
    description: null,
    is_primary: true,
    sort_order: 0,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    client_id: '1',
    asset_type: 'keyword',
    name: 'מילת מפתח',
    value: 'חדשנות',
    description: null,
    is_primary: false,
    sort_order: 1,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ContentStudio() {
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedDraft, setSelectedDraft] = useState<ContentDraft | null>(null);
  const [media] = useState<MediaItem[]>(MOCK_MEDIA);
  const [drafts, setDrafts] = useState<ContentDraft[]>(MOCK_DRAFTS);
  const [aiHistory] = useState<AIContentHistory[]>(MOCK_AI_HISTORY);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>(MOCK_BRAND_ASSETS);

  // Handlers
  const handleSaveDraft = (data: Partial<ContentDraft>) => {
    if (selectedDraft) {
      setDrafts(prev => prev.map(d => 
        d.id === selectedDraft.id 
          ? { ...d, ...data, updated_at: new Date().toISOString() }
          : d
      ));
    } else {
      const newDraft: ContentDraft = {
        id: Date.now().toString(),
        client_id: selectedClient?.id || '1',
        title: data.title || 'טיוטה חדשה',
        content: data.content || null,
        content_type: data.content_type || 'post',
        status: 'draft',
        platforms: data.platforms || [],
        media_ids: [],
        scheduled_for: null,
        metadata: {},
        created_by: null,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDrafts(prev => [newDraft, ...prev]);
      setSelectedDraft(newDraft);
    }
    toast.success('הטיוטה נשמרה');
  };

  const handlePublishDraft = (data: Partial<ContentDraft>) => {
    handleSaveDraft({ ...data, status: 'approved' });
    toast.success('התוכן אושר לפרסום');
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    if (selectedDraft?.id === id) setSelectedDraft(null);
    toast.success('הטיוטה נמחקה');
  };

  const handleStatusChange = (id: string, status: string) => {
    setDrafts(prev => prev.map(d => 
      d.id === id ? { ...d, status: status as ContentDraft['status'] } : d
    ));
    toast.success('הסטטוס עודכן');
  };

  const handleAIGenerate = async (prompt: string, _contentType: string): Promise<string> => {
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `תוכן שנוצר על ידי AI עבור: "${prompt}"\n\nזהו תוכן לדוגמה שנוצר באופן אוטומטי. במערכת אמיתית, כאן יופיע תוכן שנוצר על ידי מודל AI.`;
  };

  const handleRateAI = (id: string, rating: number) => {
    toast.success(rating > 0 ? 'תודה על המשוב!' : 'נרשם, נשתפר בפעם הבאה');
  };

  const handleUseContent = (content: string) => {
    if (selectedDraft) {
      setSelectedDraft({ ...selectedDraft, content });
    }
    toast.success('התוכן הועבר לעורך');
  };

  const handleCreateAsset = (type: string, name: string, value: string, description?: string) => {
    const newAsset: BrandAsset = {
      id: Date.now().toString(),
      client_id: selectedClient?.id || '1',
      asset_type: type as BrandAsset['asset_type'],
      name,
      value,
      description: description || null,
      is_primary: false,
      sort_order: brandAssets.filter(a => a.asset_type === type).length,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBrandAssets(prev => [...prev, newAsset]);
  };

  const handleUpdateAsset = (id: string, data: Partial<BrandAsset>) => {
    setBrandAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const handleDeleteAsset = (id: string) => {
    setBrandAssets(prev => prev.filter(a => a.id !== id));
    toast.success('הנכס נמחק');
  };

  return (
    <MainLayout>
      <DomainErrorBoundary domain="content">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">סטודיו תוכן</h1>
          <p className="text-muted-foreground">
            יצירה, עריכה וניהול תוכן שיווקי
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              עורך
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              טיוטות
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              מדיה
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="claude" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Claude Studio
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              מותג
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-6">
            <ContentEditor
              draft={selectedDraft}
              onSave={handleSaveDraft}
              onPublish={handlePublishDraft}
              onAIGenerate={handleAIGenerate}
            />
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            <DraftsManager
              drafts={drafts}
              onSelect={(draft) => {
                setSelectedDraft(draft);
                setActiveTab('editor');
              }}
              onCreate={() => {
                setSelectedDraft(null);
                setActiveTab('editor');
              }}
              onDelete={handleDeleteDraft}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <MediaLibrary
              media={media}
              folders={['general', 'banners', 'products', 'team']}
              onUpload={() => toast.info('העלאת קבצים תתווסף בקרוב')}
              onDelete={(id) => toast.success(`קובץ ${id} נמחק`)}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIContentGenerator
                history={aiHistory}
                onGenerate={handleAIGenerate}
                onRate={handleRateAI}
                onUseContent={handleUseContent}
              />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">טיפים לשימוש ב-AI</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">היה ספציפי</h4>
                    <p className="text-sm text-muted-foreground">
                      ככל שההנחיה מפורטת יותר, כך התוצאה תהיה מדויקת יותר.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">ציין את קהל היעד</h4>
                    <p className="text-sm text-muted-foreground">
                      הוסף מידע על קהל היעד לקבלת תוכן מותאם.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">הוסף דוגמאות</h4>
                    <p className="text-sm text-muted-foreground">
                      אם יש לך סגנון מועדף, שתף דוגמאות בהנחיה.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="mt-6">
            <BrandAssetsManager
              assets={brandAssets}
              onCreate={handleCreateAsset}
              onUpdate={handleUpdateAsset}
              onDelete={handleDeleteAsset}
            />
          </TabsContent>

          <TabsContent value="claude" className="mt-6">
            <ClaudeStudioChat />
          </TabsContent>
        </Tabs>
      </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}
