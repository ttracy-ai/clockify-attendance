import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStudents, saveStudents } from '@/lib/storage';

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

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

    const { students: newStudents } = await request.json();

    if (!newStudents || !Array.isArray(newStudents)) {
      return NextResponse.json(
        { error: 'Students array is required' },
        { status: 400 }
      );
    }

    // Read existing students from blob storage
    const existingStudents = await getStudents();

    // Merge logic:
    // - If student email exists, keep existing photo but update name/hour
    // - If student is new, add them without photo
    const emailMap = new Map(existingStudents.map(s => [s.email.toLowerCase(), s]));

    const mergedStudents: Student[] = [];
    const addedCount = { new: 0, updated: 0 };

    for (const newStudent of newStudents) {
      const email = newStudent.email.toLowerCase();
      const existing = emailMap.get(email);

      if (existing) {
        // Update existing student (keep photo, update other fields)
        mergedStudents.push({
          ...existing,
          name: newStudent.name || existing.name,
          hour: newStudent.hour || existing.hour,
        });
        addedCount.updated++;
        emailMap.delete(email); // Mark as processed
      } else {
        // Add new student without photo
        mergedStudents.push({
          name: newStudent.name,
          email: newStudent.email,
          hour: newStudent.hour,
          photo: null,
        });
        addedCount.new++;
      }
    }

    // Add any remaining existing students that weren't in the CSV
    emailMap.forEach(student => {
      mergedStudents.push(student);
    });

    // Sort by hour then name
    mergedStudents.sort((a, b) => {
      if (a.hour !== b.hour) {
        return a.hour.localeCompare(b.hour);
      }
      return a.name.localeCompare(b.name);
    });

    // Save merged data to blob storage
    await saveStudents(mergedStudents);

    return NextResponse.json({
      success: true,
      totalStudents: mergedStudents.length,
      newStudents: addedCount.new,
      updatedStudents: addedCount.updated,
      existingKept: emailMap.size,
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload CSV',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
