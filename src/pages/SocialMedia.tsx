// Social Media Management Page

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  Calendar, 
  BarChart3, 
  FileText, 
  Hash,
  Link2,
  Plus
} from 'lucide-react';
import { 
  SocialAccountsManager,
  PostComposer,
  ContentCalendar,
  SocialAnalyticsDashboard,
  ContentTemplates,
  HashtagManager
} from '@/components/social';
import { toast } from 'sonner';

export default function SocialMedia() {
  const [activeTab, setActiveTab] = useState('compose');

  // Mock data - will be replaced with real API calls
  const mockAccounts = [
    { id: '1', platform: 'facebook', account_name: 'דף העסק', account_url: null, is_active: true, last_sync_at: null },
  ];

  const mockStats = {
    total_posts: 24,
    total_likes: 1250,
    total_comments: 89,
    total_shares: 45,
    total_reach: 15000,
    avg_engagement_rate: 9.2,
  };

  const mockTemplates = [
    {
      id: '1',
      name: 'הודעת מבצע',
      description: 'תבנית להודעות מבצע ומכירות',
      content: '🔥 מבצע מיוחד! 🔥\n\n{product_name} במחיר {price} בלבד!\n\n#מבצע #הנחה',
      category: 'promotion',
      platforms: ['facebook', 'instagram'],
      variables: [{ name: 'product_name', label: 'שם המוצר' }, { name: 'price', label: 'מחיר' }],
      is_global: true,
      usage_count: 15,
    },
  ];

  const mockHashtagGroups = [
    {
      id: '1',
      name: 'מבצעים',
      hashtags: ['מבצע', 'הנחה', 'סייל', 'קניות', 'מחירמיוחד'],
      category: 'שיווק',
      usage_count: 12,
    },
  ];

  const mockCalendarEntries = [
    {
      id: '1',
      title: 'פוסט מבצע קיץ',
      date: new Date().toISOString().split('T')[0],
      platforms: ['facebook', 'instagram'],
      status: 'planned' as const,
      color: '#3B82F6',
    },
  ];

  const handleConnect = (platform: string) => {
    toast.info(`חיבור ל-${platform} יתווסף בקרוב`);
  };

  const handleDisconnect = (accountId: string) => {
    toast.success('החשבון נותק');
  };

  const handleSync = async (accountId: string) => {
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleCreatePost = (data: {
    content: string;
    platforms: string[];
    mediaUrls: string[];
    hashtags: string[];
    scheduledFor?: Date;
  }) => {
    console.log('Creating post:', data);
    if (data.scheduledFor) {
      toast.success('הפוסט תוזמן בהצלחה');
    } else {
      toast.success('הפוסט פורסם בהצלחה');
    }
  };

  const handleUseTemplate = (content: string) => {
    setActiveTab('compose');
    // The content would be passed to PostComposer
    toast.success('התבנית נטענה');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Share2 className="h-8 w-8 text-primary" />
              ניהול סושיאל
            </h1>
            <p className="text-muted-foreground mt-1">
              ניהול וזימון פוסטים לרשתות החברתיות
            </p>
          </div>
          <Button onClick={() => setActiveTab('compose')}>
            <Plus className="h-4 w-4 ml-1" />
            פוסט חדש
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="compose" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              יצירה
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              לוח שנה
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              ניתוח
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              תבניות
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex items-center gap-1">
              <Hash className="h-4 w-4" />
              האשטגים
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              חשבונות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-6">
            <PostComposer 
              onSubmit={handleCreatePost}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <ContentCalendar
              entries={mockCalendarEntries}
              onDateClick={(date) => console.log('Date clicked:', date)}
              onEntryClick={(entry) => console.log('Entry clicked:', entry)}
              onAddEntry={(date) => {
                console.log('Add entry for:', date);
                toast.info('הוספת פריט ללוח שנה');
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <SocialAnalyticsDashboard stats={mockStats} />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <ContentTemplates
              templates={mockTemplates}
              onUseTemplate={handleUseTemplate}
            />
          </TabsContent>

          <TabsContent value="hashtags" className="mt-6">
            <HashtagManager
              groups={mockHashtagGroups}
              onCreateGroup={(name, hashtags, category) => {
                console.log('Create group:', name, hashtags, category);
                toast.success('הקבוצה נוצרה');
              }}
              onDeleteGroup={(id) => {
                console.log('Delete group:', id);
                toast.success('הקבוצה נמחקה');
              }}
              onUseGroup={(hashtags) => {
                const text = hashtags.map(h => `#${h}`).join(' ');
                navigator.clipboard.writeText(text);
                toast.success('ההאשטגים הועתקו');
              }}
            />
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            <SocialAccountsManager
              accounts={mockAccounts}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
