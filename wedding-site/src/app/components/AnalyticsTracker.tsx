import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  captureInviteAttribution,
  getStoredInviteAttribution,
  initializeAnalytics,
  trackSaveTheDateClick,
  trackPageView,
} from "../lib/analytics";
import { logEvent } from "../lib/auth";
import { useGuestIdentity } from "../context/GuestIdentityContext";

export function AnalyticsTracker() {
  const location = useLocation();
  const lastTrackedClickKey = useRef<string | null>(null);
  const { identity, isValidating } = useGuestIdentity();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (isValidating) return;

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

    logEvent({
      sessionToken: identity?.sessionToken,
      eventType: "page_view",
      page: cleanPagePath,
      referrer: document.referrer || undefined,
    });
  }, [location.pathname, location.search, location.hash, identity?.sessionToken, isValidating]);

  return null;
}
