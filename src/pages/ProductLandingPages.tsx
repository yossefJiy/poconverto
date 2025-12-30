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
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "עיצוב מותאם אישית",
    description: "עיצוב ייחודי שמתאים למותג שלכם ולקהל היעד",
  },
  {
    icon: Smartphone,
    title: "מותאם למובייל",
    description: "כל דף נחיתה מגיב לכל מכשיר - מנייד ועד דסקטופ",
  },
  {
    icon: Zap,
    title: "זמני טעינה מהירים",
    description: "אופטימיזציה לביצועים מרביים ו-Core Web Vitals",
  },
  {
    icon: BarChart3,
    title: "A/B Testing מובנה",
    description: "בדקו גרסאות שונות וגלו מה עובד הכי טוב",
  },
  {
    icon: Globe,
    title: "SEO מובנה",
    description: "אופטימיזציה למנועי חיפוש מהיום הראשון",
  },
  {
    icon: Users,
    title: "אינטגרציה עם CRM",
    description: "חיבור ישיר למערכות ה-CRM שלכם",
  },
];

const stats = [
  { value: "300%", label: "שיפור בהמרות בממוצע" },
  { value: "2.5 שניות", label: "זמן טעינה ממוצע" },
  { value: "500+", label: "דפי נחיתה נבנו" },
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              דפי נחיתה{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ממירים
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              תנועה הופכת ללידים. דפי נחיתה מעוצבים ומותאמים לקהל שלכם, עם אופטימיזציה להמרות מקסימליות.
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
                  {user ? "לדשבורד" : "התחברו לדשבורד"}
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-muted/20">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-3 gap-6 text-center">
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

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              למה דפי הנחיתה שלנו{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                עובדים?
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              שילוב של עיצוב, טכנולוגיה ואסטרטגיה שמביא תוצאות
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
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

      {/* Process */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">איך זה עובד?</h2>
          </AnimatedSection>

          <StaggerContainer className="max-w-2xl mx-auto space-y-6">
            {[
              { step: 1, title: "שיחת אפיון", desc: "נבין את העסק, הקהל והמטרות שלכם" },
              { step: 2, title: "עיצוב ופיתוח", desc: "ניצור דף נחיתה מותאם אישית" },
              { step: 3, title: "בדיקות ואופטימיזציה", desc: "נוודא שהכל עובד ומביא תוצאות" },
              { step: 4, title: "השקה ומעקב", desc: "נעלה לאוויר ונמשיך לשפר" },
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
