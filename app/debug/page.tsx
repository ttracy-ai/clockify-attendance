'use client';

import { useState } from 'react';
import Header from '@/components/Header';

interface WorkspaceUser {
  name: string;
  email: string;
  status: string;
}

interface Student {
  name: string;
  email: string;
  hour: string;
}

interface DiagnosticResults {
  workspaceUsers: { [hour: string]: WorkspaceUser[] };
  students: Student[];
  mismatches: {
    hour: string;
    studentEmail: string;
    studentName: string;
    inClockify: boolean;
  }[];
}

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/debug/diagnostics');
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Debug" />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Attendance Diagnostics</h1>
            <p className="text-neutral-300 mb-6">
              This tool will help diagnose why students are showing as absent by comparing
              your student roster with Clockify workspace users.
            </p>

            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 font-semibold">Error:</p>
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {results && (
              <div className="mt-8 space-y-6">
                {/* Workspace Users */}
                <div className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Clockify Workspace Users</h2>
                  {Object.entries(results.workspaceUsers).map(([hour, users]) => (
                    <div key={hour} className="mb-6">
                      <h3 className="text-lg font-medium text-brand-green-400 mb-2">
                        {hour === '1' ? '1st' : hour === '2' ? '2nd' : hour === '3' ? '3rd' : '4th'} Hour
                        ({users.length} users)
                      </h3>
                      <div className="grid gap-2">
                        {users.map((user) => (
                          <div
                            key={user.email}
                            className="bg-neutral-800/50 p-3 rounded border border-neutral-600 text-sm"
                          >
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-neutral-400">{user.email}</div>
                            <div className="text-xs text-neutral-500">{user.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email Mismatches */}
                {results.mismatches.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-orange-300 mb-4">
                      ⚠️ Email Mismatches Found ({results.mismatches.length})
                    </h2>
                    <p className="text-orange-200 mb-4">
                      These students are in your roster but NOT found in their Clockify workspace:
                    </p>
                    <div className="grid gap-2">
                      {results.mismatches.map((mismatch, idx) => (
                        <div
                          key={idx}
                          className="bg-neutral-900/50 p-3 rounded border border-orange-500/30"
                        >
                          <div className="text-white font-medium">{mismatch.studentName}</div>
                          <div className="text-orange-300">{mismatch.studentEmail}</div>
                          <div className="text-xs text-neutral-400">
                            {mismatch.hour === '1' ? '1st' : mismatch.hour === '2' ? '2nd' : mismatch.hour === '3' ? '3rd' : '4th'} Hour
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-neutral-800/50 rounded">
                      <p className="text-sm text-neutral-300">
                        <strong>To fix this:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-400 mt-2">
                        <li>Verify student emails in your CSV match their Clockify emails exactly</li>
                        <li>Make sure students are invited to the correct workspace</li>
                        <li>Check that students have accepted the workspace invitation</li>
                      </ol>
                    </div>
                  </div>
                )}

                {results.mismatches.length === 0 && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-green-300 mb-2">
                      ✓ All Emails Match!
                    </h2>
                    <p className="text-green-200">
                      All students in your roster are found in their respective Clockify workspaces.
                      If students are still showing as absent, they may not have logged time entries
                      for the date you're checking.
                    </p>
                  </div>
                )}

                {/* Student Roster Summary */}
                <div className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-700">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Student Roster Summary
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    {['1', '2', '3', '4'].map((hour) => {
                      const count = results.students.filter(s => s.hour === hour).length;
                      return (
                        <div key={hour} className="bg-neutral-800/50 p-4 rounded text-center">
                          <div className="text-2xl font-bold text-brand-green-400">{count}</div>
                          <div className="text-sm text-neutral-400">
                            {hour === '1' ? '1st' : hour === '2' ? '2nd' : hour === '3' ? '3rd' : '4th'} Hour
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
