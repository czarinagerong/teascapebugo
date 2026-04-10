// src/app/hooks/useMenuAvailability.ts
import { useState, useEffect, useCallback } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AvailabilityEntry {
  item_id: string;
  type: 'item' | 'flavor' | 'addon';
  name: string;
  available: boolean;
}

export function useMenuAvailability() {
  const [entries, setEntries] = useState<AvailabilityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    fetch(`${BASE}/menu/availability`)
      .then(r => r.json())
      .then((data: AvailabilityEntry[]) => setEntries(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isItemAvailable = (itemId: string): boolean => {
    if (!loaded) return true;
    const entry = entries.find(e => e.item_id === itemId && e.type === 'item');
    return entry ? entry.available : true;
  };

  const isFlavorAvailable = (itemId: string, flavorName: string): boolean => {
    if (!loaded) return true;
    const entry = entries.find(e => e.item_id === itemId && e.type === 'flavor' && e.name === flavorName);
    return entry ? entry.available : true;
  };

  const isAddonAvailable = (itemId: string, addonName: string): boolean => {
    if (!loaded) return true;
    const entry = entries.find(e => e.item_id === itemId && e.type === 'addon' && e.name === addonName);
    return entry ? entry.available : true;
  };

  // Returns true if ALL flavors of an item are unavailable (so item shows as sold out)
  const allFlavorsUnavailable = (itemId: string, flavorNames: string[]): boolean => {
    if (!loaded || flavorNames.length === 0) return false;
    return flavorNames.every(f => !isFlavorAvailable(itemId, f));
  };

  return { isItemAvailable, isFlavorAvailable, isAddonAvailable, allFlavorsUnavailable, loaded, refresh };
}

// ── Staff version — fetches full availability data for management ──────────────
export function useStaffAvailability(token: string) {
  const [entries, setEntries] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE}/staff/menu/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEntries(data);
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (item_id: string, type: 'item'|'flavor'|'addon', name: string, available: boolean) => {
    // Optimistic update
    setEntries(prev => {
      const idx = prev.findIndex(e => e.item_id === item_id && e.type === type && e.name === name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], available };
        return next;
      }
      return [...prev, { item_id, type, name, available }];
    });
    // Persist
    await fetch(`${BASE}/staff/menu/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ item_id, type, name, available }),
    });
  };

  const getAvailable = (item_id: string, type: string, name: string): boolean => {
    const entry = entries.find(e => e.item_id === item_id && e.type === type && e.name === name);
    return entry ? entry.available : true;
  };

  return { entries, loading, toggle, getAvailable, refresh };
}