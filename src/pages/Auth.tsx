import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { z } from "zod";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PhoneSignIn } from "@/components/auth/PhoneSignIn";
import { Mail, Phone, ShieldCheck, KeyRound, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const emailSchema = z.string().email("אימייל לא תקין");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

type AuthStep = "credentials" | "otp";

const RESEND_COOLDOWN_SECONDS = 60;

// Development mode - skip 2FA for these domains
const isDevelopmentMode = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname.includes('lovableproject.com') ||
         hostname.includes('127.0.0.1');
};

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [authStep, setAuthStep] = useState<AuthStep>("credentials");
  const [resendTimer, setResendTimer] = useState(0);
  
  // Flag to prevent navigation during 2FA flow
  const is2FAInProgress = useRef(false);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't navigate if we're in the middle of 2FA flow
      if (is2FAInProgress.current) {
        return;
      }
      if (session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !is2FAInProgress.current) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateInputs = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0]?.message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0]?.message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const send2FACode = useCallback(async () => {
    const response = await supabase.functions.invoke("send-2fa-code", {
      body: { email, action: "send" },
    });

    if (response.error) {
      throw new Error(response.error.message || "Failed to send code");
    }

    if (response.data?.error) {
      throw new Error(response.data.error);
    }

    return response.data;
  }, [email]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setLoading(true);
    // Set flag to prevent navigation during 2FA
    is2FAInProgress.current = true;
    
    try {
      // First verify credentials are correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        is2FAInProgress.current = false;
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("אימייל או סיסמה שגויים");
        } else {
          toast.error(signInError.message);
        }
        setLoading(false);
        return;
      }

      // In development mode - skip 2FA and stay logged in
      if (isDevelopmentMode()) {
        is2FAInProgress.current = false;
        toast.success("התחברת בהצלחה! (מצב פיתוח - 2FA מושבת)");
        navigate("/");
        return;
      }

      // Sign out immediately - we need 2FA verification
      await supabase.auth.signOut();

      // Send 2FA code via our edge function
      await send2FACode();

      toast.success("קוד אימות נשלח לאימייל שלך");
      setAuthStep("otp");
      setResendTimer(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      is2FAInProgress.current = false;
      console.error("2FA send error:", error);
      toast.error("שגיאה בשליחת קוד אימות: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast.error("יש להזין קוד בן 6 ספרות");
      return;
    }
    
    setLoading(true);
    
    try {
      // Verify the code via our edge function
      const response = await supabase.functions.invoke("send-2fa-code", {
        body: { email, action: "verify", code: otpCode },
      });

      if (response.error || !response.data?.valid) {
        const errorMessage = response.data?.error || response.error?.message || "Invalid code";
        toast.error(errorMessage === "Invalid code" ? "קוד אימות שגוי" : errorMessage);
        setLoading(false);
        return;
      }

      // Code is valid - now sign in with password
      // Reset the 2FA flag so navigation works
      is2FAInProgress.current = false;
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast.error("שגיאה בהתחברות: " + signInError.message);
        setLoading(false);
        return;
      }

      toast.success("התחברת בהצלחה!");
      navigate("/");
    } catch (error: any) {
      console.error("2FA verify error:", error);
      toast.error("שגיאה באימות: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    
    try {
      await send2FACode();
      toast.success("קוד חדש נשלח לאימייל שלך");
      setResendTimer(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error("שגיאה בשליחת קוד: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setAuthStep("credentials");
    setOtpCode("");
    setResendTimer(0);
    is2FAInProgress.current = false;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">מערכת ניהול שיווק</CardTitle>
          <CardDescription>
            {authStep === "credentials" ? "התחבר כדי להמשיך" : "אימות דו-שלבי"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authStep === "credentials" ? (
            <>
              {/* Authorized Users Info */}
              <Alert className="border-primary/30 bg-primary/5">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>גישה מורשית בלבד</AlertTitle>
                <AlertDescription className="text-sm">
                  רק משתמשים מורשים יכולים להתחבר למערכת. פנה למנהל המערכת לקבלת גישה.
                </AlertDescription>
              </Alert>

              {/* Social Login */}
              <div className="space-y-3">
                <GoogleSignInButton />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">או</span>
                </div>
              </div>

              {/* Auth Method Toggle */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant={authMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("email")}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  אימייל
                </Button>
                <Button
                  variant={authMethod === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("phone")}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  טלפון
                </Button>
              </div>

              {authMethod === "phone" ? (
                <PhoneSignIn />
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">אימייל</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                    />
                    {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">סיסמה</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      dir="ltr"
                    />
                    {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "שולח קוד אימות..." : "המשך לאימות"}
                  </Button>
                </form>
              )}
            </>
          ) : (
            /* OTP Verification Step */
            <div className="space-y-6">
              <Alert className="border-primary/30 bg-primary/5">
                <KeyRound className="h-4 w-4" />
                <AlertTitle>אימות דו-שלבי (2FA)</AlertTitle>
                <AlertDescription className="text-sm">
                  קוד אימות בן 6 ספרות נשלח ל-{email}
                </AlertDescription>
              </Alert>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-center block text-lg font-semibold">הזן את קוד האימות</Label>
                  <div className="flex justify-center py-4" dir="ltr">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                      className="gap-3"
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot 
                          index={0} 
                          className="w-14 h-14 text-2xl font-bold border-2 border-primary/30 focus:border-primary rounded-lg shadow-sm"
                        />
                        <InputOTPSlot 
                          index={1} 
                          className="w-14 h-14 text-2xl font-bold border-2 border-primary/30 focus:border-primary rounded-lg shadow-sm"
                        />
                        <InputOTPSlot 
                          index={2} 
                          className="w-14 h-14 text-2xl font-bold border-2 border-primary/30 focus:border-primary rounded-lg shadow-sm"
                        />
                        <InputOTPSlot 
                          index={3} 
                          className="w-14 h-14 text-2xl font-bold border-2 border-primary/30 focus:border-primary rounded-lg shadow-sm"
                        />
                        <InputOTPSlot 
                          index={4} 
                          className="w-14 h-14 text-2xl font-bold border-2 border-primary/30 focus:border-primary rounded-lg shadow-sm"
                        />
                        <InputOTPSlot 
                          index={5} 
                          className="w-14 h-14 text-2xl font-bold border-2 border-primary/30 focus:border-primary rounded-lg shadow-sm"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    בדוק את תיבת האימייל שלך וקוד האימות יגיע תוך דקות ספורות
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold" 
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? "מאמת..." : "אמת והתחבר"}
                </Button>
              </form>

              <div className="flex flex-col gap-4 pt-2">
                {/* Resend button with timer */}
                <div className="flex items-center justify-center">
                  {resendTimer > 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/50 px-4 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span>שליחה מחדש תתאפשר בעוד {formatTime(resendTimer)}</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      לא קיבלת? שלח קוד חדש
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToCredentials}
                  disabled={loading}
                  className="flex items-center gap-2 mx-auto"
                >
                  <ArrowRight className="w-4 h-4" />
                  חזרה להתחברות
                </Button>
              </div>
            </div>
          )}
          
          {/* Policy Links */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                מדיניות פרטיות
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
                תנאי שימוש
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
