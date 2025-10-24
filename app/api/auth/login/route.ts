import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    console.log('AUTH_PASSWORD_HASH from env:', process.env.AUTH_PASSWORD_HASH);
    console.log('Password received:', password);

    const isValid = await verifyPassword(password);

    console.log('Password valid:', isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
