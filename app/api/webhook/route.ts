import { NextRequest, NextResponse } from 'next/server';
import { parseElevation, convertToMeters } from '@/lib/elevation-parser';
import { getActivity, createActivityWithElevation, deleteActivity } from '@/lib/strava';
import { getStoredAthleteIds } from '@/lib/auth';
import { logInfo, logError, logDebug } from '@/lib/logger';

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
  logInfo('Webhook GET request received', { url: request.url });
  
  const searchParams = request.nextUrl.searchParams;
  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (hubMode === 'subscribe') {
    logDebug('Webhook subscription verification', { hubMode, verifyToken, expectedToken: verifyToken });
    
    if (hubVerifyToken !== verifyToken) {
      logInfo('Invalid verify token for subscription');
      return NextResponse.json({ message: 'Invalid verify token' }, { status: 403 });
    }

    logInfo('Webhook subscription verified successfully');
    return NextResponse.json({ 'hub.challenge': hubChallenge });
  }

  logInfo('Unknown webhook GET request');
  return NextResponse.json({ message: 'Unknown request' }, { status: 400 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  logInfo('Webhook POST request received');
  
  try {
    const payload: StravaWebhookPayload = await request.json();
    logDebug('Webhook payload', payload);

    if (payload.object_type !== 'activity') {
      logInfo('Ignoring non-activity event', { object_type: payload.object_type });
      return NextResponse.json({ message: 'Ignoring non-activity event' }, { status: 200 });
    }

    if (payload.aspect_type !== 'create' && payload.aspect_type !== 'update') {
      logInfo('Ignoring non-create/update event', { aspect_type: payload.aspect_type });
      return NextResponse.json({ message: 'Ignoring delete event' }, { status: 200 });
    }

    const athleteIds = getStoredAthleteIds();
    logDebug('Stored athlete IDs', { athleteIds });

    if (athleteIds.length === 0) {
      logInfo('No authenticated athletes');
      return NextResponse.json({ message: 'No authenticated athletes' }, { status: 200 });
    }

    if (!athleteIds.includes(payload.owner_id)) {
      logInfo('Activity not owned by authenticated athlete', { owner_id: payload.owner_id, storedIds: athleteIds });
      return NextResponse.json({ message: 'Activity not owned by authenticated athlete' }, { status: 200 });
    }

    logInfo('Fetching activity from Strava', { activityId: payload.object_id, athleteId: payload.owner_id });
    const activity = await getActivity(payload.owner_id, payload.object_id);
    logDebug('Activity fetched', { activityId: payload.object_id, description: activity.description });

    const comment = activity.description as string | undefined;

    if (!comment) {
      logInfo('No description in activity');
      return NextResponse.json({ message: 'No description to parse' }, { status: 200 });
    }

    logDebug('Parsing elevation from comment', { comment });
    const parsedElevation = parseElevation(comment);

    if (!parsedElevation) {
      logInfo('No elevation pattern found in description', { comment });
      return NextResponse.json({ message: 'No elevation pattern found in description' }, { status: 200 });
    }

    const elevationMeters = convertToMeters(parsedElevation.value, parsedElevation.unit);
    logInfo('Parsed elevation', { 
      raw: parsedElevation.raw, 
      value: parsedElevation.value, 
      unit: parsedElevation.unit,
      elevationMeters 
    });

    logInfo('Creating new activity with elevation', { originalActivityId: payload.object_id, elevationMeters });
    const newActivity = await createActivityWithElevation(payload.owner_id, activity, elevationMeters);
    logInfo('New activity created', { newActivityId: newActivity.id });

    logInfo('Deleting original activity', { originalActivityId: payload.object_id });
    await deleteActivity(payload.owner_id, payload.object_id);
    logInfo('Original activity deleted');

    return NextResponse.json({
      message: 'Activity replaced successfully',
      original_activity_id: payload.object_id,
      new_activity_id: newActivity.id,
      elevation: elevationMeters,
    });
  } catch (error) {
    logError('Webhook error', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
