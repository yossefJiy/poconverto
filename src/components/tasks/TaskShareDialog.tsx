import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Share2,
  Mail,
  CheckCircle2,
  Loader2,
  Send,
  Building2,
  UserCircle,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
  shopify_email?: string | null;
}

interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  is_primary: boolean;
  receive_task_updates: boolean;
}

interface TaskShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

export function TaskShareDialog({ open, onOpenChange, tasks }: TaskShareDialogProps) {
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-share"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, shopify_email")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch contacts for selected client
  const { data: contacts = [] } = useQuery({
    queryKey: ["client-contacts-for-share", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from("client_contacts")
        .select("id, client_id, name, email, is_primary, receive_task_updates")
        .eq("client_id", selectedClientId)
        .eq("receive_task_updates", true)
        .order("is_primary", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as ClientContact[];
    },
    enabled: !!selectedClientId,
  });

  // Auto-select primary contact when contacts load
  useEffect(() => {
    if (contacts.length > 0 && !selectedContactId) {
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
      if (primaryContact) {
        setSelectedContactId(primaryContact.id);
        if (primaryContact.email) {
          setRecipientEmail(primaryContact.email);
        }
      }
    }
  }, [contacts, selectedContactId]);

  const shareMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Create share records
      const shares = tasks.map(task => ({
        task_id: task.id,
        client_id: selectedClientId,
        shared_by: userData.user?.id,
        share_type: "view",
        message: message || null,
        email_sent: Boolean(sendEmail && recipientEmail),
        email_sent_at: sendEmail && recipientEmail ? new Date().toISOString() : null,
      }));

      const { error: shareError } = await supabase
        .from("task_shares")
        .upsert(shares, { onConflict: "task_id,client_id" });

      if (shareError) throw shareError;

      // Send email if requested
      if (sendEmail && recipientEmail) {
        const { data, error: emailError } = await supabase.functions.invoke("send-task-email", {
          body: {
            to: recipientEmail,
            tasks: tasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              due_date: t.due_date,
            })),
            message,
            clientId: selectedClientId,
          },
        });

        if (emailError) {
          console.error("Email error:", emailError);
          toast.warning("המשימות שותפו, אך היתה בעיה בשליחת המייל");
          return tasks.length;
        }

        // Check if the response contains an error
        if (data?.error) {
          console.error("Email send error:", data.error);
          toast.warning(`המשימות שותפו, אך היתה שגיאה: ${data.error}`);
          return tasks.length;
        }
      }

      return tasks.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["task-shares"] });
      toast.success(`${count} משימות שותפו בהצלחה${sendEmail && recipientEmail ? " והמייל נשלח" : ""}`);
      onOpenChange(false);
      resetForm();
    },
    onError: () => toast.error("שגיאה בשיתוף משימות"),
  });

  const resetForm = () => {
    setSelectedClientId("");
    setSelectedContactId("");
    setRecipientEmail("");
    setMessage("");
    setSendEmail(true);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedContactId("");
    setRecipientEmail("");
    
    // Fallback to shopify_email if no contacts
    const client = clients.find(c => c.id === clientId);
    if (client?.shopify_email) {
      setRecipientEmail(client.shopify_email);
    }
  };

  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact?.email) {
      setRecipientEmail(contact.email);
    } else {
      setRecipientEmail("");
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "ממתין",
    "in-progress": "בתהליך",
    completed: "הושלם",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            שיתוף משימות עם לקוח
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tasks preview */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              משימות לשיתוף ({tasks.length})
            </Label>
            <ScrollArea className="h-[120px] rounded-lg border border-border">
              <div className="p-2 space-y-1.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate flex-1">{task.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[task.status] || task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Client selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              לקוח
            </Label>
            <Select value={selectedClientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact selection - only show if there are contacts */}
          {selectedClientId && contacts.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                איש קשר
              </Label>
              <Select value={selectedContactId} onValueChange={handleContactChange}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר איש קשר" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.is_primary && "(ראשי)"} {contact.email && `- ${contact.email}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Email toggle and input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                שלח מייל ללקוח
              </Label>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>

            {sendEmail && (
              <Input
                type="email"
                placeholder="כתובת מייל"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="text-left"
                dir="ltr"
              />
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>הודעה (אופציונלי)</Label>
            <Textarea
              placeholder="הוסף הודעה אישית ללקוח..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            onClick={() => shareMutation.mutate()}
            disabled={!selectedClientId || (sendEmail && !recipientEmail) || shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-2" />
            )}
            שתף {sendEmail ? "ושלח מייל" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
