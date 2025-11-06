'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface WorkspaceConfig {
  id: string;
  name: string;
  label: string;
  hour: string;
  startTime: string;
  endTime: string;
}

export default function ManageWorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError('Failed to load workspace configuration');
      setLoading(false);
    }
  };

  const handleWorkspaceChange = (index: number, field: keyof WorkspaceConfig, value: string) => {
    const updated = [...workspaces];
    updated[index] = { ...updated[index], [field]: value };
    setWorkspaces(updated);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate all workspaces
      for (const ws of workspaces) {
        if (!ws.id.trim()) {
          setError('All workspace IDs are required');
          setSaving(false);
          return;
        }
        if (!ws.name.trim() || !ws.label.trim()) {
          setError('All workspace names and labels are required');
          setSaving(false);
          return;
        }
        if (!ws.startTime || !ws.endTime) {
          setError('All class times are required');
          setSaving(false);
          return;
        }
      }

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaces }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Workspace configuration saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save workspace configuration');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const addWorkspace = () => {
    const newHour = (workspaces.length + 1).toString();
    setWorkspaces([
      ...workspaces,
      {
        id: '',
        name: `FALL 25 ${newHour}${newHour === '1' ? 'st' : newHour === '2' ? 'nd' : newHour === '3' ? 'rd' : 'th'} Hour`,
        label: `${newHour}${newHour === '1' ? 'st' : newHour === '2' ? 'nd' : newHour === '3' ? 'rd' : 'th'} Hour`,
        hour: newHour,
        startTime: '08:00',
        endTime: '09:00',
      },
    ]);
  };

  const removeWorkspace = (index: number) => {
    const updated = workspaces.filter((_, i) => i !== index);
    setWorkspaces(updated);
  };

  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Manage Workspaces" />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-neutral-900/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Manage Workspaces</h1>
              <p className="text-neutral-400">
                Configure your Clockify workspace IDs and class schedules. Changes take effect immediately.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-brand-green-500/10 border border-brand-green-500/50 text-brand-green-400 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <div className="space-y-6">
              {workspaces.map((workspace, index) => (
                <div
                  key={index}
                  className="bg-black/30 border border-neutral-700/50 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      {workspace.label || `Class Period ${index + 1}`}
                    </h3>
                    {workspaces.length > 1 && (
                      <button
                        onClick={() => removeWorkspace(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Remove workspace"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Workspace ID *
                      </label>
                      <input
                        type="text"
                        value={workspace.id}
                        onChange={(e) => handleWorkspaceChange(index, 'id', e.target.value)}
                        placeholder="e.g., 68ab4631cdd3100648caf4ed"
                        className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Find this in your Clockify workspace settings
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Hour Number *
                      </label>
                      <input
                        type="text"
                        value={workspace.hour}
                        onChange={(e) => handleWorkspaceChange(index, 'hour', e.target.value)}
                        placeholder="e.g., 1"
                        className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Workspace Name *
                      </label>
                      <input
                        type="text"
                        value={workspace.name}
                        onChange={(e) => handleWorkspaceChange(index, 'name', e.target.value)}
                        placeholder="e.g., SPRING 26 1st Hour"
                        className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Display Label *
                      </label>
                      <input
                        type="text"
                        value={workspace.label}
                        onChange={(e) => handleWorkspaceChange(index, 'label', e.target.value)}
                        placeholder="e.g., 1st Hour"
                        className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={workspace.startTime}
                        onChange={(e) => handleWorkspaceChange(index, 'startTime', e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {workspace.startTime ? convertTo12Hour(workspace.startTime) : 'Select time'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={workspace.endTime}
                        onChange={(e) => handleWorkspaceChange(index, 'endTime', e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {workspace.endTime ? convertTo12Hour(workspace.endTime) : 'Select time'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={addWorkspace}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors"
              >
                + Add Another Period
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-brand-green-600 to-brand-green-700 hover:from-brand-green-700 hover:to-brand-green-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center">
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
                    Saving...
                  </span>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>

            <div className="mt-8 bg-brand-green-500/5 border border-brand-green-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-brand-green-400 mb-2">How to Find Your Workspace ID:</h4>
              <ol className="text-sm text-neutral-300 space-y-1 list-decimal list-inside">
                <li>Log into Clockify and go to your workspace</li>
                <li>Click on Settings in the sidebar</li>
                <li>Look at the URL in your browser - it will look like: clockify.me/workspaces/<strong>YOUR_WORKSPACE_ID</strong>/settings</li>
                <li>Copy the workspace ID from the URL and paste it above</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
