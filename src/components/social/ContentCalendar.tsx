// Content Calendar Component

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus,
  Calendar as CalendarIcon,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  platforms: string[];
  status: 'idea' | 'planned' | 'in_progress' | 'ready' | 'published';
  color: string;
}

interface ContentCalendarProps {
  entries: CalendarEntry[];
  onDateClick: (date: Date) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onAddEntry: (date: Date) => void;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  idea: { label: 'רעיון', className: 'bg-gray-100 text-gray-700' },
  planned: { label: 'מתוכנן', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'בעבודה', className: 'bg-yellow-100 text-yellow-700' },
  ready: { label: 'מוכן', className: 'bg-green-100 text-green-700' },
  published: { label: 'פורסם', className: 'bg-primary/20 text-primary' },
};

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function ContentCalendar({ 
  entries, 
  onDateClick, 
  onEntryClick, 
  onAddEntry 
}: ContentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.filter(e => e.date === dateStr);
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            לוח תוכן
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: he })}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayEntries = getEntriesForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isHovered = hoveredDate && isSameDay(day, hoveredDate);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] p-1 border rounded-lg transition-colors cursor-pointer",
                  !isCurrentMonth && "opacity-40",
                  isToday && "border-primary bg-primary/5",
                  isHovered && "border-primary/50 bg-accent"
                )}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => onDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {isHovered && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddEntry(day);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Entries */}
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClick(entry);
                      }}
                      className="w-full text-right p-1 rounded text-xs truncate transition-colors hover:opacity-80"
                      style={{ backgroundColor: entry.color + '20', color: entry.color }}
                    >
                      <div className="flex items-center gap-1">
                        {entry.platforms.slice(0, 2).map((platform) => {
                          const Icon = PLATFORM_ICONS[platform];
                          return Icon ? <Icon key={platform} className="h-3 w-3 flex-shrink-0" /> : null;
                        })}
                        <span className="truncate">{entry.title}</span>
                      </div>
                    </button>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEntries.length - 3} נוספים
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          {Object.entries(STATUS_LABELS).map(([status, { label, className }]) => (
            <Badge key={status} variant="secondary" className={className}>
              {label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ContentCalendar;
