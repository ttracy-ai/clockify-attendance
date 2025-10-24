export interface ClockifyTimeEntry {
  id: string;
  description: string;
  userId: string;
  timeInterval: {
    start: string;
    end: string;
    duration: string;
  };
  user?: {
    email: string;
    name: string;
  };
}

export interface ClockifyUser {
  id: string;
  email: string;
  name: string;
  status: string;
}

export class ClockifyAPI {
  private apiKey: string;
  private workspaceId: string;
  private baseUrl = 'https://api.clockify.me/api/v1';

  constructor(apiKey: string, workspaceId: string) {
    this.apiKey = apiKey;
    this.workspaceId = workspaceId;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Clockify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkspaceUsers(): Promise<ClockifyUser[]> {
    return this.fetch(`/workspaces/${this.workspaceId}/users`);
  }

  async getTimeEntriesForDate(date: Date): Promise<ClockifyTimeEntry[]> {
    // Set start of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // Set end of day
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // Get all users first
    const users = await this.getWorkspaceUsers();

    // Fetch time entries for each user
    const allEntries: ClockifyTimeEntry[] = [];

    for (const user of users) {
      try {
        const entries = await this.fetch(
          `/workspaces/${this.workspaceId}/user/${user.id}/time-entries?start=${start}&end=${end}`
        );

        // Add user info to entries
        const entriesWithUser = entries.map((entry: ClockifyTimeEntry) => ({
          ...entry,
          user: {
            email: user.email,
            name: user.name,
          },
        }));

        allEntries.push(...entriesWithUser);
      } catch (error) {
        console.error(`Error fetching entries for user ${user.email}:`, error);
      }
    }

    return allEntries;
  }

  async getUsersWithTimeEntries(date: Date): Promise<Set<string>> {
    const entries = await this.getTimeEntriesForDate(date);
    const usersWithEntries = new Set<string>();

    entries.forEach((entry) => {
      if (entry.user?.email) {
        usersWithEntries.add(entry.user.email.toLowerCase());
      }
    });

    return usersWithEntries;
  }
}

export function createClockifyClient(workspaceId?: string) {
  const apiKey = process.env.CLOCKIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Missing Clockify API key in environment variables');
  }

  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  return new ClockifyAPI(apiKey, workspaceId);
}
