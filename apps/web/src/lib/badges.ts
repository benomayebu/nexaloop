export type BadgeTone = 'emerald' | 'amber' | 'red' | 'indigo' | 'slate';

export interface BadgeProps {
  tone: BadgeTone;
  label: string;
  dot?: boolean;
}

const DOC_STATUS_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  APPROVED:       { tone: 'emerald', label: 'Approved' },
  PENDING_REVIEW: { tone: 'amber',   label: 'Pending review' },
  REJECTED:       { tone: 'red',     label: 'Rejected' },
  EXPIRED:        { tone: 'red',     label: 'Expired' },
  EXPIRING:       { tone: 'amber',   label: 'Expiring soon' },
  MISSING:        { tone: 'slate',   label: 'Missing' },
};

export function docStatusBadge(status: string): BadgeProps {
  const m = DOC_STATUS_MAP[status];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? status, dot: true };
}

const SUP_STATUS_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  ACTIVE:   { tone: 'emerald', label: 'Active' },
  INACTIVE: { tone: 'slate',   label: 'Inactive' },
  PROSPECT: { tone: 'indigo',  label: 'Onboarding' },
};

export function supStatusBadge(status: string): BadgeProps {
  const m = SUP_STATUS_MAP[status];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? status, dot: true };
}

const RISK_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  LOW:     { tone: 'emerald', label: 'Low risk' },
  MEDIUM:  { tone: 'amber',   label: 'Medium risk' },
  HIGH:    { tone: 'red',     label: 'High risk' },
  UNKNOWN: { tone: 'slate',   label: 'Unknown' },
};

export function riskBadge(level: string): BadgeProps {
  const m = RISK_MAP[level];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? level };
}

const TYPE_MAP: Record<string, Omit<BadgeProps, 'dot'>> = {
  MILL:          { tone: 'amber',   label: 'Mill' },
  SPINNER:       { tone: 'amber',   label: 'Spinner' },
  DYEHOUSE:      { tone: 'indigo',  label: 'Dye house' },
  TIER1_FACTORY: { tone: 'emerald', label: 'CMT factory' },
  TRIM_SUPPLIER: { tone: 'slate',   label: 'Trim' },
  AGENT:         { tone: 'slate',   label: 'Agent' },
  OTHER:         { tone: 'slate',   label: 'Other' },
};

export function typeBadge(type: string): BadgeProps {
  const m = TYPE_MAP[type];
  return { tone: m?.tone ?? 'slate', label: m?.label ?? type };
}
