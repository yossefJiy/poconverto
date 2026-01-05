import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Trash2, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Props {
  clientId?: string;
}

export function ProductFeedManager({ clientId }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newFeed, setNewFeed] = useState({
    feed_name: "",
    platform: "google_shopping",
    feed_url: "",
    sync_frequency: "daily",
  });
  const queryClient = useQueryClient();

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ["product-feeds-manager", clientId],
    queryFn: async () => {
      const query = supabase
        .from("product_feeds")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const createFeed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_feeds").insert({
        client_id: clientId,
        ...newFeed,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-feeds-manager"] });
      setShowCreate(false);
      setNewFeed({ feed_name: "", platform: "google_shopping", feed_url: "", sync_frequency: "daily" });
      toast.success("פיד נוצר בהצלחה");
    },
  });

  const deleteFeed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_feeds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-feeds-manager"] });
      toast.success("פיד נמחק");
    },
  });

  const syncFeed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_feeds")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-feeds-manager"] });
      toast.success("פיד סונכרן בהצלחה");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ניהול פידים</CardTitle>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-1" />
                פיד חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוסף פיד חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>שם הפיד</Label>
                  <Input
                    value={newFeed.feed_name}
                    onChange={(e) => setNewFeed({ ...newFeed, feed_name: e.target.value })}
                    placeholder="לדוגמה: פיד מוצרים ראשי"
                  />
                </div>
                <div>
                  <Label>פלטפורמה</Label>
                  <Select
                    value={newFeed.platform}
                    onValueChange={(value) => setNewFeed({ ...newFeed, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google_shopping">Google Shopping</SelectItem>
                      <SelectItem value="facebook_catalog">Facebook Catalog</SelectItem>
                      <SelectItem value="tiktok_catalog">TikTok Catalog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>כתובת הפיד (URL)</Label>
                  <Input
                    value={newFeed.feed_url}
                    onChange={(e) => setNewFeed({ ...newFeed, feed_url: e.target.value })}
                    placeholder="https://example.com/feed.xml"
                  />
                </div>
                <div>
                  <Label>תדירות סנכרון</Label>
                  <Select
                    value={newFeed.sync_frequency}
                    onValueChange={(value) => setNewFeed({ ...newFeed, sync_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">כל שעה</SelectItem>
                      <SelectItem value="daily">יומי</SelectItem>
                      <SelectItem value="weekly">שבועי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createFeed.mutate()}
                  disabled={!newFeed.feed_name || createFeed.isPending}
                >
                  צור פיד
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : feeds.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">אין פידים</h3>
              <p className="text-muted-foreground mb-4">הוסף את הפיד הראשון שלך</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 ml-1" />
                הוסף פיד
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>פלטפורמה</TableHead>
                  <TableHead>מוצרים</TableHead>
                  <TableHead>סנכרון אחרון</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-medium">{feed.feed_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{feed.platform}</Badge>
                    </TableCell>
                    <TableCell>{feed.product_count || 0}</TableCell>
                    <TableCell>
                      {feed.last_sync_at 
                        ? format(new Date(feed.last_sync_at), "dd/MM HH:mm")
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={feed.status === "active" ? "default" : "secondary"}>
                        {feed.status === "active" ? "פעיל" : "מושהה"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => syncFeed.mutate(feed.id)}
                          disabled={syncFeed.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {feed.feed_url && (
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                          >
                            <a href={feed.feed_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteFeed.mutate(feed.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
