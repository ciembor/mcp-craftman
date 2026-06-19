export type Logger = {
  readonly debug: (message: string, metadata?: unknown) => void;
  readonly info: (message: string, metadata?: unknown) => void;
  readonly warn: (message: string, metadata?: unknown) => void;
  readonly error: (message: string, metadata?: unknown) => void;
};

export function createLogger(stream: NodeJS.WritableStream = process.stderr): Logger {
  const write = (level: string, message: string, metadata?: unknown): void => {
    const suffix = metadata === undefined ? "" : ` ${JSON.stringify(metadata)}`;
    stream.write(`[${level}] ${message}${suffix}\n`);
  };

  return {
    debug: (message, metadata) => write("debug", message, metadata),
    info: (message, metadata) => write("info", message, metadata),
    warn: (message, metadata) => write("warn", message, metadata),
    error: (message, metadata) => write("error", message, metadata),
  };
}

export function serializeError(error: unknown): { readonly message: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
}
