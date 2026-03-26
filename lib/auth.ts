import Redis from 'ioredis';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }
    redisClient = new Redis(redisUrl);
  }
  return redisClient;
}

function getTokenKey(athleteId: number): string {
  return `strava_token:${athleteId}`;
}

export async function storeToken(athleteId: number, tokenData: TokenData): Promise<void> {
  const redis = getRedisClient();
  await redis.set(getTokenKey(athleteId), JSON.stringify(tokenData));
}

export async function getToken(athleteId: number): Promise<TokenData | undefined> {
  const redis = getRedisClient();
  const data = await redis.get(getTokenKey(athleteId));
  if (!data) return undefined;
  return JSON.parse(data);
}

export async function removeToken(athleteId: number): Promise<void> {
  const redis = getRedisClient();
  await redis.del(getTokenKey(athleteId));
}

export async function getStoredAthleteIds(): Promise<number[]> {
  const redis = getRedisClient();
  const keys = await redis.keys('strava_token:*');
  return keys.map(key => parseInt(key.replace('strava_token:', ''), 10));
}
