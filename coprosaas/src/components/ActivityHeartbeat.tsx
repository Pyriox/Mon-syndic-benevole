'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'msb:last-activity-heartbeat';

function getLastHeartbeatAt() {
  try {
    const storedValue = sessionStorage.getItem(STORAGE_KEY);
    const parsedValue = Number(storedValue ?? 0);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  } catch {
    return 0;
  }
}

function setLastHeartbeatAt(value: number) {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Ignore storage failures.
  }
}

async function pingActivity() {
  try {
    await fetch('/api/activity/ping', {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
    });
  } catch {
    // Heartbeat best-effort only.
  }
}

export default function ActivityHeartbeat() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === previousPathRef.current) return;
    previousPathRef.current = pathname;

    const now = Date.now();
    if (now - getLastHeartbeatAt() < HEARTBEAT_INTERVAL_MS) return;

    setLastHeartbeatAt(now);
    void pingActivity();
  }, [pathname]);

  useEffect(() => {
    const handleVisibleActivity = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - getLastHeartbeatAt() < HEARTBEAT_INTERVAL_MS) return;

      setLastHeartbeatAt(now);
      void pingActivity();
    };

    window.addEventListener('focus', handleVisibleActivity);
    document.addEventListener('visibilitychange', handleVisibleActivity);

    return () => {
      window.removeEventListener('focus', handleVisibleActivity);
      document.removeEventListener('visibilitychange', handleVisibleActivity);
    };
  }, []);

  return null;
}