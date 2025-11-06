import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getGradesCache, saveGradesCache, getStudents, getWorkspaces, StudentGradeData, GradesCache } from '@/lib/storage';
import { createClockifyClient } from '@/lib/clockify';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

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

    const { startDate, endDate, forceRecalculate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Invalid request. startDate and endDate required.' },
        { status: 400 }
      );
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check cache if not forcing recalculation
    if (!forceRecalculate) {
      const cache = await getGradesCache();
      if (cache &&
          cache.calculatedDate === today &&
          cache.startDate === startDate &&
          cache.endDate === endDate) {
        console.log('Returning cached grades data');
        return NextResponse.json({
          data: cache.data,
          cached: true,
          calculatedDate: cache.calculatedDate,
        });
      }
    }

    console.log('Calculating fresh grades data...');

    // Load students and workspaces
    const students = await getStudents();
    const workspaces = await getWorkspaces();

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found. Please add students first.' },
        { status: 400 }
      );
    }

    if (workspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspaces configured. Please configure workspaces first.' },
        { status: 400 }
      );
    }

    // Calculate date range
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const dateRange: Date[] = [];

    for (let date = start; date <= end; date = new Date(date.setDate(date.getDate() + 1))) {
      dateRange.push(new Date(date));
    }

    // Track attendance for each day
    const dailyAttendance: Map<string, Set<string>> = new Map(); // date -> Set of emails
    const validDays: Set<string> = new Set(); // days with >= 5 students

    // For each day, check attendance across all workspaces
    for (const date of dateRange) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const presentEmails = new Set<string>();

      // Check each workspace for this day
      for (const workspace of workspaces) {
        try {
          const clockify = createClockifyClient(workspace.id);
          const usersWithEntries = await clockify.getUsersWithTimeEntries(date);

          // Add all users from this workspace to the daily set
          usersWithEntries.forEach(email => presentEmails.add(email));
        } catch (error) {
          console.error(`Error checking workspace ${workspace.label} for ${dateStr}:`, error);
        }
      }

      // Only count this day if at least 5 students submitted
      if (presentEmails.size >= 5) {
        validDays.add(dateStr);
        dailyAttendance.set(dateStr, presentEmails);
      }
    }

    console.log(`Found ${validDays.size} valid class days with >= 5 students`);

    if (validDays.size === 0) {
      return NextResponse.json({
        data: [],
        cached: false,
        calculatedDate: today,
        message: 'No valid class days found with at least 5 students submitting.',
      });
    }

    // Calculate stats for each student
    const gradeData: StudentGradeData[] = students.map(student => {
      let daysPresent = 0;

      // Count how many valid days this student was present
      validDays.forEach(dateStr => {
        const presentEmails = dailyAttendance.get(dateStr);
        if (presentEmails && presentEmails.has(student.email.toLowerCase())) {
          daysPresent++;
        }
      });

      const totalDays = validDays.size;
      const percentage = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;

      return {
        name: student.name,
        email: student.email,
        hour: student.hour,
        daysPresent,
        totalDays,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        photo: student.photo,
      };
    });

    // Sort by percentage (lowest first to highlight issues)
    gradeData.sort((a, b) => a.percentage - b.percentage);

    // Save to cache
    const cacheData: GradesCache = {
      calculatedDate: today,
      startDate,
      endDate,
      data: gradeData,
    };

    await saveGradesCache(cacheData);

    return NextResponse.json({
      data: gradeData,
      cached: false,
      calculatedDate: today,
    });

  } catch (error) {
    console.error('Grades calculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate grades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check cache status
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cache = await getGradesCache();
    const today = format(new Date(), 'yyyy-MM-dd');

    if (cache) {
      return NextResponse.json({
        hasCacheForToday: cache.calculatedDate === today,
        cache,
      });
    }

    return NextResponse.json({
      hasCacheForToday: false,
      cache: null,
    });
  } catch (error) {
    console.error('Error checking grades cache:', error);
    return NextResponse.json(
      { error: 'Failed to check cache' },
      { status: 500 }
    );
  }
}
