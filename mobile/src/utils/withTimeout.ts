export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Request timed out.')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId!));
}

export const SESSION_TIMEOUT_MS = 8000;
export const DATA_FETCH_TIMEOUT_MS = 8000;
export const SIGN_IN_TIMEOUT_MS = 10000;
export const SAVE_TIMEOUT_MS = 10000;
