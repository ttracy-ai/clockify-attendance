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

    const { oldEmail, newName, newEmail } = await request.json();

    if (!oldEmail || !newName || !newEmail) {
      return NextResponse.json(
        { error: 'oldEmail, newName, and newEmail are required' },
        { status: 400 }
      );
    }

    // Get current students
    const students = await getStudents();

    // Find the student to update
    const studentIndex = students.findIndex(
      s => s.email.toLowerCase() === oldEmail.toLowerCase()
    );

    if (studentIndex === -1) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if new email already exists (and it's not the same student)
    if (newEmail.toLowerCase() !== oldEmail.toLowerCase()) {
      const emailExists = students.some(
        s => s.email.toLowerCase() === newEmail.toLowerCase()
      );

      if (emailExists) {
        return NextResponse.json(
          { error: 'A student with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Update the student
    students[studentIndex] = {
      ...students[studentIndex],
      name: newName,
      email: newEmail,
    };

    // Save updated students
    await saveStudents(students);

    return NextResponse.json({
      success: true,
      student: students[studentIndex],
    });
  } catch (error) {
    console.error('Error updating student info:', error);
    return NextResponse.json(
      {
        error: 'Failed to update student info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
