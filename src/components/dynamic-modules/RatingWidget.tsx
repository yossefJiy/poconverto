import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RatingWidgetProps {
  messageId: string;
  currentRating?: number;
  onRate: (rating: number, feedback?: string) => void;
  compact?: boolean;
}

export function RatingWidget({ messageId, currentRating, onRate, compact = false }: RatingWidgetProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(currentRating || 0);
  const [feedback, setFeedback] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleRate = (rating: number) => {
    setSelected(rating);
    if (compact) {
      onRate(rating);
    }
  };

  const handleSubmit = () => {
    onRate(selected, feedback || undefined);
    setIsOpen(false);
  };

  const stars = [1, 2, 3, 4, 5];

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-4 h-4 transition-colors',
                (hovered || selected) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-7 px-2">
          <Star className={cn(
            'w-3.5 h-3.5',
            currentRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          )} />
          {currentRating ? (
            <span className="text-xs">{currentRating}</span>
          ) : (
            <span className="text-xs text-muted-foreground">דרג</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium text-center">איך הייתה התשובה?</div>
          
          <div className="flex justify-center gap-1">
            {stars.map((star) => (
              <button
                key={star}
                onClick={() => setSelected(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-6 h-6 transition-colors',
                    (hovered || selected) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>

          {selected > 0 && (
            <>
              <Textarea
                placeholder="משוב נוסף (אופציונלי)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Button onClick={handleSubmit} className="w-full" size="sm">
                שלח דירוג
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
