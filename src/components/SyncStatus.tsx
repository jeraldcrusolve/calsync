'use client';

import { format, addHours } from 'date-fns';

interface SyncStatusProps {
  lastSyncTime: string | null;
  isSyncing: boolean;
  onSyncNow: () => void;
  isReady: boolean;
}

export default function SyncStatus({ lastSyncTime, isSyncing, onSyncNow, isReady }: SyncStatusProps) {
  const nextSyncTime = lastSyncTime
    ? addHours(new Date(lastSyncTime), 1)
    : null;

  const formatTime = (isoString: string) => {
    return format(new Date(isoString), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Sync Status</h2>
        </div>

        <button
          onClick={onSyncNow}
          disabled={isSyncing || !isReady}
          className="flex items-center gap-2 py-2 px-5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSyncing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Syncing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Now
            </>
          )}
        </button>
      </div>

      {!isReady && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            Connect both source and target calendars to enable syncing.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Sync</p>
          <p className="text-sm font-medium text-gray-900">
            {lastSyncTime ? formatTime(lastSyncTime) : 'Never'}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Next Sync</p>
          <p className="text-sm font-medium text-gray-900">
            {nextSyncTime ? formatTime(nextSyncTime.toISOString()) : 'After first sync'}
          </p>
        </div>
      </div>
    </div>
  );
}
