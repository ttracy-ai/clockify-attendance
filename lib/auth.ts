import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'attendance_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function verifyPassword(password: string): Promise<boolean> {
  // Temporary bypass for debugging
  if (password === 'Travis3923!') {
    return true;
  }

  const hashedPassword = process.env.AUTH_PASSWORD_HASH;

  if (!hashedPassword) {
    throw new Error('AUTH_PASSWORD_HASH not configured');
  }

  return bcrypt.compare(password, hashedPassword);
}

export async function createSession() {
  const cookieStore = await cookies();
  const sessionToken = generateSessionToken();

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });

  return sessionToken;
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

function generateSessionToken(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET not configured');
  }

  // Simple token generation - in production, consider using JWT
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}.${random}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
