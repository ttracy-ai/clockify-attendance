import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

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

    const workspaces = [
      {
        id: process.env.CLOCKIFY_WORKSPACE_1ST_HOUR,
        name: 'FALL 25 1st Hour',
        label: '1st Hour',
      },
      {
        id: process.env.CLOCKIFY_WORKSPACE_2ND_HOUR,
        name: 'FALL 25 2nd Hour',
        label: '2nd Hour',
      },
      {
        id: process.env.CLOCKIFY_WORKSPACE_3RD_HOUR,
        name: 'FALL 25 3rd Hour',
        label: '3rd Hour',
      },
      {
        id: process.env.CLOCKIFY_WORKSPACE_4TH_HOUR,
        name: 'FALL 25 4th Hour',
        label: '4th Hour',
      },
    ].filter(ws => ws.id); // Filter out any undefined workspaces

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}
