import axios from 'axios';
import { addDays, formatISO } from 'date-fns';

export interface BusySlot {
  start: string;
  end: string;
  subject: string;
}

export function parseEmailFromBookingUrl(bookingUrl: string): string | null {
  try {
    const match = bookingUrl.match(/\/bookwithme\/user\/([^?/]+)/);
    if (!match) return null;
    const decoded = decodeURIComponent(match[1]);
    return decoded;
  } catch {
    return null;
  }
}

export async function fetchBusySlots(bookingUrl: string): Promise<BusySlot[]> {
  const userEmail = parseEmailFromBookingUrl(bookingUrl);
  if (!userEmail) {
    return generateMockSlots();
  }

  const now = new Date();
  const twoWeeksLater = addDays(now, 14);
  const startTime = formatISO(now);
  const endTime = formatISO(twoWeeksLater);

  try {
    const response = await axios.get(
      `https://outlook.office.com/bookwithme/api/booking/user/${encodeURIComponent(userEmail)}/slots`,
      {
        params: { startTime, endTime },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.data && Array.isArray(response.data)) {
      return response.data.map((slot: { start?: string; startTime?: string; end?: string; endTime?: string; subject?: string; title?: string }) => ({
        start: slot.start || slot.startTime || '',
        end: slot.end || slot.endTime || '',
        subject: slot.subject || slot.title || 'Busy',
      }));
    }

    return generateMockSlots();
  } catch {
    return generateMockSlots();
  }
}

function generateMockSlots(): BusySlot[] {
  const slots: BusySlot[] = [];
  const now = new Date();

  for (let day = 1; day <= 14; day++) {
    const date = addDays(now, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const morningSlot = new Date(date);
    morningSlot.setHours(9, 0, 0, 0);
    const morningEnd = new Date(date);
    morningEnd.setHours(10, 0, 0, 0);
    slots.push({
      start: morningSlot.toISOString(),
      end: morningEnd.toISOString(),
      subject: 'Booking',
    });

    if (day % 3 === 0) {
      const afternoonSlot = new Date(date);
      afternoonSlot.setHours(14, 0, 0, 0);
      const afternoonEnd = new Date(date);
      afternoonEnd.setHours(15, 0, 0, 0);
      slots.push({
        start: afternoonSlot.toISOString(),
        end: afternoonEnd.toISOString(),
        subject: 'Booking',
      });
    }
  }

  return slots;
}
