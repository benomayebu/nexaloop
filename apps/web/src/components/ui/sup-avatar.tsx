import { initials } from '@/lib/format';

type SupplierType = string;

const typeColors: Record<string, string> = {
  MILL:          'bg-amber-100 text-amber-700',
  SPINNER:       'bg-amber-100 text-amber-700',
  DYEHOUSE:      'bg-indigo-100 text-indigo-700',
  TIER1_FACTORY: 'bg-emerald-100 text-emerald-700',
  TRIM_SUPPLIER: 'bg-slate-100 text-slate-700',
  AGENT:         'bg-slate-100 text-slate-600',
  OTHER:         'bg-slate-100 text-slate-600',
};

const sizes = {
  sm:      'w-8 h-8 text-[11px]',
  default: 'w-10 h-10 text-xs',
  lg:      'w-12 h-12 text-sm',
};

interface SupAvatarProps {
  name: string;
  type: SupplierType;
  size?: 'sm' | 'default' | 'lg';
}

export function SupAvatar({ name, type, size = 'default' }: SupAvatarProps) {
  const colorClass = typeColors[type] ?? 'bg-slate-100 text-slate-600';
  return (
    <div className={`inline-flex items-center justify-center rounded-full font-semibold ${colorClass} ${sizes[size]}`}>
      {initials(name)}
    </div>
  );
}
