import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface StoreStatus {
  isOpen: boolean;
  closeReason: string;
}

export function useStoreStatus() {
  const [status, setStatus] = useState<StoreStatus>({ isOpen: true, closeReason: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/store/status`)
      .then(r => r.json())
      .then(data => setStatus(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { ...status, loaded };
}

// ── Business hours helpers ────────────────────────────────────────────────────

export function getBusinessHours(date: Date): { open: number; close: number } | null {
  const day = date.getDay();
  if (day === 0) return { open: 13 * 60, close: 19 * 60 }; // Sunday 1PM–7PM
  return { open: 7 * 60, close: 21 * 60 };                  // Mon–Sat 7AM–9PM
}

export function isOrderingOpen(): boolean {
  const now = new Date();
  const hours = getBusinessHours(now);
  if (!hours) return false;
  
  const nowMin = now.getHours() * 60 + now.getMinutes();
  
  // Store closes at 9:00 PM (1260 mins). Last pickup is 8:30 PM.
  // With a 30-min prep time, the ABSOLUTE LAST minute they can place an order is 8:00 PM.
  // (hours.close - 60) makes the system shut down right at 8:00 PM.
  return nowMin >= (hours.open - 30) && nowMin <= (hours.close - 60);
}

export function generateTimeSlots(): string[] {
  const now = new Date();
  const hours = getBusinessHours(now);
  if (!hours) return [];
  
  const slots: string[] = [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minMinutes = nowMinutes + 30; // 30-minute prep buffer
  const startMinutes = Math.ceil(minMinutes / 15) * 15;
  
  // Last slot's START time is 45 min before closing (so it ENDS exactly 30 min before closing)
  // For 9:00 PM closing, the loop stops at 8:15 PM.
  for (let m = startMinutes; m <= hours.close - 45; m += 15) {
    if (m < hours.open) continue;
    
    // 1. Calculate the START time
    const startH = Math.floor(m / 60);
    const startMin = m % 60;
    const startAmpm = startH >= 12 ? 'PM' : 'AM';
    const startH12 = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH;
    const startTimeStr = `${startH12}:${startMin.toString().padStart(2, '0')} ${startAmpm}`;

    // 2. Calculate the END time (+15 minutes)
    const endM = m + 15;
    const endH = Math.floor(endM / 60);
    const endMin = endM % 60;
    const endAmpm = endH >= 12 ? 'PM' : 'AM';
    const endH12 = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
    const endTimeStr = `${endH12}:${endMin.toString().padStart(2, '0')} ${endAmpm}`;

    // 3. Combine into the range
    slots.push(`${startTimeStr} - ${endTimeStr}`);
  }
  
  return slots;
}