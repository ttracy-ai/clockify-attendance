import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const TIMEZONE = 'America/Chicago';

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) return null;

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

export async function GET() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();

  if (!auth || !calendarId) {
    return NextResponse.json({
      error: 'Missing Google Calendar configuration',
    }, { status: 500 });
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || '(No title)',
      description: event.description || null,
      start: event.start?.dateTime || event.start?.date || null,
      end: event.end?.dateTime || event.end?.date || null,
      allDay: !event.start?.dateTime,
      location: event.location || null,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Google Calendar error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getAuth();

  if (!auth || !calendarId) {
    return NextResponse.json({ error: 'Missing Google Calendar configuration' }, { status: 500 });
  }

  try {
    const { title, description, date, hour, allDay } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    let start, end;
    if (allDay) {
      const endDate = new Date(date + 'T00:00:00');
      endDate.setDate(endDate.getDate() + 1);
      start = { date };
      end = { date: endDate.toISOString().split('T')[0] };
    } else {
      const [h] = (hour as string).split(':').map(Number);
      const endHour = String(h + 1).padStart(2, '0');
      const endMin = (hour as string).split(':')[1];
      start = { dateTime: `${date}T${hour}:00`, timeZone: TIMEZONE };
      end = { dateTime: `${date}T${endHour}:${endMin}:00`, timeZone: TIMEZONE };
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title,
        description: description || undefined,
        start,
        end,
      },
    });

    return NextResponse.json({
      event: {
        id: event.data.id,
        title: event.data.summary || '(No title)',
        description: event.data.description || null,
        start: event.data.start?.dateTime || event.data.start?.date || null,
        end: event.data.end?.dateTime || event.data.end?.date || null,
        allDay: !event.data.start?.dateTime,
        location: event.data.location || null,
      },
    });
  } catch (error) {
    console.error('Google Calendar create error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
