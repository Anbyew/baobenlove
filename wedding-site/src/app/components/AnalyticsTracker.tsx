import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  captureInviteAttribution,
  getStoredInviteAttribution,
  initializeAnalytics,
  trackSaveTheDateClick,
  trackPageView,
} from "../lib/analytics";

export function AnalyticsTracker() {
  const location = useLocation();
  const lastTrackedClickKey = useRef<string | null>(null);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    const capturedAttribution = captureInviteAttribution(location.search);
    const cleanPagePath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const storedAttribution = getStoredInviteAttribution();
    const hasCapturedAttribution =
      Boolean(capturedAttribution.inviteSource) || Boolean(capturedAttribution.guestId);
    const clickKey = `${capturedAttribution.inviteSource ?? ""}:${capturedAttribution.guestId ?? ""}`;

    if (hasCapturedAttribution && clickKey !== lastTrackedClickKey.current) {
      trackSaveTheDateClick(capturedAttribution, cleanPagePath);
      lastTrackedClickKey.current = clickKey;
    }

    trackPageView(cleanPagePath, storedAttribution);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
