interface IconProps {
  className?: string;
}

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IconHome({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>;
}

export function IconTruck({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M1 7h13v10H1z" /><path d="M14 10h5l3 3v4h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
}

export function IconPackage({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5" /><path d="M12 12v10" /></svg>;
}

export function IconFile({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>;
}

export function IconQr({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M17 17v4h4v-4M21 17h-4" /></svg>;
}

export function IconLeaf({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M11 20A7 7 0 0 1 4 13V4h9a7 7 0 0 1 7 7v9z" /><path d="M4 20l16-16" /></svg>;
}

export function IconBook({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM6.5 17H20v4H6.5A2.5 2.5 0 0 1 4 18.5v0A2.5 2.5 0 0 1 6.5 17z" /></svg>;
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>;
}

export function IconSearch({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
}

export function IconBell({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-5 h-5'} {...s}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
}

export function IconChevronRight({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-4 h-4'} {...s}><path d="M9 18l6-6-6-6" /></svg>;
}

export function IconChevronDown({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className ?? 'w-4 h-4'} {...s}><path d="M6 9l6 6 6-6" /></svg>;
}
