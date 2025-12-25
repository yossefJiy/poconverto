import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, ArrowRight } from "lucide-react";

export function PhoneSignIn() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number (Israeli format)
    const phoneRegex = /^(\+972|0)?[5][0-9]{8}$/;
    const formattedPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;
    
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
      toast.error("מספר טלפון לא תקין");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      toast.error("שגיאה בשליחת קוד: " + error.message);
    } else {
      toast.success("קוד נשלח בהצלחה!");
      setStep("otp");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;
    
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });

    if (error) {
      toast.error("קוד שגוי או פג תוקף");
    } else {
      toast.success("התחברת בהצלחה!");
    }
    setLoading(false);
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
  };

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="text-center text-sm text-muted-foreground mb-4">
          קוד נשלח למספר {phone}
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp">קוד אימות</Label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            dir="ltr"
            maxLength={6}
            className="text-center text-xl tracking-widest"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "מאמת..." : "אימות"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleBack}
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">מספר טלפון</Label>
        <div className="relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="050-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            dir="ltr"
            className="pr-10"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "שולח..." : "שליחת קוד"}
      </Button>
    </form>
  );
}
