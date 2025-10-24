import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { saveStudents } from '@/lib/storage';

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

    // Clear all students by saving an empty array to blob storage
    await saveStudents([]);

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
