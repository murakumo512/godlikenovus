"use client";

import { BASE_PATH } from "./base-path";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const key = "gl_visitor_id";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function trackAnalytics(payload: {
  type: "pageview" | "section" | "media";
  section?: string;
  mediaKey?: string;
  mediaLabel?: string;
  mediaCategory?: string;
  mediaUrl?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      ...payload,
      visitorId: getVisitorId(),
    });
    const url = `${BASE_PATH}/api/analytics/track`;
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // ignore tracking errors
  }
}
