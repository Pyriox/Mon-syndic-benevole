'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'msb:last-activity-heartbeat';
const SESSION_ID_KEY = 'msb:session-id';

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

/**
 * Retourne l'ID de la session d'utilisation interne courante.
 * Disponible uniquement dans les composants client après le premier ping.
 */
export function getCurrentSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
}

async function pingActivity() {
  try {
    const res = await fetch('/api/activity/ping', {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({})) as { sessionId?: string | null };
      if (data.sessionId) {
        try { sessionStorage.setItem(SESSION_ID_KEY, data.sessionId); } catch { /* ignore */ }
      }
    }
  } catch {
    // Heartbeat best-effort only.
  }
}

export default function ActivityHeartbeat() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const lastHeartbeatRef = useRef(0);

  useEffect(() => {
    lastHeartbeatRef.current = getLastHeartbeatAt();
  }, []);

  const maybePing = () => {
    const now = Date.now();
    if (now - lastHeartbeatRef.current < HEARTBEAT_INTERVAL_MS) return;

    lastHeartbeatRef.current = now;
    setLastHeartbeatAt(now);
    void pingActivity();
  };

  useEffect(() => {
    if (!pathname || pathname === previousPathRef.current) return;
    previousPathRef.current = pathname;

    maybePing();
  }, [pathname]);

  useEffect(() => {
    const handleVisibleActivity = () => {
      if (document.visibilityState !== 'visible') return;

      maybePing();
    };

    const handleInteraction = () => {
      if (document.visibilityState !== 'visible') return;
      maybePing();
    };

    window.addEventListener('focus', handleVisibleActivity);
    document.addEventListener('visibilitychange', handleVisibleActivity);
    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('scroll', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('focus', handleVisibleActivity);
      document.removeEventListener('visibilitychange', handleVisibleActivity);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  return null;
}