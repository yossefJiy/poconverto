import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LeadForm } from "@/components/home/LeadForm";
import { useAuth } from "@/hooks/useAuth";
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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const Home = () => {
  const { user } = useAuth();
  const authHref = user ? "/dashboard" : "/auth";

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">הפסיקו לבזבז.</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              התחילו להמיר.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            דפי נחיתה שמייצרים לידים. חנויות שמוכרות. דשבורד שחושב בשבילכם.
            <br />
            <span className="text-primary font-medium">חוסכים זמן. חוסכים כסף. מונעים תסכול.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              <Link to={authHref}>
                {user ? "לדשבורד" : "התחילו בחינם"}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-border/50 hover:bg-muted/50">
              <a href="#products">
                ראו איך זה עובד
                <ChevronDown className="mr-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>ללא התחייבות</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>הקמה מהירה</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>תמיכה מלאה</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
        </motion.div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              שלושה פתרונות.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                מטרה אחת.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              להמיר יותר תנועה ללקוחות, ולקוחות לכסף.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {/* Landing Pages */}
            <motion.div variants={fadeInUp}>
              <Card className="group h-full p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">דפי נחיתה ממירים</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  תנועה הופכת ללידים. דפי נחיתה מעוצבים ומותאמים לקהל שלכם.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-5">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    עיצוב מותאם אישית
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    A/B Testing מובנה
                  </li>
                </ul>
                <Button asChild variant="ghost" size="sm" className="group-hover:text-primary">
                  <Link to="/products/landing-pages">
                    למידע נוסף
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </Card>
            </motion.div>

            {/* E-Commerce */}
            <motion.div variants={fadeInUp}>
              <Card className="group h-full p-6 bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-5 shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">חנויות שמוכרות</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  פשטות + פונקציונליות. חנויות שנבנות מהר ומוכרות יותר.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-5">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    ממשק ניהול פשוט
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    אינטגרציות תשלום
                  </li>
                </ul>
                <Button asChild variant="ghost" size="sm" className="group-hover:text-accent">
                  <Link to="/products/ecommerce">
                    למידע נוסף
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </Card>
            </motion.div>

            {/* Smart Dashboard */}
            <motion.div variants={fadeInUp}>
              <Card className="group h-full p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">דשבורד חכם</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  נתונים הופכים לפעולות. כל הפלטפורמות במקום אחד.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-5">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Google Analytics + Ads
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    המלצות AI בזמן אמת
                  </li>
                </ul>
                <Button asChild variant="ghost" size="sm" className="group-hover:text-primary">
                  <Link to="/products/dashboard">
                    למידע נוסף
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              למה{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Converto?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              כי אתם צריכים לעבוד על העסק, לא על הכלים
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">חיסכון בזמן</h3>
              <p className="text-sm text-muted-foreground">
                אוטומציות חכמות שעושות את העבודה בשבילכם
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">חיסכון בכסף</h3>
              <p className="text-sm text-muted-foreground">
                פתרון אחד במקום עשרה כלים יקרים
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">מניעת תסכול</h3>
              <p className="text-sm text-muted-foreground">
                ממשק פשוט ותמיכה צמודה בעברית
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                בואו נדבר
              </h2>
              <p className="text-lg text-muted-foreground">
                השאירו פרטים ונחזור אליכם תוך 24 שעות
              </p>
            </div>
            <Card className="p-6 md:p-8 bg-card/80 backdrop-blur border-border/50">
              <LeadForm source="home_contact" />
            </Card>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
