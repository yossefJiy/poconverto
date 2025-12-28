import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-foreground">תנאי שימוש</h1>
          <p className="text-muted-foreground mt-2">עדכון אחרון: דצמבר 2024</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. הסכמה לתנאים</h2>
            <p className="text-muted-foreground leading-relaxed">
              ברוכים הבאים ל-Converto. השימוש באתר שלנו בכתובת 
              <a href="https://converto.co.il" className="text-primary hover:underline mx-1">converto.co.il</a>
              ("האתר", "השירות") מותנה בהסכמתך לתנאי שימוש אלה. 
              בשימוש באתר, אתה מאשר שקראת, הבנת והסכמת לתנאים אלה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. תיאור השירות</h2>
            <p className="text-muted-foreground leading-relaxed">
              Converto היא מערכת לניהול שיווק ולקוחות המאפשרת:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground mt-4">
              <li>ניהול קמפיינים פרסומיים</li>
              <li>מעקב וניתוח נתוני שיווק</li>
              <li>ניהול לקוחות ומשימות</li>
              <li>אינטגרציה עם פלטפורמות פרסום (Google Ads, Facebook Ads)</li>
              <li>חיבור לפלטפורמות מסחר אלקטרוני (Shopify)</li>
              <li>ניתוח נתונים ודוחות</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. הרשמה וחשבון משתמש</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong className="text-foreground">3.1 גישה מורשית:</strong> השימוש במערכת מותר למשתמשים מורשים בלבד. 
                הגישה מותנית באישור מנהל המערכת.
              </p>
              <p>
                <strong className="text-foreground">3.2 אחריות לחשבון:</strong> אתה אחראי לשמירה על סודיות פרטי ההתחברות שלך 
                ולכל פעילות המתבצעת תחת חשבונך.
              </p>
              <p>
                <strong className="text-foreground">3.3 מידע מדויק:</strong> עליך לספק מידע מדויק ועדכני בעת ההרשמה 
                ולעדכן אותו לפי הצורך.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. שימוש מותר</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              בשימוש בשירות, אתה מתחייב:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground">
              <li>לא לעשות שימוש בלתי חוקי בשירות</li>
              <li>לא לפגוע בזכויות צדדים שלישיים</li>
              <li>לא לנסות לפרוץ או לשבש את המערכת</li>
              <li>לא להעביר וירוסים או קוד זדוני</li>
              <li>לא להשתמש בשירות לשליחת ספאם</li>
              <li>לא לאסוף מידע על משתמשים אחרים ללא הרשאה</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. קניין רוחני</h2>
            <p className="text-muted-foreground leading-relaxed">
              כל הזכויות בשירות, כולל אך לא רק, קוד, עיצוב, לוגואים, טקסטים ותכנים, 
              הן בבעלות Converto או נותני הרישיון שלה. אין להעתיק, לשנות, להפיץ או לעשות 
              שימוש מסחרי בתכנים אלה ללא אישור מראש ובכתב.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. תוכן משתמש</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong className="text-foreground">6.1 בעלות:</strong> אתה שומר על הבעלות בכל תוכן שאתה מעלה למערכת.
              </p>
              <p>
                <strong className="text-foreground">6.2 רישיון:</strong> בהעלאת תוכן, אתה מעניק לנו רישיון להשתמש בו 
                לצורך מתן השירות.
              </p>
              <p>
                <strong className="text-foreground">6.3 אחריות:</strong> אתה אחראי לכל תוכן שאתה מעלה ומתחייב שלא יפר 
                זכויות צדדים שלישיים.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. אינטגרציות צד שלישי</h2>
            <p className="text-muted-foreground leading-relaxed">
              השירות מתחבר לפלטפורמות צד שלישי כגון Google, Facebook ו-Shopify. 
              השימוש בשירותים אלה כפוף לתנאי השימוש שלהם. אנו לא אחראים לזמינות או 
              לשינויים בשירותי צד שלישי.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. הגבלת אחריות</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                השירות מסופק "כמות שהוא" (AS IS). אנו לא אחראים לנזקים ישירים, עקיפים, 
                מקריים או תוצאתיים הנובעים משימוש בשירות, כולל אך לא מוגבל ל:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>אובדן נתונים או מידע</li>
                <li>הפסדים כספיים</li>
                <li>הפרעות בשירות</li>
                <li>פגיעה במוניטין</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. שיפוי</h2>
            <p className="text-muted-foreground leading-relaxed">
              אתה מתחייב לשפות ולפצות את Converto, מנהליה, עובדיה ושותפיה מפני כל תביעה, 
              נזק או הוצאה הנובעים משימושך בשירות או מהפרת תנאים אלה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. סיום שימוש</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו רשאים להשעות או לסיים את גישתך לשירות בכל עת, מכל סיבה, ללא הודעה מוקדמת. 
              במקרה של הפרת תנאים אלה, הגישה תופסק לאלתר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. שינויים בתנאים</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו רשאים לעדכן תנאים אלה מעת לעת. שינויים מהותיים יפורסמו באתר. 
              המשך השימוש בשירות לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. דין וסמכות שיפוט</h2>
            <p className="text-muted-foreground leading-relaxed">
              תנאים אלה כפופים לחוקי מדינת ישראל. כל מחלוקת תידון בבתי המשפט המוסמכים 
              במחוז תל אביב-יפו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. יצירת קשר</h2>
            <p className="text-muted-foreground leading-relaxed">
              לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו:
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
