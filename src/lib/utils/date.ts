import { format, formatDistance, formatRelative } from 'date-fns';

export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  return format(new Date(date), formatStr);
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'PPP p');
}

export function formatTimeAgo(date: Date | string): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

export function formatRelativeTime(date: Date | string): string {
  return formatRelative(new Date(date), new Date());
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function isToday(date: Date | string): boolean {
  const today = new Date();
  const compareDate = new Date(date);
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

