import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
import { useAuth } from "@/hooks/useAuth";
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
  MessageSquare,
  Bot,
  Target,
  TrendingUp,
  RefreshCw,
  Globe,
  Sparkles,
  CheckCircle2,
  Search,
  Share2,
  ShoppingBag,
} from "lucide-react";

const features = [
  {
    icon: ShoppingBag,
    title: "Shopify & WooCommerce",
    description: "אינטגרציה מלאה עם הפלטפורמות המובילות",
  },
  {
    icon: Target,
    title: "סנכרון לקטלוגי פרסום",
    description: "המוצרים מסונכרנים אוטומטית למטא, גוגל וטיקטוק",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Agents",
    description: "בוטים חכמים שמטפלים בהזמנות, שאלות ומעקב משלוחים",
  },
  {
    icon: CreditCard,
    title: "קופה חכמה",
    description: "Checkout ממיר עם upsells, cross-sells ו-one-click purchase",
  },
  {
    icon: Package,
    title: "ניהול מלאי חכם",
    description: "התראות אוטומטיות וסנכרון מלאי בזמן אמת",
  },
  {
    icon: BarChart3,
    title: "אנליטיקס מכירות",
    description: "ROI, ROAS ומעקב המרות מדויק לכל מוצר וקמפיין",
  },
  {
    icon: Search,
    title: "SEO מתקדם",
    description: "אופטימיזציה למנועי חיפוש עם סכמות מובנות",
  },
  {
    icon: Zap,
    title: "A/B Testing אוטומטי",
    description: "בדיקות מתמידות לשיפור המרות ללא התערבות",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "חוויה מושלמת בנייד - 70% מהרכישות מגיעות משם",
  },
];

const stats = [
  { value: "₪50M+", label: "מכירות דרך החנויות שלנו" },
  { value: "300%", label: "שיפור בהמרות בממוצע" },
  { value: "3 ימים", label: "זמן הקמה ממוצע" },
  { value: "99.9%", label: "זמינות מערכת" },
];

const capabilities = [
  {
    category: "חיבור למערכות פרסום",
    icon: Target,
    items: [
      "סנכרון קטלוג מוצרים למטא",
      "סנכרון ל-Google Merchant Center",
      "קטלוג TikTok Shop",
      "Dynamic Product Ads אוטומטיים",
      "רימרקטינג חכם",
    ],
  },
  {
    category: "אוטומציות וAI",
    icon: Bot,
    items: [
      "WhatsApp bot לטיפול בהזמנות",
      "מענה אוטומטי לשאלות נפוצות",
      "מעקב משלוחים אוטומטי",
      "התראות על עגלות נטושות",
      "המלצות מוצרים חכמות",
    ],
  },
  {
    category: "קופה וממשק",
    icon: CreditCard,
    items: [
      "Checkout בעמוד אחד",
      "Upsells ו-Cross-sells חכמים",
      "Apple Pay ו-Google Pay",
      "תשלומים בתשלומים",
      "קופונים וקודי הנחה",
    ],
  },
];

export default function ProductEcommerce() {
  const { user } = useAuth();
  const authHref = user ? "/dashboard" : "/auth";

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent mb-6">
              <Sparkles className="h-4 w-4" />
              <span>חנויות שמוכרות יותר</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/20">
              <ShoppingCart className="h-8 w-8 text-accent-foreground" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              אתרי איקומרס{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                חכמים
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              לא סתם חנות - אתר עם פונקציונליות גבוהה שמחובר למערכות הפרסום, עם קופה חכמה ואייג'נטים בוואטסאפ שמטפלים בהזמנות בשבילכם.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-accent to-primary hover:opacity-90">
                <a href="#contact">
                  פתחו חנות חכמה
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={authHref}>
                  {user ? "לדשבורד" : "ראו הדגמה"}
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
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              מה הופך חנות ל{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                חכמה?
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              אינטגרציות שעובדות, אוטומציות שמוכרות
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {capabilities.map((cap, index) => (
              <StaggerItem key={index}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <cap.icon className="h-6 w-6 text-accent" />
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
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              כל מה שצריך לחנות{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                טופ
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              פיצ'רים שמביאים תוצאות
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            <AnimatedSection direction="right">
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                למה לבנות חנות{" "}
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  איתנו?
                </span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Zap, text: "הקמה תוך 3 ימים - תהיו באוויר מהר" },
                  { icon: Target, text: "סנכרון אוטומטי לקטלוגי פרסום" },
                  { icon: MessageSquare, text: "WhatsApp bot שמטפל בלקוחות 24/7" },
                  { icon: CreditCard, text: "קופה חכמה עם upsells שמגדילים סל" },
                  { icon: BarChart3, text: "אנליטיקס מלא עם מעקב ROI" },
                  { icon: Shield, text: "אבטחה ברמה הגבוהה ביותר" },
                  { icon: Globe, text: "תמיכה מלאה בעברית ו-RTL" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection direction="left">
              <Card className="p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">300%</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    שיפור בהמרות בממוצע אצל הלקוחות שלנו
                  </p>
                  <Button asChild className="w-full bg-gradient-to-r from-accent to-primary">
                    <a href="#contact">
                      בואו נדבר
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
            <h2 className="text-2xl md:text-3xl font-bold mb-3">איך מתחילים?</h2>
          </AnimatedSection>

          <StaggerContainer className="max-w-2xl mx-auto space-y-6">
            {[
              { step: 1, title: "שיחת אפיון", desc: "נבין את העסק, המוצרים והמטרות שלכם" },
              { step: 2, title: "עיצוב ופיתוח", desc: "נבנה חנות מותאמת עם כל הפיצ'רים" },
              { step: 3, title: "חיבור פרסום", desc: "נסנכרן את הקטלוג למטא, גוגל וטיקטוק" },
              { step: 4, title: "הגדרת אוטומציות", desc: "נפעיל את הבוטים והתראות" },
              { step: 5, title: "השקה ומעקב", desc: "נעלה לאוויר ונמשיך לשפר ביצועים" },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
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
                רוצים חנות שמוכרת יותר?
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
