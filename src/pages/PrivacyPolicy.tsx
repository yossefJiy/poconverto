import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/auth" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה לדף ההתחברות
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">מדיניות פרטיות</h1>
          <p className="text-muted-foreground mt-2">עדכון אחרון: דצמבר 2024</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. מבוא</h2>
            <p className="text-muted-foreground leading-relaxed">
              ברוכים הבאים ל-Converto ("האתר", "אנחנו", "שלנו"). אנו מחויבים להגן על פרטיותך ולשמור על המידע האישי שלך. 
              מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך כאשר אתה משתמש באתר שלנו בכתובת 
              <a href="https://converto.co.il" className="text-primary hover:underline mx-1">converto.co.il</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. המידע שאנו אוספים</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">2.1 מידע שאתה מספק לנו</h3>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>פרטי התחברות: כתובת אימייל, סיסמה, מספר טלפון</li>
                  <li>פרטי פרופיל: שם מלא, תמונת פרופיל</li>
                  <li>מידע עסקי: נתוני לקוחות, קמפיינים, משימות</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">2.2 מידע שנאסף אוטומטית</h3>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>נתוני שימוש: עמודים שנצפו, זמן שהייה באתר</li>
                  <li>מידע טכני: כתובת IP, סוג דפדפן, מערכת הפעלה</li>
                  <li>עוגיות ומזהי מעקב</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. כיצד אנו משתמשים במידע</h2>
            <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground">
              <li>ניהול חשבון המשתמש שלך</li>
              <li>מתן השירותים המבוקשים</li>
              <li>שיפור וייעול השירותים שלנו</li>
              <li>שליחת עדכונים והודעות חשובות</li>
              <li>אבטחת המערכת ומניעת הונאות</li>
              <li>עמידה בדרישות חוקיות</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. שיתוף מידע עם צדדים שלישיים</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              אנו לא מוכרים את המידע האישי שלך. אנו עשויים לשתף מידע עם:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground">
              <li>ספקי שירות הנדרשים לתפעול המערכת (אחסון ענן, תשתיות)</li>
              <li>רשויות חוק, כאשר נדרש על פי דין</li>
              <li>צדדים שלישיים בהסכמתך המפורשת</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. אבטחת מידע</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלך, כולל:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground mt-4">
              <li>הצפנת נתונים בהעברה ובאחסון</li>
              <li>אימות דו-שלבי (2FA)</li>
              <li>בקרות גישה קפדניות</li>
              <li>ניטור אבטחה מתמיד</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. זכויותיך</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              על פי חוק הגנת הפרטיות, יש לך את הזכויות הבאות:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground">
              <li>זכות גישה למידע האישי שלך</li>
              <li>זכות לתיקון מידע שגוי</li>
              <li>זכות למחיקת המידע שלך</li>
              <li>זכות להתנגד לעיבוד מידע</li>
              <li>זכות להעברת מידע</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. עוגיות (Cookies)</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו משתמשים בעוגיות לשיפור חוויית המשתמש, לניתוח שימוש באתר ולאימות משתמשים. 
              באפשרותך לנהל את הגדרות העוגיות דרך הדפדפן שלך.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. שינויים במדיניות</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר ו/או יישלחו אליך בדוא"ל.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. יצירת קשר</h2>
            <p className="text-muted-foreground leading-relaxed">
              לשאלות בנוגע למדיניות הפרטיות שלנו, ניתן לפנות אלינו:
            </p>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-foreground font-medium">Converto</p>
              <p className="text-muted-foreground">אתר: <a href="https://converto.co.il" className="text-primary hover:underline">converto.co.il</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
