import { useEffect, useState } from "react";
/** navigator.onLine describes a network interface, not reachability of our origin. */
export function useConnectivity() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    let alive = true;
    let active: AbortController | undefined;
    const check = async () => {
      active?.abort();
      if (!navigator.onLine) {
        setOffline(true);
        return;
      }
      const controller = new AbortController();
      active = controller;
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch("/manifest.webmanifest", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        if (alive && active === controller) setOffline(!response.ok);
      } catch {
        if (alive && active === controller) setOffline(true);
      } finally {
        clearTimeout(timeout);
      }
    };
    const refresh = () => {
      if (document.visibilityState !== "hidden") void check();
    };
    void check();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      active?.abort();
      clearInterval(timer);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return offline;
}
