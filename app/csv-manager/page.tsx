'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function CSVManagerPage() {
  const router = useRouter();
  const [emailList, setEmailList] = useState<string>('');
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setEmailList(pastedText);
  };

  const removeDuplicates = () => {
    const emails = emailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const uniqueEmails = Array.from(new Set(emails));
    setProcessedEmails(uniqueEmails);
  };

  const handleManualEdit = (index: number, newValue: string) => {
    const updated = [...processedEmails];
    updated[index] = newValue;
    setProcessedEmails(updated);
  };

  const handleRemoveEmail = (index: number) => {
    const updated = processedEmails.filter((_, i) => i !== index);
    setProcessedEmails(updated);
  };

  const handleAddEmail = () => {
    setProcessedEmails([...processedEmails, '']);
  };

  const downloadCSV = () => {
    const csvContent = processedEmails.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-emails-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setEmailList('');
    setProcessedEmails([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="CSV Manager" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Input */}
            <div className="space-y-6">
              <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Paste Email List</h2>

                <textarea
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Paste your email list here (one per line)..."
                  className="w-full h-96 px-4 py-3 bg-neutral-900/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent font-mono text-sm resize-none"
                />

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={removeDuplicates}
                    disabled={!emailList.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-green-500 to-brand-green-700 hover:from-brand-green-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Duplicates
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-3 text-sm text-neutral-300 hover:text-white border border-neutral-600 hover:border-neutral-500 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {emailList && (
                  <div className="mt-4 bg-neutral-900/50 rounded-lg p-3">
                    <p className="text-sm text-neutral-300">
                      <span className="font-medium text-brand-green-400">
                        {emailList.split('\n').filter(e => e.trim()).length}
                      </span>{' '}
                      emails in input
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Results & Editing */}
            <div className="space-y-6">
              <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Processed Emails
                    {processedEmails.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-neutral-400">
                        ({processedEmails.length} unique)
                      </span>
                    )}
                  </h2>
                  {processedEmails.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddEmail}
                        className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white border border-neutral-600 hover:border-neutral-500 rounded-lg transition-colors"
                      >
                        + Add
                      </button>
                      <button
                        onClick={downloadCSV}
                        className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Download CSV
                      </button>
                    </div>
                  )}
                </div>

                {processedEmails.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {processedEmails.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-neutral-900/50 border border-neutral-600 rounded-lg p-2"
                      >
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => handleManualEdit(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-transparent text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-green-500 rounded"
                        />
                        <button
                          onClick={() => handleRemoveEmail(index)}
                          className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-neutral-900/50 rounded-lg p-12 text-center">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-neutral-300 mb-2">
                      No emails processed yet
                    </h3>
                    <p className="text-neutral-500">
                      Paste your email list on the left and click &quot;Remove Duplicates&quot;
                    </p>
                  </div>
                )}
              </div>

              {processedEmails.length > 0 && (
                <div className="bg-brand-green-500/10 border border-brand-green-500/50 rounded-lg p-4">
                  <p className="text-sm text-brand-green-300">
                    <span className="font-semibold">Tip:</span> You can edit any email directly in the list above, add new entries, or remove unwanted ones before downloading.
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
