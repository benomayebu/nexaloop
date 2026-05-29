'use client';

import { useSidebar } from './sidebar-context';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`flex-1 transition-[margin] duration-200 ${
        collapsed ? 'md:ml-16' : 'md:ml-sidebar'
      }`}
    >
      {children}
    </div>
  );
}
