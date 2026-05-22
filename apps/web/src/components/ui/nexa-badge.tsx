import type { BadgeTone } from '@/lib/badges';

const toneStyles: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber:   'bg-amber-50 text-amber-700',
  red:     'bg-red-50 text-red-700',
  indigo:  'bg-indigo-50 text-indigo-700',
  slate:   'bg-slate-100 text-slate-600',
};

const dotStyles: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  indigo:  'bg-indigo-500',
  slate:   'bg-slate-400',
};

interface NexaBadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function NexaBadge({ tone = 'slate', dot, children, className = '' }: NexaBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${toneStyles[tone]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[tone]}`} />}
      {children}
    </span>
  );
}
