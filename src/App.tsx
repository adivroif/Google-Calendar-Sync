/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  Bell,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './lib/firebase';
import {
  createGoogleCalendarEvent,
  fetchUpcomingEvents,
  deleteGoogleCalendarEvent,
  type GoogleCalendarEvent,
} from './lib/calendarApi';
import { parseEventText, type ParsedEventResult } from './lib/eventParser';
import { Navbar } from './components/Navbar';
import { EventInputCard } from './components/EventInputCard';
import { EventEditorCard } from './components/EventEditorCard';
import {
  AddEventConfirmationModal,
  DeleteEventConfirmationModal,
} from './components/ConfirmationModal';
import { UpcomingEventsList } from './components/UpcomingEventsList';
import { ToastContainer, type ToastMessage } from './components/NotificationToast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [needsScopeApproval, setNeedsScopeApproval] = useState(false);

  // Parsing & Event state
  const [isParsing, setIsParsing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ParsedEventResult | null>(null);

  // Calendar events list
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const [eventToDelete, setEventToDelete] = useState<GoogleCalendarEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to auth and preserve remembered user
  useEffect(() => {
    const unsubscribe = initAuth({
      onUserChanged: (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
    });
    return () => unsubscribe();
  }, []);

  // Fetch upcoming events when token is available
  const loadEvents = useCallback(async (token: string) => {
    setIsLoadingEvents(true);
    try {
      const events = await fetchUpcomingEvents(token, 10);
      setUpcomingEvents(events);
      setNeedsScopeApproval(false);
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_SCOPES') {
        setNeedsScopeApproval(true);
        addToast({
          type: 'error',
          title: 'דרושה הרשאת גישה ליומן Google',
          message: 'אנא אשר את הרשאת הגישה ליומן Google כדי לסנכרן אירועים.',
        });
      } else if (err.message === 'UNAUTHORIZED') {
        setAccessToken(null);
        addToast({
          type: 'error',
          title: 'פג תוקף החיבור ל-Google Calendar',
          message: 'אנא התחבר מחדש עם חשבון Google שלך.',
        });
      } else {
        console.error('Error fetching events:', err);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (accessToken) {
      loadEvents(accessToken);
    } else {
      setUpcomingEvents([]);
    }
  }, [accessToken, loadEvents]);

  // Handle Google Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setNeedsScopeApproval(false);
        addToast({
          type: 'success',
          title: 'התחברת בהצלחה!',
          message: `ברוך הבא, ${res.user.displayName || 'משתמש Google'}. כעת תוכל לסנכרן אירועים ליומן.`,
        });
        loadEvents(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      addToast({
        type: 'error',
        title: 'ההתחברות לא הושלמה',
        message: err.message || 'אנא ודא שאישרת גישה ליומן Google.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setUpcomingEvents([]);
    addToast({
      type: 'info',
      title: 'התנתקת מחשבון Google',
    });
  };

  // Parse natural language event
  const handleParseText = async (text: string) => {
    setIsParsing(true);
    try {
      const parsed = await parseEventText(text);
      setCurrentEvent(parsed);
      addToast({
        type: 'success',
        title: 'האירוע נותח בהצלחה!',
        message: parsed.summaryExplanation,
      });

      // Smooth scroll to the editor
      setTimeout(() => {
        const el = document.getElementById('event-editor-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'שגיאה בניתוח הטקסט',
        message: err.message || 'אנא נסה שוב או נסח אחרת.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Add event flow (triggers confirmation modal first)
  const handleRequestSave = () => {
    if (!user || !accessToken) {
      handleLogin();
      return;
    }
    if (!currentEvent || !currentEvent.title.trim()) {
      addToast({
        type: 'error',
        title: 'חסרה כותרת לאירוע',
      });
      return;
    }
    setShowAddModal(true);
  };

  // User confirmed in modal
  const handleConfirmAddEvent = async () => {
    if (!accessToken || !currentEvent) return;
    setIsAddingEvent(true);

    try {
      const created = await createGoogleCalendarEvent(accessToken, currentEvent);

      // Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      addToast({
        type: 'success',
        title: 'האירוע נוסף בהצלחה ליומן Google שלך!',
        message: `${created.summary || currentEvent.title} תואם ל-${currentEvent.startDate}`,
        link: created.htmlLink
          ? {
              url: created.htmlLink,
              text: 'צפה באירוע ב-Google Calendar',
            }
          : undefined,
      });

      // Reset form & reload upcoming events
      setCurrentEvent(null);
      setShowAddModal(false);
      loadEvents(accessToken);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      if (err.message === 'INSUFFICIENT_SCOPES') {
        setNeedsScopeApproval(true);
        addToast({
          type: 'error',
          title: 'דרושה הרשאת גישה ליומן',
          message: 'אנא אשר את הרשאת הגישה ליומן Google בחלון שנפתח.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'שגיאה בהוספת האירוע ליומן',
          message: err.message || 'אנא נסה שוב או בדוק את ההרשאות.',
        });
      }
    } finally {
      setIsAddingEvent(false);
    }
  };

  // Delete event flow
  const handleDeleteRequest = (event: GoogleCalendarEvent) => {
    setEventToDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      await deleteGoogleCalendarEvent(accessToken, eventToDelete.id);
      addToast({
        type: 'success',
        title: 'האירוע נמחק מיומן Google',
      });
      setEventToDelete(null);
      loadEvents(accessToken);
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      addToast({
        type: 'error',
        title: 'שגיאה במחיקת האירוע',
        message: err.message || 'אנא נסה שנית.',
      });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100 flex flex-col font-['Assistant',sans-serif]" dir="rtl">
      {/* Navbar */}
      <Navbar
        user={user}
        hasAccessToken={!!accessToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Banner / Instructions */}
        <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>בינה מלאכותית + סנכרון ישיר ל-Google Calendar</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              הזן טקסט חופשי – וזה נכנס ליומן גוגל שלך
            </h2>

            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              הקלד מה שתרצה בעברית (תאריך, שעה, תיאור, פגישה) עם אפשרות לקבוע <strong>תזכורת כמה שעות לפני</strong>. המערכת תזהה את כל הפרטים ותכניס אותם בלחיצה אחת ליומן Google הרשמי שלך.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs text-blue-100">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
                <Clock className="w-4 h-4 text-blue-200 shrink-0" />
                <span>זיהוי חכם של תאריכים ושעות</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
                <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                <span>הגדרת תזכורת X שעות לפני</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>אישור מפורש לפני כל סנכרון</span>
              </div>
            </div>
          </div>
        </section>

        {/* Not signed-in notice card */}
        {!user && (
          <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>חיבור ל-Google Calendar</span>
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                כדי להכניס את האירועים ישירות ליומן שלך, עליך להתחבר פעם אחת עם חשבון Google שלך ולאשר גישה ליומן.
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-amber-300 shadow-sm transition-all shrink-0 cursor-pointer"
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
              <span>{isLoggingIn ? 'מתחבר...' : 'התחבר עכשיו עם Google'}</span>
            </button>
          </section>
        )}

        {/* Remembered user session: 1-click calendar sync notice */}
        {user && !accessToken && !needsScopeApproval && (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-slate-900">
                  שלום, {user.displayName || user.email}! 👋
                </h3>
                <p className="text-xs text-slate-600">
                  המשתמש שלך מזוהה ושמור במערכת. לחץ על הכפתור כדי לסנכרן את יומן Google בלחיצה אחת.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{isLoggingIn ? 'מחבר יומן...' : 'סנכרן את יומן Google (בלחיצה)'}</span>
            </button>
          </section>
        )}

        {/* Needs Scope Permission Notice */}
        {user && needsScopeApproval && (
          <section className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-rose-900">
                  דרוש אישור הרשאה ליומן Google
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  התחברת עם Google, אך עדיין לא אושרה הרשאת הגישה ליומן (Google Calendar). לחץ על הכפתור כדי לאשר את הגישה וסמן את תיבת הבחירה של היומן בחלון של Google.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="shrink-0 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              {isLoggingIn ? 'פותח אישור...' : 'אשר הרשאת יומן גוגל עכשיו'}
            </button>
          </section>
        )}

        {/* Input Card */}
        <EventInputCard
          onParse={handleParseText}
          isLoading={isParsing}
        />

        {/* Parsed Event Editor (appears after parsing or if currentEvent exists) */}
        {currentEvent && (
          <div id="event-editor-section" className="scroll-mt-20">
            <EventEditorCard
              event={currentEvent}
              onChange={setCurrentEvent}
              onRequestSave={handleRequestSave}
              isSaving={isAddingEvent}
              isUserSignedIn={!!user && !!accessToken}
              onSignInRequired={handleLogin}
            />
          </div>
        )}

        {/* Upcoming events list */}
        <UpcomingEventsList
          events={upcomingEvents}
          isLoading={isLoadingEvents}
          onRefresh={() => accessToken && loadEvents(accessToken)}
          onDeleteRequest={handleDeleteRequest}
          isUserSignedIn={!!user && !!accessToken}
        />
      </main>

      {/* Confirmation Modals (Mandatory for destructive/mutating Workspace operations) */}
      <AddEventConfirmationModal
        isOpen={showAddModal}
        event={currentEvent}
        onConfirm={handleConfirmAddEvent}
        onCancel={() => setShowAddModal(false)}
        isProcessing={isAddingEvent}
      />

      <DeleteEventConfirmationModal
        isOpen={!!eventToDelete}
        eventTitle={eventToDelete?.summary || 'האירוע הנבחר'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEventToDelete(null)}
        isProcessing={isDeletingEvent}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>
          מחובר ישירות ל-Google Calendar API • כל המידע והאירועים מסונכרנים באישור המשתמש
        </p>
      </footer>
    </div>
  );
}
