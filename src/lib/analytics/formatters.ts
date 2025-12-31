/**
 * Analytics formatting utilities
 * Centralized formatting functions for analytics display
 */

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

export function formatCurrency(num: number | null | undefined, currency = "ILS"): string {
  if (num === null || num === undefined || isNaN(num)) return currency === "USD" ? "$0" : "₪0";
  const symbol = currency === "USD" ? "$" : "₪";
  return symbol + formatNumber(num);
}

export function formatPercentage(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined || isNaN(num)) return "0%";
  return num.toFixed(decimals) + "%";
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
