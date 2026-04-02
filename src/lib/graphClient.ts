import axios from 'axios';

export interface CalendarEvent {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  showAs: string;
  isAllDay: boolean;
}

export interface BusySlot {
  start: string;
  end: string;
  subject: string;
}

export async function getExistingEvents(
  accessToken: string,
  startTime: string,
  endTime: string
): Promise<CalendarEvent[]> {
  const response = await axios.get(
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startTime}&endDateTime=${endTime}&$filter=subject eq 'Busy (CalSync)'&$select=subject,start,end`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.value || [];
}

export async function createCalendarEvent(
  accessToken: string,
  slot: BusySlot
): Promise<void> {
  const event: CalendarEvent = {
    subject: 'Busy (CalSync)',
    start: {
      dateTime: slot.start,
      timeZone: 'UTC',
    },
    end: {
      dateTime: slot.end,
      timeZone: 'UTC',
    },
    showAs: 'busy',
    isAllDay: false,
  };

  await axios.post('https://graph.microsoft.com/v1.0/me/events', event, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function getUserProfile(accessToken: string): Promise<{ displayName: string; mail: string; userPrincipalName: string }> {
  const response = await axios.get('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}
