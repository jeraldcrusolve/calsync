export interface BusySlot {
  start: string;
  end: string;
  subject: string;
}

function parseIcsDate(value: string): Date | null {
  try {
    // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS or YYYYMMDD
    const clean = value.split(';').pop()?.trim() ?? value.trim();
    if (clean.length === 8) {
      // All-day: YYYYMMDD
      return new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T00:00:00Z`);
    }
    const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!match) return null;
    const [, yr, mo, dy, hr, mn, sc, z] = match;
    return new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:${sc}${z || 'Z'}`);
  } catch {
    return null;
  }
}

export function parseIcsContent(icsContent: string): BusySlot[] {
  const slots: BusySlot[] = [];
  const lines = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Unfold continued lines (lines starting with space/tab are continuations)
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  let inEvent = false;
  let start: Date | null = null;
  let end: Date | null = null;
  let subject = 'Busy';

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      start = null;
      end = null;
      subject = 'Busy';
    } else if (line === 'END:VEVENT') {
      if (inEvent && start && end) {
        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          subject,
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        const val = line.split(':').slice(1).join(':');
        start = parseIcsDate(val);
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':').slice(1).join(':');
        end = parseIcsDate(val);
      } else if (line.startsWith('SUMMARY:')) {
        subject = line.slice(8) || 'Busy';
      }
    }
  }

  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return slots;
}
