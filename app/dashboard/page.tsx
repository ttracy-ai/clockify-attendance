'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { format } from 'date-fns';
import Header from '@/components/Header';

interface AttendanceResult {
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  presentStudents: string[];
  absentStudents: string[];
}

interface StudentWithPhoto {
  email: string;
  name: string;
  photo: string | null;
}

interface Workspace {
  id: string;
  name: string;
  label: string;
}

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [studentEmails, setStudentEmails] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available workspaces
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data.workspaces || []);
        if (data.workspaces && data.workspaces.length > 0) {
          setSelectedWorkspace(data.workspaces[0].id);
        }
      })
      .catch(err => console.error('Failed to load workspaces:', err));

    // Load student data
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        setAllStudents(data);
      })
      .catch(err => console.error('Failed to load students:', err));
  }, []);

  // Update student emails when workspace changes
  useEffect(() => {
    if (!selectedWorkspace || allStudents.length === 0) return;

    // Map workspace ID to hour number
    const workspaceHourMap: Record<string, string> = {
      '68ab4631cdd3100648caf4ed': '1',  // 1st Hour
      '68ab4b8ee201a71118cd502b': '2',  // 2nd Hour
      '68ab4d83d138cb5f24c57310': '3',  // 3rd Hour
      '68ab4e24e201a71118cd5084': '4',  // 4th Hour
    };

    const hour = workspaceHourMap[selectedWorkspace];
    if (hour) {
      const studentsForHour = allStudents
        .filter(s => s.hour === hour)
        .map(s => s.email);
      setStudentEmails(studentsForHour);
    }
  }, [selectedWorkspace, allStudents]);

  const getStudentInfo = (email: string): StudentWithPhoto => {
    const student = allStudents.find(s => s.email.toLowerCase() === email.toLowerCase());
    return {
      email,
      name: student?.name || email,
      photo: student?.photo || null
    };
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        // Extract emails from CSV (assuming first column or email column)
        const emails: string[] = [];

        results.data.forEach((row: any) => {
          if (Array.isArray(row)) {
            // If row is an array, take the first non-empty value
            const email = row.find((cell: any) => cell && typeof cell === 'string' && cell.includes('@'));
            if (email) emails.push(email.trim());
          } else if (typeof row === 'object') {
            // If row is an object, look for email field
            const email = row.email || row.Email || row.EMAIL || Object.values(row).find((val: any) =>
              typeof val === 'string' && val.includes('@')
            );
            if (email && typeof email === 'string') emails.push(email.trim());
          }
        });

        setStudentEmails(emails.filter(Boolean));
        setError('');
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  const handleCheckAttendance = async () => {
    if (studentEmails.length === 0) {
      setError('Please upload a student list first');
      return;
    }

    if (!selectedWorkspace) {
      setError('Please select a class hour');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/clockify/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          studentEmails,
          workspaceId: selectedWorkspace,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check attendance');
      }
    } catch (err) {
      setError('An error occurred while checking attendance');
      console.error('Attendance check error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Dashboard" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Student List Upload */}
              <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Student List</h2>

                <div className="space-y-4">
                  {studentEmails.length > 0 ? (
                    <div className="bg-gradient-to-br from-brand-green-500/10 to-brand-green-700/10 border border-brand-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">Auto-loaded for selected hour</p>
                          <p className="text-2xl font-bold text-brand-green-400">
                            {studentEmails.length} students
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-brand-green-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-neutral-400">
                        Select a class hour to load students
                      </p>
                    </div>
                  )}

                  <div className="border-t border-neutral-700/50 pt-4">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Or Upload Custom CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green-500 file:text-white hover:file:bg-brand-green-600 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      Optional: Override with custom list
                    </p>
                  </div>
                </div>
              </div>

              {/* Class Hour Selection */}
              <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Select Class Hour</h2>

                <select
                  value={selectedWorkspace}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Select Date</h2>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                />
              </div>

              {/* Check Button */}
              <button
                onClick={handleCheckAttendance}
                disabled={loading || studentEmails.length === 0}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-green-600 to-brand-green-700 hover:from-brand-green-700 hover:to-brand-green-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Checking...
                  </span>
                ) : (
                  'Check Attendance'
                )}
              </button>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-2">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-neutral-900/50 backdrop-blur-xl rounded-xl border border-neutral-700/50 p-4">
                      <p className="text-sm text-neutral-400 mb-1">Total Students</p>
                      <p className="text-3xl font-bold text-white">{result.totalStudents}</p>
                    </div>
                    <div className="bg-emerald-500/10 backdrop-blur-xl rounded-xl border border-emerald-500/50 p-4">
                      <p className="text-sm text-emerald-400 mb-1">Present</p>
                      <p className="text-3xl font-bold text-emerald-400">{result.presentCount}</p>
                    </div>
                    <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-500/50 p-4">
                      <p className="text-sm text-red-400 mb-1">Absent</p>
                      <p className="text-3xl font-bold text-red-400">{result.absentCount}</p>
                    </div>
                  </div>

                  {/* Absent Students List */}
                  <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Absent Students ({result.absentCount})
                    </h2>

                    {result.absentStudents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {result.absentStudents.map((email, index) => {
                          const student = getStudentInfo(email);
                          return (
                            <div
                              key={index}
                              className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex flex-col items-center hover:border-red-500/40 transition-colors"
                            >
                              {student.photo ? (
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  className="w-24 h-24 rounded-lg object-cover border-2 border-red-500/30 mb-3 shadow-lg"
                                />
                              ) : (
                                <div className="w-24 h-24 rounded-lg bg-red-500/20 flex items-center justify-center border-2 border-red-500/30 mb-3">
                                  <span className="text-red-400 font-bold text-3xl">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              )}
                              <div className="text-center w-full">
                                <div className="font-medium text-neutral-200 mb-1">{student.name}</div>
                                <div className="text-xs text-neutral-400 truncate" title={student.email}>{student.email}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-neutral-400 text-center py-8">
                        All students are present! 🎉
                      </p>
                    )}
                  </div>

                  {/* Present Students List */}
                  <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Present Students ({result.presentCount})
                    </h2>

                    {result.presentStudents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.presentStudents.map((email, index) => {
                          const student = getStudentInfo(email);
                          return (
                            <div
                              key={index}
                              className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 flex items-center space-x-3"
                            >
                              {student.photo ? (
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                                  <span className="text-emerald-400 font-bold text-lg">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-neutral-200">{student.name}</div>
                                <div className="text-xs text-neutral-400">{student.email}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-neutral-400 text-center py-8">
                        No students present
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!result && !error && (
                <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-700/50 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-300 mb-2">
                    Ready to Check Attendance
                  </h3>
                  <p className="text-neutral-500">
                    Upload a student list, select a date, and click &quot;Check Attendance&quot; to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
