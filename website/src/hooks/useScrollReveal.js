/**
 * useScrollReveal.js
 *
 * Custom React hook that uses the IntersectionObserver API to detect
 * when an element scrolls into the viewport. Returns a ref to attach
 * to the target element and a boolean indicating visibility.
 *
 * Used by the Services section to trigger fade-in/slide-up animations
 * on individual cards as they enter the viewport.
 */

import { useRef, useState, useEffect } from "react";

/**
 * useScrollReveal — Observes an element and flags when it becomes visible.
 *
 * @param {Object} [options]                - IntersectionObserver options
 * @param {number} [options.threshold=0.15] - Visibility threshold (0-1)
 * @param {string} [options.rootMargin="0px"] - Root margin for early/late triggering
 * @returns {[React.RefObject, boolean]} A ref for the element and a revealed flag
 */
export default function useScrollReveal(options = {}) {
  const { threshold = 0.15, rootMargin = "0px" } = options;
  const ref = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Create the observer — triggers once then disconnects
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(element); // Only animate once
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    // Cleanup on unmount
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, isRevealed];
}
