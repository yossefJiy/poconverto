import * as React from "react";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StyledDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showQuickOptions?: boolean;
}

export function StyledDatePicker({
  value,
  onChange,
  placeholder = "בחר תאריך",
  className,
  showQuickOptions = true,
}: StyledDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const handleQuickSelect = (option: "today" | "tomorrow") => {
    const date = option === "today" ? new Date() : addDays(new Date(), 1);
    onChange(date);
    setOpen(false);
  };

  // Get display label
  const getDisplayLabel = () => {
    if (!value) return null;
    if (isToday(value)) return "היום";
    if (isTomorrow(value)) return "מחר";
    return null;
  };

  const displayLabel = getDisplayLabel();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-right font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 opacity-70" />
            {value ? (
              <div className="flex items-center gap-2">
                {displayLabel && (
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                    {displayLabel}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {/* Day cube */}
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-muted text-sm font-bold">
                    {format(value, "d")}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  {/* Month cube */}
                  <span className="inline-flex items-center justify-center px-2 h-8 rounded-md bg-muted text-sm font-medium">
                    {format(value, "MMM", { locale: he })}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  {/* Year cube */}
                  <span className="inline-flex items-center justify-center w-12 h-8 rounded-md bg-muted text-sm font-medium">
                    {format(value, "yyyy")}
                  </span>
                </div>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {showQuickOptions && (
          <div className="flex gap-2 p-3 border-b border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickSelect("today")}
              className={cn(
                "flex-1",
                value && isToday(value) && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              היום
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickSelect("tomorrow")}
              className={cn(
                "flex-1",
                value && isTomorrow(value) && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              מחר
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelect(undefined)}
                className="text-muted-foreground"
              >
                נקה
              </Button>
            )}
          </div>
        )}
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
