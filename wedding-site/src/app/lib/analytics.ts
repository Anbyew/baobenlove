const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";

const SOURCE_PARAM = "src";
const GUEST_PARAM = "guest";
const SOURCE_STORAGE_KEY = "wedding_invite_source";
const GUEST_STORAGE_KEY = "wedding_guest_id";
const SCRIPT_ID = "google-analytics";

export interface InviteAttribution {
  inviteSource: string | null;
  guestId: string | null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function analyticsEnabled() {
  return MEASUREMENT_ID.length > 0;
}

function getGtag() {
  return window.gtag;
}

function normalizeAttributionValue(value: string | null) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!normalized) return null;

  return normalized.slice(0, 64);
}

export function initializeAnalytics() {
  if (!analyticsEnabled() || typeof window === "undefined") {
    return;
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: false,
  });
}

export function captureInviteAttribution(search: string): InviteAttribution {
  if (typeof window === "undefined") {
    return {
      inviteSource: null,
      guestId: null,
    };
  }

  const params = new URLSearchParams(search);
  const inviteSource = normalizeAttributionValue(params.get(SOURCE_PARAM));
  const guestId = normalizeAttributionValue(params.get(GUEST_PARAM));

  if (inviteSource) {
    window.localStorage.setItem(SOURCE_STORAGE_KEY, inviteSource);
  }

  if (guestId) {
    window.localStorage.setItem(GUEST_STORAGE_KEY, guestId);
  }

  params.delete(SOURCE_PARAM);
  params.delete(GUEST_PARAM);

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);

  return {
    inviteSource,
    guestId,
  };
}

export function getStoredInviteAttribution(): InviteAttribution {
  if (typeof window === "undefined") {
    return {
      inviteSource: null,
      guestId: null,
    };
  }

  return {
    inviteSource: normalizeAttributionValue(window.localStorage.getItem(SOURCE_STORAGE_KEY)),
    guestId: normalizeAttributionValue(window.localStorage.getItem(GUEST_STORAGE_KEY)),
  };
}

export function trackSaveTheDateClick(attribution: InviteAttribution, pagePath: string) {
  const gtag = getGtag();
  if (
    !analyticsEnabled() ||
    !gtag ||
    (!attribution.inviteSource && !attribution.guestId)
  ) {
    return;
  }

  gtag("set", "user_properties", {
    invite_source: attribution.inviteSource ?? undefined,
    guest_id: attribution.guestId ?? undefined,
  });
  gtag("event", "save_the_date_click", {
    invite_source: attribution.inviteSource ?? undefined,
    guest_id: attribution.guestId ?? undefined,
    page_path: pagePath,
  });
}

export function trackPageView(pagePath: string, attribution?: InviteAttribution) {
  const gtag = getGtag();
  if (!analyticsEnabled() || !gtag) {
    return;
  }

  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: document.title,
    invite_source: attribution?.inviteSource ?? undefined,
    guest_id: attribution?.guestId ?? undefined,
  });
}
