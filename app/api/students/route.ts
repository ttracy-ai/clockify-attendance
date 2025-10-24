import { NextResponse } from 'next/server';
import { getStudents } from '@/lib/storage';

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array if no students yet
  }
}
