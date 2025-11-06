import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getWorkspaces, saveWorkspaces, WorkspaceConfig } from '@/lib/storage';

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

    const workspaces = await getWorkspaces();

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
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

    const { workspaces }: { workspaces: WorkspaceConfig[] } = await request.json();

    if (!Array.isArray(workspaces)) {
      return NextResponse.json(
        { error: 'Invalid request. Workspaces array required.' },
        { status: 400 }
      );
    }

    // Validate workspace structure
    for (const ws of workspaces) {
      if (!ws.id || !ws.name || !ws.label || !ws.hour || !ws.startTime || !ws.endTime) {
        return NextResponse.json(
          { error: 'Invalid workspace structure. All fields required.' },
          { status: 400 }
        );
      }
    }

    await saveWorkspaces(workspaces);

    return NextResponse.json({ success: true, workspaces });
  } catch (error) {
    console.error('Error saving workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to save workspaces' },
      { status: 500 }
    );
  }
}
