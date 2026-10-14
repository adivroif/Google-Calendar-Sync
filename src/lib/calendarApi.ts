export interface CalendarEventInput {
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  isAllDay: boolean;
  location?: string;
  description?: string;
  reminderHours?: number; // e.g. 1, 2, 3, etc.
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEventInput,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem'
): Promise<GoogleCalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  let startBody: any;
  let endBody: any;

  if (event.isAllDay) {
    startBody = { date: event.startDate };
    // For all-day events, Google Calendar's end date is exclusive.
    // If startDate === endDate, end should be the next day
    const nextDay = new Date(`${event.endDate}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    endBody = { date: nextDayStr };
  } else {
    // Format to ISO 8601 with local timezone offset or include timeZone field
    startBody = {
      dateTime: `${event.startDate}T${event.startTime}:00`,
      timeZone,
    };
    endBody = {
      dateTime: `${event.endDate}T${event.endTime}:00`,
      timeZone,
    };
  }

  // Reminder configuration
  let remindersBody: any = { useDefault: true };
  if (typeof event.reminderHours === 'number') {
    if (event.reminderHours === 0) {
      remindersBody = {
        useDefault: false,
        overrides: [],
      };
    } else {
      const minutes = Math.max(1, Math.round(event.reminderHours * 60));
      remindersBody = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes },
        ],
      };
    }
  }

  const payload: any = {
    summary: event.title || 'אירוע חדש',
    description: event.description || '',
    location: event.location || '',
    start: startBody,
    end: endBody,
    reminders: remindersBody,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || '';
    if (
      response.status === 401 ||
      response.status === 403 ||
      message.toLowerCase().includes('insufficient') ||
      message.toLowerCase().includes('scope')
    ) {
      throw new Error('INSUFFICIENT_SCOPES');
    }
    throw new Error(message || `שגיאה ביצירת אירוע ביומן (${response.status})`);
  }

  return response.json();
}

export async function fetchUpcomingEvents(
  accessToken: string,
  maxResults: number = 8
): Promise<GoogleCalendarEvent[]> {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || '';
    if (
      response.status === 401 ||
      response.status === 403 ||
      message.toLowerCase().includes('insufficient') ||
      message.toLowerCase().includes('scope')
    ) {
      throw new Error('INSUFFICIENT_SCOPES');
    }
    throw new Error(message || `שגיאה בטעינת אירועים מהיומן (${response.status})`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
    eventId
  )}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 410) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `שגיאה במחיקת האירוע (${response.status})`
    );
  }
}
