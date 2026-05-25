'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface EntityMap {
  [id: string]: string;
}

interface BreadcrumbContextValue {
  entities: EntityMap;
  setEntity: (id: string, name: string) => void;
}

const BreadcrumbCtx = createContext<BreadcrumbContextValue>({
  entities: {},
  setEntity: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<EntityMap>({});

  const setEntity = useCallback((id: string, name: string) => {
    setEntities((prev) => {
      if (prev[id] === name) return prev;
      return { ...prev, [id]: name };
    });
  }, []);

  return (
    <BreadcrumbCtx.Provider value={{ entities, setEntity }}>
      {children}
    </BreadcrumbCtx.Provider>
  );
}

export function useBreadcrumbEntity(id: string | undefined, name: string | undefined) {
  const { setEntity } = useContext(BreadcrumbCtx);
  if (id && name) {
    setEntity(id, name);
  }
}

export function useBreadcrumbEntities() {
  return useContext(BreadcrumbCtx).entities;
}
