import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStudents, saveStudents } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, newHour } = await request.json();

    if (!email || !newHour) {
      return NextResponse.json(
        { error: 'Email and newHour are required' },
        { status: 400 }
      );
    }

    // Validate hour
    if (!['1', '2', '3', '4'].includes(newHour)) {
      return NextResponse.json(
        { error: 'Invalid hour. Must be 1, 2, 3, or 4' },
        { status: 400 }
      );
    }

    const students = await getStudents();

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found' },
        { status: 404 }
      );
    }

    // Find and update the student
    const studentIndex = students.findIndex(s => s.email.toLowerCase() === email.toLowerCase());

    if (studentIndex === -1) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const oldHour = students[studentIndex].hour;
    students[studentIndex].hour = newHour;

    await saveStudents(students);

    return NextResponse.json({
      success: true,
      studentName: students[studentIndex].name,
      oldHour,
      newHour
    });
  } catch (error) {
    console.error('Error updating student hour:', error);
    return NextResponse.json(
      { error: 'Failed to update student hour' },
      { status: 500 }
    );
  }
}
