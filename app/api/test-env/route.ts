import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.CLOCKIFY_API_KEY,
    hasPasswordHash: !!process.env.AUTH_PASSWORD_HASH,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    passwordHashLength: process.env.AUTH_PASSWORD_HASH?.length || 0,
    passwordHashPreview: process.env.AUTH_PASSWORD_HASH?.substring(0, 20) || 'missing',
  });
}
