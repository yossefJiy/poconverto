import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_TIMEOUT = 60 * 1000; // 1 minute warning

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  remainingTime: number;
  extendSession: () => void;
}

export const useSessionTimeout = (): UseSessionTimeoutReturn => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const logout = useCallback(async () => {
    clearAllTimeouts();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }, [clearAllTimeouts]);

  const startCountdown = useCallback(() => {
    setRemainingTime(60);
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimers = useCallback(() => {
    clearAllTimeouts();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    // Set warning timeout (14 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();

      // Set final logout timeout (1 minute after warning)
      timeoutRef.current = setTimeout(() => {
        logout();
      }, WARNING_BEFORE_TIMEOUT);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT);
  }, [clearAllTimeouts, logout, startCountdown]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      // Only reset if warning is not showing
      if (!showWarning) {
        resetTimers();
      }
    };

    // Initial timer setup
    resetTimers();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimeouts();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimers, clearAllTimeouts, showWarning]);

  return { showWarning, remainingTime, extendSession };
};
