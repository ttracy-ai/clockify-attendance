import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

interface PhotoUpdate {
  email: string;
  photo: string;
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

    const { photoUpdates } = await request.json();

    if (!photoUpdates || !Array.isArray(photoUpdates)) {
      return NextResponse.json(
        { error: 'Photo updates array is required' },
        { status: 400 }
      );
    }

    // Read existing students
    const studentsPath = path.join(process.cwd(), 'public', 'students.json');
    let students: Student[] = [];

    try {
      const studentsData = fs.readFileSync(studentsPath, 'utf8');
      students = JSON.parse(studentsData);
    } catch (error) {
      return NextResponse.json(
        { error: 'Students file not found. Please upload student roster first.' },
        { status: 404 }
      );
    }

    // Create a map for quick lookup
    const photoMap = new Map<string, string>();
    for (const update of photoUpdates as PhotoUpdate[]) {
      photoMap.set(update.email.toLowerCase(), update.photo);
    }

    let updatedCount = 0;
    let notFoundCount = 0;

    // Update photos for matching students
    const updatedStudents = students.map(student => {
      const photo = photoMap.get(student.email.toLowerCase());
      if (photo !== undefined) {
        updatedCount++;
        return { ...student, photo };
      }
      return student;
    });

    // Count emails that weren't found
    photoMap.forEach((_, email) => {
      if (!students.find(s => s.email.toLowerCase() === email)) {
        notFoundCount++;
      }
    });

    // Save updated data
    fs.writeFileSync(studentsPath, JSON.stringify(updatedStudents, null, 2));

    return NextResponse.json({
      success: true,
      updatedCount,
      notFoundCount,
      totalStudents: updatedStudents.length,
    });
  } catch (error) {
    console.error('Error updating photos:', error);
    return NextResponse.json(
      {
        error: 'Failed to update photos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
