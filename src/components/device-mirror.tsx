import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { DEVICE_SYNC, onRemoteRoute, publishRoute } from '@/lib/device-sync';

/**
 * Device preview "Both" mode: keeps the phone and tablet frames on the same screen. When one
 * navigates, the other follows; going back on one goes back on the other. Renders nothing, and
 * does nothing outside the preview's frames.
 */
export function DeviceMirror() {
  return DEVICE_SYNC ? <Mirror /> : null;
}

/** Current route as an href, e.g. "/visit/11?summary=complete" (without the site's base path). */
function currentHref(pathname: string): string {
  return pathname + window.location.search;
}

/** Screens are matched by path: the same screen can carry different queries in each frame
 * (e.g. Home with or without the preview's `?state=`), and that mustn't make them chase each other. */
function pathOf(href: string): string {
  return href.split('?')[0];
}

function Mirror() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  // Approximate stack of screen paths visited here, so a remote "back" can be replayed as a back.
  const trail = useRef<string[]>([]);
  const following = useRef<string | null>(null); // path we're navigating to because the other frame did

  // Tell the other frame where this one is now.
  useEffect(() => {
    // Let the URL settle before reading its query.
    const id = setTimeout(() => {
      const href = currentHref(pathname);
      const stack = trail.current;
      const at = stack.lastIndexOf(pathname);
      if (at >= 0) stack.splice(at + 1);
      else stack.push(pathname);

      if (following.current === pathname) {
        following.current = null; // arrived where the other frame is: nothing to send back
        return;
      }
      publishRoute(href);
    }, 0);
    return () => clearTimeout(id);
  }, [pathname, params]);

  // Follow the other frame.
  useEffect(
    () =>
      onRemoteRoute((href) => {
        const path = pathOf(href);
        if (path === pathname) return;
        following.current = path;
        const stack = trail.current;
        const at = stack.lastIndexOf(path);
        if (at === stack.length - 2 && router.canGoBack()) router.back();
        else if (at >= 0) router.dismissTo(href as never);
        else router.push(href as never);
      }),
    [pathname],
  );

  return null;
}
