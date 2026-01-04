import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
import { useAuth } from "@/hooks/useAuth";
import {
  Target,
  ArrowLeft,
  Zap,
  BarChart3,
  Palette,
  Smartphone,
  Globe,
  Users,
  Sparkles,
  Bot,
  TrendingUp,
  MousePointer2,
  Layers,
  CheckCircle2,
  MessageSquare,
  Share2,
  Timer,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "עיצוב מותאם אישית",
    description: "עיצוב ייחודי שמותאם למותג ולקהל היעד שלכם",
  },
  {
    icon: MousePointer2,
    title: "אופטימיזציה להמרות",
    description: "מבנה, צבעים ו-CTA שמביאים תוצאות מוכחות",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "70% מהתנועה מנייד - כל דף מושלם במובייל",
  },
  {
    icon: Zap,
    title: "ביצועים מהירים",
    description: "Core Web Vitals מושלמים, טעינה מהירה",
  },
  {
    icon: BarChart3,
    title: "A/B Testing מובנה",
    description: "בדיקות אוטומטיות לגילוי מה עובד הכי טוב",
  },
  {
    icon: Globe,
    title: "SEO מתקדם",
    description: "אופטימיזציה למנועי חיפוש מהיום הראשון",
  },
  {
    icon: Users,
    title: "אינטגרציה לCRM",
    description: "חיבור ישיר למערכות הCRM שלכם",
  },
  {
    icon: Bot,
    title: "תובנות AI",
    description: "ניתוח התנהגות גולשים והמלצות לשיפור",
  },
  {
    icon: Share2,
    title: "חיבור לפרסום",
    description: "Pixel מובנה למטא, גוגל וטיקטוק",
  },
];

const stats = [
  { value: "300%", label: "שיפור בהמרות בממוצע" },
  { value: "2.5 שניות", label: "זמן טעינה ממוצע" },
  { value: "500+", label: "דפי נחיתה נבנו" },
  { value: "15%+", label: "שיעור המרה ממוצע" },
];

const useCases = [
  {
    title: "השקת מוצר",
    description: "דף נחיתה ממוקד שמייצר buzz ומכירות",
    icon: Sparkles,
  },
  {
    title: "קמפיינים ממומנים",
    description: "דפים ממירים לתנועה מפייסבוק, גוגל וטיקטוק",
    icon: Target,
  },
  {
    title: "איסוף לידים",
    description: "טפסים חכמים שממירים מבקרים ללידים חמים",
    icon: Users,
  },
  {
    title: "וובינרים ואירועים",
    description: "דפי הרשמה עם countdown וFOMO",
    icon: Timer,
  },
];

export default function ProductLandingPages() {
  const { user } = useAuth();
  const authHref = user ? "/dashboard" : "/auth";
  
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
              <TrendingUp className="h-4 w-4" />
              <span>300% שיפור בהמרות</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              דפי נחיתה{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                שממירים
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              דפי נחיתה מעוצבים ומותאמים לקהל שלכם, עם אופטימיזציה להמרות מקסימליות, A/B Testing מובנה, וחיבור ישיר למערכות הפרסום.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <a href="#contact">
                  בואו נדבר
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={authHref}>
                  {user ? "לדשבורד" : "ראו דוגמאות"}
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-muted/20">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              מתי צריך{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                דף נחיתה?
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              כל קמפיין צריך דף ממיר שמותאם למטרה
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {useCases.map((useCase, index) => (
              <StaggerItem key={index}>
                <Card className="p-5 h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all text-center group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <useCase.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground text-sm">{useCase.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              למה הדפים שלנו{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                עובדים?
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              שילוב של עיצוב, טכנולוגיה ואסטרטגיה שמביא תוצאות
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

      {/* What's Included */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            <AnimatedSection direction="right">
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                מה כלול{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  בכל דף?
                </span>
              </h2>
              <div className="space-y-3">
                {[
                  "עיצוב מותאם אישית למותג שלכם",
                  "פיתוח מגיב (Responsive) מושלם",
                  "אופטימיזציה למהירות ו-Core Web Vitals",
                  "SEO בסיסי ותגיות מטא",
                  "התקנת Pixels (מטא, גוגל, טיקטוק)",
                  "אינטגרציה עם הCRM שלכם",
                  "A/B Testing מובנה",
                  "דוחות ביצועים שבועיים",
                  "תמיכה ותחזוקה שוטפת",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection direction="left">
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">15%+</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    שיעור המרה ממוצע בדפי הנחיתה שלנו (הממוצע בשוק: 2-3%)
                  </p>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent">
                    <a href="#contact">
                      קבלו הצעת מחיר
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">איך זה עובד?</h2>
          </AnimatedSection>

          <StaggerContainer className="max-w-2xl mx-auto space-y-6">
            {[
              { step: 1, title: "שיחת אפיון", desc: "נבין את העסק, הקהל, המטרות והקמפיין" },
              { step: 2, title: "מחקר מתחרים", desc: "ננתח מה עובד בתחום שלכם" },
              { step: 3, title: "עיצוב", desc: "ניצור עיצוב מותאם עם דגש על המרות" },
              { step: 4, title: "פיתוח", desc: "נבנה את הדף עם כל הפיקסלים והאינטגרציות" },
              { step: 5, title: "השקה ואופטימיזציה", desc: "נעלה לאוויר ונמשיך לשפר עם A/B Testing" },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm">
                    {item.step}
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

      {/* Contact Form */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                רוצים דף נחיתה שממיר?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם עם הצעה מותאמת
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                <LeadForm source="landing-pages" />
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
