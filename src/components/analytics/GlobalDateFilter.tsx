import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format, isToday, subDays, startOfMonth, startOfYear } from "date-fns";
import { he } from "date-fns/locale";
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

const quickOptions: { value: DateFilterValue; label: string }[] = [
  { value: "today", label: "היום" },
  { value: "yesterday", label: "אתמול" },
  { value: "7", label: "7 ימים" },
  { value: "14", label: "14 ימים" },
  { value: "30", label: "30 ימים" },
  { value: "90", label: "90 ימים" },
  { value: "mtd", label: "מתחילת החודש" },
  { value: "ytd", label: "מתחילת השנה" },
];

export function GlobalDateFilter({ 
  value, 
  onChange, 
  customDateRange,
  onCustomDateChange 
}: GlobalDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: customDateRange?.from,
    to: customDateRange?.to,
  });
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  const handleQuickSelect = (quickValue: DateFilterValue) => {
    if (quickValue === "custom") {
      setShowCustomCalendar(true);
    } else {
      onChange(quickValue);
      setOpen(false);
      setShowCustomCalendar(false);
    }
  };

  const handleCustomApply = () => {
    if (tempRange.from && tempRange.to && onCustomDateChange) {
      onCustomDateChange({ from: tempRange.from, to: tempRange.to });
      onChange("custom");
      setOpen(false);
      setShowCustomCalendar(false);
    }
  };

  const getDateRangeDisplay = () => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (value) {
      case "today":
        return { start: today, end: today, label: "היום" };
      case "yesterday":
        start = subDays(today, 1);
        return { start, end: start, label: "אתמול" };
      case "7":
        start = subDays(today, 6);
        return { start, end: today, label: null };
      case "14":
        start = subDays(today, 13);
        return { start, end: today, label: null };
      case "30":
        start = subDays(today, 29);
        return { start, end: today, label: null };
      case "90":
        start = subDays(today, 89);
        return { start, end: today, label: null };
      case "mtd":
        start = startOfMonth(today);
        return { start, end: today, label: "מתחילת החודש" };
      case "ytd":
        start = startOfYear(today);
        return { start, end: today, label: "מתחילת השנה" };
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          return { start: customDateRange.from, end: customDateRange.to, label: null };
        }
        return { start: today, end: today, label: "בחר תאריכים" };
      default:
        return { start: startOfMonth(today), end: today, label: null };
    }
  };

  const displayInfo = getDateRangeDisplay();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between text-right font-normal min-w-[200px]",
            !value && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-70" />
            <div className="flex items-center gap-2">
              {displayInfo.label ? (
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                  {displayInfo.label}
                </span>
              ) : null}
              <div className="flex items-center gap-1">
                {/* Start Date Cube */}
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-muted text-sm font-bold">
                  {format(displayInfo.start, "d")}
                </span>
                <span className="text-muted-foreground text-xs">/</span>
                <span className="inline-flex items-center justify-center px-1.5 h-7 rounded-md bg-muted text-xs font-medium">
                  {format(displayInfo.start, "MMM", { locale: he })}
                </span>
                
                {/* Separator if range */}
                {displayInfo.start.getTime() !== displayInfo.end.getTime() && (
                  <>
                    <span className="text-muted-foreground mx-1">—</span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-muted text-sm font-bold">
                      {format(displayInfo.end, "d")}
                    </span>
                    <span className="text-muted-foreground text-xs">/</span>
                    <span className="inline-flex items-center justify-center px-1.5 h-7 rounded-md bg-muted text-xs font-medium">
                      {format(displayInfo.end, "MMM", { locale: he })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {!showCustomCalendar ? (
          <div className="p-2 space-y-1">
            <div className="grid grid-cols-2 gap-1">
              {quickOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={value === option.value ? "default" : "ghost"}
                  size="sm"
                  className="justify-start"
                  onClick={() => handleQuickSelect(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="border-t pt-2 mt-2">
              <Button
                variant={value === "custom" ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setShowCustomCalendar(true)}
              >
                <Calendar className="w-4 h-4 ml-2" />
                תאריכים מותאמים אישית
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setShowCustomCalendar(false)}>
                ← חזור
              </Button>
              <span className="text-sm font-medium">בחר טווח תאריכים</span>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">מתאריך</p>
                <CalendarComponent
                  mode="single"
                  selected={tempRange.from}
                  onSelect={(date) => setTempRange({ ...tempRange, from: date })}
                  locale={he}
                  className={cn("p-3 pointer-events-auto rounded-md border")}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">עד תאריך</p>
                <CalendarComponent
                  mode="single"
                  selected={tempRange.to}
                  onSelect={(date) => setTempRange({ ...tempRange, to: date })}
                  locale={he}
                  disabled={(date) => tempRange.from ? date < tempRange.from : false}
                  className={cn("p-3 pointer-events-auto rounded-md border")}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowCustomCalendar(false)}>
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
        )}
      </PopoverContent>
    </Popover>
  );
}

// Helper function to convert filter value to date range
export function getDateRangeFromFilter(
  filter: DateFilterValue, 
  customRange?: { from: Date; to: Date }
): { startDate: string; endDate: string; dateFrom: string; dateTo: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date = today;

  switch (filter) {
    case "today":
      start = today;
      break;
    case "yesterday":
      start = new Date(today);
      start.setDate(start.getDate() - 1);
      end = new Date(start);
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
      start.setDate(start.getDate() - 6);
      break;
    case "14":
      start = new Date(today);
      start.setDate(start.getDate() - 13);
      break;
    case "30":
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      break;
    case "90":
      start = new Date(today);
      start.setDate(start.getDate() - 89);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

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