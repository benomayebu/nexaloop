import { docStatusBadge, supStatusBadge, riskBadge, typeBadge } from '../badges';

describe('docStatusBadge', () => {
  it('returns emerald tone for APPROVED', () => {
    expect(docStatusBadge('APPROVED')).toEqual({ tone: 'emerald', label: 'Approved', dot: true });
  });
  it('returns amber tone for PENDING_REVIEW', () => {
    expect(docStatusBadge('PENDING_REVIEW')).toEqual({ tone: 'amber', label: 'Pending review', dot: true });
  });
  it('returns red tone for REJECTED', () => {
    expect(docStatusBadge('REJECTED')).toEqual({ tone: 'red', label: 'Rejected', dot: true });
  });
  it('returns red tone for EXPIRED', () => {
    expect(docStatusBadge('EXPIRED')).toEqual({ tone: 'red', label: 'Expired', dot: true });
  });
  it('returns slate for unknown status', () => {
    expect(docStatusBadge('UNKNOWN' as any)).toEqual({ tone: 'slate', label: 'UNKNOWN', dot: true });
  });
});

describe('supStatusBadge', () => {
  it('returns emerald for ACTIVE', () => {
    expect(supStatusBadge('ACTIVE')).toEqual({ tone: 'emerald', label: 'Active', dot: true });
  });
  it('returns indigo for PROSPECT (onboarding)', () => {
    expect(supStatusBadge('PROSPECT')).toEqual({ tone: 'indigo', label: 'Onboarding', dot: true });
  });
});

describe('riskBadge', () => {
  it('returns emerald for LOW', () => {
    expect(riskBadge('LOW')).toEqual({ tone: 'emerald', label: 'Low risk' });
  });
  it('returns red for HIGH', () => {
    expect(riskBadge('HIGH')).toEqual({ tone: 'red', label: 'High risk' });
  });
});

describe('typeBadge', () => {
  it('returns amber for MILL', () => {
    expect(typeBadge('MILL')).toEqual({ tone: 'amber', label: 'Mill' });
  });
  it('returns emerald for TIER1_FACTORY', () => {
    expect(typeBadge('TIER1_FACTORY')).toEqual({ tone: 'emerald', label: 'CMT factory' });
  });
  it('returns indigo for DYEHOUSE', () => {
    expect(typeBadge('DYEHOUSE')).toEqual({ tone: 'indigo', label: 'Dye house' });
  });
});
