/**
 * Device preview "Both" mode: the phone and tablet frames are two copies of the app, each with
 * its own memory. This links them over a BroadcastChannel so data (sync state, consent, notes,
 * summaries) and the current screen match on both. Only active inside the preview's frames;
 * the app opened on its own is unaffected.
 */

type Message =
  | { type: 'hello' }
  | { type: 'store'; key: string; value: unknown }
  | { type: 'route'; href: string };

type Store = { get: () => unknown; apply: (value: unknown) => void };

const framed = typeof window !== 'undefined' && window.parent !== window && 'BroadcastChannel' in window;
const channel = framed ? new BroadcastChannel('ella-device-preview') : null;

const stores = new Map<string, Store>();
const routeListeners = new Set<(href: string) => void>();

function post(message: Message) {
  try {
    channel?.postMessage(message);
  } catch {
    // A value that can't be cloned: skip it rather than break the app.
  }
}

if (channel) {
  channel.onmessage = (event: MessageEvent<Message>) => {
    const message = event.data;
    if (message.type === 'hello') {
      // A frame (re)loaded: send it everything this one knows.
      stores.forEach((store, key) => post({ type: 'store', key, value: store.get() }));
    } else if (message.type === 'store') {
      stores.get(message.key)?.apply(message.value);
    } else if (message.type === 'route') {
      routeListeners.forEach((listener) => listener(message.href));
    }
  };
  // Ask once the stores have registered (they do so when their modules load).
  setTimeout(() => post({ type: 'hello' }), 0);
}

export const DEVICE_SYNC = framed;

/**
 * Shares a store with the other device. `apply` must update the store and notify its listeners
 * without calling the returned `publish`, or the two frames would echo forever.
 */
export function shareStore<T>(key: string, get: () => T, apply: (value: T) => void): () => void {
  if (!channel) return () => {};
  stores.set(key, { get, apply: apply as (value: unknown) => void });
  return () => post({ type: 'store', key, value: get() });
}

export function publishRoute(href: string) {
  post({ type: 'route', href });
}

export function onRemoteRoute(listener: (href: string) => void): () => void {
  routeListeners.add(listener);
  return () => routeListeners.delete(listener);
}
