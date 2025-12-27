import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClient } from "@/hooks/useClient";
import { Share2, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

export function ShareDashboardDialog() {
  const { selectedClient } = useClient();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  if (!selectedClient) return null;

  const shareUrl = `${window.location.origin}/client/${selectedClient.id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("הקישור הועתק!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("שגיאה בהעתקת הקישור");
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          שתף דשבורד
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שתף דשבורד ללקוח</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              שתף את הקישור הזה עם {selectedClient.name} כדי שיוכלו לצפות בדשבורד שלהם
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input 
              value={shareUrl} 
              readOnly 
              className="text-sm font-mono"
              dir="ltr"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex-1 gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "הועתק!" : "העתק קישור"}
            </Button>
            <Button variant="outline" onClick={openInNewTab} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              פתח
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              הלקוח יוכל לצפות בנתוני הקמפיינים, המשימות והיעדים שלו בזמן אמת.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
