import { put, list } from '@vercel/blob';

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

const STUDENTS_BLOB_NAME = 'students.json';

export async function getStudents(): Promise<Student[]> {
  try {
    // List all blobs and find our students file
    const { blobs } = await list();
    const studentsBlob = blobs.find(blob => blob.pathname === STUDENTS_BLOB_NAME);

    if (!studentsBlob) {
      console.log('No students blob found, returning empty array');
      return [];
    }

    const response = await fetch(studentsBlob.url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reading students from blob:', error);
    return [];
  }
}

export async function saveStudents(students: Student[]): Promise<void> {
  try {
    const blob = await put(STUDENTS_BLOB_NAME, JSON.stringify(students, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log('Students saved to blob:', blob.url);
  } catch (error) {
    console.error('Error saving students to blob:', error);
    throw error;
  }
}
