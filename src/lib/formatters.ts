/**
 * Safe number formatting utilities that handle undefined, null, and NaN values
 */

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

export function formatCurrency(num: number | undefined | null, symbol: string = "₪"): string {
  return symbol + formatNumber(num);
}

export function formatPercent(num: number | undefined | null, decimals: number = 1): string {
  if (num === undefined || num === null || isNaN(num)) return "0%";
  return num.toFixed(decimals) + "%";
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function safeNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}
