import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
import {
  Target,
  ArrowLeft,
  CheckCircle2,
  Zap,
  BarChart3,
  Palette,
  Smartphone,
  Globe,
  TrendingUp,
  Users,
  Clock,
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
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              חזרה לעמוד הבית
            </Link>
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/25">
              <Target className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              דפי נחיתה{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ממירים
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              תנועה הופכת ללידים. דפי נחיתה מעוצבים ומותאמים לקהל שלכם, עם אופטימיזציה להמרות מקסימליות.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <a href="#contact">
                  בואו נדבר
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/auth">
                  התחברו לדשבורד
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              למה דפי הנחיתה שלנו{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                עובדים?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              שילוב של עיצוב, טכנולוגיה ואסטרטגיה שמביא תוצאות
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">איך זה עובד?</h2>
          </AnimatedSection>

          <StaggerContainer className="max-w-3xl mx-auto space-y-8">
            {[
              { step: 1, title: "שיחת אפיון", desc: "נבין את העסק, הקהל והמטרות שלכם" },
              { step: 2, title: "עיצוב ופיתוח", desc: "ניצור דף נחיתה מותאם אישית" },
              { step: 3, title: "בדיקות ואופטימיזציה", desc: "נוודא שהכל עובד ומביא תוצאות" },
              { step: 4, title: "השקה ומעקב", desc: "נעלה לאוויר ונמשיך לשפר" },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                רוצים דף נחיתה שממיר?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם עם הצעה מותאמת
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <LeadForm source="landing-pages" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Converto
            </span>
            <span className="text-muted-foreground">by JIY</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            © {new Date().getFullYear()} JIY. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}
