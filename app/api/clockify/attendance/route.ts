import { NextRequest, NextResponse } from 'next/server';
import { createClockifyClient } from '@/lib/clockify';
import { isAuthenticated } from '@/lib/auth';

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

    const { date, studentEmails, workspaceId } = await request.json();

    if (!date || !studentEmails || !Array.isArray(studentEmails) || !workspaceId) {
      return NextResponse.json(
        { error: 'Invalid request. Date, studentEmails array, and workspaceId required.' },
        { status: 400 }
      );
    }

    const clockify = createClockifyClient(workspaceId);
    const checkDate = new Date(date);

    // Get users who have time entries for the date
    const usersWithEntries = await clockify.getUsersWithTimeEntries(checkDate);

    // Normalize student emails for comparison
    const normalizedStudentEmails = studentEmails.map((email: string) =>
      email.toLowerCase().trim()
    );

    // Determine who is absent
    const absentStudents = normalizedStudentEmails.filter(
      (email: string) => !usersWithEntries.has(email)
    );

    // Determine who is present
    const presentStudents = normalizedStudentEmails.filter(
      (email: string) => usersWithEntries.has(email)
    );

    return NextResponse.json({
      date: checkDate.toISOString(),
      totalStudents: studentEmails.length,
      presentCount: presentStudents.length,
      absentCount: absentStudents.length,
      presentStudents,
      absentStudents,
    });
  } catch (error) {
    console.error('Attendance check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check attendance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
