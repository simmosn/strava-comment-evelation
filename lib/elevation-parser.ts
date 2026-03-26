export interface ParsedElevation {
  value: number;
  unit: 'm' | 'ft';
  raw: string;
}

export function parseElevation(comment: string): ParsedElevation | null {
  if (!comment) return null;

  const cleanComment = comment.trim();

  const metersPatterns = [
    /^(\d+(?:\.\d+)?)\s*m$/i,
    /^(\d+(?:\.\d+)?)\s*meters?$/i,
  ];

  for (const pattern of metersPatterns) {
    const match = cleanComment.match(pattern);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: 'm',
        raw: match[0],
      };
    }
  }

  const feetPatterns = [
    /^(\d+(?:\.\d+)?)\s*ft$/i,
    /^(\d+(?:\.\d+)?)\s*feet$/i,
    /^(\d+(?:\.\d+)?)\s*'$/i,
  ];

  for (const pattern of feetPatterns) {
    const match = cleanComment.match(pattern);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: 'ft',
        raw: match[0],
      };
    }
  }

  return null;
}

export function convertToMeters(value: number, unit: 'm' | 'ft'): number {
  if (unit === 'ft') {
    return Math.round(value * 0.3048);
  }
  return Math.round(value);
}
