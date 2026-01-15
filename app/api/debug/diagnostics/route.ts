import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStudents } from '@/lib/storage';
import { getWorkspaces } from '@/lib/storage';
import { createClockifyClient } from '@/lib/clockify';

export async function GET() {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workspace configurations
    const workspaces = await getWorkspaces();

    // Get all students
    const students = await getStudents();

    // Fetch users from each Clockify workspace
    const workspaceUsers: { [hour: string]: any[] } = {};

    for (const workspace of workspaces) {
      try {
        const clockify = createClockifyClient(workspace.id);
        const users = await clockify.getWorkspaceUsers();
        workspaceUsers[workspace.hour] = users;
      } catch (error) {
        console.error(`Error fetching users for workspace ${workspace.hour}:`, error);
        workspaceUsers[workspace.hour] = [];
      }
    }

    // Find mismatches - students not in their workspace
    const mismatches: Array<{
      hour: string;
      studentEmail: string;
      studentName: string;
      inClockify: boolean;
    }> = [];

    for (const student of students) {
      const workspaceHourUsers = workspaceUsers[student.hour] || [];
      const emailsInWorkspace = workspaceHourUsers.map(u => u.email.toLowerCase());
      const studentEmailLower = student.email.toLowerCase();

      if (!emailsInWorkspace.includes(studentEmailLower)) {
        mismatches.push({
          hour: student.hour,
          studentEmail: student.email,
          studentName: student.name,
          inClockify: false
        });
      }
    }

    return NextResponse.json({
      workspaceUsers,
      students,
      mismatches
    });

  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
