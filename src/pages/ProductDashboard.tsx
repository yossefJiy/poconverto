import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
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
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "כל הפלטפורמות במקום אחד",
    description: "Google Analytics, Ads, Shopify, Facebook - הכל בתצוגה אחת",
  },
  {
    icon: Brain,
    title: "תובנות AI",
    description: "המלצות אוטומטיות לשיפור ביצועים מבוססות בינה מלאכותית",
  },
  {
    icon: RefreshCw,
    title: "סנכרון בזמן אמת",
    description: "הנתונים מתעדכנים אוטומטית מכל המקורות",
  },
  {
    icon: Bell,
    title: "התראות חכמות",
    description: "קבלו התראות כשמשהו דורש תשומת לב",
  },
  {
    icon: FileText,
    title: "דוחות אוטומטיים",
    description: "דוחות מותאמים אישית נשלחים ישירות למייל",
  },
  {
    icon: TrendingUp,
    title: "מעקב ROI",
    description: "ראו בדיוק כמה כל שקל מחזיר",
  },
];

const integrations = [
  { name: "Google Analytics", color: "bg-orange-500" },
  { name: "Google Ads", color: "bg-blue-500" },
  { name: "Facebook Ads", color: "bg-[#1877F2]" },
  { name: "Shopify", color: "bg-green-500" },
  { name: "WooCommerce", color: "bg-purple-500" },
];

const stats = [
  { value: "80%", label: "חיסכון בזמן הכנת דוחות" },
  { value: "24/7", label: "מעקב אוטומטי" },
  { value: "10+", label: "אינטגרציות זמינות" },
];

export default function ProductDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              חזרה לעמוד הבית
            </Link>
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/25">
              <BarChart3 className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              דשבורד{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                חכם
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              נתונים הופכים לפעולות. כל הפלטפורמות במקום אחד, עם תובנות AI שחוסכות שעות עבודה.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Link to="/auth">
                  גשו לדשבורד
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <a href="#contact">
                  השאירו פרטים
                </a>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-8">
            <p className="text-muted-foreground">מתחבר לכל הפלטפורמות שאתם כבר משתמשים בהן</p>
          </AnimatedSection>
          
          <StaggerContainer className="flex flex-wrap justify-center gap-4">
            {integrations.map((integration, index) => (
              <StaggerItem key={index}>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50">
                  <div className={`w-3 h-3 rounded-full ${integration.color}`} />
                  <span className="text-sm">{integration.name}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              יכולות{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                הדשבורד
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              כל מה שצריך כדי לקבל החלטות חכמות מבוססות נתונים
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

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">איך מתחילים?</h2>
          </AnimatedSection>

          <StaggerContainer className="max-w-3xl mx-auto space-y-8">
            {[
              { step: 1, icon: Zap, title: "התחברו", desc: "היכנסו לדשבורד עם חשבון Google או מייל" },
              { step: 2, icon: Layers, title: "חברו פלטפורמות", desc: "חברו את Google Analytics, Ads, Shopify ועוד" },
              { step: 3, icon: BarChart3, title: "ראו הכל במקום אחד", desc: "כל הנתונים מסונכרנים וזמינים בתצוגה אחידה" },
              { step: 4, icon: Brain, title: "קבלו תובנות", desc: "AI מנתח את הנתונים ומציע שיפורים" },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-primary-foreground" />
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

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              מוכנים לראות את הנתונים שלכם בצורה אחרת?
            </h2>
            <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
              <Link to="/auth">
                התחילו עכשיו - בחינם
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                יש לכם שאלות?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <LeadForm source="dashboard" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
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
