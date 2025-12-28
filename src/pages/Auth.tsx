import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Mail, Phone, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const emailSchema = z.string().email("אימייל לא תקין");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

type AuthStep = "credentials" | "otp";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [authStep, setAuthStep] = useState<AuthStep>("credentials");

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setLoading(true);
    
    // First verify credentials are correct
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("אימייל או סיסמה שגויים");
      } else {
        toast.error(signInError.message);
      }
      setLoading(false);
      return;
    }

    // Sign out immediately - we need OTP verification
    await supabase.auth.signOut();

    // Send OTP to email
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    });

    if (otpError) {
      toast.error("שגיאה בשליחת קוד אימות: " + otpError.message);
      setLoading(false);
      return;
    }

    toast.success("קוד אימות נשלח לאימייל שלך");
    setAuthStep("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast.error("יש להזין קוד בן 6 ספרות");
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });

    if (error) {
      toast.error("קוד אימות שגוי או פג תוקף");
      setLoading(false);
      return;
    }

    toast.success("התחברת בהצלחה!");
    navigate("/");
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    });

    if (error) {
      toast.error("שגיאה בשליחת קוד: " + error.message);
    } else {
      toast.success("קוד חדש נשלח לאימייל שלך");
    }
    setLoading(false);
  };

  const handleBackToCredentials = () => {
    setAuthStep("credentials");
    setOtpCode("");
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

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label>קוד אימות</Label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>
                  {loading ? "מאמת..." : "אמת והתחבר"}
                </Button>
              </form>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  שלח קוד חדש
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToCredentials}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  חזרה להתחברות
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;