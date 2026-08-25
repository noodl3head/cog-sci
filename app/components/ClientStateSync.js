'use client';

import { useEffect } from 'react';
import { collectSyncEntries } from '../../lib/agentData';

async function syncNow() {
  const entries = collectSyncEntries(window.localStorage);
  if (!entries.length) return;
  await fetch('/api/app-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
    keepalive: true,
  });
}

export default function ClientStateSync() {
  useEffect(() => {
    syncNow().catch(() => {});
    const timer = window.setInterval(() => syncNow().catch(() => {}), 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') syncNow().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return null;
}
