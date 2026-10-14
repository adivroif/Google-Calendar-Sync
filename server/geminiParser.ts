import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ParsedEventResponse {
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm (24-hour)
  isAllDay: boolean;
  location: string;
  description: string;
  reminderHours: number; // Hours before event, e.g., 1, 2, 3
  summaryExplanation: string;
}

export async function parseEventWithGemini(
  text: string,
  userCurrentIsoTime: string,
  timeZone: string = 'Asia/Jerusalem'
): Promise<ParsedEventResponse> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const prompt = `אתה מומחה בינלאומי לחילוץ אירועים ופענוח טקסט טבעי בעברית עבור Google Calendar.
המשתמש הזין את הבקשה הבאה:
"""
${text}
"""

הזמן הנוכחי של המשתמש (כולל שנה נוכחית, חודש ויום): ${userCurrentIsoTime}
אזור הזמן (TimeZone): ${timeZone}

הנחיות קריטיות ומדויקות:
1. title (כותרת האירוע):
   - חלץ את השם / הנושא האמיתי של האירוע בלבד!
   - חובה לנקות מהכותרת את מילות הפקודה (כגון: "תקבע פגישה ב", "תקבע לי", "תוסיף ליומן", "תכניס אירוע", "תזכיר לי", "קבע פגישה").
   - חובה לא לכלול בכותרת את התאריך (למשל: "25/10", "מחר", "ביום שני") או את השעה (למשל: "בשעה 12:00") או את התזכורת.
   - דוגמה מובהקת: עבור "תקבע פגישה ב25/10 דייט חודשי עם פרידה בשעה 12:00", הכותרת חייבת להיות בדיוק: "דייט חודשי עם פרידה" (ולא "פגישה ב25/10 דייט חודשי...").

2. startDate ו-endDate (תאריכים בפורמט YYYY-MM-DD):
   - זיהוי תאריכים מפורשים בפורמט ישראלי (יום/חודש): למשל "25/10", "ב25/10", "25.10" משמעותו 25 באוקטובר!
   - חשב את השנה לפי הזמן הנוכחי (${userCurrentIsoTime}). אם התאריך טרם עבר בשנה הנוכחית, השתמש בשנה הנוכחית. אם עבר, השתמש בשנה הבאה.
   - זיהוי ימים יחסיים: "היום", "מחר", "מחרתיים", "ביום חמישי", "ביום שני הקרוב", "בעוד 3 ימים" – חשב במדויק מתוך הזמן הנוכחי.
   - endDate: בדרך כלל שווה ל-startDate, אלא אם מדובר באירוע מרובה ימים.

3. startTime ו-endTime (שעות בפורמט HH:mm של 24 שעות):
   - שעת התחלה: חלץ במדויק (למשל "12:00", "14:30", "09:00", "שמונה בערב" -> "20:00").
   - שעת סיום: אם צוין משך זמן (למשל "למשך שעתיים", "ל-45 דקות"), הוסף לשעת ההתחלה. אם לא צוין משך, קבע ברירת מחדל של שעה אחת אחרי שעת ההתחלה (למשל 12:00 עד 13:00).
   - אם לא צוינה שעה כלל וצוין "יום שלם" / "כל היום" / "יום הולדת", קבע isAllDay = true.

4. reminderHours (תזכורת כמה שעות לפני):
   - אם נכתב "תזכורת שעתיים לפני" -> 2.
   - אם נכתב "תזכורת 3 שעות לפני" -> 3.
   - אם נכתב "חצי שעה לפני" -> 0.5.
   - אם נכתב "יום לפני" -> 24.
   - אם נכתב "ללא תזכורת" -> 0.
   - אם לא צוין במפורש, ברירת מחדל 1 (שעה אחת לפני).

5. location: מיקום, כתובת, מסעדה או קישור לפגישה (אם קיים), אחרת מחרוזת ריקה "".
6. description: תיאור מפורט, נושאים וציטוט הטקסט המקורי של המשתמש.
7. summaryExplanation: משפט קצר, ברור ואלגנטי בעברית שמסכם בדיוק מה נקלט (לדוגמה: "נקבע 'דייט חודשי עם פרידה' לתאריך 25/10/2026 בשעה 12:00").`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startDate: { type: Type.STRING },
          startTime: { type: Type.STRING },
          endDate: { type: Type.STRING },
          endTime: { type: Type.STRING },
          isAllDay: { type: Type.BOOLEAN },
          location: { type: Type.STRING },
          description: { type: Type.STRING },
          reminderHours: { type: Type.NUMBER },
          summaryExplanation: { type: Type.STRING },
        },
        required: [
          'title',
          'startDate',
          'startTime',
          'endDate',
          'endTime',
          'isAllDay',
          'location',
          'description',
          'reminderHours',
          'summaryExplanation',
        ],
      },
    },
  });

  const rawJson = response.text || '{}';
  const parsed = JSON.parse(rawJson) as ParsedEventResponse;
  return parsed;
}
