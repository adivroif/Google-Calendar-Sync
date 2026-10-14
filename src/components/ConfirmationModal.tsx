import React, { useEffect } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import type { ParsedEventResult } from '../lib/eventParser';

interface AddEventConfirmationModalProps {
  isOpen: boolean;
  event: ParsedEventResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const AddEventConfirmationModal: React.FC<AddEventConfirmationModalProps> = ({
  isOpen,
  event,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                אישור הוספת אירוע ליומן
              </h3>
              <p className="text-xs text-blue-100">
                פרטי האירוע שייכנס ליומן Google שלך
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Details Card */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2.5">
            <div className="font-bold text-base text-slate-900">
              {event.title}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {event.startDate}
                {event.endDate && event.endDate !== event.startDate && ` עד ${event.endDate}`}
              </span>
            </div>

            {!event.isAllDay ? (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {event.startTime} - {event.endTime}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                <span>אירוע לכל היום</span>
              </div>
            )}

            {/* Reminder Details */}
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/60">
              <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {event.reminderHours && event.reminderHours > 0
                  ? `תזכורת: ${event.reminderHours} שעות לפני תחילת האירוע`
                  : 'ללא תזכורת מראש'}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            {event.description && (
              <div className="text-xs text-slate-500 pt-2 border-t border-blue-100">
                <span className="font-semibold text-slate-700">הערות: </span>
                {event.description}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>האירוע יתווסף ליומן Google שלך באישור מפורש זה.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>מוסיף ליומן...</span>
              </>
            ) : (
              <span>אישור והוספה ליומן</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteEventConfirmationModalProps {
  isOpen: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const DeleteEventConfirmationModal: React.FC<DeleteEventConfirmationModalProps> = ({
  isOpen,
  eventTitle,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden"
        dir="rtl"
      >
        <div className="p-6 text-right space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">
            למחוק את האירוע מיומן Google?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            האם אתה בטוח שברצונך למחוק את האירוע{' '}
            <strong className="text-slate-900 font-bold">"{eventTitle}"</strong> מיומן גוגל שלך? פעולה זו תמחק אותו לצמיתות מהיומן.
          </p>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all"
          >
            {isProcessing ? 'מוחק...' : 'כן, מחק אירוע'}
          </button>
        </div>
      </div>
    </div>
  );
};
