import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Target, TrendingUp, Plus, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  clientId?: string;
}

export function AudienceSegments({ clientId }: Props) {
  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["customer-segments", clientId],
    queryFn: async () => {
      const query = supabase
        .from("customer_segments")
        .select("*")
        .order("customer_count", { ascending: false });
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Default segments to show if none exist
  const defaultSegments = [
    { id: "1", name: "לקוחות VIP", description: "לקוחות עם 5+ רכישות", customer_count: 342, segment_type: "behavioral" },
    { id: "2", name: "נטשו עגלה", description: "הוסיפו לעגלה אך לא רכשו", customer_count: 1205, segment_type: "behavioral" },
    { id: "3", name: "חדשים", description: "נרשמו ב-30 ימים אחרונים", customer_count: 567, segment_type: "demographic" },
    { id: "4", name: "לא פעילים", description: "לא רכשו 90+ ימים", customer_count: 892, segment_type: "behavioral" },
  ];

  const displaySegments = segments.length > 0 ? segments : defaultSegments;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה"כ קהלים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displaySegments.length}</div>
            <p className="text-xs text-muted-foreground">קהלים מוגדרים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה"כ משתמשים</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displaySegments.reduce((sum, s) => sum + (s.customer_count || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">בכל הקהלים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">קהל ממוצע</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                displaySegments.reduce((sum, s) => sum + (s.customer_count || 0), 0) / 
                (displaySegments.length || 1)
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">משתמשים לקהל</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>קהלי יעד</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 ml-1" />
            קהל חדש
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם קהל</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>גודל</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displaySegments.map((segment, index) => (
                <TableRow key={segment.id || index}>
                  <TableCell className="font-medium">{segment.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {segment.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {segment.segment_type === "behavioral" ? "התנהגותי" : 
                       segment.segment_type === "demographic" ? "דמוגרפי" : 
                       segment.segment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">
                      {(segment.customer_count || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
