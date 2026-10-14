import React from 'react';
import type { User } from 'firebase/auth';
import { Calendar, LogOut, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  hasAccessToken: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  hasAccessToken,
  onLogin,
  onLogout,
  isLoggingIn,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 leading-tight">
                יומן גוגל חכם
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              הוספת אירועים ותזכורות מותאמות אישית מתוך טקסט חופשי
            </p>
          </div>
        </div>

        {/* User / Auth actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {!hasAccessToken ? (
                <button
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isLoggingIn ? 'מחבר...' : 'חבר יומן (בלחיצה)'}</span>
                </button>
              ) : (
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <span>פתח יומן Google</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <div className="flex items-center gap-2.5 bg-slate-100/80 pl-2 pr-3 py-1.5 rounded-full border border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {user.displayName ? user.displayName.charAt(0) : 'U'}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-none">
                    {user.displayName || user.email?.split('@')[0] || 'משתמש מחובר'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {hasAccessToken ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        יומן מחובר
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">
                        ממתין לסנכרון
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="התנתק"
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-full hover:bg-slate-200/60 mr-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Official Google Sign-in button structure */
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="group relative inline-flex items-center justify-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
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
              <span>{isLoggingIn ? 'מתחבר ל-Google...' : 'התחבר עם Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
