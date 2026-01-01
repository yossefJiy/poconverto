import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type DateFilterValue = "today" | "yesterday" | "mtd" | "ytd" | "custom" | "7" | "14" | "30" | "90";

interface GlobalDateFilterProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  customDateRange?: { from: Date; to: Date };
  onCustomDateChange?: (range: { from: Date; to: Date }) => void;
}

export function GlobalDateFilter({ 
  value, 
  onChange, 
  customDateRange,
  onCustomDateChange 
}: GlobalDateFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: customDateRange?.from,
    to: customDateRange?.to,
  });

  const handleValueChange = (newValue: DateFilterValue) => {
    if (newValue === "custom") {
      setIsCustomOpen(true);
    } else {
      onChange(newValue);
    }
  };

  const handleCustomApply = () => {
    if (tempRange.from && tempRange.to && onCustomDateChange) {
      onCustomDateChange({ from: tempRange.from, to: tempRange.to });
      onChange("custom");
      setIsCustomOpen(false);
    }
  };

  const getDisplayValue = () => {
    switch (value) {
      case "today":
        return "היום";
      case "yesterday":
        return "אתמול";
      case "mtd":
        return "מתחילת החודש";
      case "ytd":
        return "מתחילת השנה";
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          return `${format(customDateRange.from, "dd/MM")} - ${format(customDateRange.to, "dd/MM")}`;
        }
        return "תאריכים מותאמים";
      case "7":
        return "7 ימים";
      case "14":
        return "14 ימים";
      case "30":
        return "30 ימים";
      case "90":
        return "90 ימים";
      default:
        return "בחר תקופה";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 ml-2" />
            <SelectValue>{getDisplayValue()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">היום</SelectItem>
            <SelectItem value="yesterday">אתמול</SelectItem>
            <SelectItem value="mtd">מתחילת החודש</SelectItem>
            <SelectItem value="ytd">מתחילת השנה</SelectItem>
            <SelectItem value="7">7 ימים</SelectItem>
            <SelectItem value="14">14 ימים</SelectItem>
            <SelectItem value="30">30 ימים</SelectItem>
            <SelectItem value="90">90 ימים</SelectItem>
            <SelectItem value="custom">תאריכים מותאמים אישית</SelectItem>
          </SelectContent>
        </Select>

        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <div>
                <p className="text-sm font-medium mb-2">מתאריך</p>
                <CalendarComponent
                  mode="single"
                  selected={tempRange.from}
                  onSelect={(date) => setTempRange({ ...tempRange, from: date })}
                  locale={he}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">עד תאריך</p>
                <CalendarComponent
                  mode="single"
                  selected={tempRange.to}
                  onSelect={(date) => setTempRange({ ...tempRange, to: date })}
                  locale={he}
                  disabled={(date) => tempRange.from ? date < tempRange.from : false}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCustomOpen(false)}>
                ביטול
              </Button>
              <Button 
                size="sm" 
                onClick={handleCustomApply}
                disabled={!tempRange.from || !tempRange.to}
              >
                החל
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Helper function to convert filter value to date range
export function getDateRangeFromFilter(
  filter: DateFilterValue, 
  customRange?: { from: Date; to: Date }
): { startDate: string; endDate: string; dateFrom: string; dateTo: string } {
  const now = new Date();
  // Today at midnight for start, today at end of day for calculations
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date = today; // Always include today

  switch (filter) {
    case "today":
      start = today;
      break;
    case "yesterday":
      start = new Date(today);
      start.setDate(start.getDate() - 1);
      end = new Date(start); // Yesterday only
      break;
    case "mtd":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      if (customRange?.from && customRange?.to) {
        start = customRange.from;
        end = customRange.to;
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      break;
    case "7":
      start = new Date(today);
      start.setDate(start.getDate() - 6); // 7 days including today
      break;
    case "14":
      start = new Date(today);
      start.setDate(start.getDate() - 13); // 14 days including today
      break;
    case "30":
      start = new Date(today);
      start.setDate(start.getDate() - 29); // 30 days including today
      break;
    case "90":
      start = new Date(today);
      start.setDate(start.getDate() - 89); // 90 days including today
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Format dates consistently as YYYY-MM-DD
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
  };
}