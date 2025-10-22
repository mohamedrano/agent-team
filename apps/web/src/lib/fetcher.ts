const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface FetchOptions extends RequestInit {
  retries?: number;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetcher<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retries = MAX_RETRIES, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
      if (i < retries - 1) {
        await delay(RETRY_DELAY * (i + 1));
      }
    }
  }

  throw lastError || new Error("Request failed");
}

export function buildUrl(base: string, params?: Record<string, string>) {
  if (!params) return base;
  
  const searchParams = new URLSearchParams(params);
  return `${base}?${searchParams.toString()}`;
}

