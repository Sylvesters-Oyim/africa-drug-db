"use client";

import { useEffect } from "react";

/**
 * Marks the document as JS-capable and observes `.reveal` elements so they
 * fade/slide in on scroll. Respects prefers-reduced-motion via CSS.
 */
export function RevealObserver() {
  useEffect(() => {
    document.documentElement.dataset.js = "";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const watch = () => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => observer.observe(el));
    };
    watch();

    // Catch elements added after navigation (soft nav / streaming).
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
