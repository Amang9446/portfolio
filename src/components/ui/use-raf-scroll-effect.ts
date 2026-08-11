"use client";

import { useEffect, useRef } from "react";

export function useRafScrollEffect(
  callback: () => void,
  includeResize = false,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let frame = 0;

    const requestUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => callbackRef.current());
    };

    callbackRef.current();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    if (includeResize) window.addEventListener("resize", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      if (includeResize) window.removeEventListener("resize", requestUpdate);
    };
  }, [includeResize]);
}
