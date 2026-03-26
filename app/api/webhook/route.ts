import { NextRequest, NextResponse } from 'next/server';
import { parseElevation, convertToMeters } from '@/lib/elevation-parser';
import { getActivity, updateActivityElevation, updateActivityComment } from '@/lib/strava';
import { getStoredAthleteIds } from '@/lib/auth';

interface StravaWebhookPayload {
  aspect_type: string;
  event_time: number;
  object_id: number;
  object_type: string;
  owner_id: number;
  subscription_id: number;
  updates?: {
    title?: string;
    type?: string;
    private?: boolean;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (hubMode === 'subscribe') {
    if (hubVerifyToken !== verifyToken) {
      return NextResponse.json({ message: 'Invalid verify token' }, { status: 403 });
    }

    return NextResponse.json({ 'hub.challenge': hubChallenge });
  }

  return NextResponse.json({ message: 'Unknown request' }, { status: 400 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload: StravaWebhookPayload = await request.json();

    if (payload.object_type !== 'activity') {
      return NextResponse.json({ message: 'Ignoring non-activity event' }, { status: 200 });
    }

    if (payload.aspect_type !== 'create' && payload.aspect_type !== 'update') {
      return NextResponse.json({ message: 'Ignoring delete event' }, { status: 200 });
    }

    const athleteIds = getStoredAthleteIds();

    if (athleteIds.length === 0) {
      return NextResponse.json({ message: 'No authenticated athletes' }, { status: 200 });
    }

    if (!athleteIds.includes(payload.owner_id)) {
      return NextResponse.json({ message: 'Activity not owned by authenticated athlete' }, { status: 200 });
    }

    const activity = await getActivity(payload.owner_id, payload.object_id);
    const comment = activity.description as string | undefined;

    if (!comment) {
      return NextResponse.json({ message: 'No description to parse' }, { status: 200 });
    }

    const parsedElevation = parseElevation(comment);

    if (!parsedElevation) {
      return NextResponse.json({ message: 'No elevation pattern found in description' }, { status: 200 });
    }

    const elevationMeters = convertToMeters(parsedElevation.value, parsedElevation.unit);

    console.log(`Updating activity ${payload.object_id}: ${parsedElevation.value}${parsedElevation.unit} = ${elevationMeters}m`);

    await updateActivityElevation(payload.owner_id, payload.object_id, elevationMeters);
    await updateActivityComment(payload.owner_id, payload.object_id, '');

    return NextResponse.json({
      message: 'Activity updated successfully',
      activity_id: payload.object_id,
      elevation: elevationMeters,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
