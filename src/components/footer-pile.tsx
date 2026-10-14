"use client";

import type { Body as Coin } from "matter-js";
import { useEffect, useRef } from "react";

/**
 * The footer's coin pile: the mark falls in as physical coins once the footer comes into view, piles
 * up, and makes way for the cursor (a tap knocks them about on touch screens). Physics by Matter.js,
 * loaded only when the footer is first seen. The simulation stops once every coin is asleep and while
 * the footer is off screen. With reduced motion the pile is computed in one go and drawn still.
 */
const MARK = "/brand/mark-coin.png";
const MARK_PX = 256;
const CFG = {
  sizeRatio: 0.036,
  sizeMin: 46,
  sizeMax: 84,
  fill: 0.55, // share of the area the settled coins cover
  overlap: 0.14, // coins are drawn this much larger than their bodies, so the pile looks full
  countMax: 150,
  cursorRatio: 0.05,
  cursorMin: 24,
  cursorMax: 48,
  burstRatio: 5,
  burstStrength: 24,
  spawnMs: 70,
  spawnPerTick: 4,
  gravity: 2.4,
  maxFps: 60,
  dprMax: 2,
  dprMaxTouch: 1.5,
};
const WALL = 200;

export function FooterPile({ className }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let teardown: (() => void) | null = null;
    let wake: (() => void) | null = null;
    let sleep: (() => void) | null = null;
    let started = false;
    let visible = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;

    const build = async () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const { default: M } = await import("matter-js");
      const { Engine, Render, Runner, Bodies, Body, Composite, Events, Query, Sleeping } = M;

      const engine = Engine.create({ enableSleeping: true });
      engine.gravity.y = CFG.gravity;
      const ratio = Math.min(window.devicePixelRatio || 1, touch ? CFG.dprMaxTouch : CFG.dprMax);
      const render = Render.create({ element: el, engine, options: { width, height, pixelRatio: ratio, background: "transparent", wireframes: false, showSleeping: false } });
      render.canvas.style.display = "block";
      render.canvas.style.width = `${width}px`;
      render.canvas.style.height = `${height}px`;

      // floor and side walls just outside the box; the lid goes on once every coin is in
      const hidden = { isStatic: true, render: { visible: false } };
      Composite.add(engine.world, [
        Bodies.rectangle(width / 2, height + WALL / 2, width + WALL * 2, WALL, hidden),
        Bodies.rectangle(-WALL / 2, -height / 2, WALL, height * 4, hidden),
        Bodies.rectangle(width + WALL / 2, -height / 2, WALL, height * 4, hidden),
      ]);

      const size = Math.min(Math.max(width * CFG.sizeRatio, CFG.sizeMin), CFG.sizeMax);
      const radius = size / 2;
      const body = radius * (1 - CFG.overlap);
      const count = Math.min(CFG.countMax, Math.round((CFG.fill * width * height) / (4 * body * body * 0.86)));
      const coin = (y: number) =>
        Bodies.circle(radius + Math.random() * (width - size), y, body, {
          restitution: 0.4,
          friction: 0.3,
          angle: (Math.random() - 0.5) * Math.PI,
          render: { sprite: { texture: MARK, xScale: size / MARK_PX, yScale: size / MARK_PX } },
        });
      const coins: Coin[] = [];
      const runner = Runner.create();
      let running = false;

      if (still) {
        // reduced motion: let the pile settle off screen, then draw it once
        for (let i = 0; i < count; i++) coins.push(coin(-Math.random() * height * 3));
        Composite.add(engine.world, coins);
        for (let i = 0; i < 600; i++) Engine.update(engine, 1000 / 60);
        Render.world(render);
        teardown = () => {
          Composite.clear(engine.world, false);
          Engine.clear(engine);
          render.canvas.remove();
        };
        return;
      }

      // the cursor is an invisible ball that shoulders coins aside
      const reach = Math.min(Math.max(width * CFG.cursorRatio, CFG.cursorMin), CFG.cursorMax);
      const cursor = Bodies.circle(-9999, -9999, reach, { isStatic: true, render: { visible: false } });
      Composite.add(engine.world, cursor);
      // Matter 0.20 can carry the move into the cursor's velocity, so coins it hits take its speed
      // (the published types lag behind and list two parameters)
      const place = Body.setPosition as (body: Coin, position: { x: number; y: number }, updateVelocity?: boolean) => void;
      let parked = true;
      const park = () => {
        parked = true;
        Body.setPosition(cursor, { x: -9999, y: -9999 });
      };
      const burst = (x: number, y: number) => {
        const r = reach * CFG.burstRatio;
        for (const b of Query.region(Composite.allBodies(engine.world), { min: { x: x - r, y: y - r }, max: { x: x + r, y: y + r } })) {
          if (b.isStatic) continue;
          const dx = b.position.x - x;
          const dy = b.position.y - y;
          const d = Math.hypot(dx, dy) || 1;
          if (d > r) continue;
          const push = CFG.burstStrength * (1 - d / r);
          Sleeping.set(b, false);
          Body.setVelocity(b, { x: b.velocity.x + (dx / d) * push, y: b.velocity.y + (dy / d) * push });
        }
      };
      const onPointer = (e: PointerEvent) => {
        const rect = render.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return park();
        place(cursor, { x, y }, !parked);
        parked = false;
        if (visible) wake?.();
        if (e.type === "pointerdown" && e.pointerType !== "mouse") burst(x, y);
        const r = reach + 20;
        for (const b of Query.region(Composite.allBodies(engine.world), { min: { x: x - r, y: y - r }, max: { x: x + r, y: y + r } })) if (!b.isStatic) Sleeping.set(b, false);
      };
      const onRelease = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") park();
      };
      if (!touch) window.addEventListener("pointermove", onPointer);
      window.addEventListener("pointerdown", onPointer);
      window.addEventListener("pointerup", onRelease);
      window.addEventListener("pointercancel", onRelease);

      // pour the coins in a few at a time
      const spawn = setInterval(() => {
        if (!running) return;
        for (let i = 0; i < CFG.spawnPerTick && coins.length < count; i++) {
          const b = coin(-size - Math.random() * size);
          coins.push(b);
          Composite.add(engine.world, b);
        }
        if (coins.length >= count) clearInterval(spawn);
      }, CFG.spawnMs);
      let lidded = false;
      Events.on(engine, "afterUpdate", () => {
        if (!lidded && coins.length >= count && coins.every((b) => b.position.y > size)) {
          lidded = true;
          Composite.add(engine.world, Bodies.rectangle(width / 2, -WALL / 2, width + WALL * 2, WALL, hidden));
        }
        if (coins.length >= count && coins.every((b) => b.isSleeping)) sleep?.();
      });

      let frame = 0;
      let last = 0;
      const gap = 1000 / CFG.maxFps;
      const draw = (t: number) => {
        frame = requestAnimationFrame(draw);
        if (t - last < gap - 1) return;
        last = t;
        Render.world(render);
      };
      wake = () => {
        if (running) return;
        running = true;
        Runner.run(runner, engine);
        frame = requestAnimationFrame(draw);
      };
      sleep = () => {
        if (!running) return;
        running = false;
        Runner.stop(runner);
        cancelAnimationFrame(frame);
      };
      if (visible) wake();

      teardown = () => {
        clearInterval(spawn);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("pointerup", onRelease);
        window.removeEventListener("pointercancel", onRelease);
        sleep?.();
        wake = sleep = null;
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        render.canvas.remove();
      };
    };

    const preload = () =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = MARK;
      });

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) {
          started = true;
          void preload().then(build);
          return;
        }
        if (visible) wake?.();
        else sleep?.();
      },
      { threshold: 0.1 },
    );
    io.observe(el);

    // a new width needs a new pile (phones keep theirs: their width only changes on rotation)
    let lastWidth = el.getBoundingClientRect().width;
    const onResize = () => {
      if (!started || touch) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = el.getBoundingClientRect().width;
        if (Math.abs(w - lastWidth) < 1) return;
        lastWidth = w;
        teardown?.();
        teardown = null;
        void build();
      }, 300);
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      teardown?.();
    };
  }, []);

  return <div ref={box} aria-hidden className={className} />;
}
