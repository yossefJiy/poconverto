import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
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
  Smartphone,
  Zap,
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
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/20">
              <ShoppingCart className="h-8 w-8 text-accent-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              חנויות{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                שמוכרות
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              פשטות + פונקציונליות. חנויות איקומרס שנבנות מהר, עובדות חלק, ומוכרות יותר.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-accent to-primary hover:opacity-90">
                <a href="#contact">
                  פתחו חנות
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">
                  התחברו לדשבורד
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
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
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
              כל מה שצריך לחנות{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                מצליחה
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              מערכת מלאה לניהול חנות אונליין ללא כאב ראש
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <Card className="p-5 h-full bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
            <AnimatedSection direction="right">
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                למה לבנות איתנו?
              </h2>
              <div className="space-y-3">
                {[
                  "הקמה מהירה - תהיו באוויר תוך ימים",
                  "ממשק ניהול פשוט שכל אחד יכול להשתמש בו",
                  "תמיכה בעברית וב-RTL מלא",
                  "אינטגרציה עם כל הכלים שכבר משתמשים בהם",
                  "עלויות שקופות ללא הפתעות",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-3 w-3 text-accent" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection direction="left">
              <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
                <h3 className="text-xl font-bold mb-3">מוכנים להתחיל?</h3>
                <p className="text-muted-foreground text-sm mb-5">
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
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <AnimatedSection className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                רוצים לפתוח חנות?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם עם הצעה מותאמת
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                <LeadForm source="ecommerce" />
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
