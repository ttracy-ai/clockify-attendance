'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import Header from '@/components/Header';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
}

function formatEventDate(start: string | null, allDay: boolean): string {
  if (!start) return 'No date';
  try {
    const date = parseISO(start);
    if (allDay) return format(date, 'EEEE, MMMM d, yyyy');
    return format(date, 'EEEE, MMMM d, yyyy · h:mm a');
  } catch {
    return start;
  }
}

function getEventStatus(start: string | null): 'today' | 'upcoming' | 'past' {
  if (!start) return 'past';
  try {
    const date = parseISO(start);
    if (isToday(date)) return 'today';
    if (isFuture(date)) return 'upcoming';
    return 'past';
  } catch {
    return 'past';
  }
}

export default function AnnouncementsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.events || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load announcements');
        setLoading(false);
      });
  }, []);

  const upcomingEvents = events.filter(e => getEventStatus(e.start) !== 'past');
  const pastEvents = events.filter(e => getEventStatus(e.start) === 'past');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Announcements" />

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Announcements</h1>
            <p className="text-sm text-neutral-400">Upcoming events and announcements from Google Calendar</p>
          </div>

          {loading && (
            <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-12 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-brand-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-neutral-400">Loading announcements...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-700/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-300 mb-2">No announcements</h3>
              <p className="text-neutral-500">No upcoming events found on the calendar.</p>
            </div>
          )}

          {!loading && upcomingEvents.length > 0 && (
            <div className="space-y-4 mb-8">
              {upcomingEvents.map((event) => {
                const status = getEventStatus(event.start);
                return (
                  <div
                    key={event.id}
                    className={`bg-neutral-900/50 backdrop-blur-xl rounded-2xl border p-6 transition-colors ${
                      status === 'today'
                        ? 'border-brand-green-500/50 bg-brand-green-500/5'
                        : 'border-neutral-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {status === 'today' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-green-500/20 text-brand-green-400 rounded-full border border-brand-green-500/30">
                              Today
                            </span>
                          )}
                          <h2 className="text-lg font-semibold text-white">{event.title}</h2>
                        </div>

                        <p className="text-sm text-neutral-400 mb-3 flex items-center gap-1.5">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatEventDate(event.start, event.allDay)}
                        </p>

                        {event.location && (
                          <p className="text-sm text-neutral-400 mb-3 flex items-center gap-1.5">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </p>
                        )}

                        {event.description && (
                          <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && pastEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">Past</h2>
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-neutral-900/30 rounded-xl border border-neutral-800/50 px-5 py-4 opacity-60"
                  >
                    <p className="font-medium text-neutral-300">{event.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">{formatEventDate(event.start, event.allDay)}</p>
                    {event.description && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
