import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Bell,
  MapPin,
  FileText,
  CalendarPlus,
  CheckCircle,
} from 'lucide-react';
import type { ParsedEventResult } from '../lib/eventParser';

interface EventEditorCardProps {
  event: ParsedEventResult;
  onChange: (updated: ParsedEventResult) => void;
  onRequestSave: () => void;
  isSaving: boolean;
  isUserSignedIn: boolean;
  onSignInRequired: () => void;
}

const COMMON_REMINDER_PRESETS = [
  { label: 'ללא', hours: 0 },
  { label: 'חצי שעה (0.5)', hours: 0.5 },
  { label: 'שעה לפני (1)', hours: 1 },
  { label: 'שעתיים לפני (2)', hours: 2 },
  { label: '3 שעות לפני', hours: 3 },
  { label: '4 שעות לפני', hours: 4 },
  { label: '12 שעות לפני', hours: 12 },
  { label: 'יום לפני (24)', hours: 24 },
];

export const EventEditorCard: React.FC<EventEditorCardProps> = ({
  event,
  onChange,
  onRequestSave,
  isSaving,
  isUserSignedIn,
  onSignInRequired,
}) => {
  const updateField = <K extends keyof ParsedEventResult>(
    field: K,
    val: ParsedEventResult[K]
  ) => {
    onChange({
      ...event,
      [field]: val,
    });
  };

  const handleDurationChange = (minutes: number) => {
    if (!event.startTime) return;
    const [h, m] = event.startTime.split(':').map((x) => parseInt(x, 10) || 0);
    const startMinutes = h * 60 + m;
    const endMinutes = (startMinutes + minutes) % (24 * 60);
    const endH = Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');
    onChange({
      ...event,
      endTime: `${endH}:${endM}`,
    });
  };

  // Calculate reminder preview time
  const getReminderPreviewTime = () => {
    if (!event.reminderHours || event.reminderHours <= 0) return null;
    try {
      const dtStr = `${event.startDate}T${event.isAllDay ? '09:00' : event.startTime}:00`;
      const eventDate = new Date(dtStr);
      if (isNaN(eventDate.getTime())) return null;
      const reminderMs = event.reminderHours * 60 * 60 * 1000;
      const reminderDate = new Date(eventDate.getTime() - reminderMs);
      return reminderDate.toLocaleString('he-IL', {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const reminderTimeText = getReminderPreviewTime();

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80 transition-all">
      {/* Header with summary from AI */}
      <div className="mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">
              פרטי האירוע שזוהו
            </h3>
          </div>
          {event.summaryExplanation && (
            <p className="text-xs text-slate-600 mt-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
              {event.summaryExplanation}
            </p>
          )}
        </div>

        <div className="text-xs text-slate-400">
          בדוק את הפרטים וערוך לפי הצורך
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            כותרת האירוע <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            dir="auto"
            value={event.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="לדוגמה: פגישה עם יוסי"
            className="w-full text-slate-900 font-medium bg-slate-50/70 focus:bg-white rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
        </div>

        {/* Date fields */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>תאריך התחלה</span>
          </label>
          <input
            type="date"
            value={event.startDate}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                ...event,
                startDate: val,
                // keep end date synced if it was the same
                endDate: event.endDate <= event.startDate ? val : event.endDate,
              });
            }}
            className="w-full text-slate-800 bg-slate-50/70 focus:bg-white rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>תאריך סיום</span>
          </label>
          <input
            type="date"
            value={event.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
            className="w-full text-slate-800 bg-slate-50/70 focus:bg-white rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
        </div>

        {/* All-day toggle */}
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="allDayCheckbox"
            checked={event.isAllDay}
            onChange={(e) => updateField('isAllDay', e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <label
            htmlFor="allDayCheckbox"
            className="text-xs font-medium text-slate-700 cursor-pointer select-none"
          >
            אירוע של יום שלם (ללא שעות ספציפיות)
          </label>
        </div>

        {/* Times (if not all day) */}
        {!event.isAllDay && (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>שעת התחלה</span>
              </label>
              <input
                type="time"
                value={event.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="w-full text-slate-800 bg-white rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>שעת סיום</span>
                </label>
                {/* Duration chips */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="text-[10px]">משך:</span>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(30)}
                    className="hover:text-blue-600 underline"
                  >
                    30דק׳
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(60)}
                    className="hover:text-blue-600 underline"
                  >
                    שעה
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(90)}
                    className="hover:text-blue-600 underline"
                  >
                    1.5שעות
                  </button>
                </div>
              </div>
              <input
                type="time"
                value={event.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="w-full text-slate-800 bg-white rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        )}

        {/* KEY REQUIREMENT: Reminders (תזכורת כמה שעות לפני) */}
        <div className="md:col-span-2 bg-gradient-to-r from-amber-50/70 to-blue-50/70 p-4 rounded-xl border border-amber-200/70">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>תזכורת ביומן גוגל (כמה שעות לפני)</span>
              <span className="text-[11px] font-normal text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                דרישה מרכזית
              </span>
            </label>

            {reminderTimeText && (
              <span className="text-xs text-amber-900 font-medium">
                התראה ב: {reminderTimeText}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-3">
            הגדר התראת קופצת (Notification) שתישלח ליומן גוגל ולמכשירים שלך X שעות לפני מועד האירוע:
          </p>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_REMINDER_PRESETS.map((preset) => {
              const isSelected = event.reminderHours === preset.hours;
              return (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => updateField('reminderHours', preset.hours)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 font-semibold'
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 hover:border-amber-300'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom hours number input */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-slate-700 font-medium">או הקלד שעות באופן מותאם אישית:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="720"
                step="0.5"
                value={event.reminderHours ?? 1}
                onChange={(e) =>
                  updateField(
                    'reminderHours',
                    Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-20 bg-white text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-semibold text-center focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <span className="text-xs text-slate-600">שעות לפני האירוע</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>מיקום או קישור לפגישה (אופציונלי)</span>
          </label>
          <input
            type="text"
            dir="auto"
            value={event.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="לדוגמה: משרד ראשי, רחוב רוטשילד 1 תל אביב, או קישור ל-Zoom"
            className="w-full text-slate-800 bg-slate-50/70 focus:bg-white rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
        </div>

        {/* Description / Notes */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>תיאור והערות</span>
          </label>
          <textarea
            rows={2}
            dir="auto"
            value={event.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="פרטים נוספים, נושאים לפגישה, או תזכורות מיוחדות..."
            className="w-full text-slate-800 bg-slate-50/70 focus:bg-white rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>האירוע יתווסף ישירות ליומן Google הראשי שלך</span>
        </div>

        {isUserSignedIn ? (
          <button
            type="button"
            onClick={onRequestSave}
            disabled={isSaving || !event.title.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>יוצר אירוע ביומן...</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" />
                <span>הכנס ליומן Google עכשיו</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignInRequired}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-slate-800 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>התחבר עם Google כדי להכניס ליומן</span>
          </button>
        )}
      </div>
    </div>
  );
};
