import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ set' : '❌ missing',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? '✅ set' : '❌ missing',
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID ? '✅ set' : '❌ missing',
    CLOCKIFY_API_KEY: process.env.CLOCKIFY_API_KEY ? '✅ set' : '❌ missing',
  });
}
