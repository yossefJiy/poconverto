import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Pause, Square, Clock, Coins } from "lucide-react";
import { calculateTaskCredits, creditsToHours } from "@/hooks/useClientCredits";

interface TimeTrackerProps {
  taskId?: string;
  taskTitle?: string;
  onTimeUpdate?: (seconds: number, credits: number) => void;
  onStop?: (totalSeconds: number, credits: number) => void;
  className?: string;
}

export function TimeTracker({ 
  taskId, 
  taskTitle = "משימה",
  onTimeUpdate, 
  onStop,
  className 
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const currentCredits = calculateTaskCredits(Math.ceil(seconds / 60));

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => {
          const newSeconds = s + 1;
          const credits = calculateTaskCredits(Math.ceil(newSeconds / 60));
          onTimeUpdate?.(newSeconds, credits);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeUpdate]);

  const handleStart = () => {
    if (!isRunning) {
      setStartTime(new Date());
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop?.(seconds, currentCredits);
    setSeconds(0);
    setStartTime(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setStartTime(null);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            מעקב זמן
          </div>
          {isRunning && (
            <Badge variant="outline" className="bg-success/20 text-success animate-pulse">
              פעיל
            </Badge>
          )}
        </CardTitle>
        {taskTitle && (
          <p className="text-sm text-muted-foreground">{taskTitle}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center py-4">
          <div className={cn(
            "text-5xl font-mono font-bold tabular-nums",
            isRunning ? "text-success" : "text-foreground"
          )}>
            {formatTime(seconds)}
          </div>
          {startTime && (
            <p className="text-xs text-muted-foreground mt-2">
              התחיל ב-{startTime.toLocaleTimeString("he-IL")}
            </p>
          )}
        </div>

        {/* Credits Preview */}
        <div className="flex items-center justify-center gap-4 py-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs">זמן</span>
            </div>
            <p className="font-medium">{creditsToHours(currentCredits).toFixed(2)} שעות</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span className="text-xs">קרדיטים</span>
            </div>
            <p className="font-bold text-primary text-lg">{currentCredits}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button 
              onClick={handleStart} 
              className="w-24"
              variant="default"
            >
              <Play className="w-4 h-4 mr-1" />
              התחל
            </Button>
          ) : (
            <Button 
              onClick={handlePause} 
              className="w-24"
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-1" />
              עצור
            </Button>
          )}
          
          <Button 
            onClick={handleStop} 
            variant="destructive"
            disabled={seconds === 0}
            className="w-24"
          >
            <Square className="w-4 h-4 mr-1" />
            סיים
          </Button>
        </div>

        {seconds > 0 && !isRunning && (
          <Button 
            onClick={handleReset} 
            variant="ghost" 
            size="sm"
            className="w-full"
          >
            אפס
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
