import { format, subDays, startOfMonth, startOfYear, subYears } from "date-fns";

export type DatePreset = "7d" | "14d" | "30d" | "mtd" | "ytd" | "custom";

export function getDateRange(preset: DatePreset, custom?: { from: Date; to: Date }) {
  const today = new Date();
  switch (preset) {
    case "7d": return { from: format(subDays(today, 6), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "14d": return { from: format(subDays(today, 13), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "30d": return { from: format(subDays(today, 29), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "mtd": return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "ytd": return { from: format(startOfYear(today), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "custom":
      if (custom) return { from: format(custom.from, "yyyy-MM-dd"), to: format(custom.to, "yyyy-MM-dd") };
      return { from: format(subDays(today, 29), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  }
}

export function getYoYRange(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return {
    from: format(subYears(fromDate, 1), "yyyy-MM-dd"),
    to: format(subYears(toDate, 1), "yyyy-MM-dd"),
  };
}

export function formatILS(num: number): string {
  if (num >= 1000000) return "₪" + (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return "₪" + (num / 1000).toFixed(1) + "K";
  return "₪" + num.toLocaleString("he-IL", { maximumFractionDigits: 0 });
}

export function formatNum(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL", { maximumFractionDigits: 0 });
}

export function formatPercent(num: number): string {
  return num.toFixed(1) + "%";
}
