import axios, { AxiosInstance } from 'axios';
import { storeToken, getToken } from './auth';
import { logInfo, logDebug, logError } from './logger';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
  };
}

export function getAuthorizationUrl(baseUrl: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  if (!clientId) {
    throw new Error('STRAVA_CLIENT_ID is not configured');
  }

  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=activity:write,activity:read_all`;
}

export async function exchangeCodeForTokens(code: string, baseUrl: string): Promise<number> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials are not configured');
  }

  const redirectUri = `${baseUrl}/api/auth/callback`;

  logDebug('Exchanging authorization code for tokens', { redirectUri });

  const response = await axios.post<StravaTokens>(
    'https://www.strava.com/oauth/token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }
  );

  const { access_token, refresh_token, expires_at, athlete } = response.data;

  logInfo('Token exchange successful', { athleteId: athlete.id });

  storeToken(athlete.id, {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: expires_at,
    athleteId: athlete.id,
  });

  return athlete.id;
}

async function refreshAccessToken(athleteId: number): Promise<string> {
  const tokenData = getToken(athleteId);
  
  if (!tokenData) {
    throw new Error(`No token found for athlete ${athleteId}`);
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials are not configured');
  }

  logInfo('Refreshing access token', { athleteId });

  const response = await axios.post<StravaTokens>(
    'https://www.strava.com/oauth/token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: tokenData.refreshToken,
    }
  );

  const { access_token, refresh_token, expires_at } = response.data;

  storeToken(athleteId, {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: expires_at,
    athleteId,
  });

  logInfo('Token refresh successful', { athleteId });

  return access_token;
}

function createApiClient(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: STRAVA_API_BASE,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

async function getValidAccessToken(athleteId: number): Promise<string> {
  const tokenData = getToken(athleteId);
  
  if (!tokenData) {
    throw new Error(`No token found for athlete ${athleteId}`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokenData.expiresAt - now < 300) {
    logDebug('Token expiring soon, refreshing', { athleteId, expiresAt: tokenData.expiresAt, now });
    return refreshAccessToken(athleteId);
  }

  return tokenData.accessToken;
}

export async function updateActivity(
  athleteId: number,
  activityId: number,
  elevationMeters: number,
  clearDescription: boolean = false
): Promise<unknown> {
  const accessToken = await getValidAccessToken(athleteId);
  const client = createApiClient(accessToken);

  const payload: Record<string, unknown> = {
    total_elevation_gain: elevationMeters,
  };

  if (clearDescription) {
    payload.description = '';
  }

  logInfo('PUT /activities/:id', { activityId, ...payload });

  try {
    const response = await client.put(`/activities/${activityId}`, payload);
    logDebug('Activity update response', response.data);
    return response.data;
  } catch (error) {
    logError('Failed to update activity', error);
    throw error;
  }
}

export async function updateActivityComment(
  athleteId: number,
  activityId: number,
  comment: string
): Promise<void> {
  const accessToken = await getValidAccessToken(athleteId);
  const client = createApiClient(accessToken);

  logInfo('PUT /activities/:id - description', { activityId, descriptionLength: comment.length });

  try {
    await client.put(`/activities/${activityId}`, {
      description: comment,
    });
    logDebug('Description updated successfully');
  } catch (error) {
    logError('Failed to update description', error);
    throw error;
  }
}

export async function getActivity(
  athleteId: number,
  activityId: number
): Promise<Record<string, unknown>> {
  const accessToken = await getValidAccessToken(athleteId);
  const client = createApiClient(accessToken);

  logInfo('GET /activities/:id', { activityId });

  try {
    const response = await client.get(`/activities/${activityId}`);
    logDebug('Activity fetched', { activityId, title: response.data.title });
    return response.data;
  } catch (error) {
    logError('Failed to fetch activity', error);
    throw error;
  }
}
