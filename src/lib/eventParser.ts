import type { CalendarEventInput } from './calendarApi';

export interface ParsedEventResult extends CalendarEventInput {
  summaryExplanation: string;
}

// Client heuristic fallback in case offline or API unavailable
export function heuristicParseHebrew(text: string): ParsedEventResult {
  const now = new Date();
  let targetDate = new Date(now);

  const lower = text.trim();
  let reminderHours = 1; // default 1 hour before

  // Check for reminder mentions
  if (lower.includes('שעתיים לפני') || lower.includes('2 שעות לפני')) {
    reminderHours = 2;
  } else if (lower.includes('3 שעות לפני') || lower.includes('שלוש שעות לפני')) {
    reminderHours = 3;
  } else if (lower.includes('4 שעות לפני') || lower.includes('ארבע שעות לפני')) {
    reminderHours = 4;
  } else if (lower.includes('5 שעות לפני') || lower.includes('חמש שעות לפני')) {
    reminderHours = 5;
  } else if (lower.includes('חצי שעה לפני')) {
    reminderHours = 0.5;
  } else if (lower.includes('יום לפני') || lower.includes('24 שעות לפני')) {
    reminderHours = 24;
  } else if (lower.includes('ללא תזכורת') || lower.includes('בלי תזכורת')) {
    reminderHours = 0;
  } else {
    const reminderMatch = lower.match(/תזכורת\s+(\d+(?:\.\d+)?)\s+שעות/);
    if (reminderMatch) {
      reminderHours = parseFloat(reminderMatch[1]) || 1;
    }
  }

  // 1. Explicit Date format in Hebrew: DD/MM or DD.MM (e.g. 25/10, ב25/10, ב-25/10, 25.10)
  const explicitDateMatch = lower.match(/(?:בתאריך\s+|ב-?|ל-?)?(\d{1,2})[\/\.](\d{1,2})(?:[\/\.](\d{2,4}))?/);
  let foundExplicitDate = false;

  if (explicitDateMatch) {
    const day = parseInt(explicitDateMatch[1], 10);
    const month = parseInt(explicitDateMatch[2], 10);
    let year = explicitDateMatch[3] ? parseInt(explicitDateMatch[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      targetDate = new Date(year, month - 1, day);
      // If date was earlier in this year and no explicit year was specified, assume next year
      if (!explicitDateMatch[3] && targetDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
        targetDate.setFullYear(year + 1);
      }
      foundExplicitDate = true;
    }
  }

  // 2. Relative day (if no explicit date like 25/10 was found)
  if (!foundExplicitDate) {
    if (lower.includes('מחרתיים')) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (lower.includes('מחר')) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      const daysMap: Record<string, number> = {
        ראשון: 0,
        שני: 1,
        שלישי: 2,
        רביעי: 3,
        חמישי: 4,
        שישי: 5,
        שבת: 6,
      };
      for (const [dayName, dayIndex] of Object.entries(daysMap)) {
        if (lower.includes(`יום ${dayName}`) || lower.includes(`ביום ${dayName}`)) {
          const currentDay = now.getDay();
          let diff = dayIndex - currentDay;
          if (diff <= 0) diff += 7;
          targetDate.setDate(targetDate.getDate() + diff);
          break;
        }
      }
    }
  }

  // 3. Time extraction (e.g. 12:00, בשעה 12:00, 14:30, ב-11:00, 9 בבוקר, 8 בערב)
  let startTime = '10:00';
  let endTime = '11:00';
  let isAllDay = false;

  const timeMatch = lower.match(/(?:בשעה|ב-?|@)?\s*(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const endH = (hour + 1) % 24;
    endTime = `${endH.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } else {
    const simpleHourMatch = lower.match(/(?:בשעה|ב-?)\s*(\d{1,2})(?!\d|:)/);
    if (simpleHourMatch) {
      let h = parseInt(simpleHourMatch[1], 10);
      if (lower.includes('בערב') && h < 12) h += 12;
      if (lower.includes('בצהריים') && h < 12 && h >= 1) h += 12;
      startTime = `${h.toString().padStart(2, '0')}:00`;
      endTime = `${((h + 1) % 24).toString().padStart(2, '0')}:00`;
    }
  }

  if (lower.includes('כל היום') || lower.includes('יום שלם') || (lower.includes('יום הולדת') && !timeMatch)) {
    isAllDay = true;
  }

  // Format date to YYYY-MM-DD
  const yyyy = targetDate.getFullYear();
  const mm = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = targetDate.getDate().toString().padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // 4. Smart Title extraction:
  // Remove command prefixes, dates, times, reminders to leave the clean event title!
  let title = text
    // Remove command prefixes
    .replace(/^(?:תקבע\s+פגישה\s+ב?|תקבע\s+לי\s+פגישה\s+ב?|תקבע\s+לי\s+|תקבע\s+|לקבוע\s+|תוסיף\s+ליומן\s+|תכניס\s+ליומן\s+|תרשום\s+לי\s+|תזכיר\s+לי\s+|שים\s+ביומן\s+)/i, '')
    // Remove date tokens like ב25/10, ב-25/10, 25/10, מחר, מחרתיים, ביום ראשון
    .replace(/(?:בתאריך\s+|ב-?|ל-?)?\b\d{1,2}[\/\.]\d{1,2}(?:[\/\.]\d{2,4})?\b/g, '')
    .replace(/\b(?:מחרתיים|מחר|היום|ביום\s+[א-ת]+|יום\s+[א-ת]+)\b/g, '')
    // Remove time tokens like בשעה 12:00, ב-12:00, 12:00
    .replace(/(?:בשעה|ב-?|@)?\s*\b\d{1,2}:\d{2}\b/g, '')
    .replace(/(?:בשעה|ב-?)\s*\b\d{1,2}\s*(?:בבוקר|בערב|בצהריים)?\b/g, '')
    // Remove reminder mentions
    .replace(/(?:עם\s+)?תזכורת\s+\d+(?:\.\d+)?\s+שעות(?:\s+לפני)?/g, '')
    .replace(/(?:עם\s+)?תזכורת\s+(?:שעתיים|שלוש שעות|חצי שעה|יום)(?:\s+לפני)?/g, '')
    // Clean remaining punctuation and whitespace
    .replace(/^[\s,.\-–—]+|[\s,.\-–—]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If title was completely stripped or empty, fallback gracefully
  if (!title) {
    title = 'פגישה';
  }

  // Capitalize or format
  if (title.length > 60) {
    title = title.slice(0, 57) + '...';
  }

  return {
    title,
    startDate: dateStr,
    startTime,
    endDate: dateStr,
    endTime,
    isAllDay,
    location: '',
    description: text,
    reminderHours,
    summaryExplanation: `נקבע "${title}" לתאריך ${dd}/${mm}/${yyyy} בשעה ${startTime}`,
  };
}

export async function parseEventText(
  text: string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem'
): Promise<ParsedEventResult> {
  const currentTime = new Date().toISOString();

  try {
    const res = await fetch('/api/parse-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        currentTime,
        timeZone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'אירוע חדש',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        startTime: data.startTime || '10:00',
        endDate: data.endDate || data.startDate || new Date().toISOString().split('T')[0],
        endTime: data.endTime || '11:00',
        isAllDay: !!data.isAllDay,
        location: data.location || '',
        description: data.description || text,
        reminderHours: typeof data.reminderHours === 'number' ? data.reminderHours : 1,
        summaryExplanation: data.summaryExplanation || 'האירוע נותח בהצלחה',
      };
    }
  } catch (err) {
    console.warn('Backend parse endpoint failed, falling back to heuristic parsing:', err);
  }

  // Graceful fallback
  return heuristicParseHebrew(text);
}
