'use client';

import { useState } from 'react';

interface SourceCardProps {
  bookingUrl: string;
  onBookingUrlChange: (url: string) => void;
  isConnected: boolean;
  onConnect: () => void;
}

export default function SourceCard({
  bookingUrl,
  onBookingUrlChange,
  isConnected,
  onConnect,
}: SourceCardProps) {
  const [inputUrl, setInputUrl] = useState(bookingUrl);

  const handleConnect = () => {
    onBookingUrlChange(inputUrl);
    onConnect();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Source Calendar</h2>
            <p className="text-sm text-gray-500">Microsoft Bookings</p>
          </div>
        </div>
        {isConnected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Connected
          </span>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Booking URL
        </label>
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://outlook.office.com/bookwithme/user/..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleConnect}
          disabled={!inputUrl.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isConnected ? 'Update Source' : 'Connect Source'}
        </button>
      </div>

      {isConnected && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">Source URL configured</p>
          <p className="text-xs text-blue-600 mt-0.5 truncate">{bookingUrl}</p>
        </div>
      )}
    </div>
  );
}
