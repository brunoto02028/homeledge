'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface EntityInfo {
  id: string;
  name: string;
  type: string;
  taxRegime: string;
  isDefault: boolean;
}

interface EntityContextValue {
  entities: EntityInfo[];
  selectedEntityId: string | null;
  selectedEntity: EntityInfo | null;
  setSelectedEntityId: (id: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EntityContext = createContext<EntityContextValue>({
  entities: [],
  selectedEntityId: null,
  selectedEntity: null,
  setSelectedEntityId: () => {},
  loading: true,
  refresh: async () => {},
});

export const useEntityContext = () => useContext(EntityContext);

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/entities');
      if (res.ok) {
        const data = await res.json();
        setEntities(data);

        // Restore from localStorage or pick default
        const saved = localStorage.getItem('homeledger-entity');
        if (saved && data.find((e: EntityInfo) => e.id === saved)) {
          setSelectedEntityId(saved);
        } else {
          const defaultEntity = data.find((e: EntityInfo) => e.isDefault);
          if (defaultEntity) setSelectedEntityId(defaultEntity.id);
          else if (data.length > 0) setSelectedEntityId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  // Persist selection
  useEffect(() => {
    if (selectedEntityId) {
      localStorage.setItem('homeledger-entity', selectedEntityId);
    }
  }, [selectedEntityId]);

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || null;

  return (
    <EntityContext.Provider value={{
      entities,
      selectedEntityId,
      selectedEntity,
      setSelectedEntityId,
      loading,
      refresh: fetchEntities,
    }}>
      {children}
    </EntityContext.Provider>
  );
}
