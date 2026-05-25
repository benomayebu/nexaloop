const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function daysUntil(d: string | Date | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeDays(d: string | Date | null | undefined): string {
  const n = daysUntil(d);
  if (n == null) return '—';
  if (n < 0) return `${-n}d overdue`;
  if (n === 0) return 'today';
  if (n < 30) return `in ${n}d`;
  if (n < 60) return `in ${Math.floor(n / 7)}w`;
  return `in ${Math.floor(n / 30)}mo`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
