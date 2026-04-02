'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

interface TargetCardProps {
  onAccessTokenChange: (token: string | null) => void;
  isConnected: boolean;
  userInfo: UserInfo | null;
}

export default function TargetCard({
  onAccessTokenChange,
  isConnected,
  userInfo,
}: TargetCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [msalInstance, setMsalInstance] = useState<import('@azure/msal-browser').PublicClientApplication | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMsal = async () => {
      const { PublicClientApplication } = await import('@azure/msal-browser');
      const { msalConfig } = await import('@/lib/msalConfig');
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();
      setMsalInstance(instance);
    };

    initMsal().catch(console.error);
  }, []);

  const handleSignIn = async () => {
    if (!msalInstance) return;
    setIsLoading(true);

    try {
      const { loginRequest } = await import('@/lib/msalConfig');
      const response = await msalInstance.loginPopup(loginRequest);
      onAccessTokenChange(response.accessToken);
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (msalInstance) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.logoutPopup({ account: accounts[0] }).catch(console.error);
      }
    }
    onAccessTokenChange(null);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userInfo');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Target Calendar</h2>
            <p className="text-sm text-gray-500">Microsoft 365</p>
          </div>
        </div>
        {isConnected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Connected
          </span>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Sign in with your Microsoft account to allow CalSync to create events on your calendar.
          </p>
          <button
            onClick={handleSignIn}
            disabled={isLoading || !msalInstance}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg viewBox="0 0 21 21" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
            )}
            Sign in with Microsoft
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
            <div className="w-9 h-9 bg-indigo-200 rounded-full flex items-center justify-center">
              <span className="text-indigo-700 font-semibold text-sm">
                {userInfo?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userInfo?.displayName || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userInfo?.mail || userInfo?.userPrincipalName || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
