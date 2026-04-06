import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!email || !privateKey || !calendarId) {
    return NextResponse.json({
      error: 'Missing Google Calendar configuration',
      missing: {
        GOOGLE_SERVICE_ACCOUNT_EMAIL: !email,
        GOOGLE_PRIVATE_KEY: !privateKey,
        GOOGLE_CALENDAR_ID: !calendarId,
      }
    }, { status: 500 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // past 30 days
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
