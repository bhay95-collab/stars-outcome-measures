export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out.')), ms)
    ),
  ]);
}

export const SESSION_TIMEOUT_MS = 8000;
export const DATA_FETCH_TIMEOUT_MS = 8000;
export const SIGN_IN_TIMEOUT_MS = 10000;
export const SAVE_TIMEOUT_MS = 10000;
