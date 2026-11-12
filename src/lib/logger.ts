/**
 * Centralized application logger.
 * Replaces raw console calls across services and components.
 * Future: wire to Sentry, Datadog, or structured log service.
 */

type LogContext = Record<string, unknown>;

function formatMessage(level: string, msg: string, ctx?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : '';
  return `[${timestamp}] [${level}] ${msg}${ctxStr}`;
}

export const logger = {
  warn(msg: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(formatMessage('WARN', msg, ctx));
    }
  },

  error(msg: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV !== 'test') {
      console.error(formatMessage('ERROR', msg, ctx));
    }
  },

  info(msg: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV !== 'test') {
      console.info(formatMessage('INFO', msg, ctx));
    }
  },

  /** Log and re-throw — use in catch blocks that should propagate */
  rethrow(msg: string, error: unknown): never {
    const e = error instanceof Error ? error : new Error(String(error));
    logger.error(msg, { error: e.message, stack: e.stack });
    throw e;
  },
};
