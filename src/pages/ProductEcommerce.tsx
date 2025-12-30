import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Package,
  Truck,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "אינטגרציות תשלום",
    description: "חיבור לכל שערי התשלום הפופולריים בישראל",
  },
  {
    icon: Package,
    title: "ניהול מלאי",
    description: "מערכת מלאי חכמה עם התראות אוטומטיות",
  },
  {
    icon: Truck,
    title: "משלוחים",
    description: "אינטגרציה עם חברות משלוחים מובילות",
  },
  {
    icon: BarChart3,
    title: "אנליטיקס מובנה",
    description: "דוחות מכירות ותובנות בזמן אמת",
  },
  {
    icon: Shield,
    title: "אבטחה מלאה",
    description: "SSL, PCI DSS ואבטחה ברמה הגבוהה ביותר",
  },
  {
    icon: Smartphone,
    title: "חוויה מותאמת למובייל",
    description: "70% מהרכישות מגיעות מנייד - אנחנו מוכנים",
  },
];

const stats = [
  { value: "₪50M+", label: "מכירות דרך החנויות שלנו" },
  { value: "99.9%", label: "זמינות מערכת" },
  { value: "3 ימים", label: "זמן הקמה ממוצע" },
];

export default function ProductEcommerce() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              חזרה לעמוד הבית
            </Link>
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-8 shadow-lg shadow-accent/25">
              <ShoppingCart className="h-10 w-10 text-accent-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              חנויות{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                שמוכרות
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              פשטות + פונקציונליות. חנויות איקומרס שנבנות מהר, עובדות חלק, ומוכרות יותר.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-accent to-primary hover:opacity-90">
                <a href="#contact">
                  פתחו חנות
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
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
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
              כל מה שצריך לחנות{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                מצליחה
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              מערכת מלאה לניהול חנות אונליין ללא כאב ראש
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur border-border/50 hover:border-accent/50 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <AnimatedSection direction="right">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                למה לבנות איתנו?
              </h2>
              <div className="space-y-4">
                {[
                  "הקמה מהירה - תהיו באוויר תוך ימים",
                  "ממשק ניהול פשוט שכל אחד יכול להשתמש בו",
                  "תמיכה בעברית וב-RTL מלא",
                  "אינטגרציה עם כל הכלים שכבר משתמשים בהם",
                  "עלויות שקופות ללא הפתעות",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-3 w-3 text-accent" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection direction="left">
              <Card className="p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
                <h3 className="text-2xl font-bold mb-4">מוכנים להתחיל?</h3>
                <p className="text-muted-foreground mb-6">
                  השאירו פרטים ונחזור אליכם עם הצעה מותאמת לעסק שלכם
                </p>
                <Button asChild className="w-full bg-gradient-to-r from-accent to-primary">
                  <a href="#contact">
                    בואו נדבר
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                רוצים לפתוח חנות?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם עם הצעה מותאמת
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <LeadForm source="ecommerce" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
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
