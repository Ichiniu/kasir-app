type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: string;
  meta?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, context?: string, meta?: Record<string, unknown>): string {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    context: context || "APP",
    message,
    ...(meta && { meta }),
  };

  return JSON.stringify(payload);
}

export const logger = {
  info(message: string, context?: string, meta?: Record<string, unknown>) {
    console.log(formatLog("info", message, context, meta));
  },
  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    console.warn(formatLog("warn", message, context, meta));
  },
  error(message: string, context?: string, meta?: Record<string, unknown>) {
    console.error(formatLog("error", message, context, meta));
  },
  debug(message: string, context?: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, context, meta));
    }
  },
};
