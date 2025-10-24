import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStudents } from '@/lib/storage';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await getStudents();

    // Count students by hour and photo status
    const stats: Record<string, { total: number; withPhoto: number; withoutPhoto: number; names: string[] }> = {};

    students.forEach(student => {
      if (!stats[student.hour]) {
        stats[student.hour] = { total: 0, withPhoto: 0, withoutPhoto: 0, names: [] };
      }

      stats[student.hour].total++;

      if (student.photo) {
        stats[student.hour].withPhoto++;
        stats[student.hour].names.push(student.name + ' ✓');
      } else {
        stats[student.hour].withoutPhoto++;
        stats[student.hour].names.push(student.name + ' ✗');
      }
    });

    return NextResponse.json({
      totalStudents: students.length,
      statsByHour: stats,
      sampleStudents: students.slice(0, 5).map(s => ({
        name: s.name,
        email: s.email,
        hour: s.hour,
        hasPhoto: !!s.photo,
        photoPreview: s.photo ? s.photo.substring(0, 50) + '...' : null
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
