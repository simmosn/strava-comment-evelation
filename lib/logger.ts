type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatLog(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataStr = data !== undefined ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
}

export function logInfo(message: string, data?: unknown): void {
  console.log(formatLog('INFO', message, data));
}

export function logError(message: string, error?: unknown): void {
  const errorData = error instanceof Error 
    ? { name: error.name, message: error.message, stack: error.stack }
    : error;
  console.error(formatLog('ERROR', message, errorData));
}

export function logDebug(message: string, data?: unknown): void {
  console.log(formatLog('DEBUG', message, data));
}

export function logWarn(message: string, data?: unknown): void {
  console.warn(formatLog('WARN', message, data));
}
