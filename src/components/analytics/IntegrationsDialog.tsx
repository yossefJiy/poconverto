import { useState, useEffect } from "react";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Check,
  X,
  RefreshCw,
  Loader2,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Building2,
  Search,
  ShoppingBag,
  BarChart3,
  Target,
  Store,
  FileText,
  FolderOpen,
  Table,
  CalendarDays,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NOTIFY_EMAIL = "yossef@jiy.co.il";

// Platform Icons as SVG components
const ShopifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M15.337 3.415c-.088-.006-.183-.006-.271-.006-.183 0-.366.006-.543.025a1.073 1.073 0 00-.872.771l-.348 1.212c-.012.044-.024.082-.036.119a4.156 4.156 0 00-1.462-.256c-2.055 0-3.839 1.559-4.282 3.778-.177.89-.106 1.73.206 2.423.32.716.852 1.189 1.486 1.372l-.543 1.889c-.088.301.082.614.382.702l2.38.696c.3.088.614-.082.702-.382l.902-3.137c.088-.301-.082-.614-.382-.702l-.602-.176c-.196-.057-.325-.183-.368-.354a1.023 1.023 0 01.075-.565c.196-.496.615-.921 1.141-1.128.113-.044.232-.075.354-.094l-.614 2.137c-.088.301.082.614.382.702l2.38.696c.3.088.614-.082.702-.382l1.446-5.034c.225-.778-.088-1.609-.765-2.029a2.51 2.51 0 00-1.448-.471zm.271 2.549l-.755 2.625-.908-.265.755-2.625.908.265z"/>
  </svg>
);

const GoogleAnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fillOpacity="0"/>
    <rect x="4" y="14" width="4" height="6" rx="1" fill="#F9AB00"/>
    <rect x="10" y="10" width="4" height="10" rx="1" fill="#E37400"/>
    <rect x="16" y="4" width="4" height="16" rx="1" fill="#F9AB00"/>
  </svg>
);

const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <circle cx="6" cy="18" r="3" fill="#FBBC04"/>
    <path d="M14.5 4l-8 14h5l8-14h-5z" fill="#4285F4"/>
    <path d="M21 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" fill="#34A853"/>
  </svg>
);

const FacebookAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WooCommerceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#96588A">
    <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h3.09l-.396 3.063 3.558-3.063h11.283c1.236 0 2.228-1.001 2.228-2.237V7.094c0-1.236-1.001-2.237-2.237-2.237H2.227zm4.012 1.821c.61 0 1.063.198 1.359.594.247.331.38.775.399 1.332l-.658.064c-.019-.401-.096-.7-.231-.899-.172-.254-.418-.38-.738-.38-.439 0-.778.237-.997.711-.187.389-.282.896-.282 1.521 0 .654.095 1.167.282 1.539.22.465.558.697.997.697.32 0 .566-.135.738-.406.135-.198.212-.488.231-.868l.658.064c-.019.538-.152.973-.399 1.305-.296.405-.749.608-1.359.608-.724 0-1.285-.29-1.682-.871-.33-.484-.495-1.128-.495-1.932 0-.834.165-1.49.495-1.969.397-.581.958-.871 1.682-.871zm3.563.113h.723l.952 3.73.952-3.73h.732l.952 3.73.952-3.73h.706l-1.275 4.871h-.788l-.952-3.609-.952 3.609h-.788l-1.275-4.871zm6.556 0h2.56v.593h-1.877v1.454h1.748v.593h-1.748v1.639h1.932v.593h-2.615v-4.872z"/>
  </svg>
);

interface PlatformOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  credentialKey: string;
  placeholder: string;
  useMccSelection?: boolean;
  useApiCredentials?: boolean; // For platforms needing consumer key/secret
  useGACredentials?: boolean; // For Google Analytics with property ID + measurement ID
  useOAuth?: boolean; // For Google Workspace integrations requiring OAuth
  useFacebookCredentials?: boolean; // For Facebook Ads with access token + ad account ID
  category: "ecommerce" | "analytics" | "google_workspace" | "ai";
  comingSoon?: boolean;
  steps: { title: string; description: string }[];
  helpUrl: string;
  features: string[];
}

interface MccAccount {
  id: string;
  name: string;
  currency: string;
}

// Validation helpers
const validateCustomerId = (value: string): { valid: boolean; formatted: string } => {
  const cleanId = value.replace(/\D/g, '');
  if (cleanId.length === 10) {
    const formatted = cleanId.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return { valid: true, formatted };
  }
  return { valid: false, formatted: value };
};

const platformOptions: PlatformOption[] = [
  // E-commerce
  { 
    id: "shopify", 
    name: "Shopify", 
    icon: () => <ShoppingBag className="w-5 h-5" />,
    color: "bg-[#96BF48]",
    category: "ecommerce",
    description: "סנכרון נתוני מכירות, מוצרים והזמנות",
    credentialKey: "store_url",
    placeholder: "mystore.myshopify.com",
    steps: [
      { title: "היכנס לחשבון Shopify שלך", description: "פתח את הדשבורד של החנות" },
      { title: "העתק את כתובת החנות", description: "הכתובת נמצאת בשורת הכתובת: yourstore.myshopify.com" },
      { title: "הדבק את הכתובת למטה", description: "ודא שהכתובת מכילה .myshopify.com" },
    ],
    helpUrl: "https://help.shopify.com/en/manual/your-account/account-settings",
    features: ["הזמנות בזמן אמת", "מלאי מוצרים", "נתוני לקוחות", "דוחות מכירות"],
  },
  { 
    id: "woocommerce", 
    name: "WooCommerce", 
    icon: () => <Store className="w-5 h-5" />,
    color: "bg-[#96588A]",
    category: "ecommerce",
    description: "סנכרון נתוני חנות WordPress + WooCommerce",
    credentialKey: "store_url",
    placeholder: "https://mystore.com",
    useApiCredentials: true,
    steps: [
      { title: "היכנס לאזור הניהול של WordPress", description: "עבור ל-WooCommerce > Settings > Advanced > REST API" },
      { title: "צור מפתח API חדש", description: "לחץ על 'Add key' והגדר הרשאות Read/Write" },
      { title: "העתק Consumer Key ו-Consumer Secret", description: "שמור אותם במקום בטוח" },
      { title: "הזן את הפרטים למטה", description: "כתובת אתר + מפתחות ה-API" },
    ],
    helpUrl: "https://woocommerce.com/document/woocommerce-rest-api/",
    features: ["הזמנות", "מוצרים", "לקוחות", "דוחות מכירות"],
  },
  // Analytics & Ads
  { 
    id: "google_analytics", 
    name: "Google Analytics", 
    icon: () => <BarChart3 className="w-5 h-5" />,
    color: "bg-[#F9AB00]",
    category: "analytics",
    description: "נתוני תנועה והתנהגות גולשים",
    credentialKey: "property_id",
    placeholder: "123456789",
    useGACredentials: true,
    steps: [
      { title: "היכנס ל-Google Analytics", description: "עבור ל-analytics.google.com" },
      { title: "עבור להגדרות הנכס", description: "לחץ על Admin > Property Settings" },
      { title: "העתק Property ID ו-Measurement ID", description: "Property ID הוא מספר (לדוגמה: 123456789), Measurement ID מתחיל ב-G-" },
    ],
    helpUrl: "https://support.google.com/analytics/answer/9539598",
    features: ["סשנים וצפיות", "מקורות תנועה", "המרות", "התנהגות גולשים"],
  },
  { 
    id: "google_ads", 
    name: "Google Ads", 
    icon: () => <Target className="w-5 h-5" />,
    color: "bg-[#4285F4]",
    category: "analytics",
    description: "סנכרון קמפיינים ונתוני ביצועים",
    credentialKey: "customer_id",
    placeholder: "123-456-7890",
    useMccSelection: true,
    steps: [
      { title: "בחר חשבון מהרשימה", description: "בחר את החשבון הפרסומי של הלקוח" },
      { title: "אישור החיבור", description: "לחץ על 'התחבר' לסיום" },
    ],
    helpUrl: "https://support.google.com/google-ads/answer/1704344",
    features: ["קמפיינים", "מילות מפתח", "המרות", "עלויות"],
  },
  { 
    id: "facebook_ads", 
    name: "Facebook Ads", 
    icon: () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    color: "bg-[#1877F2]",
    category: "analytics",
    description: "מנהל מודעות, עמודים ואינסטגרם מ-Facebook Business",
    credentialKey: "ad_account_id",
    placeholder: "123456789",
    useFacebookCredentials: true,
    steps: [
      { title: "צור Access Token", description: "עבור ל-Facebook Developer > Tools > Graph API Explorer" },
      { title: "הגדר הרשאות", description: "ads_read, pages_read_engagement, instagram_basic" },
      { title: "צור Long-Lived Token", description: "בחר User Token ארוך-טווח (60 ימים)" },
      { title: "חבר נכסים", description: "מנהל מודעות, עמוד פייסבוק ואינסטגרם" },
    ],
    helpUrl: "https://developers.facebook.com/docs/marketing-api/overview",
    features: ["מנהל מודעות", "עמודי פייסבוק", "אינסטגרם", "קהלים"],
  },
  // Google Workspace
  { 
    id: "google_drive", 
    name: "Google Drive", 
    icon: () => <FolderOpen className="w-5 h-5" />,
    color: "bg-[#4285F4]",
    category: "google_workspace",
    description: "גישה לקבצים ותיקיות מה-Drive",
    credentialKey: "folder_id",
    placeholder: "מזהה תיקייה (אופציונלי)",
    useOAuth: true,
    steps: [
      { title: "התחבר עם חשבון Google", description: "לחץ על 'התחבר' ואשר גישה לחשבון Google שלך" },
      { title: "אשר הרשאות גישה", description: "אשר גישה ל-Google Drive לצפייה וניהול קבצים" },
      { title: "בחר תיקייה (אופציונלי)", description: "ניתן להגביל גישה לתיקייה ספציפית" },
    ],
    helpUrl: "https://support.google.com/drive",
    features: ["גישה לקבצים", "העלאת קבצים", "שיתוף תיקיות", "חיפוש מסמכים"],
  },
  { 
    id: "google_docs", 
    name: "Google Docs", 
    icon: () => <FileText className="w-5 h-5" />,
    color: "bg-[#4285F4]",
    category: "google_workspace",
    description: "ייבוא ויצוא מסמכים",
    credentialKey: "doc_url",
    placeholder: "https://docs.google.com/document/d/...",
    useOAuth: true,
    steps: [
      { title: "התחבר עם חשבון Google", description: "לחץ על 'התחבר' ואשר גישה לחשבון Google שלך" },
      { title: "אשר הרשאות גישה", description: "אשר גישה ל-Google Docs לקריאה וכתיבה" },
      { title: "בחר מסמך או תיקייה", description: "ניתן לייבא משימות ממסמכים קיימים" },
    ],
    helpUrl: "https://support.google.com/docs",
    features: ["ייבוא משימות", "יצוא דוחות", "שיתוף מסמכים", "עריכה משותפת"],
  },
  { 
    id: "google_sheets", 
    name: "Google Sheets", 
    icon: () => <Table className="w-5 h-5" />,
    color: "bg-[#0F9D58]",
    category: "google_workspace",
    description: "ייבוא ויצוא נתונים מגיליונות",
    credentialKey: "sheet_url",
    placeholder: "https://docs.google.com/spreadsheets/d/...",
    useOAuth: true,
    steps: [
      { title: "התחבר עם חשבון Google", description: "לחץ על 'התחבר' ואשר גישה לחשבון Google שלך" },
      { title: "אשר הרשאות גישה", description: "אשר גישה ל-Google Sheets לקריאה וכתיבה" },
      { title: "בחר גיליון או צור חדש", description: "ניתן לסנכרן נתונים אוטומטית" },
    ],
    helpUrl: "https://support.google.com/sheets",
    features: ["ייבוא משימות", "יצוא דוחות", "סנכרון נתונים", "נוסחאות חכמות"],
  },
  { 
    id: "google_calendar", 
    name: "Google Calendar", 
    icon: () => <CalendarDays className="w-5 h-5" />,
    color: "bg-[#4285F4]",
    category: "google_workspace",
    description: "סנכרון משימות עם יומן Google",
    credentialKey: "calendar_id",
    placeholder: "primary (או מזהה יומן ספציפי)",
    useOAuth: true,
    steps: [
      { title: "התחבר עם חשבון Google", description: "לחץ על 'התחבר' ואשר גישה לחשבון Google שלך" },
      { title: "אשר הרשאות גישה", description: "אשר גישה ל-Google Calendar לצפייה וניהול אירועים" },
      { title: "בחר יומן", description: "בחר יומן לסנכרון משימות (ברירת מחדל: primary)" },
    ],
    helpUrl: "https://support.google.com/calendar",
    features: ["סנכרון משימות", "תזכורות אוטומטיות", "תצוגת יומן", "הזמנות לפגישות"],
  },
  // AI
  { 
    id: "gemini", 
    name: "Google Gemini", 
    icon: () => <Sparkles className="w-5 h-5" />,
    color: "bg-gradient-to-r from-[#4285F4] to-[#EA4335]",
    category: "ai",
    description: "בינה מלאכותית ליצירת תוכן וניתוח",
    credentialKey: "api_key",
    placeholder: "AIza...",
    steps: [
      { title: "היכנס ל-Google AI Studio", description: "עבור ל-aistudio.google.com" },
      { title: "צור API Key", description: "לחץ על 'Get API key' ובחר פרויקט" },
      { title: "העתק את ה-API Key", description: "הדבק את המפתח למטה" },
    ],
    helpUrl: "https://ai.google.dev/",
    features: ["יצירת תוכן", "סיכום מסמכים", "ניתוח נתונים", "המלצות חכמות"],
  },
  // Perplexity הוסר - זמין דרך OpenRouter
  { 
    id: "openrouter", 
    name: "OpenRouter", 
    icon: () => <Sparkles className="w-5 h-5" />,
    color: "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]",
    category: "ai",
    description: "גישה למגוון מודלים של AI כולל Perplexity Sonar לחיפוש",
    credentialKey: "api_key",
    placeholder: "sk-or-...",
    steps: [
      { title: "היכנס ל-OpenRouter", description: "עבור ל-openrouter.ai/keys" },
      { title: "צור API Key", description: "לחץ על 'Create Key'" },
      { title: "העתק את ה-API Key", description: "המפתח מתחיל ב-sk-or-" },
    ],
    helpUrl: "https://openrouter.ai/docs",
    features: ["Perplexity Sonar (חיפוש)", "Claude", "GPT-4", "Gemini", "Llama"],
  },
  { 
    id: "tiktok", 
    name: "TikTok Ads", 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: "bg-black",
    category: "analytics",
    description: "סנכרון קמפיינים ונתוני ביצועים מ-TikTok",
    credentialKey: "access_token",
    placeholder: "Access Token",
    steps: [
      { title: "היכנס ל-TikTok Business Center", description: "עבור ל-ads.tiktok.com" },
      { title: "צור App ב-TikTok for Developers", description: "קבל Access Token מ-Marketing API" },
      { title: "העתק את ה-Access Token", description: "הדבק את הטוקן ואת מזהה המפרסם" },
    ],
    helpUrl: "https://ads.tiktok.com/marketing_api/docs",
    features: ["קמפיינים", "קבוצות מודעות", "סטטיסטיקות", "המרות"],
    useFacebookCredentials: true, // Reuse the same pattern for access token + account ID
  },
  { 
    id: "notebooklm", 
    name: "NotebookLM", 
    icon: () => <BookOpen className="w-5 h-5" />,
    color: "bg-[#4285F4]",
    category: "ai",
    comingSoon: true,
    description: "מחקר וסיכום מסמכים עם AI",
    credentialKey: "api_key",
    placeholder: "בקרוב...",
    steps: [
      { title: "אינטגרציה בפיתוח", description: "NotebookLM עדיין לא תומך ב-API ציבורי" },
      { title: "הירשם לעדכונים", description: "נעדכן אותך כשהאינטגרציה תהיה זמינה" },
    ],
    helpUrl: "https://notebooklm.google.com/",
    features: ["סיכום מסמכים", "שאלות ותשובות", "מחקר חכם", "יצירת פודקאסטים"],
  },
];

interface IntegrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform?: string;
}

export function IntegrationsDialog({ open, onOpenChange, defaultPlatform }: IntegrationsDialogProps) {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [credential, setCredential] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [measurementId, setMeasurementId] = useState(""); // For Google Analytics Measurement ID (G-XXXXXX)
  const [facebookAccessToken, setFacebookAccessToken] = useState(""); // For Facebook Ads access token
  const [facebookPageId, setFacebookPageId] = useState(""); // For Facebook Page ID
  const [instagramAccountId, setInstagramAccountId] = useState(""); // For Instagram Business Account ID
  const [selectedMccAccount, setSelectedMccAccount] = useState<MccAccount | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [validationError, setValidationError] = useState("");

  // Auto-select platform if defaultPlatform is provided
  useEffect(() => {
    if (open && defaultPlatform) {
      const platform = platformOptions.find(p => p.id === defaultPlatform);
      if (platform) {
        setSelectedPlatform(platform);
      }
    }
  }, [open, defaultPlatform]);

  // Fetch MCC accounts when Google Ads is selected
  const { data: mccAccounts = [], isLoading: isLoadingMcc } = useQuery({
    queryKey: ["mcc-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-ads-oauth', {
        body: { action: 'list_mcc_accounts' }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.accounts as MccAccount[];
    },
    enabled: open && selectedPlatform?.id === 'google_ads',
  });

  // Filter accounts by search
  const filteredAccounts = mccAccounts.filter(account => 
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.id.includes(searchQuery)
  );

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !selectedPlatform) throw new Error("Missing data");
      
      // Build credentials based on platform type
      let credentials: Record<string, string> = {};
      
      if (selectedPlatform.useMccSelection && selectedMccAccount) {
        credentials[selectedPlatform.credentialKey] = selectedMccAccount.id;
      } else if (selectedPlatform.useApiCredentials) {
        // WooCommerce with consumer key/secret
        credentials = {
          store_url: credential,
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        };
      } else if (selectedPlatform.useGACredentials) {
        // Google Analytics with property ID + measurement ID
        credentials = {
          property_id: credential,
          measurement_id: measurementId || "",
        };
      } else if (selectedPlatform.useFacebookCredentials) {
        // Facebook Ads with access token + ad account ID + pages
        credentials = {
          ad_account_id: credential,
          access_token: facebookAccessToken,
          facebook_page_id: facebookPageId || "",
          instagram_account_id: instagramAccountId || "",
        };
      } else {
        credentials[selectedPlatform.credentialKey] = credential;
      }
      
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          action: "connect",
          platform: selectedPlatform.id,
          client_id: selectedClient.id,
          credentials,
          notify_email: NOTIFY_EMAIL,
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage(data.message);
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
        queryClient.invalidateQueries({ queryKey: ["google-ads"] });
        toast.success(data.message);
        setTimeout(() => {
          resetDialog();
        }, 1500);
      } else {
        setConnectionStatus("error");
        setConnectionMessage(data.message);
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      setConnectionStatus("error");
      setConnectionMessage(error.message || "שגיאה בחיבור");
      toast.error("שגיאה בחיבור לפלטפורמה");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: { action: "sync", integration_id: integrationId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("הסנכרון הושלם בהצלחה");
    },
    onError: () => toast.error("שגיאה בסנכרון"),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.from("integrations").delete().eq("id", integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["google-ads"] });
      toast.success("החיבור הוסר");
    },
  });

  const handlePlatformSelect = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setCurrentStep(0);
    setCredential("");
    setConsumerKey("");
    setConsumerSecret("");
    setMeasurementId("");
    setFacebookAccessToken("");
    setFacebookPageId("");
    setInstagramAccountId("");
    setSelectedMccAccount(null);
    setConnectionStatus("idle");
    setConnectionMessage("");
    setSearchQuery("");
    setValidationError("");
  };

  const handleMccAccountSelect = (account: MccAccount) => {
    setSelectedMccAccount(account);
    setCurrentStep(1);
  };

  const handleConnect = () => {
    // Validate Google Ads customer ID
    if (selectedPlatform?.useMccSelection && selectedMccAccount) {
      const { valid } = validateCustomerId(selectedMccAccount.id);
      if (!valid) {
        setValidationError("מספר לקוח לא תקין. יש להזין 10 ספרות בפורמט: 123-456-7890");
        return;
      }
    }
    
    // Validate WooCommerce
    if (selectedPlatform?.useApiCredentials) {
      if (!credential || !consumerKey || !consumerSecret) {
        setValidationError("יש למלא את כל השדות");
        return;
      }
      if (!credential.startsWith('http')) {
        setValidationError("כתובת האתר חייבת להתחיל ב-https://");
        return;
      }
    }

    // Validate Google Analytics
    if (selectedPlatform?.useGACredentials) {
      if (!credential) {
        setValidationError("יש להזין Property ID");
        return;
      }
      // Property ID can be numeric or alphanumeric (some GA4 properties have different formats)
      // Allow: pure numbers (123456789), or alphanumeric identifiers
      const cleanPropertyId = credential.trim();
      if (cleanPropertyId.length < 1 || cleanPropertyId.length > 50) {
        setValidationError("Property ID חייב להיות בין 1 ל-50 תווים");
        return;
      }
      // Measurement ID validation is optional and flexible
      if (measurementId) {
        const cleanMeasurementId = measurementId.trim();
        // Accept G-XXXXX format or just the ID part
        if (cleanMeasurementId.length > 0 && cleanMeasurementId.length > 30) {
          setValidationError("Measurement ID ארוך מדי");
          return;
        }
      }
    }

    // Validate Facebook Ads
    if (selectedPlatform?.useFacebookCredentials) {
      if (!credential) {
        setValidationError("יש להזין מספר חשבון מודעות");
        return;
      }
      if (!facebookAccessToken) {
        setValidationError("יש להזין Access Token");
        return;
      }
    }
    
    setValidationError("");
    setConnectionStatus("testing");
    connectMutation.mutate();
  };

  const resetDialog = () => {
    onOpenChange(false);
    setSelectedPlatform(null);
    setCurrentStep(0);
    setCredential("");
    setConsumerKey("");
    setConsumerSecret("");
    setMeasurementId("");
    setFacebookAccessToken("");
    setFacebookPageId("");
    setInstagramAccountId("");
    setSelectedMccAccount(null);
    setConnectionStatus("idle");
    setConnectionMessage("");
    setSearchQuery("");
    setValidationError("");
  };

  if (!selectedClient) {
    return null;
  }

  const canConnect = selectedPlatform?.useMccSelection 
    ? !!selectedMccAccount 
    : selectedPlatform?.useApiCredentials 
      ? !!credential && !!consumerKey && !!consumerSecret
      : selectedPlatform?.useGACredentials
        ? !!credential
        : selectedPlatform?.useFacebookCredentials
          ? !!credential && !!facebookAccessToken
          : !!credential;

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedPlatform ? `חיבור ${selectedPlatform.name}` : "ניהול אינטגרציות"}</DialogTitle>
          <DialogDescription>
            {selectedPlatform ? selectedPlatform.description : "חבר פלטפורמות או נהל חיבורים קיימים"}
          </DialogDescription>
        </DialogHeader>

        {!selectedPlatform ? (
          <div className="space-y-6 mt-4">
            {/* Existing Integrations */}
            {integrations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">חיבורים קיימים:</h4>
                {integrations.map((integration) => {
                  const platform = platformOptions.find(p => p.id === integration.platform);
                  const settings = integration.settings as any;
                  const connectionData = settings?.connection_data;
                  
                  // Get additional info for Facebook integrations
                  const facebookPage = connectionData?.facebook_page || settings?.facebook_page;
                  const instagramAccount = connectionData?.instagram_account || settings?.instagram_account;
                  const accountStatus = connectionData?.account_status;
                  
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", platform?.color)}>
                          {platform && <platform.icon />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{platform?.name}</p>
                            {connectionData?.account_name && (
                              <span className="text-xs text-muted-foreground">• {connectionData.account_name}</span>
                            )}
                          </div>
                          
                          {/* Facebook-specific info */}
                          {integration.platform === 'facebook_ads' && (facebookPage || instagramAccount) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {facebookPage && (
                                <span className="flex items-center gap-1">
                                  📄 {facebookPage.name}
                                </span>
                              )}
                              {instagramAccount && (
                                <span className="flex items-center gap-1">
                                  📸 @{instagramAccount.username}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString("he-IL") : "לא סונכרן"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Account status for Facebook */}
                        {integration.platform === 'facebook_ads' && accountStatus !== undefined && (
                          <Badge 
                            variant={accountStatus === 1 ? "default" : "secondary"}
                            className={cn(
                              "text-[10px]",
                              accountStatus === 1 ? "bg-green-500" : 
                              accountStatus === 2 ? "bg-yellow-500" : 
                              accountStatus === 3 ? "bg-red-500" : ""
                            )}
                          >
                            {accountStatus === 1 ? "פעיל" : 
                             accountStatus === 2 ? "מושבת" : 
                             accountStatus === 3 ? "לא מאושר" : 
                             `סטטוס: ${accountStatus}`}
                          </Badge>
                        )}
                        <Badge variant={integration.is_connected ? "default" : "secondary"}>
                          {integration.is_connected ? "מחובר" : "מנותק"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => syncMutation.mutate(integration.id)} disabled={syncMutation.isPending}>
                          <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => disconnectMutation.mutate(integration.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Integration */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">הוסף אינטגרציה חדשה:</h4>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-5 h-9 mb-4">
                  <TabsTrigger value="all" className="text-xs">הכל</TabsTrigger>
                  <TabsTrigger value="ecommerce" className="text-xs">חנויות</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs">אנליטיקס</TabsTrigger>
                  <TabsTrigger value="google_workspace" className="text-xs">Google Workspace</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                </TabsList>
                
                {["all", "ecommerce", "analytics", "google_workspace", "ai"].map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <ScrollArea className="h-[300px]">
                      <div className="grid grid-cols-2 gap-3 pr-2">
                        {platformOptions
                          .filter(p => category === "all" || p.category === category)
                          .map((platform) => {
                            const isConnected = integrations.some(i => i.platform === platform.id);
                            return (
                              <button
                                key={platform.id}
                                onClick={() => !platform.comingSoon && handlePlatformSelect(platform)}
                                disabled={isConnected || platform.comingSoon}
                                className={cn(
                                  "p-3 rounded-xl border-2 border-border hover:border-primary transition-all text-right relative group",
                                  isConnected && "opacity-50 cursor-not-allowed",
                                  platform.comingSoon && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                {platform.comingSoon && (
                                  <Badge className="absolute -top-2 -right-2 text-[10px] bg-warning text-warning-foreground">
                                    בקרוב
                                  </Badge>
                                )}
                                {platform.useOAuth && !platform.comingSoon && (
                                  <Badge variant="outline" className="absolute -top-2 -right-2 text-[10px] bg-background">
                                    OAuth
                                  </Badge>
                                )}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", platform.color)}>
                                    <platform.icon />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-sm">{platform.name}</p>
                                    {isConnected && <Badge variant="secondary" className="text-[10px]">מחובר</Badge>}
                                  </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{platform.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {platform.features.slice(0, 2).map((f, i) => (
                                    <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{f}</span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Steps */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-primary" />
                שלבי החיבור:
              </h4>
              {selectedPlatform.steps.map((step, index) => (
                <div key={index} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  currentStep === index ? "bg-primary/10 border border-primary" : "bg-muted/50"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    currentStep > index ? "bg-success text-white" : currentStep === index ? "bg-primary text-white" : "bg-muted-foreground/30"
                  )}>
                    {currentStep > index ? <Check className="w-3 h-3" /> : index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* MCC Account Selection for Google Ads */}
            {selectedPlatform.useMccSelection && (
              <div className="space-y-3">
                <Label>הזן מספר לקוח Google Ads:</Label>
                
                {/* Manual Input */}
                <div className="relative">
                  <Input
                    placeholder="123-456-7890"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // If user enters a valid customer ID format, use it directly
                      const cleanId = e.target.value.replace(/\D/g, '');
                      if (cleanId.length === 10) {
                        const formattedId = cleanId.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                        setSelectedMccAccount({ id: formattedId, name: 'חשבון ידני', currency: 'ILS' });
                        setCurrentStep(1);
                      } else {
                        setSelectedMccAccount(null);
                      }
                    }}
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                
                {/* Show selected account confirmation */}
                {selectedMccAccount && (
                  <Alert className="py-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription className="text-sm">
                      מספר לקוח: {selectedMccAccount.id}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* WooCommerce with API credentials */}
            {selectedPlatform.useApiCredentials && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>כתובת האתר:</Label>
                  <Input
                    value={credential}
                    onChange={(e) => {
                      setCredential(e.target.value);
                      setCurrentStep(e.target.value ? 1 : 0);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="https://mystore.com"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consumer Key:</Label>
                  <Input
                    value={consumerKey}
                    onChange={(e) => {
                      setConsumerKey(e.target.value);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    dir="ltr"
                    className="text-left font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consumer Secret:</Label>
                  <Input
                    type="password"
                    value={consumerSecret}
                    onChange={(e) => {
                      setConsumerSecret(e.target.value);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    dir="ltr"
                    className="text-left font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Google Analytics with Property ID + Measurement ID */}
            {selectedPlatform.useGACredentials && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Property ID (מספרי - חובה):</Label>
                  <Input
                    value={credential}
                    onChange={(e) => {
                      setCredential(e.target.value);
                      setCurrentStep(e.target.value ? 1 : 0);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="123456789"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    נמצא ב-Admin → Property Settings → Property ID
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Measurement ID (אופציונלי):</Label>
                  <Input
                    value={measurementId}
                    onChange={(e) => {
                      setMeasurementId(e.target.value);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="G-XXXXXXXXXX"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    נמצא ב-Data Streams → Web → Measurement ID
                  </p>
                </div>
              </div>
            )}

            {/* Facebook Ads with full integration */}
            {selectedPlatform.useFacebookCredentials && selectedPlatform.id === 'facebook_ads' && (
              <div className="space-y-4">
                <Alert className="border-blue-500/50 bg-blue-500/5">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-sm">חיבור מלא ל-Facebook Business</AlertTitle>
                  <AlertDescription className="text-xs">
                    חבר את כל נכסי Facebook שלך: מנהל מודעות, עמוד פייסבוק ואינסטגרם
                  </AlertDescription>
                </Alert>
                
                {/* Access Token - Required */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Access Token <Badge variant="destructive" className="text-[10px]">חובה</Badge>
                  </Label>
                  <Input
                    type="password"
                    value={facebookAccessToken}
                    onChange={(e) => {
                      setFacebookAccessToken(e.target.value);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="EAAxxxxxxx..."
                    dir="ltr"
                    className="text-left font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    צור ב-Graph API Explorer. הרשאות: ads_read, pages_read_engagement, instagram_basic
                  </p>
                </div>

                {/* Ad Account ID - Required */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    מזהה מנהל מודעות (Ad Account ID) <Badge variant="destructive" className="text-[10px]">חובה</Badge>
                  </Label>
                  <Input
                    value={credential}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '');
                      setCredential(cleanValue);
                      setCurrentStep(cleanValue ? 1 : 0);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="123456789012345"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    Business Settings → Ad Accounts. מספרים בלבד (נוסיף act_ אוטומטית)
                  </p>
                </div>

                {/* Facebook Page ID - Optional */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    מזהה עמוד פייסבוק (Page ID) <Badge variant="secondary" className="text-[10px]">אופציונלי</Badge>
                  </Label>
                  <Input
                    value={facebookPageId}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '');
                      setFacebookPageId(cleanValue);
                      setConnectionStatus("idle");
                    }}
                    placeholder="123456789012345"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    About → Page ID או מהכתובת: facebook.com/[page_id]
                  </p>
                </div>

                {/* Instagram Account ID - Optional */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    מזהה אינסטגרם עסקי (Instagram ID) <Badge variant="secondary" className="text-[10px]">אופציונלי</Badge>
                  </Label>
                  <Input
                    value={instagramAccountId}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '');
                      setInstagramAccountId(cleanValue);
                      setConnectionStatus("idle");
                    }}
                    placeholder="17841400000000000"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    עמוד פייסבוק → Settings → Instagram → Business Account ID
                  </p>
                </div>

                {/* Help link */}
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => window.open("https://developers.facebook.com/docs/marketing-api/overview", "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  מדריך יצירת Access Token
                </Button>
              </div>
            )}

            {/* TikTok with access token + advertiser ID */}
            {selectedPlatform.useFacebookCredentials && selectedPlatform.id === 'tiktok' && (
              <div className="space-y-4">
                <Alert className="border-black/50 bg-black/5">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-sm">חיבור TikTok Ads</AlertTitle>
                  <AlertDescription className="text-xs">
                    יש ליצור App ולקבל Access Token מ-TikTok Marketing API
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Advertiser ID:</Label>
                  <Input
                    value={credential}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '');
                      setCredential(cleanValue);
                      setCurrentStep(cleanValue ? 1 : 0);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="123456789012345"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Token:</Label>
                  <Input
                    type="password"
                    value={facebookAccessToken}
                    onChange={(e) => {
                      setFacebookAccessToken(e.target.value);
                      setConnectionStatus("idle");
                      setValidationError("");
                    }}
                    placeholder="TikTok Access Token..."
                    dir="ltr"
                    className="text-left font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* OAuth for Google Workspace integrations */}
            {selectedPlatform.useOAuth && (
              <div className="space-y-4">
                <Alert className="border-primary/50 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-sm">חיבור Google OAuth</AlertTitle>
                  <AlertDescription className="text-xs">
                    אינטגרציה זו דורשת אימות עם חשבון Google שלך. לחץ על הכפתור למטה להתחברות.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast.info("אימות Google OAuth יופעל בקרוב", {
                        description: "אנו עובדים על השלמת האינטגרציה. בינתיים, ניתן לייבא נתונים ידנית."
                      });
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    התחבר עם Google
                  </Button>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">או הזן מזהה/קישור ידנית (אופציונלי):</Label>
                    <Input
                      value={credential}
                      onChange={(e) => {
                        setCredential(e.target.value);
                        setCurrentStep(e.target.value ? 1 : 0);
                        setConnectionStatus("idle");
                        setValidationError("");
                      }}
                      placeholder={selectedPlatform.placeholder}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Manual Input for other platforms (not MCC, API credentials, GA, Facebook, or OAuth) */}
            {!selectedPlatform.useMccSelection && !selectedPlatform.useApiCredentials && !selectedPlatform.useGACredentials && !selectedPlatform.useFacebookCredentials && !selectedPlatform.useOAuth && (
              <div className="space-y-2">
                <Label>הזן את המזהה:</Label>
                <Input
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    setCurrentStep(1);
                    setConnectionStatus("idle");
                  }}
                  placeholder={selectedPlatform.placeholder}
                  dir="ltr"
                  className="text-left"
                />
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Features */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">לאחר החיבור תקבל גישה ל:</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlatform.features.map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>

            {/* Status */}
            {connectionStatus !== "idle" && (
              <Alert variant={connectionStatus === "success" ? "default" : connectionStatus === "error" ? "destructive" : "default"}>
                {connectionStatus === "testing" && <Loader2 className="h-4 w-4 animate-spin" />}
                {connectionStatus === "success" && <CheckCircle2 className="h-4 w-4 text-success" />}
                {connectionStatus === "error" && <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>
                  {connectionStatus === "testing" && "מתחבר..."}
                  {connectionStatus === "success" && "החיבור הצליח!"}
                  {connectionStatus === "error" && "החיבור נכשל"}
                </AlertTitle>
                <AlertDescription>
                  {connectionMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedPlatform(null)} className="flex-1">
                חזור
              </Button>
              <Button onClick={handleConnect} disabled={!canConnect || connectionStatus === "testing"} className="flex-1 glow">
                {connectionStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    התחבר
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Help link */}
            <a href={selectedPlatform.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline justify-center">
              <ExternalLink className="w-3 h-3" />
              מדריך מפורט ל-{selectedPlatform.name}
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
