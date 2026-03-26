import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/strava';

export async function GET(): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL not configured' }, { status: 500 });
  }

  try {
    const authUrl = getAuthorizationUrl(baseUrl);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=configuration_error`);
  }
}
