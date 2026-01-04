import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LeadForm } from "@/components/home/LeadForm";
import { WelcomeGateCTA } from "@/components/home/WelcomeGateCTA";
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
  ChevronDown,
  Bot,
  TrendingUp,
  Shield,
  Rocket,
  MessageSquare,
  Brain,
  Globe
} from "lucide-react";

const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

const staggerContainer: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
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
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6"
          >
            <Bot className="h-4 w-4" />
            <span>AI שמנהל את השיווק שלכם 24/7</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1 }} 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">הפסיקו לנהל.</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              תתחילו להמיר.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }} 
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
          >
            מערכת All-in-One לשיווק דיגיטלי שמחליפה 10 כלים.
            <br />
            <span className="text-primary font-medium">
              פרסום פרוגרמטי · AI Agents · אנליטיקס מאוחד · חנויות חכמות
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.3 }} 
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
                גלו את היכולות
                <ChevronDown className="mr-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.5 }} 
            className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>ללא התחייבות</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>הקמה תוך 24 שעות</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>תמיכה בעברית 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>300%+ שיפור בהמרות</span>
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

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "300%", label: "שיפור בהמרות בממוצע" },
              { value: "15 שעות", label: "חיסכון בשבוע" },
              { value: "₪50M+", label: "מכירות דרך המערכת" },
              { value: "10+", label: "פלטפורמות מחוברות" },
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={fadeInUp} 
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              שני פתרונות.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                שיווק חכם.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Converto מספקת הכל מהקמת חנות חכמה ועד ניהול קמפיינים מתקדם עם AI
            </p>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            variants={staggerContainer} 
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {/* Marketing System */}
            <motion.div variants={fadeInUp}>
              <Card className="group h-full p-8 bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary mb-4">
                  <Sparkles className="h-3 w-3" />
                  הרבה יותר מדשבורד
                </div>
                <h3 className="text-2xl font-bold mb-3">מערכת ניהול שיווק אינטגרטיבית</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  מערכת All-in-One שמנהלת את כל השיווק הדיגיטלי שלכם: פרסום פרוגרמטי, AI Agents, אנליטיקס מאוחד, דוחות אוטומטיים וניהול צוות.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                    פרסום ישיר לטיקטוק, מטא וגוגל ממקום אחד
                  </li>
                  <li className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary flex-shrink-0" />
                    AI Agents שמבצעים אופטימיזציה 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary flex-shrink-0" />
                    תובנות וזיהוי הזדמנויות בזמן אמת
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    Google Analytics, Ads, Meta, TikTok במקום אחד
                  </li>
                </ul>
                <Button asChild variant="default" className="w-full group-hover:bg-primary">
                  <Link to="/products/dashboard">
                    גלו את המערכת
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </Card>
            </motion.div>

            {/* E-Commerce */}
            <motion.div variants={fadeInUp}>
              <Card className="group h-full p-8 bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-6 shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="h-7 w-7 text-accent-foreground" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-xs text-accent mb-4">
                  <Rocket className="h-3 w-3" />
                  חנויות שמוכרות יותר
                </div>
                <h3 className="text-2xl font-bold mb-3">אתרי איקומרס חכמים</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  אתרים עם פונקציונליות גבוהה שמחוברים למערכות הפרסום, קופה חכמה עם upsells, ואייג'נטים בוואטסאפ שמטפלים בהזמנות.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
                    Shopify ו-WooCommerce אינטגרציה מלאה
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-accent flex-shrink-0" />
                    WhatsApp Agents לטיפול בהזמנות
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent flex-shrink-0" />
                    סנכרון אוטומטי לקטלוגי פרסום
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent flex-shrink-0" />
                    קופה חכמה עם upsells ו-cross-sells
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full border-accent/50 hover:bg-accent/10 hover:border-accent">
                  <Link to="/products/ecommerce">
                    למידע נוסף
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points & Solutions */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={fadeInUp} 
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              מכירים את{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                הכאבים האלה?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Converto פותרת את כל הבעיות שמונעות מכם לצמוח
            </p>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              {
                pain: "בזבוז שעות על מעבר בין פלטפורמות",
                solution: "הכל במקום אחד - טיקטוק, מטא וגוגל בממשק אחד",
                icon: Clock,
              },
              {
                pain: "חוסר שקיפות בROI של קמפיינים",
                solution: "מעקב ROI מדויק עם ייחוס הכנסות לכל קמפיין",
                icon: TrendingUp,
              },
              {
                pain: "עלויות גבוהות על 10 כלים שונים",
                solution: "מחיר אחד שמחליף את כל הכלים",
                icon: DollarSign,
              },
              {
                pain: "חוסר אופטימיזציה אוטומטית",
                solution: "AI שמבצע אופטימיזציה 24/7 בלי התערבות",
                icon: Bot,
              },
              {
                pain: "קושי בהבנת הנתונים",
                solution: "תובנות פשוטות בעברית עם המלצות לפעולה",
                icon: Brain,
              },
              {
                pain: "בזבוז זמן על דוחות",
                solution: "דוחות PDF אוטומטיים נשלחים למייל",
                icon: Zap,
              },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground line-through mb-3">{item.pain}</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{item.solution}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
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
            className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              {
                icon: Clock,
                title: "חיסכון בזמן",
                description: "15 שעות בשבוע פחות על ניהול כלים",
                color: "primary",
              },
              {
                icon: DollarSign,
                title: "חיסכון בכסף",
                description: "מחיר אחד במקום 10 מנויים",
                color: "accent",
              },
              {
                icon: Zap,
                title: "מניעת תסכול",
                description: "ממשק פשוט בעברית עם תמיכה צמודה",
                color: "primary",
              },
              {
                icon: TrendingUp,
                title: "צמיחה מהירה",
                description: "300%+ שיפור בהמרות בממוצע",
                color: "accent",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center p-4">
                <div className={`w-14 h-14 rounded-full bg-${item.color}/10 flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`h-7 w-7 text-${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Welcome Gate CTA */}
      <WelcomeGateCTA />

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }} 
              variants={fadeInUp}
              className="text-center mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                מוכנים להתחיל?
              </h2>
              <p className="text-muted-foreground">
                השאירו פרטים ונחזור אליכם עם הצעה מותאמת
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }} 
              variants={fadeInUp}
            >
              <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                <LeadForm source="homepage" />
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
