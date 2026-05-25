import { FigmaApiError, FigmaAuthError, FigmaRateLimitError } from "./errors.js";
import type {
  FigmaClientOptions,
  FigmaRequestParams,
  FigmaFile,
  FigmaFileNodesResponse,
  FigmaVersionsResponse,
  FigmaComponentsResponse,
  FigmaStylesResponse,
  FigmaVariablesResponse,
  FigmaImageResponse,
} from "./types.js";

interface CacheEntry {
  data: unknown;
  timestamp: number;
  key: string;
}

export class FigmaClient {
  private token: string;
  private baseUrl: string;
  private cache: Map<string, CacheEntry>;
  private cacheTTL: number;
  private cacheMaxSize: number;
  private maxRetries: number;
  private maxConcurrency: number;
  private requestTimeoutMs: number;
  private activeRequests: number;
  private requestQueue: Array<{ resolve: () => void }>;
  onResponse: ((path: string, params: FigmaRequestParams, data: unknown) => void) | null;

  constructor(options: FigmaClientOptions) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? "https://api.figma.com/v1";
    this.cacheTTL = options.cacheTTL ?? 60000;
    this.cacheMaxSize = options.cacheMaxSize ?? 50;
    this.maxRetries = options.maxRetries ?? 3;
    this.maxConcurrency = options.maxConcurrency ?? 5;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 20000;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.cache = new Map();
    this.onResponse = null;
  }

  private async acquireConcurrency(): Promise<void> {
    if (this.activeRequests < this.maxConcurrency) {
      this.activeRequests++;
      return;
    }
    await new Promise<void>((resolve) => {
      this.requestQueue.push({ resolve });
    });
    this.activeRequests++;
  }

  private releaseConcurrency(): void {
    this.activeRequests--;
    const next = this.requestQueue.shift();
    if (next) next.resolve();
  }

  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getCacheKey(path: string, params: FigmaRequestParams): string {
    const sorted = Object.entries(params)
      .filter(([, v]) => v != null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return `${path}?${sorted}`;
  }

  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: unknown): void {
    if (this.cache.size >= this.cacheMaxSize) {
      const oldest = this.cache.keys().next().value!;
      this.cache.delete(oldest);
    }
    this.cache.set(key, { data, timestamp: Date.now(), key });
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async request<T = unknown>(path: string, params: FigmaRequestParams = {}): Promise<T> {
    const cacheKey = this.getCacheKey(path, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as T;

    await this.acquireConcurrency();

    let lastError: Error | null = null;

    try {
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        if (attempt > 0) {
          await this.sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
        }

        const url = new URL(path, this.baseUrl);
        for (const [key, value] of Object.entries(params)) {
          if (value != null) url.searchParams.set(key, String(value));
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        let response: Response;
        try {
          response = await fetch(url.toString(), {
            headers: { "X-Figma-Token": this.token },
            signal: controller.signal,
          });
        } catch (err: unknown) {
          clearTimeout(timeout);
          if (err instanceof Error && err.name === "AbortError") {
            lastError = new FigmaApiError(408, `Request timeout after ${this.requestTimeoutMs}ms`);
            continue;
          }
          throw err;
        } finally {
          clearTimeout(timeout);
        }

        if (response.ok) {
          const data = (await response.json()) as T;
          this.setCache(cacheKey, data);
          if (this.onResponse) this.onResponse(path, params, data);
          return data;
        }

        if (response.status === 403) {
          throw new FigmaAuthError();
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : null;
          if (retryMs && attempt < this.maxRetries) {
            await this.sleep(Math.min(retryMs, 10000));
            continue;
          }
          throw new FigmaRateLimitError(retryMs);
        }

        const text = await response.text();
        lastError = new FigmaApiError(response.status, `Figma API ${response.status}: ${text}`);

        if (!this.isRetryable(response.status)) throw lastError;
      }

      throw lastError!;
    } finally {
      this.releaseConcurrency();
    }
  }

  async getFile(fileKey: string, options: { depth?: number } = {}): Promise<FigmaFile> {
    return this.request<FigmaFile>(`/files/${fileKey}`, { depth: options.depth });
  }

  async getFileNodes(fileKey: string, nodeIds: string[], version?: string): Promise<FigmaFileNodesResponse> {
    return this.request<FigmaFileNodesResponse>(`/files/${fileKey}/nodes`, {
      ids: nodeIds.join(","),
      version,
    });
  }

  async getFileVersions(fileKey: string): Promise<FigmaVersionsResponse> {
    return this.request<FigmaVersionsResponse>(`/files/${fileKey}/versions`);
  }

  async getFileComponents(fileKey: string): Promise<FigmaComponentsResponse> {
    return this.request<FigmaComponentsResponse>(`/files/${fileKey}/components`);
  }

  async getFileStyles(fileKey: string): Promise<FigmaStylesResponse> {
    return this.request<FigmaStylesResponse>(`/files/${fileKey}/styles`);
  }

  async getVariables(fileKey: string): Promise<FigmaVariablesResponse> {
    return this.request<FigmaVariablesResponse>(`/files/${fileKey}/variables/local`);
  }

  async getPublishedVariables(fileKey: string): Promise<FigmaVariablesResponse> {
    return this.request<FigmaVariablesResponse>(`/files/${fileKey}/variables/published`);
  }

  async getImages(
    fileKey: string,
    nodeIds: string[],
    options: { format?: string; scale?: number } = {}
  ): Promise<FigmaImageResponse> {
    return this.request<FigmaImageResponse>(`/images/${fileKey}`, {
      ids: nodeIds.join(","),
      format: options.format ?? "png",
      scale: options.scale ?? 2,
    });
  }

  async getComponentSet(fileKey: string, nodeId: string): Promise<FigmaFileNodesResponse> {
    return this.request<FigmaFileNodesResponse>(`/files/${fileKey}/nodes`, { ids: nodeId });
  }
}
