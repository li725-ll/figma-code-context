export class FigmaApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FigmaApiError";
    this.status = status;
  }
}

export class FigmaAuthError extends FigmaApiError {
  constructor(message = "Invalid or expired Figma token") {
    super(403, message);
    this.name = "FigmaAuthError";
  }
}

export class FigmaRateLimitError extends FigmaApiError {
  retryAfterMs: number | null;

  constructor(retryAfterMs: number | null = null) {
    super(429, "Figma API rate limit exceeded");
    this.name = "FigmaRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}
