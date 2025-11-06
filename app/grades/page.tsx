'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import Header from '@/components/Header';

interface StudentGradeData {
  name: string;
  email: string;
  hour: string;
  daysPresent: number;
  totalDays: number;
  percentage: number;
  photo: string | null;
}

interface GradesResponse {
  data: StudentGradeData[];
  cached: boolean;
  calculatedDate: string;
  message?: string;
  error?: string;
}

export default function GradesPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gradesData, setGradesData] = useState<StudentGradeData[]>([]);
  const [calculatedDate, setCalculatedDate] = useState<string>('');
  const [isCached, setIsCached] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string>('all');

  // Check for cached data on mount
  useEffect(() => {
    checkCache();
  }, []);

  const checkCache = async () => {
    try {
      const response = await fetch('/api/grades');
      const data = await response.json();

      if (data.hasCacheForToday && data.cache) {
        // Auto-load today's cached data
        setGradesData(data.cache.data);
        setCalculatedDate(data.cache.calculatedDate);
        setStartDate(data.cache.startDate);
        setEndDate(data.cache.endDate);
        setIsCached(true);
      }
    } catch (err) {
      console.error('Failed to check cache:', err);
    }
  };

  const calculateGrades = async (forceRecalculate = false) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          forceRecalculate,
        }),
      });

      const data: GradesResponse = await response.json();

      if (response.ok) {
        setGradesData(data.data);
        setCalculatedDate(data.calculatedDate);
        setIsCached(data.cached);

        if (data.message) {
          setError(data.message);
        }
      } else {
        setError(data.error || 'Failed to calculate grades');
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError('An error occurred while calculating grades');
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-brand-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPercentageBackground = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500/10 border-green-500/30';
    if (percentage >= 80) return 'bg-brand-green-500/10 border-brand-green-500/30';
    if (percentage >= 70) return 'bg-yellow-500/10 border-yellow-500/30';
    if (percentage >= 60) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const filteredData = selectedHour === 'all'
    ? gradesData
    : gradesData.filter(student => student.hour === selectedHour);

  const uniqueHours = Array.from(new Set(gradesData.map(s => s.hour))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Grades" />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Attendance Grades</h1>
                  <p className="text-sm text-neutral-400">
                    View student attendance completion rates over a date range
                  </p>
                </div>
                {calculatedDate && (
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Last calculated</p>
                    <p className="text-sm text-brand-green-400 font-medium">
                      {calculatedDate}
                      {isCached && <span className="ml-2 text-neutral-500">(cached)</span>}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => calculateGrades(false)}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-gradient-to-r from-brand-green-600 to-brand-green-700 hover:from-brand-green-700 hover:to-brand-green-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Calculating...' : 'Calculate'}
                  </button>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => calculateGrades(true)}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Force Refresh
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-brand-green-500/5 border border-brand-green-500/20 rounded-lg p-4">
              <p className="text-sm text-neutral-300">
                <strong className="text-brand-green-400">Note:</strong> Only days with at least 5 students submitting Clockify entries are counted as valid class days.
                This filters out weekends and holidays automatically. Results are cached daily to minimize API calls.
              </p>
            </div>

            {/* Results */}
            {gradesData.length > 0 && (
              <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Results ({filteredData.length} students)
                  </h2>

                  {/* Hour Filter */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-neutral-400">Filter:</label>
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="px-3 py-1 bg-black/50 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500"
                    >
                      <option value="all">All Hours</option>
                      {uniqueHours.map(hour => (
                        <option key={hour} value={hour}>{hour}{hour === '1' ? 'st' : hour === '2' ? 'nd' : hour === '3' ? 'rd' : 'th'} Hour</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">Student</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-neutral-400">Hour</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-neutral-400">Days Present</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-neutral-400">Total Days</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-neutral-400">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((student, index) => (
                        <tr
                          key={index}
                          className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {student.photo ? (
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover border border-neutral-600"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center border border-neutral-600">
                                  <span className="text-neutral-300 font-medium text-sm">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-white">{student.name}</div>
                                <div className="text-xs text-neutral-400">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-neutral-300">{student.hour}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-white font-medium">{student.daysPresent}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-neutral-300">{student.totalDays}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className={`inline-block px-3 py-1 rounded-lg border ${getPercentageBackground(student.percentage)}`}>
                              <span className={`font-bold text-lg ${getPercentageColor(student.percentage)}`}>
                                {student.percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && gradesData.length === 0 && (
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
                  No Grade Data
                </h3>
                <p className="text-neutral-500">
                  Select a date range and click Calculate to generate attendance grades.
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-brand-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-400">Calculating grades across date range...</p>
                <p className="text-sm text-neutral-500 mt-2">This may take a moment depending on the date range.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
