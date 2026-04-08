import { put, list } from '@vercel/blob';

interface Student {
  name: string;
  email: string;
  hour: string;
  photo: string | null;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  label: string;
  hour: string;
  startTime: string;
  endTime: string;
  startRapidMinutes?: number; // minutes at start of class with fast refresh (default 10)
  endRapidMinutes?: number;   // minutes at end of class with fast refresh (default 10)
}

const STUDENTS_BLOB_NAME = 'students.json';
const WORKSPACES_BLOB_NAME = 'workspaces.json';
const GRADES_CACHE_BLOB_NAME = 'grades-cache.json';

export interface GradesCache {
  calculatedDate: string; // ISO date string (YYYY-MM-DD)
  startDate: string;
  endDate: string;
  data: StudentGradeData[];
}

export interface StudentGradeData {
  name: string;
  email: string;
  hour: string;
  daysPresent: number;
  totalDays: number;
  percentage: number;
  photo: string | null;
}

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

// Default workspace configuration
function getDefaultWorkspaces(): WorkspaceConfig[] {
  return [
    {
      id: process.env.CLOCKIFY_WORKSPACE_1ST_HOUR || '',
      name: 'FALL 25 1st Hour',
      label: '1st Hour',
      hour: '1',
      startTime: '08:20',
      endTime: '09:20',
      startRapidMinutes: 10,
      endRapidMinutes: 10,
    },
    {
      id: process.env.CLOCKIFY_WORKSPACE_2ND_HOUR || '',
      name: 'FALL 25 2nd Hour',
      label: '2nd Hour',
      hour: '2',
      startTime: '09:30',
      endTime: '11:00',
      startRapidMinutes: 10,
      endRapidMinutes: 10,
    },
    {
      id: process.env.CLOCKIFY_WORKSPACE_3RD_HOUR || '',
      name: 'FALL 25 3rd Hour',
      label: '3rd Hour',
      hour: '3',
      startTime: '12:00',
      endTime: '13:10',
      startRapidMinutes: 10,
      endRapidMinutes: 10,
    },
    {
      id: process.env.CLOCKIFY_WORKSPACE_4TH_HOUR || '',
      name: 'FALL 25 4th Hour',
      label: '4th Hour',
      hour: '4',
      startTime: '13:15',
      endTime: '14:40',
      startRapidMinutes: 10,
      endRapidMinutes: 10,
    },
  ].filter(ws => ws.id); // Filter out any workspaces without IDs
}

export async function getWorkspaces(): Promise<WorkspaceConfig[]> {
  try {
    // List all blobs and find our workspaces file
    const { blobs } = await list();
    const workspacesBlob = blobs.find(blob => blob.pathname === WORKSPACES_BLOB_NAME);

    if (!workspacesBlob) {
      console.log('No workspaces blob found, initializing from environment variables');
      const defaultWorkspaces = getDefaultWorkspaces();

      // Save default workspaces to blob for future use
      if (defaultWorkspaces.length > 0) {
        await saveWorkspaces(defaultWorkspaces);
      }

      return defaultWorkspaces;
    }

    const response = await fetch(workspacesBlob.url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reading workspaces from blob:', error);
    // Fallback to environment variables
    return getDefaultWorkspaces();
  }
}

export async function saveWorkspaces(workspaces: WorkspaceConfig[]): Promise<void> {
  try {
    const blob = await put(WORKSPACES_BLOB_NAME, JSON.stringify(workspaces, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log('Workspaces saved to blob:', blob.url);
  } catch (error) {
    console.error('Error saving workspaces to blob:', error);
    throw error;
  }
}

export async function getGradesCache(): Promise<GradesCache | null> {
  try {
    const { blobs } = await list();
    const gradesBlob = blobs.find(blob => blob.pathname === GRADES_CACHE_BLOB_NAME);

    if (!gradesBlob) {
      console.log('No grades cache found');
      return null;
    }

    const response = await fetch(gradesBlob.url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reading grades cache from blob:', error);
    return null;
  }
}

export async function saveGradesCache(cache: GradesCache): Promise<void> {
  try {
    const blob = await put(GRADES_CACHE_BLOB_NAME, JSON.stringify(cache, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log('Grades cache saved to blob:', blob.url);
  } catch (error) {
    console.error('Error saving grades cache to blob:', error);
    throw error;
  }
}
