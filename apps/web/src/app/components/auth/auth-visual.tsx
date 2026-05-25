// Orbital supply-chain SVG — renders the animated ring of nodes around a central "LOOP" badge.
// Used on the dark left panel of the auth shell.

export function AuthVisual() {
  const nodes = [
    { x: 120, y: 300, label: 'Mill' },
    { x: 210, y: 160, label: 'Dye' },
    { x: 390, y: 160, label: 'CMT' },
    { x: 480, y: 300, label: 'Trim' },
    { x: 390, y: 440, label: 'Finish' },
    { x: 210, y: 440, label: 'DPP' },
  ];

  return (
    <svg
      className="w-full max-w-[340px] mx-auto opacity-90"
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="auth-rg" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="300" cy="300" r="260" fill="url(#auth-rg)" />

      {/* Concentric orbit rings */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx="300"
          cy="300"
          r={80 + i * 40}
          stroke="#818cf8"
          strokeOpacity={0.15 + i * 0.04}
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />
      ))}

      {/* Flow arcs */}
      <g stroke="#c7d2fe" strokeWidth="1.5" fill="none" opacity="0.9">
        <path d="M120 300 a 180 180 0 0 1 360 0" />
        <path d="M480 300 a 180 180 0 0 1 -360 0" />
      </g>

      {/* Supply-chain nodes */}
      {nodes.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="14" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
          <text
            x={p.x}
            y={p.y + 32}
            fill="#c7d2fe"
            fontSize="11"
            fontFamily="var(--font-dm-mono), DM Mono, monospace"
            textAnchor="middle"
          >
            {p.label}
          </text>
        </g>
      ))}

      {/* Centre badge */}
      <circle cx="300" cy="300" r="28" fill="#4f46e5" />
      <text
        x="300"
        y="305"
        fill="#fff"
        fontSize="14"
        fontFamily="var(--font-dm-sans), DM Sans, sans-serif"
        fontWeight="600"
        textAnchor="middle"
      >
        LOOP
      </text>
    </svg>
  );
}
