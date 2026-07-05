import { useEffect, useState } from 'react';

/**
 * True while the document is visible — false when the window is hidden
 * (minimized, occluded, or the user switched to another app/desktop).
 *
 * Browsers throttle background-tab timers, but Tauri's webview keeps
 * `setInterval` / `requestAnimationFrame` running at full cadence when the
 * window is merely occluded, so explicit visibility gating is required to
 * actually pause background work. Pairs with page-active gating to cover the
 * CSS-hidden-page case within the app; this hook covers the window-hidden
 * case (the bigger waste — polls that run for hours while the user is away).
 */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'visible'
  );
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}
