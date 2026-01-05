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
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import { logger } from "@/lib/logger";

const emailSchema = z.string().email("אימייל לא תקין");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

type AuthStep = "credentials" | "otp";

const RESEND_COOLDOWN_SECONDS = 60;

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
  const [codeDeliveryMethod, setCodeDeliveryMethod] = useState<"sms" | "email">("email");
  
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
      logger.debug("[Auth] onAuthStateChange", { event, hasSession: !!session, is2FAInProgress: is2FAInProgress.current });
      
      // Don't navigate if we're in the middle of 2FA flow
      if (is2FAInProgress.current) {
        logger.debug("[Auth] Skipping navigation - 2FA in progress");
        return;
      }
      if (session?.user) {
        logger.debug("[Auth] User session detected, navigating to dashboard");
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.debug("[Auth] Initial getSession", { hasSession: !!session, is2FAInProgress: is2FAInProgress.current });
      if (session?.user && !is2FAInProgress.current) {
        logger.debug("[Auth] Existing session found, navigating to dashboard");
        navigate("/dashboard");
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
    // First, get user's phone and notification preference from authorized_emails
    const { data: authUser } = await supabase
      .from("authorized_emails")
      .select("phone, notification_preference")
      .eq("email", email.toLowerCase())
      .single();

    const phone = authUser?.phone;
    const notificationPref = authUser?.notification_preference || "email";
    logger.debug("[Auth] User 2FA preference", { notificationPref, hasPhone: !!phone });

    const response = await supabase.functions.invoke("send-2fa-code", {
      body: { email, phone, notification_preference: notificationPref, action: "send" },
    });

    if (response.error) {
      throw new Error(response.error.message || "Failed to send code");
    }

    if (response.data?.error) {
      throw new Error(response.data.error);
    }

    return response.data;
  }, [email]);

  const checkTrustedDevice = useCallback(async (): Promise<boolean> => {
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const response = await supabase.functions.invoke("trusted-device", {
        body: { email, device_fingerprint: deviceFingerprint, action: "check" },
      });

      if (response.error) {
        logger.error(response.error, { context: "[Auth] Error checking trusted device" });
        return false;
      }

      return response.data?.trusted === true;
    } catch (error) {
      logger.error(error, { context: "[Auth] Error checking trusted device" });
      return false;
    }
  }, [email]);

  const addTrustedDevice = useCallback(async () => {
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const response = await supabase.functions.invoke("trusted-device", {
        body: { email, device_fingerprint: deviceFingerprint, action: "add" },
      });

      if (response.error) {
        logger.error(response.error, { context: "[Auth] Error adding trusted device" });
      } else {
        logger.debug("[Auth] Device added as trusted", { trustedUntil: response.data?.trusted_until });
      }
    } catch (error) {
      logger.error(error, { context: "[Auth] Error adding trusted device" });
    }
  }, [email]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setLoading(true);
    // Set flag to prevent navigation during 2FA
    is2FAInProgress.current = true;
    logger.debug("[Auth][2FA] Starting credential verification", { email });
    
    try {
      // First verify credentials are correct
      logger.debug("[Auth][2FA] Calling signInWithPassword...");
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        logger.error(signInError, { context: "[Auth][2FA] signInWithPassword failed" });
        is2FAInProgress.current = false;
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("אימייל או סיסמה שגויים");
        } else {
          toast.error(signInError.message);
        }
        setLoading(false);
        return;
      }

      logger.debug("[Auth][2FA] Credentials valid, session created", { userId: signInData.user?.id });

      // Check if this device is trusted
      const isTrusted = await checkTrustedDevice();
      
      if (isTrusted) {
        // Device is trusted - skip 2FA
        logger.debug("[Auth][2FA] Device is trusted, skipping 2FA");
        is2FAInProgress.current = false;
        toast.success("התחברת בהצלחה!");
        navigate("/dashboard");
        return;
      }

      // Sign out immediately - we need 2FA verification
      logger.debug("[Auth][2FA] Device not trusted, signing out for 2FA verification...");
      await supabase.auth.signOut();
      logger.debug("[Auth][2FA] Signed out, sending 2FA code...");

      // Send 2FA code via our edge function
      const result = await send2FACode();
      logger.debug("[Auth][2FA] 2FA code sent successfully", { method: result.method });
      
      const method = result.method as "sms" | "email" | "both";
      setCodeDeliveryMethod(method === "both" ? "sms" : method);
      
      if (method === "sms") {
        toast.success("קוד אימות נשלח ב-SMS לטלפון שלך");
      } else if (method === "both") {
        toast.success("קוד אימות נשלח ב-SMS ולאימייל שלך");
      } else {
        toast.success("קוד אימות נשלח לאימייל שלך");
      }
      setAuthStep("otp");
      setResendTimer(RESEND_COOLDOWN_SECONDS);
    } catch (error: unknown) {
      is2FAInProgress.current = false;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(error, { context: "[Auth][2FA] Error in handleSendOtp" });
      toast.error("שגיאה בשליחת קוד אימות: " + errorMessage);
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
    logger.debug("[Auth][2FA] Starting OTP verification...");
    
    try {
      // Verify the code via our edge function
      logger.debug("[Auth][2FA] Calling verify function...");
      const response = await supabase.functions.invoke("send-2fa-code", {
        body: { email, action: "verify", code: otpCode },
      });

      logger.debug("[Auth][2FA] Verify response", { hasError: !!response.error, data: response.data });

      if (response.error || !response.data?.valid) {
        const errorMessage = response.data?.error || response.error?.message || "Invalid code";
        logger.error(new Error(errorMessage), { context: "[Auth][2FA] OTP verification failed" });
        toast.error(errorMessage === "Invalid code" ? "קוד אימות שגוי" : errorMessage);
        setLoading(false);
        return;
      }

      logger.debug("[Auth][2FA] OTP verified, signing in with password...");
      
      // Code is valid - now sign in with password
      // Reset the 2FA flag so navigation works
      is2FAInProgress.current = false;
      
      const { data: finalSignIn, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        logger.error(signInError, { context: "[Auth][2FA] Final signIn failed" });
        toast.error("שגיאה בהתחברות: " + signInError.message);
        setLoading(false);
        return;
      }

      logger.debug("[Auth][2FA] Login successful", { userId: finalSignIn.user?.id, sessionExists: !!finalSignIn.session });
      
      // Add device as trusted for 30 days
      await addTrustedDevice();
      
      // Log session details for debugging
      const sessionCheck = await supabase.auth.getSession();
      logger.debug("[Auth][2FA] Session check after login", { 
        hasSession: !!sessionCheck.data.session,
        accessToken: sessionCheck.data.session?.access_token ? "present" : "missing",
        expiresAt: sessionCheck.data.session?.expires_at
      });

      toast.success("התחברת בהצלחה! המכשיר יזכר ל-30 יום");
      navigate("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(error, { context: "[Auth][2FA] Error in handleVerifyOtp" });
      toast.error("שגיאה באימות: " + errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(error, { context: "Resend error" });
      toast.error("שגיאה בשליחת קוד: " + errorMessage);
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
                  {codeDeliveryMethod === "sms" 
                    ? "קוד אימות בן 6 ספרות נשלח ב-SMS לטלפון שלך"
                    : `קוד אימות בן 6 ספרות נשלח ל-${email}`
                  }
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
                </div>
                
                <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>
                  {loading ? "מאמת..." : "אמת והתחבר"}
                </Button>
              </form>

              {/* Resend Code */}
              <div className="text-center space-y-3">
                {resendTimer > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>ניתן לשלוח קוד חדש בעוד {formatTime(resendTimer)}</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    שלח קוד חדש
                  </Button>
                )}
              </div>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={handleBackToCredentials}
                className="w-full flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                חזור להתחברות
              </Button>
            </div>
          )}

          {/* Footer Links */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              בהתחברות אתה מסכים ל
              <Link to="/terms-of-service" className="text-primary hover:underline mx-1">
                תנאי השימוש
              </Link>
              ול
              <Link to="/privacy-policy" className="text-primary hover:underline mx-1">
                מדיניות הפרטיות
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
