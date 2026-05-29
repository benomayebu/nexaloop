'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarCtx = createContext<SidebarState>({
  collapsed: false,
  toggle: () => {},
});

export function useSidebar() {
  return useContext(SidebarCtx);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  }

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarCtx.Provider>
  );
}
