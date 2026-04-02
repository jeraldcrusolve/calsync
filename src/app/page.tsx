'use client';

import { useState, useEffect, useCallback } from 'react';
import SourceCard from '@/components/SourceCard';
import TargetCard from '@/components/TargetCard';
import SyncStatus from '@/components/SyncStatus';
import LogsTable from '@/components/LogsTable';
import { BusySlot } from '@/lib/bookingReader';

interface UserInfo {
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

interface SyncLog {
  id: number;
  timestamp: string;
  booking_url: string;
  slots_found: number;
  slots_created: number;
  status: 'success' | 'error';
  error_message: string | null;
}

export default function Home() {
  const [sourceSlots, setSourceSlots] = useState<BusySlot[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json() as { logs: SyncLog[] };
      setLogs(data.logs || []);
      if (data.logs && data.logs.length > 0) {
        setLastSyncTime(data.logs[0].timestamp);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('accessToken');
    const savedUserInfo = sessionStorage.getItem('userInfo');
    if (savedToken) setAccessToken(savedToken);
    if (savedUserInfo) {
      try { setUserInfo(JSON.parse(savedUserInfo) as UserInfo); } catch { /* ignore */ }
    }
    fetchLogs();
  }, [fetchLogs]);

  const handleAccessTokenChange = async (token: string | null) => {
    setAccessToken(token);
    if (token) {
      sessionStorage.setItem('accessToken', token);
      try {
        const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json() as UserInfo;
        setUserInfo(user);
        sessionStorage.setItem('userInfo', JSON.stringify(user));
      } catch { /* ignore */ }
    } else {
      setUserInfo(null);
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userInfo');
    }
  };

  const handleSyncNow = async () => {
    if (!sourceSlots.length || !accessToken) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: sourceSlots, accessToken }),
      });
      await res.json();
      await fetchLogs();
    } catch { /* Silent fail */ }
    finally { setIsSyncing(false); }
  };

  const isReady = sourceSlots.length > 0 && !!accessToken;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CalSync</h1>
              <p className="text-xs text-gray-500">Keep your calendars in sync, automatically</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex gap-6">
          <SourceCard slots={sourceSlots} onSlotsLoaded={setSourceSlots} />
          <TargetCard
            onAccessTokenChange={handleAccessTokenChange}
            isConnected={!!accessToken}
            userInfo={userInfo}
          />
        </div>

        <SyncStatus
          lastSyncTime={lastSyncTime}
          isSyncing={isSyncing}
          onSyncNow={handleSyncNow}
          isReady={isReady}
        />

        <LogsTable logs={logs} isLoading={isLoadingLogs} />
      </main>
    </div>
  );
}
