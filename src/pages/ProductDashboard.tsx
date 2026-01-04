import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  ArrowLeft,
  Brain,
  Layers,
  RefreshCw,
  Bell,
  FileText,
  Zap,
  TrendingUp,
  Bot,
  Target,
  Send,
  Users,
  Calendar,
  Shield,
  Globe,
  Sparkles,
  Play,
  PauseCircle,
  Settings,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Send,
    title: "פרסום פרוגרמטי",
    description: "יצירה והפעלת קמפיינים ישירות לטיקטוק, מטא וגוגל ממקום אחד",
  },
  {
    icon: Bot,
    title: "AI Agents",
    description: "סוכנים חכמים שמנהלים קמפיינים, מבצעים אופטימיזציה ומזהים הזדמנויות 24/7",
  },
  {
    icon: Layers,
    title: "אנליטיקס מאוחד",
    description: "Google Analytics, Ads, Meta, TikTok, Shopify, WooCommerce - הכל בתצוגה אחת",
  },
  {
    icon: Brain,
    title: "תובנות AI",
    description: "המלצות אוטומטיות לשיפור ביצועים מבוססות בינה מלאכותית",
  },
  {
    icon: FileText,
    title: "דוחות אוטומטיים",
    description: "דוחות PDF מעוצבים עם תובנות AI נשלחים ישירות למייל",
  },
  {
    icon: Calendar,
    title: "ניהול משימות",
    description: "Kanban board לצוותי שיווק עם AI שמקצה משימות אוטומטית",
  },
  {
    icon: Bell,
    title: "התראות חכמות",
    description: "זיהוי אנומליות ובעיות בקמפיינים בזמן אמת עם התראות מיידיות",
  },
  {
    icon: Users,
    title: "ניהול לקוחות",
    description: "CRM מובנה לסוכנויות שיווק עם ניהול צוותים והרשאות",
  },
  {
    icon: TrendingUp,
    title: "מעקב ROI",
    description: "ראו בדיוק כמה כל שקל מחזיר עם ייחוס הכנסות מדויק",
  },
];

const integrations = [
  { name: "Google Analytics", color: "bg-orange-500" },
  { name: "Google Ads", color: "bg-blue-500" },
  { name: "Meta Ads", color: "bg-[#1877F2]" },
  { name: "TikTok Ads", color: "bg-pink-500" },
  { name: "Shopify", color: "bg-green-500" },
  { name: "WooCommerce", color: "bg-purple-500" },
];

const stats = [
  { value: "300%", label: "שיפור בהמרות בממוצע" },
  { value: "15 שעות", label: "חיסכון בשבוע" },
  { value: "24/7", label: "AI שעובד בשבילכם" },
  { value: "10+", label: "פלטפורמות מחוברות" },
];

const capabilities = [
  {
    category: "ניהול קמפיינים",
    icon: Target,
    items: [
      "יצירת קמפיינים חדשים ישירות מהמערכת",
      "עריכה והשהיית קמפיינים קיימים",
      "שכפול קמפיינים מצליחים",
      "תזמון קמפיינים מראש",
      "ניהול תקציבים מרכזי",
    ],
  },
  {
    category: "AI & אוטומציה",
    icon: Bot,
    items: [
      "סוכני AI שמנתחים ביצועים 24/7",
      "אופטימיזציה אוטומטית של תקציבים",
      "זיהוי הזדמנויות וחריגות",
      "המלצות לפעולה בזמן אמת",
      "ניתוח מתחרים אוטומטי",
    ],
  },
  {
    category: "דוחות ואנליטיקס",
    icon: BarChart3,
    items: [
      "דוחות PDF אוטומטיים למייל",
      "דשבורד מותאם לכל לקוח",
      "השוואת ביצועים לאורך זמן",
      "מעקב ROI ו-ROAS מדויק",
      "ייצוא נתונים לאקסל",
    ],
  },
];

export default function ProductDashboard() {
  const { user } = useAuth();
  const authHref = user ? "/dashboard" : "/auth";

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span>הרבה יותר מדשבורד</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              מערכת ניהול שיווק{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                אינטגרטיבית
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              מערכת All-in-One שמנהלת את כל השיווק הדיגיטלי שלכם: פרסום פרוגרמטי לכל הפלטפורמות, AI Agents שעובדים 24/7, אנליטיקס מאוחד, ודוחות אוטומטיים.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Link to={authHref}>
                  {user ? "לדשבורד שלי" : "התחילו בחינם"}
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#contact">
                  קבלו הדגמה
                </a>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-6">
            <p className="text-sm text-muted-foreground">פרסום וניתוח נתונים מכל הפלטפורמות במקום אחד</p>
          </AnimatedSection>
          
          <StaggerContainer className="flex flex-wrap justify-center gap-3">
            {integrations.map((integration, index) => (
              <StaggerItem key={index}>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50">
                  <div className={`w-3 h-3 rounded-full ${integration.color}`} />
                  <span className="text-sm font-medium">{integration.name}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Main Capabilities */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              יכולות{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                המערכת
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              לא רק צפייה בנתונים - מערכת מלאה לניהול ופרסום
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {capabilities.map((cap, index) => (
              <StaggerItem key={index}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <cap.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-4">{cap.category}</h3>
                  <ul className="space-y-2">
                    {cap.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              כל מה שצריך{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                במקום אחד
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              פיצ'רים מתקדמים שחוסכים לכם שעות עבודה כל יום
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <Card className="p-5 h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">איך מתחילים?</h2>
          </AnimatedSection>

          <StaggerContainer className="max-w-2xl mx-auto space-y-6">
            {[
              { step: 1, icon: Zap, title: "התחברו", desc: "היכנסו לדשבורד עם Google או מייל" },
              { step: 2, icon: Layers, title: "חברו פלטפורמות", desc: "חברו את Google, Meta, TikTok, Shopify ועוד" },
              { step: 3, icon: Bot, title: "AI לומד את העסק", desc: "הסוכנים לומדים את הנתונים ומתחילים לעבוד" },
              { step: 4, icon: Send, title: "פרסמו ישירות", desc: "צרו והפעילו קמפיינים ישירות מהמערכת" },
              { step: 5, icon: Brain, title: "קבלו תובנות", desc: "AI מנתח, ממליץ ומבצע אופטימיזציה אוטומטית" },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-0.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold mb-5">
              מוכנים לשדרג את השיווק?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              הפסיקו לבזבז זמן על כלים שונים. התחילו לנהל הכל ממקום אחד עם AI שעובד בשבילכם.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Link to={authHref}>
                  {user ? "לדשבורד שלי" : "התחילו עכשיו - בחינם"}
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#contact">
                  תיאום הדגמה
                </a>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                רוצים לראות הדגמה?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם עם הצעה מותאמת
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                <LeadForm source="dashboard" />
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
