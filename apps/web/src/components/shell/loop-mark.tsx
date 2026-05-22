interface LoopMarkProps {
  size?: number;
}

export function LoopMark({ size = 24 }: LoopMarkProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="loop-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M6 10a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v4a6 6 0 0 1-6 6h-8"
        stroke="url(#loop-grad)" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M26 22a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6v-4"
        stroke="url(#loop-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"
      />
      <circle cx="26" cy="10" r="2" fill="#4f46e5" />
    </svg>
  );
}
