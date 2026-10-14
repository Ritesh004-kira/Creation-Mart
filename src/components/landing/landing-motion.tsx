'use client';

import { useEffect, useRef } from 'react';

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container || !('IntersectionObserver' in window)) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const elements = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal]'));
    let observer: IntersectionObserver | undefined;
    function setup() {
      observer?.disconnect();
      elements.forEach(element => element.classList.remove('reveal-pending'));
      if (media.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-pending');
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
      elements.forEach(element => {
        // Keep the initial viewport and restored scroll position visible immediately.
        if (element.getBoundingClientRect().top > window.innerHeight) {
          element.classList.add('reveal-pending');
          observer?.observe(element);
        }
      });
    }
    setup();
    media.addEventListener('change', setup);
    return () => {
      observer?.disconnect();
      media.removeEventListener('change', setup);
      elements.forEach(element => element.classList.remove('reveal-pending'));
    };
  }, []);

  return <div ref={root} className="landing">{children}</div>;
}
