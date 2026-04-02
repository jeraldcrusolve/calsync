import * as ical from 'node-ical';

export interface BusySlot {
  start: string;
  end: string;
  subject: string;
}

export function parseIcsContent(icsContent: string): BusySlot[] {
  const slots: BusySlot[] = [];

  try {
    const parsed = ical.parseICS(icsContent);

    for (const key in parsed) {
      const event = parsed[key];
      if (!event || event.type !== 'VEVENT') continue;

      const start = event.start;
      const end = event.end;
      if (!start || !end) continue;

      // Skip all-day events (Date objects without time)
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) continue;

      slots.push({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        subject: (event.summary as string) || 'Busy',
      });
    }
  } catch {
    throw new Error('Failed to parse ICS file. Please ensure it is a valid iCalendar (.ics) file.');
  }

  // Sort chronologically
  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return slots;
}
