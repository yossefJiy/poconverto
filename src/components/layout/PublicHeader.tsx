import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.svg";
import logoText from "@/assets/logo-text.svg";
import byJiyLogo from "@/assets/by-jiy-logo.svg";

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

const navItems: NavItem[] = [
  { label: "דפי נחיתה", href: "/products/landing-pages" },
  { label: "חנויות", href: "/products/ecommerce" },
  { label: "דשבורד", href: "/products/dashboard" },
  { label: "צור קשר", href: "#contact", isExternal: true },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    return location.pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="hidden sm:flex flex-col items-end">
              <img 
                src={logoText} 
                alt="Converto" 
                className="h-5 w-auto" 
              />
              <img 
                src={byJiyLogo} 
                alt="by JIY" 
                className="h-2.5 w-auto mt-0.5 opacity-70" 
              />
            </div>
            <img 
              src={logoIcon} 
              alt="Converto" 
              className="h-8 w-auto group-hover:scale-105 transition-transform" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              item.isExternal ? (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Login/User Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button asChild size="sm" className="hidden sm:flex bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Link to="/dashboard">
                    למערכת
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  התנתק
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-2">
                  <Link to="/auth">
                    <LogIn className="h-4 w-4" />
                    כניסה למערכת
                  </Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:flex bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Link to="/auth">
                    התחילו בחינם
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                item.isExternal ? (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive(item.href) 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
                {user ? (
                  <>
                    <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        למערכת
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      התנתק
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full gap-2">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="h-4 w-4" />
                        כניסה למערכת
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        התחילו בחינם
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
