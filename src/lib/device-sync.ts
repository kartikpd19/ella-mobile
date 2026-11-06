// Native: there's no device preview, so nothing is shared. See device-sync.web.ts.

export const DEVICE_SYNC = false;

export function shareStore<T>(_key: string, _get: () => T, _apply: (value: T) => void): () => void {
  return () => {};
}

export function publishRoute(_href: string) {}

export function onRemoteRoute(_listener: (href: string) => void): () => void {
  return () => {};
}
