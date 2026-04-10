'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches an Intersection Observer to the returned ref.
 * When the element enters the viewport, adds the 'visible' class
 * which triggers the .scroll-fade CSS transition defined in globals.css.
 * The observer disconnects after firing once (elements don't re-animate).
 */
export function useScrollFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already visible (e.g. page loads mid-scroll), show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
