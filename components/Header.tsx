'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HeaderProps {
  currentPage: string;
}

interface WorkspaceConfig {
  id: string;
  name: string;
  label: string;
  hour: string;
  startTime: string;
  endTime: string;
  startRapidMinutes?: number;
  endRapidMinutes?: number;
}

function convertTo12Hour(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function Header({ currentPage }: HeaderProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const openSettings = async () => {
    setLoadingSettings(true);
    setSaveError('');
    setSaveSuccess(false);
    setShowSettings(true);
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch {
      setSaveError('Failed to load settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleRapidChange = (index: number, field: 'startRapidMinutes' | 'endRapidMinutes', value: string) => {
    const parsed = Math.max(1, Math.min(60, parseInt(value) || 1));
    const updated = [...workspaces];
    updated[index] = { ...updated[index], [field]: parsed };
    setWorkspaces(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaces }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowSettings(false);
        }, 1200);
      } else {
        const data = await res.json();
        setSaveError(data.error || 'Failed to save');
      }
    } catch {
      setSaveError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Live Update', path: '/live-update' },
    { name: 'CSV Manager', path: '/csv-manager' },
    { name: 'Manage Students', path: '/students' },
    { name: 'Manage Workspaces', path: '/workspaces' },
  ];

  return (
    <>
      <header className="border-b border-neutral-700/50 bg-neutral-800/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <h1 className="text-xl font-bold text-white">{currentPage}</h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-4">
              {navItems.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-4">
                  {index > 0 && <span className="text-neutral-600">|</span>}
                  {item.name === currentPage ? (
                    <span className="text-sm text-brand-green-400 font-medium">
                      {item.name}
                    </span>
                  ) : (
                    <button
                      onClick={() => router.push(item.path)}
                      className="text-sm text-neutral-400 hover:text-brand-green-400 transition-colors"
                    >
                      {item.name}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {/* Announcements Icon Button */}
            <button
              onClick={() => router.push('/announcements')}
              className="p-2 text-neutral-400 hover:text-brand-green-400 border border-neutral-600 hover:border-brand-green-600 rounded-lg transition-colors"
              title="Announcements"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </button>

            {/* Grades Icon Button */}
            <button
              onClick={() => router.push('/grades')}
              className="p-2 text-neutral-400 hover:text-brand-green-400 border border-neutral-600 hover:border-brand-green-600 rounded-lg transition-colors"
              title="Grades"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </button>

            {/* Settings (Gear) Icon Button */}
            <button
              onClick={openSettings}
              className="p-2 text-neutral-400 hover:text-brand-green-400 border border-neutral-600 hover:border-brand-green-600 rounded-lg transition-colors"
              title="Class Period Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-neutral-300 hover:text-white border border-neutral-600 hover:border-brand-green-600 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Rapid Refresh Windows</h2>
                <p className="text-xs text-neutral-500 mt-0.5">How many minutes at the start/end of each period to use fast refresh</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingSettings ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-brand-green-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 mb-1 px-1">
                  <div className="text-xs text-neutral-500 text-center">First N min → 30s refresh</div>
                  <div className="text-xs text-neutral-500 text-center">Last N min → 15s refresh</div>
                </div>
                {workspaces.map((ws, index) => (
                  <div key={ws.hour} className="bg-neutral-800/60 rounded-xl p-4">
                    <div className="text-sm font-semibold text-white mb-3">
                      {ws.label}
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        {convertTo12Hour(ws.startTime)} – {convertTo12Hour(ws.endTime)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Start window (min)</label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={ws.startRapidMinutes ?? 10}
                          onChange={e => handleRapidChange(index, 'startRapidMinutes', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">End window (min)</label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={ws.endRapidMinutes ?? 10}
                          onChange={e => handleRapidChange(index, 'endRapidMinutes', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-green-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {saveError && (
                  <p className="text-sm text-red-400">{saveError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saveSuccess}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-black bg-brand-green-500 hover:bg-brand-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
