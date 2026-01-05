import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  description: string;
  size: number;
  growth: number;
  avgOrderValue: number;
  totalRevenue: number;
  criteria: string[];
}

interface SegmentDetailDialogProps {
  segment: Segment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SegmentDetailDialog({ segment, open, onOpenChange }: SegmentDetailDialogProps) {
  if (!segment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {segment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">{segment.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">גודל סגמנט</span>
                </div>
                <p className="text-xl font-bold">{segment.size.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">צמיחה</span>
                </div>
                <p className={`text-xl font-bold ${segment.growth >= 0 ? "text-success" : "text-destructive"}`}>
                  {segment.growth >= 0 ? "+" : ""}{segment.growth}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ממוצע הזמנה</span>
                </div>
                <p className="text-xl font-bold">₪{segment.avgOrderValue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">הכנסות כוללות</span>
                </div>
                <p className="text-xl font-bold">₪{segment.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {segment.criteria && segment.criteria.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">קריטריונים</h4>
              <div className="flex flex-wrap gap-2">
                {segment.criteria.map((criterion, index) => (
                  <Badge key={index} variant="outline">
                    {criterion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
