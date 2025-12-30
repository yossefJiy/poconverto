import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/home/LeadForm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/home/AnimatedSection";
import { 
  Target, 
  ShoppingCart, 
  BarChart3, 
  ArrowLeft, 
  Sparkles,
  Clock,
  DollarSign,
  Zap,
  CheckCircle2,
  ChevronDown
} from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <span className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
              Converto
            </span>
            <span className="block text-muted-foreground text-lg mt-2">by JIY</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in [animation-delay:200ms]">
            <span className="text-foreground">הפסיקו לבזבז.</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              התחילו להמיר.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in [animation-delay:400ms]">
            דפי נחיתה שמייצרים לידים. חנויות שמוכרות. דשבורד שחושב בשבילכם.
            <br />
            <span className="text-primary">חוסכים זמן. חוסכים כסף. מונעים תסכול.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in [animation-delay:600ms]">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25">
              <Link to="/auth">
                התחילו בחינם
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-border/50 hover:bg-muted/50">
              <a href="#products">
                ראו איך זה עובד
                <ChevronDown className="mr-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground animate-fade-in [animation-delay:800ms]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>ללא התחייבות</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>הקמה מהירה</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>תמיכה מלאה</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              שלושה פתרונות.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                מטרה אחת.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              להמיר יותר תנועה ללקוחות, ולקוחות לכסף.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Landing Pages */}
            <Card className="group relative p-8 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">דפי נחיתה ממירים</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  תנועה הופכת ללידים. דפי נחיתה מעוצבים ומותאמים לקהל שלכם, עם אופטימיזציה להמרות מקסימליות.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    עיצוב מותאם אישית
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    A/B Testing מובנה
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    אינטגרציה עם CRM
                  </li>
                </ul>
                <Button variant="ghost" className="group-hover:text-primary">
                  למידע נוסף
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

            {/* E-Commerce */}
            <Card className="group relative p-8 bg-card/50 backdrop-blur border-border/50 hover:border-accent/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-6 shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">חנויות שמוכרות</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  פשטות + פונקציונליות. חנויות איקומרס שנבנות מהר, עובדות חלק, ומוכרות יותר.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    ממשק ניהול פשוט
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    אינטגרציות תשלום
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    מלאי וניהול הזמנות
                  </li>
                </ul>
                <Button variant="ghost" className="group-hover:text-accent">
                  למידע נוסף
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

            {/* Smart Dashboard */}
            <Card className="group relative p-8 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">דשבורד חכם</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  נתונים הופכים לפעולות. כל הפלטפורמות במקום אחד, עם תובנות AI שחוסכות שעות עבודה.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Google Analytics + Ads
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Shopify & WooCommerce
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    המלצות AI בזמן אמת
                  </li>
                </ul>
                <Button asChild variant="ghost" className="group-hover:text-primary">
                  <Link to="/auth">
                    גשו לדשבורד
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              למה{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Converto?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              כי אתם צריכים לעבוד על העסק, לא על הכלים
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">חיסכון בזמן</h3>
              <p className="text-muted-foreground">
                אוטומציות חכמות שעושות את העבודה בשבילכם
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">חיסכון בכסף</h3>
              <p className="text-muted-foreground">
                פתרון אחד במקום עשרה כלים יקרים
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">מניעת תסכול</h3>
              <p className="text-muted-foreground">
                ממשק פשוט ותמיכה צמודה בעברית
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            מוכנים להפסיק לבזבז?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            הצטרפו לעסקים שכבר המירו יותר עם Converto
          </p>
          <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25">
            <Link to="/auth">
              התחילו עכשיו - בחינם
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Converto
              </span>
              <span className="text-muted-foreground">by JIY</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                מדיניות פרטיות
              </Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
                תנאי שימוש
              </Link>
              <a href="mailto:hello@jiy.co.il" className="hover:text-foreground transition-colors">
                צור קשר
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} JIY. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
