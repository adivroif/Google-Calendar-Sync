import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Trash2,
  RefreshCw,
  Bell,
  CalendarCheck,
} from 'lucide-react';
import type { GoogleCalendarEvent } from '../lib/calendarApi';

interface UpcomingEventsListProps {
  events: GoogleCalendarEvent[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteRequest: (event: GoogleCalendarEvent) => void;
  isUserSignedIn: boolean;
}

export const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({
  events,
  isLoading,
  onRefresh,
  onDeleteRequest,
  isUserSignedIn,
}) => {
  if (!isUserSignedIn) {
    return null;
  }

  const formatEventDate = (event: GoogleCalendarEvent) => {
    if (event.start.date) {
      // All day
      try {
        const d = new Date(event.start.date + 'T00:00:00');
        return {
          dateStr: d.toLocaleDateString('he-IL', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric',
          }),
          timeStr: 'יום שלם',
        };
      } catch {
        return { dateStr: event.start.date, timeStr: 'יום שלם' };
      }
    }

    if (event.start.dateTime) {
      try {
        const start = new Date(event.start.dateTime);
        const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;

        const dateStr = start.toLocaleDateString('he-IL', {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric',
        });

        const startTime = start.toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const endTime = end
          ? end.toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        return {
          dateStr,
          timeStr: endTime ? `${startTime} - ${endTime}` : startTime,
        };
      } catch {
        return { dateStr: '', timeStr: '' };
      }
    }

    return { dateStr: '', timeStr: '' };
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base text-slate-800">
            האירועים הקרובים ביומן Google שלך
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {events.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="רענן אירועים מיומן Google"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden sm:inline">רענן</span>
        </button>
      </div>

      {isLoading && events.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <span>טוען אירועים מיומן Google...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          אין אירועים קרובים כרגע ביומן. הוסף אירוע ראשון בעזרת התיבה למעלה!
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => {
            const { dateStr, timeStr } = formatEventDate(event);
            const reminderCount = event.reminders?.overrides?.length || 0;
            const hasPopupReminder = event.reminders?.overrides?.some((r) => r.method === 'popup');

            return (
              <div
                key={event.id}
                className="group p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                    {event.summary || 'אירוע ללא כותרת'}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeStr}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate max-w-[200px]">{event.location}</span>
                      </div>
                    )}

                    {hasPopupReminder && (
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 text-[11px]">
                        <Bell className="w-3 h-3" />
                        <span>מוגדרת תזכורת</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="צפה ביומן Google"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteRequest(event)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="מחק מיומן Google"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
