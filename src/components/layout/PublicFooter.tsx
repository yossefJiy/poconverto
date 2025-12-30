import { Link } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.svg";
import logoText from "@/assets/logo-text.svg";
import byJiyLogo from "@/assets/by-jiy-logo.svg";

export function PublicFooter() {
  return (
    <footer className="py-12 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex flex-col items-end">
                <img src={logoText} alt="Converto" className="h-5 w-auto" />
                <img src={byJiyLogo} alt="by JIY" className="h-2.5 w-auto mt-1.5 opacity-70" />
              </div>
              <img src={logoIcon} alt="Converto" className="h-8 w-auto" />
            </div>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Converto הופך את השיווק הדיגיטלי שלכם לפשוט ויעיל יותר. 
              דפי נחיתה, חנויות אונליין ודשבורד חכם - הכל במקום אחד.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">המוצרים שלנו</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products/landing-pages" className="text-muted-foreground hover:text-foreground transition-colors">
                  דפי נחיתה
                </Link>
              </li>
              <li>
                <Link to="/products/ecommerce" className="text-muted-foreground hover:text-foreground transition-colors">
                  חנויות אונליין
                </Link>
              </li>
              <li>
                <Link to="/products/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  דשבורד חכם
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">מידע נוסף</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  מדיניות פרטיות
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  תנאי שימוש
                </Link>
              </li>
              <li>
                <a href="mailto:hello@jiy.co.il" className="text-muted-foreground hover:text-foreground transition-colors">
                  צור קשר
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} JIY. כל הזכויות שמורות.
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://jiy.co.il" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              jiy.co.il
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
