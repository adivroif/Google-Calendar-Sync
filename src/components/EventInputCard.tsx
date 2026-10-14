import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, MicOff, ArrowLeft, RotateCcw } from 'lucide-react';

interface EventInputCardProps {
  onParse: (text: string) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_PROMPTS = [
  'תקבע פגישה ב25/10 דייט חודשי עם פרידה בשעה 12:00',
  'פגישת עבודה עם דני מחר ב-11:00 במשרד על התקציב, תזכורת שעתיים לפני',
  'רופא שיניים ביום שלישי הבא ב-16:30 במרפאת כללית, תזכורת 3 שעות לפני',
  'יום הולדת לשירה ביום שישי ב-20:00 במסעדה, להביא מתנה',
  'אימון כושר ביום חמישי ב-07:00 בבוקר למשך 45 דקות',
];

export const EventInputCard: React.FC<EventInputCardProps> = ({
  onParse,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'he-IL';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('הקלטת קול אינה נתמכת בדפדפן זה.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onParse(inputText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectSample = (sample: string) => {
    setInputText(sample);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>מה תרצה להכניס ליומן?</span>
            <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              בשפה טבעית
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            הקלד או הקלט בחופשיות – כולל שעה, תאריך, תיאור וכמה שעות לפני תרצה תזכורת.
          </p>
        </div>

        {inputText && (
          <button
            type="button"
            onClick={() => setInputText('')}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>נקה</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            dir="auto"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='לדוגמה: "פגישת צוות ביום חמישי הקרוב בשעה 14:00 במשרד על יעדי החודש, שים לי תזכורת 3 שעות לפני"'
            className="w-full text-slate-800 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 p-3.5 text-sm sm:text-base focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed"
          />

          {/* Voice button */}
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              title={isRecording ? 'עצור הקלטה' : 'הקלט קולית בעברית'}
              className={`p-2 rounded-lg transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-400/30'
                  : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">
            רעיונות מהירים לדוגמה (לחץ כדי לנסות):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSample(sample)}
                className="text-xs bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/60 text-slate-600 px-2.5 py-1.5 rounded-lg transition-colors text-right"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 hidden sm:block">
            טיפ: לחץ <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-[10px]">Ctrl+Enter</kbd> לניתוח מהיר
          </span>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>מזהה פרטים ותאריכים...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>זהה פרטים והכן ליומן</span>
                <ArrowLeft className="w-4 h-4 mr-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
