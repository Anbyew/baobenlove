import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  captureInviteSource,
  getStoredInviteSource,
  initializeAnalytics,
  trackInviteSource,
  trackPageView,
} from "../lib/analytics";

export function AnalyticsTracker() {
  const location = useLocation();
  const lastCapturedSource = useRef<string | null>(null);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    const capturedSource = captureInviteSource(location.search);
    const cleanPagePath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const storedSource = capturedSource ?? getStoredInviteSource();

    if (capturedSource && capturedSource !== lastCapturedSource.current) {
      trackInviteSource(capturedSource, cleanPagePath);
      lastCapturedSource.current = capturedSource;
    }

    trackPageView(cleanPagePath, storedSource);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
