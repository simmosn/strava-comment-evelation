import { Redis } from '@upstash/redis';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function getTokenKey(athleteId: number): string {
  return `strava_token:${athleteId}`;
}

export async function storeToken(athleteId: number, tokenData: TokenData): Promise<void> {
  await redis.set(getTokenKey(athleteId), JSON.stringify(tokenData));
}

export async function getToken(athleteId: number): Promise<TokenData | undefined> {
  const data = await redis.get<string>(getTokenKey(athleteId));
  if (!data) return undefined;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function removeToken(athleteId: number): Promise<void> {
  await redis.del(getTokenKey(athleteId));
}

export async function getStoredAthleteIds(): Promise<number[]> {
  const keys = await redis.keys('strava_token:*');
  return keys.map(key => parseInt(key.replace('strava_token:', ''), 10));
}
