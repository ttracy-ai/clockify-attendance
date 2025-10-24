import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStudents, saveStudents } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Read students from blob storage
    const students = await getStudents();

    // Filter out the student
    const filteredStudents = students.filter(
      (s: any) => s.email.toLowerCase() !== email.toLowerCase()
    );

    // Save back to blob storage
    await saveStudents(filteredStudents);

    return NextResponse.json({
      success: true,
      removedCount: students.length - filteredStudents.length,
      remainingCount: filteredStudents.length
    });
  } catch (error) {
    console.error('Error removing student:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove student',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
