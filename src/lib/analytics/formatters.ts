/**
 * Analytics formatting utilities
 * Centralized formatting functions for analytics display
 */

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

export function formatCurrency(num: number, currency = "ILS"): string {
  const symbol = currency === "USD" ? "$" : "₪";
  return symbol + formatNumber(num);
}

export function formatPercentage(num: number, decimals = 2): string {
  return num.toFixed(decimals) + "%";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
