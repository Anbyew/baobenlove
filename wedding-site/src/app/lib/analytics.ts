const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";

const SOURCE_PARAM = "src";
const SOURCE_STORAGE_KEY = "wedding_invite_source";
const SCRIPT_ID = "google-analytics";

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

function normalizeSource(value: string | null) {
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

export function captureInviteSource(search: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(search);
  const source = normalizeSource(params.get(SOURCE_PARAM));

  if (!source) {
    return getStoredInviteSource();
  }

  window.localStorage.setItem(SOURCE_STORAGE_KEY, source);
  params.delete(SOURCE_PARAM);

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);

  return source;
}

export function getStoredInviteSource() {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeSource(window.localStorage.getItem(SOURCE_STORAGE_KEY));
}

export function trackInviteSource(source: string | null, pagePath: string) {
  const gtag = getGtag();
  if (!analyticsEnabled() || !gtag || !source) {
    return;
  }

  gtag("set", "user_properties", {
    invite_source: source,
  });
  gtag("event", "invite_source_captured", {
    invite_source: source,
    page_path: pagePath,
  });
}

export function trackPageView(pagePath: string, inviteSource?: string | null) {
  const gtag = getGtag();
  if (!analyticsEnabled() || !gtag) {
    return;
  }

  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: document.title,
    invite_source: inviteSource ?? undefined,
  });
}
