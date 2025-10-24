import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

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

    // Clear the students.json file by writing an empty array
    const studentsPath = path.join(process.cwd(), 'public', 'students.json');
    fs.writeFileSync(studentsPath, JSON.stringify([], null, 2));

    return NextResponse.json({
      success: true,
      message: 'All students have been removed from the roster',
    });
  } catch (error) {
    console.error('Error clearing students:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear students',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
