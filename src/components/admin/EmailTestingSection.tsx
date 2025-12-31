import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface TestResult {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
  details?: any;
}

export function EmailTestingSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleSendTest = async () => {
    if (!email) {
      toast.error("יש להזין כתובת אימייל");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("test-email", {
        body: { to: email },
      });

      if (error) {
        setResult({
          success: false,
          error: error.message,
        });
        toast.error("שגיאה בשליחת המייל");
      } else {
        setResult(data);
        if (data.success) {
          toast.success("מייל הבדיקה נשלח בהצלחה!");
        } else {
          toast.error(data.error || "שגיאה בשליחת המייל");
        }
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
      });
      toast.error("שגיאה בשליחת המייל");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          בדיקת מיילים
        </CardTitle>
        <CardDescription>
          שלח מייל בדיקה כדי לוודא שמערכת המיילים פועלת כראוי
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">כתובת אימייל לבדיקה</Label>
          <div className="flex gap-2">
            <Input
              id="test-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              className="flex-1"
            />
            <Button onClick={handleSendTest} disabled={isLoading || !email}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 ml-2" />
                  שלח בדיקה
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.success
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p
                  className={`font-medium ${
                    result.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {result.success ? "המייל נשלח בהצלחה!" : "שגיאה בשליחה"}
                </p>
                {result.id && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    מזהה: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{result.id}</code>
                  </p>
                )}
                {result.error && (
                  <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
                )}
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-red-600 dark:text-red-400">
                      פרטים נוספים
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900 p-2 rounded overflow-auto" dir="ltr">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            המייל נשלח מהכתובת <strong dir="ltr">tasks@converto.co.il</strong>. 
            אם לא קיבלת את המייל, בדוק את תיקיית הספאם.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
