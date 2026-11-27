"use client";

import { useEffect, useRef } from "react";

// Global stack of active layer IDs so only the topmost layer responds to Back / Swipe Back
const activeLayerStack: string[] = [];

/**
 * Integrates modal / sub-view state with browser history so pressing Back
 * or swiping Back on mobile closes the current layer instead of exiting the site.
 */
export function useHistoryBack(
  isOpen: boolean,
  onClose: () => void,
  layerPrefix = "layer"
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const layerIdRef = useRef<string | null>(null);
  const closedByPopRef = useRef(false);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const id = `${layerPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    layerIdRef.current = id;
    closedByPopRef.current = false;
    activeLayerStack.push(id);

    window.history.pushState({ __glLayer: id }, "");

    const handlePopState = () => {
      const topId = activeLayerStack[activeLayerStack.length - 1];
      if (topId !== id) return;
      activeLayerStack.pop();
      closedByPopRef.current = true;
      layerIdRef.current = null;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      const idx = activeLayerStack.lastIndexOf(id);
      if (idx !== -1) {
        activeLayerStack.splice(idx, 1);
      }
      if (!closedByPopRef.current && layerIdRef.current === id) {
        layerIdRef.current = null;
        if (window.history.state?.__glLayer === id) {
          window.history.back();
        }
      }
    };
  }, [isOpen, layerPrefix]);
}
