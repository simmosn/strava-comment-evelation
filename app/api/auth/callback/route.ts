import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/strava';
import { logInfo, logError } from '@/lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  logInfo('OAuth callback received', { url: request.url });
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    logInfo('OAuth error from Strava', { error });
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    logInfo('Missing authorization code');
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  try {
    logInfo('Exchanging code for tokens');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const athleteId = await exchangeCodeForTokens(code, baseUrl);
    logInfo('OAuth successful', { athleteId });

    return NextResponse.redirect(new URL('/?status=connected', request.url));
  } catch (error) {
    logError('OAuth callback error', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent('authentication_failed')}`, request.url));
  }
}
