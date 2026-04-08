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

const CLASS_HOURS = [
  { label: '1st Hour — 8:00 AM', value: '08:00' },
  { label: '2nd Hour — 10:00 AM', value: '10:00' },
  { label: '3rd Hour — 12:00 PM', value: '12:00' },
  { label: '4th Hour — 1:00 PM', value: '13:00' },
];

function getClassHour(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  if (time === 8 * 60) return '1st Hour';
  if (time === 10 * 60) return '2nd Hour';
  if (time === 12 * 60) return '3rd Hour';
  if (time === 13 * 60) return '4th Hour';
  return format(date, 'h:mm a');
}

function formatEventDate(start: string | null, allDay: boolean): string {
  if (!start) return 'No date';
  try {
    const date = parseISO(start);
    if (allDay) return format(date, 'EEEE, MMMM d, yyyy');
    return `${format(date, 'EEEE, MMMM d, yyyy')} · ${getClassHour(date)}`;
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

function todayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export default function AnnouncementsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(todayDateString());
  const [formAllDay, setFormAllDay] = useState(true);
  const [formHour, setFormHour] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function fetchEvents() {
    setLoading(true);
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
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function openModal() {
    setFormTitle('');
    setFormDescription('');
    setFormDate(todayDateString());
    setFormAllDay(true);
    setFormHour('08:00');
    setSubmitError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || null,
          date: formDate,
          hour: formHour,
          allDay: formAllDay,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create announcement');
      } else {
        setShowModal(false);
        fetchEvents();
      }
    } catch {
      setSubmitError('Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  }

  const upcomingEvents = events.filter(e => getEventStatus(e.start) !== 'past');
  const pastEvents = events.filter(e => getEventStatus(e.start) === 'past');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Announcements" />

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Announcements</h1>
              <p className="text-sm text-neutral-400">Upcoming events and announcements from Google Calendar</p>
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green-500 hover:bg-brand-green-600 text-black text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Announcement
            </button>
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
            <div className="space-y-2 mb-8">
              {upcomingEvents.map((event) => {
                const status = getEventStatus(event.start);
                return (
                  <div
                    key={event.id}
                    className={`bg-neutral-900/50 backdrop-blur-xl rounded-xl border px-5 py-3 transition-colors ${
                      status === 'today'
                        ? 'border-brand-green-500/50 bg-brand-green-500/5'
                        : 'border-neutral-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {status === 'today' && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-brand-green-500/20 text-brand-green-400 rounded-full border border-brand-green-500/30 flex-shrink-0">
                            Today
                          </span>
                        )}
                        <h2 className="text-sm font-semibold text-white truncate">{event.title}</h2>
                        {event.description && (
                          <span className="text-sm text-neutral-400 truncate hidden sm:block">— {event.description}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 text-sm text-neutral-400">
                        {event.location && (
                          <span className="hidden md:flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatEventDate(event.start, event.allDay)}
                        </span>
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

      {/* Add Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Add Announcement</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  placeholder="e.g. No School — Staff PD"
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  required
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Time</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeType"
                      checked={formAllDay}
                      onChange={() => setFormAllDay(true)}
                      className="accent-brand-green-500"
                    />
                    <span className="text-sm text-neutral-300">All day</span>
                  </label>
                  {CLASS_HOURS.map(h => (
                    <label key={h.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timeType"
                        checked={!formAllDay && formHour === h.value}
                        onChange={() => { setFormAllDay(false); setFormHour(h.value); }}
                        className="accent-brand-green-500"
                      />
                      <span className="text-sm text-neutral-300">{h.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Description <span className="text-neutral-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-green-500 resize-none"
                />
              </div>

              {submitError && (
                <p className="text-sm text-red-400">{submitError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-black bg-brand-green-500 hover:bg-brand-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
