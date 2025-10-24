'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedHour, setSelectedHour] = useState<string>('1');
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load students:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleRemoveStudent = async (email: string) => {
    if (!confirm(`Are you sure you want to remove this student? This action cannot be undone.`)) {
      return;
    }

    setRemoving(email);
    try {
      const response = await fetch('/api/students/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Remove from local state
        setStudents(students.filter(s => s.email !== email));
      } else {
        const error = await response.json();
        alert(`Failed to remove student: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student');
    } finally {
      setRemoving(null);
    }
  };

  const handleClearRoster = async () => {
    if (!confirm('Are you sure you want to clear the ENTIRE roster? This will remove ALL students from ALL hours. This action cannot be undone!')) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch('/api/students/clear', {
        method: 'POST',
      });

      if (response.ok) {
        setStudents([]);
        alert('Roster cleared successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to clear roster: ${error.error}`);
      }
    } catch (error) {
      console.error('Error clearing roster:', error);
      alert('Failed to clear roster');
    } finally {
      setClearing(false);
    }
  };

  const handleUploadPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhotos(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // Look for table cells with student info
      const cells = doc.querySelectorAll('th, td');
      const photoUpdates: Array<{email: string, photo: string}> = [];

      for (const cell of Array.from(cells)) {
        const paragraphs = cell.querySelectorAll('p');
        if (paragraphs.length >= 2) {
          // First p should have name, second p should have img
          const namePara = paragraphs[0];
          const imgPara = paragraphs[1];
          const img = imgPara.querySelector('img');

          if (img && img.src && namePara.textContent) {
            const name = namePara.textContent.trim();
            // Try to find matching student by name
            const matchingStudent = students.find(s =>
              s.name.toLowerCase() === name.toLowerCase()
            );

            if (matchingStudent) {
              photoUpdates.push({
                email: matchingStudent.email,
                photo: img.src
              });
            }
          }
        }
      }

      if (photoUpdates.length === 0) {
        alert('No valid photos found. Make sure the HTML has student names that match your roster.');
        setUploadingPhotos(false);
        return;
      }

      const response = await fetch('/api/students/update-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoUpdates }),
      });

      if (response.ok) {
        const result = await response.json();
        await loadStudents();
        alert(`Photos uploaded successfully!\nUpdated: ${result.updatedCount}\nNot found: ${result.notFoundCount}\nTotal students: ${result.totalStudents}`);
      } else {
        const error = await response.json();
        alert(`Failed to upload photos: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
      event.target.value = '';
    }
  };

  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      // Check if first line is a header
      const hasHeader = lines[0].toLowerCase().includes('email') ||
                       lines[0].toLowerCase().includes('name') ||
                       lines[0].toLowerCase().includes('hour');

      const dataLines = hasHeader ? lines.slice(1) : lines;

      const newStudents = dataLines.map(line => {
        const parts = line.split(',').map(p => p.trim());

        // Support different CSV formats:
        // 1. email,name,hour
        // 2. name,email,hour
        // We'll detect by checking if @ symbol is in first or second column

        if (parts[0].includes('@')) {
          // Format: email,name,hour
          return {
            email: parts[0] || '',
            name: parts[1] || '',
            hour: parts[2] || '1',
          };
        } else {
          // Format: name,email,hour
          return {
            name: parts[0] || '',
            email: parts[1] || '',
            hour: parts[2] || '1',
          };
        }
      }).filter(s => s.email && s.name);

      if (newStudents.length === 0) {
        alert('No valid student data found in CSV. Make sure your CSV has email, name, and hour columns.');
        setUploading(false);
        return;
      }

      const response = await fetch('/api/students/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: newStudents }),
      });

      if (response.ok) {
        const result = await response.json();
        await loadStudents(); // Reload the students list
        alert(`CSV uploaded successfully!\nNew students: ${result.newStudents}\nUpdated students: ${result.updatedStudents}\nTotal students: ${result.totalStudents}`);
      } else {
        const error = await response.json();
        alert(`Failed to upload CSV: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Failed to upload CSV');
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const filteredStudents = students.filter(s => s.hour === selectedHour);

  const getStudentCountByHour = (hour: string) => {
    return students.filter(s => s.hour === hour).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative">
        <Header currentPage="Manage Students" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Actions Bar */}
          <div className="mb-6">
            <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Roster Management</h2>
              <div className="flex flex-wrap gap-4">
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadCSV}
                    disabled={uploading}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className={`inline-block px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                      uploading
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {uploading ? (
                      <span className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Uploading...
                      </span>
                    ) : (
                      'Upload CSV Roster'
                    )}
                  </label>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleUploadPhotos}
                    disabled={uploadingPhotos}
                    className="hidden"
                    id="photos-upload"
                  />
                  <label
                    htmlFor="photos-upload"
                    className={`inline-block px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                      uploadingPhotos
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {uploadingPhotos ? (
                      <span className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Uploading...
                      </span>
                    ) : (
                      'Upload Student Photos'
                    )}
                  </label>
                </div>
                <button
                  onClick={handleClearRoster}
                  disabled={clearing || students.length === 0}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {clearing ? (
                    <span className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Clearing...
                    </span>
                  ) : (
                    'Clear Entire Roster'
                  )}
                </button>
              </div>
              <div className="mt-4 bg-brand-green-500/10 border border-brand-green-500/50 rounded-lg p-3 space-y-2">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">CSV Format:</span> Your CSV should have columns for email, name, and hour (1-4).
                  Headers are optional.
                </p>
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Photos Format:</span> HTML file with student names and photos in table format.
                  Student names in the HTML must match the names in your roster exactly.
                </p>
              </div>
            </div>
          </div>

          {/* Hour Selector */}
          <div className="mb-6">
            <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Select Class Hour</h2>
              <div className="grid grid-cols-4 gap-4">
                {['1', '2', '3', '4'].map((hour) => (
                  <button
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedHour === hour
                        ? 'bg-brand-green-500/20 border-brand-green-500 text-white'
                        : 'bg-neutral-900/50 border-neutral-600 text-neutral-400 hover:border-neutral-500'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {hour === '1' ? '1st' : hour === '2' ? '2nd' : hour === '3' ? '3rd' : '4th'} Hour
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {getStudentCountByHour(hour)}
                    </div>
                    <div className="text-xs mt-1">students</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Students in {selectedHour === '1' ? '1st' : selectedHour === '2' ? '2nd' : selectedHour === '3' ? '3rd' : '4th'} Hour
                <span className="ml-2 text-neutral-400 font-normal">({filteredStudents.length})</span>
              </h2>
              <div className="text-sm text-neutral-400">
                Click the × button to remove a student
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-brand-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-400">Loading students...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.email}
                    className="bg-neutral-900/50 border border-neutral-600 rounded-lg p-4 flex flex-col items-center relative group hover:border-neutral-500 transition-colors"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveStudent(student.email)}
                      disabled={removing === student.email}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold shadow-lg"
                      title="Remove student"
                    >
                      {removing === student.email ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        '×'
                      )}
                    </button>

                    {/* Photo */}
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-32 h-32 rounded-lg object-cover border-2 border-neutral-600 mb-3 shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-neutral-700 flex items-center justify-center border-2 border-neutral-600 mb-3">
                        <span className="text-neutral-400 font-bold text-4xl">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="w-full text-center">
                      <div className="font-medium text-neutral-200 mb-1 truncate" title={student.name}>
                        {student.name}
                      </div>
                      <div className="text-xs text-neutral-400 truncate" title={student.email}>
                        {student.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-300 mb-2">
                  No students in this hour
                </h3>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-brand-green-500/10 border border-brand-green-500/50 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">Note:</span> Removing a student here permanently updates the student database.
              They will no longer appear in attendance checks until you re-add them.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
