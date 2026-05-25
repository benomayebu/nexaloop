import { fmtDate, daysUntil, relativeDays, initials } from '../format';

describe('fmtDate', () => {
  it('formats a date string as DD MMM YYYY', () => {
    expect(fmtDate('2026-05-22T00:00:00Z')).toBe('22 May 2026');
  });

  it('formats a Date object', () => {
    expect(fmtDate(new Date(2026, 0, 5))).toBe('05 Jan 2026');
  });

  it('returns em dash for null/undefined', () => {
    expect(fmtDate(null as any)).toBe('—');
    expect(fmtDate(undefined as any)).toBe('—');
  });
});

describe('daysUntil', () => {
  it('returns positive days for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysUntil(future.toISOString())).toBe(10);
  });

  it('returns negative days for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(daysUntil(past.toISOString())).toBe(-5);
  });

  it('returns null for null input', () => {
    expect(daysUntil(null as any)).toBeNull();
  });
});

describe('relativeDays', () => {
  it('returns "today" for today', () => {
    expect(relativeDays(new Date().toISOString())).toBe('today');
  });

  it('returns "in Xd" for < 30 days', () => {
    const d = new Date();
    d.setDate(d.getDate() + 12);
    expect(relativeDays(d.toISOString())).toBe('in 12d');
  });

  it('returns "Xd overdue" for past dates', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    expect(relativeDays(d.toISOString())).toBe('3d overdue');
  });

  it('returns em dash for null', () => {
    expect(relativeDays(null as any)).toBe('—');
  });
});

describe('initials', () => {
  it('returns first letters of first and last word', () => {
    expect(initials('Inês Madeira')).toBe('IM');
  });

  it('returns first two letters for single word', () => {
    expect(initials('Admin')).toBe('AD');
  });

  it('handles three-word names', () => {
    expect(initials('Rui De Moreira')).toBe('RM');
  });
});
