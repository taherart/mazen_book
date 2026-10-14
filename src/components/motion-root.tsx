"use client";

import { useEffect } from "react";

/**
 * One set of observers for the whole site, so server components can opt into motion with a
 * data attribute and stay server components:
 *
 *   data-reveal            fade/slide in once when scrolled into view  ("", "fade", "start", "scale")
 *   data-stagger           on a parent: its children reveal in sequence
 *   data-countup="1250"    counts up to the number when revealed
 *   data-spotlight         exposes the pointer position as --mx/--my (px) and --px/--py (0..1)
 *   data-magnetic="0.25"   element leans toward the pointer; the value is the pull strength
 *
 * Nothing here touches React state: values go straight to the DOM. Pointer effects are only
 * wired up for a real mouse, and everything is skipped under prefers-reduced-motion.
 */
export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const countUp = (el: HTMLElement) => {
      const target = Number(el.dataset.countup);
      // Write into the text node React rendered, never replace it: if React later updates the
      // number it updates that same node, and the screen stays in step.
      const text = el.firstChild;
      if (!Number.isFinite(target) || reduce || !(text instanceof Text) || el.childNodes.length !== 1) return;
      const started = performance.now();
      const tick = (now: number) => {
        // React changed the value mid-count: its number wins
        if (Number(el.dataset.countup) !== target) return;
        const t = Math.min(1, (now - started) / 900);
        text.nodeValue = Math.round(target * (1 - Math.pow(1 - t, 4))).toLocaleString("en-US");
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const show = (el: HTMLElement) => {
      if (el.dataset.inview !== undefined) return;
      el.dataset.inview = "";
      if (el.dataset.countup) countUp(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    const SELECTOR = "[data-reveal]:not([data-inview]), [data-countup]:not([data-inview])";
    const watch = (scope: ParentNode) => scope.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(SELECTOR)) io.observe(node);
          watch(node);
        }
      }
    });

    let frame = 0;
    let last: PointerEvent | null = null;
    let pulled: HTMLElement | null = null;
    const release = () => {
      if (!pulled) return;
      delete pulled.dataset.pulling;
      pulled.style.removeProperty("--tx");
      pulled.style.removeProperty("--ty");
      pulled = null;
    };
    const apply = () => {
      frame = 0;
      const e = last;
      if (!e || !(e.target instanceof Element)) return;

      const spot = e.target.closest<HTMLElement>("[data-spotlight]");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
        spot.style.setProperty("--px", ((e.clientX - r.left) / r.width).toFixed(3));
        spot.style.setProperty("--py", ((e.clientY - r.top) / r.height).toFixed(3));
      }

      const magnet = e.target.closest<HTMLElement>("[data-magnetic]");
      if (pulled && pulled !== magnet) release();
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const k = Number(magnet.dataset.magnetic) || 0.25;
        const clamp = (v: number) => Math.max(-8, Math.min(8, v));
        magnet.dataset.pulling = "";
        magnet.style.setProperty("--tx", `${clamp((e.clientX - (r.left + r.width / 2)) * k)}px`);
        magnet.style.setProperty("--ty", `${clamp((e.clientY - (r.top + r.height / 2)) * k)}px`);
        pulled = magnet;
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const start = () => {
      // Whatever is on screen, or already scrolled past, stays put: mark it before the hidden
      // state switches on, so visible content never blinks.
      for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.inview = "";
      }
      root.classList.add("motion");
      watch(document);
      mo.observe(document.body, { childList: true, subtree: true });
      if (fine && !reduce) {
        document.addEventListener("pointermove", onMove, { passive: true });
        root.addEventListener("pointerleave", release);
      }
    };

    // Server-rendered elements must not gain attributes before React hydrates them, or React
    // reports a mismatch, and Suspense boundaries hydrate after this effect runs. So wait until
    // the document has finished streaming and the main thread is idle. Until then nothing is
    // hidden, so the page is complete either way.
    const hasIdle = typeof window.requestIdleCallback === "function"; // not in Safari
    let idle = 0;
    const schedule = () => {
      idle = hasIdle ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 200);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", release);
      root.classList.remove("motion");
    };
  }, []);

  return null;
}
