import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface GsiButtonProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
  lastSyncTime: string | null;
  syncError: string | null;
}

export const GsiButton: React.FC<GsiButtonProps> = ({
  user,
  onSignIn,
  onSignOut,
  isLoading,
  isSyncing,
  onSync,
  lastSyncTime,
  syncError,
}) => {
  if (user) {
    return (
      <div id="google-auth-status-container" className="flex items-center gap-2 flex-wrap">
        <button
          id="sync-google-sheets-btn"
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 shadow-xs"
          title="ซิงค์ข้อมูลกับ Google Sheet (1dsyMuhOZ6LeEByJmH7Py6AIpGiVW66QN_Zs3YJxpmlo)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'กำลังซิงค์ Sheet...' : 'ซิงค์ Google Sheet'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg py-1 px-2.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-5 h-5 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user.displayName?.charAt(0) || 'G'}
            </div>
          )}
          <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate hidden sm:inline">
            {user.displayName || user.email}
          </span>
          <button
            id="signout-google-btn"
            onClick={onSignOut}
            title="ออกจากระบบ"
            className="text-slate-400 hover:text-red-500 transition-colors ml-1 p-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {syncError && (
          <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate max-w-[180px]">{syncError}</span>
          </div>
        )}
        {!syncError && lastSyncTime && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>ซิงค์ล่าสุด {lastSyncTime}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="google-signin-container" className="flex items-center gap-2">
      <button
        id="signin-with-google-btn"
        onClick={onSignIn}
        disabled={isLoading}
        className="gsi-material-button inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
      >
        <div className="w-4 h-4 shrink-0">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
        </div>
        <span>{isLoading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google Sheets'}</span>
      </button>
    </div>
  );
};
