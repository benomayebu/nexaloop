import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'xs' | 'sm' | 'default';

const variantStyles: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 border-transparent',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
};

const sizeStyles: Record<Size, string> = {
  xs:      'h-7 px-2.5 text-xs gap-1',
  sm:      'h-8 px-3 text-sm gap-1.5',
  default: 'h-9 px-4 text-sm gap-2',
};

interface NexaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const NexaButton = forwardRef<HTMLButtonElement, NexaButtonProps>(
  ({ variant = 'secondary', size = 'default', icon, iconRight, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }
);

NexaButton.displayName = 'NexaButton';
