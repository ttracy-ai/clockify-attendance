'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Header from '@/components/Header';

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

interface StudentWithPhoto {
  email: string;
  name: string;
  photo: string | null;
}

interface ClassPeriod {
  hour: string;
  label: string;
  startTime: string;
  endTime: string;
  workspaceId: string;
  startRapidMinutes: number;
  endRapidMinutes: number;
}

export default function LiveUpdatePage() {
  const router = useRouter();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  const [absentStudents, setAbsentStudents] = useState<StudentWithPhoto[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<ClassPeriod | null>(null);
  const [manualPeriod, setManualPeriod] = useState<ClassPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(0);
  const [isFirstTenMinutes, setIsFirstTenMinutes] = useState(false);
  const [isLastTenMinutes, setIsLastTenMinutes] = useState(false);
  const [rapidRefreshMode, setRapidRefreshMode] = useState(false);
  const [rapidRefreshEndTime, setRapidRefreshEndTime] = useState<Date | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Determine which class period we're in
  const getCurrentPeriod = useCallback((): ClassPeriod | null => {
    if (classPeriods.length === 0) return null;

    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    for (const period of classPeriods) {
      if (currentTime >= period.startTime && currentTime <= period.endTime) {
        return period;
      }
    }
    return null;
  }, [classPeriods]);

  // Calculate refresh interval based on time within class period
  const getRefreshInterval = useCallback((period: ClassPeriod, isManual: boolean = false): number => {
    // If rapid refresh mode is active, use 15 seconds
    if (rapidRefreshMode && rapidRefreshEndTime && new Date() < rapidRefreshEndTime) {
      setIsFirstTenMinutes(false);
      setIsLastTenMinutes(false);
      return 15 * 1000;
    }

    // If rapid refresh time expired, turn it off
    if (rapidRefreshMode && rapidRefreshEndTime && new Date() >= rapidRefreshEndTime) {
      setRapidRefreshMode(false);
      setRapidRefreshEndTime(null);
    }

    // If manual mode, always use 10 minutes
    if (isManual) {
      setIsFirstTenMinutes(false);
      setIsLastTenMinutes(false);
      return 10 * 60 * 1000;
    }

    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    const [startHour, startMin] = period.startTime.split(':').map(Number);
    const [endHour, endMin] = period.endTime.split(':').map(Number);
    const [curHour, curMin] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = curHour * 60 + curMin;

    const minutesIntoClass = currentMinutes - startMinutes;
    const minutesUntilEnd = endMinutes - currentMinutes;

    // First N minutes: refresh every 30 seconds
    if (minutesIntoClass <= period.startRapidMinutes) {
      setIsFirstTenMinutes(true);
      setIsLastTenMinutes(false);
      return 30 * 1000;
    }

    // Last N minutes: refresh every 15 seconds
    if (minutesUntilEnd <= period.endRapidMinutes) {
      setIsFirstTenMinutes(false);
      setIsLastTenMinutes(true);
      return 15 * 1000;
    }

    // Middle of class: refresh every 10 minutes
    setIsFirstTenMinutes(false);
    setIsLastTenMinutes(false);
    return 10 * 60 * 1000;
  }, [rapidRefreshMode, rapidRefreshEndTime]);

  // Convert 24-hour time to 12-hour AM/PM format
  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Load workspace configuration and student data
  useEffect(() => {
    // Load workspaces
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        const periods: ClassPeriod[] = (data.workspaces || []).map((ws: any) => ({
          hour: ws.hour,
          label: ws.label,
          startTime: ws.startTime,
          endTime: ws.endTime,
          workspaceId: ws.id,
          startRapidMinutes: ws.startRapidMinutes ?? 10,
          endRapidMinutes: ws.endRapidMinutes ?? 10,
        }));
        setClassPeriods(periods);
      })
      .catch(err => console.error('Failed to load workspaces:', err));

    // Load students
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        setAllStudents(data);
      })
      .catch(err => console.error('Failed to load students:', err));
  }, []);

  // Get student info with photo
  const getStudentInfo = useCallback((email: string): StudentWithPhoto => {
    const student = allStudents.find(s => s.email.toLowerCase() === email.toLowerCase());
    return {
      email,
      name: student?.name || email,
      photo: student?.photo || null
    };
  }, [allStudents]);

  // Check attendance
  const checkAttendance = useCallback(async () => {
    const detectedPeriod = getCurrentPeriod();
    setCurrentPeriod(detectedPeriod);

    // If we're in a class period, use that and clear manual selection
    // Otherwise, use manual selection if available
    const period = detectedPeriod || manualPeriod;

    // If we detected a class period and it's different from manual, clear manual
    if (detectedPeriod && manualPeriod && detectedPeriod.hour !== manualPeriod.hour) {
      setManualPeriod(null);
    }

    if (!period || allStudents.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get students for this hour
      const studentsForHour = allStudents
        .filter(s => s.hour === period.hour)
        .map(s => s.email);

      // Check attendance
      const response = await fetch('/api/clockify/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(new Date(), 'yyyy-MM-dd'),
          studentEmails: studentsForHour,
          workspaceId: period.workspaceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const absentWithPhotos = data.absentStudents.map((email: string) => getStudentInfo(email));
        setAbsentStudents(absentWithPhotos);
        setLastUpdate(new Date());

        // Reset countdown timer after successful update
        const isManual = !detectedPeriod && !!manualPeriod;
        const interval = getRefreshInterval(period, isManual);
        setNextUpdateIn(Math.floor(interval / 1000));
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [getCurrentPeriod, allStudents, getStudentInfo, manualPeriod, getRefreshInterval]);

  // Initial check
  useEffect(() => {
    if (allStudents.length > 0) {
      checkAttendance();
    }
  }, [allStudents, checkAttendance]);

  // Auto-refresh with dynamic interval
  useEffect(() => {
    const activePeriod = currentPeriod || manualPeriod;

    if (!activePeriod) {
      // Check every minute if we're in a class period
      const interval = setInterval(() => {
        const period = getCurrentPeriod();
        if (period) {
          checkAttendance();
        }
      }, 60 * 1000);

      return () => clearInterval(interval);
    }

    // Pass isManual flag to getRefreshInterval
    const isManual = !currentPeriod && !!manualPeriod;
    let currentInterval = getRefreshInterval(activePeriod, isManual);
    let timer = setInterval(() => {
      checkAttendance();
    }, currentInterval);

    // Check every 30 seconds if we've transitioned to a different timing zone
    const zoneCheckTimer = setInterval(() => {
      const newInterval = getRefreshInterval(activePeriod, isManual);

      // If interval has changed (we've moved to a different time zone)
      if (newInterval !== currentInterval) {
        // Clear the old timer
        clearInterval(timer);

        // Immediately check attendance with new interval
        checkAttendance();

        // Set up new timer with updated interval
        currentInterval = newInterval;
        timer = setInterval(() => {
          checkAttendance();
        }, currentInterval);

        setNextUpdateIn(Math.floor(currentInterval / 1000));
      }
    }, 30 * 1000); // Check every 30 seconds

    // Update countdown every second
    const countdownTimer = setInterval(() => {
      setNextUpdateIn(prev => Math.max(0, prev - 1));
    }, 1000);

    setNextUpdateIn(Math.floor(currentInterval / 1000));

    return () => {
      clearInterval(timer);
      clearInterval(countdownTimer);
      clearInterval(zoneCheckTimer);
    };
  }, [currentPeriod, manualPeriod, getCurrentPeriod, checkAttendance, getRefreshInterval]);

  const handleManualPeriodSelect = (period: ClassPeriod) => {
    setManualPeriod(period);
    // Immediately check attendance for selected period
    setTimeout(() => checkAttendance(), 100);
  };

  const handleRapidRefresh = () => {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + 5);
    setRapidRefreshMode(true);
    setRapidRefreshEndTime(endTime);
    // Immediately trigger an update
    checkAttendance();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Live Update" collapsible onVisibilityChange={setHeaderVisible} />

        {/* Main Content */}
        <main
          className="px-6 py-8 transition-[padding-top] duration-300 ease-in-out"
          style={{ paddingTop: headerVisible ? '96px' : '24px' }}
        >
          {/* Status Bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-800/50 backdrop-blur-xl rounded-lg border border-neutral-700/50 px-3 py-1.5">
              <span className="text-xs text-neutral-400">Period:</span>
              <span className="text-xs font-semibold text-white">
                {currentPeriod ? currentPeriod.label : manualPeriod ? manualPeriod.label : 'No Class'}
              </span>
              {currentPeriod && <span className="text-xs bg-brand-green-500/20 text-green-400 px-1.5 py-0.5 rounded">LIVE</span>}
              {!currentPeriod && manualPeriod && <span className="text-xs bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded">MANUAL</span>}
            </div>

            <div className="flex items-center gap-2 bg-neutral-800/50 backdrop-blur-xl rounded-lg border border-neutral-700/50 px-3 py-1.5">
              <span className="text-xs text-neutral-400">Updated:</span>
              <span className="text-xs font-semibold text-white">{format(lastUpdate, 'h:mm:ss a')}</span>
              <span className="text-xs text-neutral-500">· next in {nextUpdateIn}s</span>
            </div>

            <div className="flex items-center gap-2 bg-neutral-800/50 backdrop-blur-xl rounded-lg border border-neutral-700/50 px-3 py-1.5">
              <span className="text-xs text-neutral-400">Refresh:</span>
              <span className="text-xs font-semibold text-white">
                {rapidRefreshMode ? '15s' : !currentPeriod && manualPeriod ? '10m' : isFirstTenMinutes ? '30s' : isLastTenMinutes ? '15s' : '10m'}
              </span>
              <span className="text-xs text-neutral-500">
                ({rapidRefreshMode ? 'rapid' : !currentPeriod && manualPeriod ? 'manual' : isFirstTenMinutes ? 'start' : isLastTenMinutes ? 'end' : 'mid'})
              </span>
            </div>

            {/* Rapid Refresh Button */}
            <button
              onClick={handleRapidRefresh}
              disabled={rapidRefreshMode}
              className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border-2 border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
              title="Activate 15-second refresh for 5 minutes"
            >
              {rapidRefreshMode ? (
                <svg className="w-4 h-4 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500 group-hover:text-red-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Not In Class Message / Manual Selection */}
          {!currentPeriod && !manualPeriod && !loading && (
            <div className="bg-brand-brand-green-500/10 border border-brand-brand-green-500/50 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-brand-green-500/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-brand-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No Class in Session</h2>
              <p className="text-neutral-400 mb-6">
                The live update will automatically start when a class period begins.
              </p>

              {/* Manual Period Selection */}
              <div className="max-w-2xl mx-auto mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Or Select a Period Manually:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {classPeriods.map(period => (
                    <button
                      key={period.hour}
                      onClick={() => handleManualPeriodSelect(period)}
                      className="bg-neutral-800/50 hover:bg-neutral-700/50 border-2 border-neutral-600 hover:border-brand-brand-green-500 rounded-lg p-4 transition-all"
                    >
                      <div className="text-lg font-bold text-white mb-1">{period.label}</div>
                      <div className="text-xs text-neutral-400">{convertTo12Hour(period.startTime)} - {convertTo12Hour(period.endTime)}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-4">
                  Manual selection will be overridden when the actual class period starts
                </p>
              </div>
            </div>
          )}

          {/* Students Missing Clockify */}
          {(currentPeriod || manualPeriod) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse shadow shadow-brand-green-500/50"></span>
                <span className="text-sm font-semibold text-brand-green-400">Missing Clockify Entry Today</span>
              </div>

              {initialLoad || loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-brand-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-neutral-400">{initialLoad ? 'Loading attendance data...' : 'Checking Clockify entries...'}</p>
                </div>
              ) : absentStudents.length > 0 ? (
                <div className="grid gap-4 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 160px))' }}>
                  {absentStudents.map((student, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center group"
                    >
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-full aspect-square rounded-xl object-cover mb-4 shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-brand-green-500/20 to-brand-green-600/10 flex items-center justify-center mb-4 shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300">
                          <span className="text-brand-green-400 font-bold text-5xl">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                      <div className="text-center w-full">
                        <div className="font-semibold text-white text-lg group-hover:text-brand-green-400 transition-colors">{student.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-green-500/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2">
                    All Students Completed!
                  </h3>
                  <p className="text-neutral-400">
                    Everyone has submitted their Clockify timesheet for today.
                  </p>
                </div>
              )}

              {/* Note for students still on the page */}
              <div className="mt-6">
                <p className="text-center text-neutral-300 text-lg">
                  If you completed Clockify today, but you are still on the page, please see Mr. Tracy
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
