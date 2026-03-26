interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

const tokenStore: Map<number, TokenData> = new Map();

export function storeToken(athleteId: number, tokenData: TokenData): void {
  tokenStore.set(athleteId, tokenData);
}

export function getToken(athleteId: number): TokenData | undefined {
  return tokenStore.get(athleteId);
}

export function removeToken(athleteId: number): void {
  tokenStore.delete(athleteId);
}

export function getStoredAthleteIds(): number[] {
  return Array.from(tokenStore.keys());
}
