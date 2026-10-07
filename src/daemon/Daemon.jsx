import { useEffect, useRef, useState } from "react";
import { daemon } from "./state";

// ───────────── sprite (original 16x16 ghost, drawn as <rect>s) ─────────────
// O outline, B body, C detail colour. Eyes, cheeks and mouth are drawn separately so
// they can move or close.
const BODY = [
  "......OOOO......",
  "....OOBBCCOO....",
  "...OBBBBBBBBO...",
  "..OBBBBBBBBBBO..",
  "..OBBBBBBBBBBO..",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  ".OBBOOBBBBOOBBO.",
  "..OO..OOOO..OO..",
];

const QUESTION = ["XXX.", "X.X.", "..X.", ".X..", "....", ".X.."];
const Z_BIG = ["XXXXX", "...X.", "..X..", ".X...", "XXXXX"];
const Z_SMALL = ["XXX", ".X.", "XXX"];

const Pixels = ({ grid, cls }) =>
  grid.flatMap((row, y) =>
    [...row].map((c, x) =>
      c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={cls[c]} />
    )
  );

const SIZE = 32;
const IDLE_MS = 8000;
const INTERACTIVE = "a, button, [role='button'], summary, label, .term-run, .unit";
const ROW = ".unit";

const media = (q) => window.matchMedia(q);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// The daemon IS the mouse pointer: it replaces the arrow, tracks the pointer exactly
// (the centre of the ghost is the click point), reacts to links and project rows, and falls
// asleep when idle. rAF + refs only; React never re-renders per move.
const Daemon = () => {
  const [enabled, setEnabled] = useState(false);
  const refs = {
    root: useRef(null),
    sprite: useRef(null),
    eyes: useRef(null),
    eyesClosed: useRef(null),
    bubble: useRef(null),
    zz: useRef(null),
    label: useRef(null),
  };

  useEffect(() => {
    const fine = media("(pointer: fine) and (hover: hover)");
    const reduce = media("(prefers-reduced-motion: reduce)");
    const update = () => {
      const on = fine.matches && !reduce.matches;
      daemon.available = on;
      setEnabled(on);
    };
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const { root, sprite, eyes, eyesClosed, bubble, zz, label } = Object.fromEntries(
      Object.entries(refs).map(([k, r]) => [k, r.current])
    );

    // The real cursor is always hidden (except the text cursor in the terminal input);
    // the daemon sprite below is drawn at the pointer on every element, buttons included.
    const style = document.createElement("style");
    style.textContent = `html.has-custom-cursor,html.has-custom-cursor *{cursor:none !important}
html.has-custom-cursor .term-input{cursor:text !important}`;
    document.head.appendChild(style);

    const st = {
      px: 0,
      py: 0,
      lastPx: 0,
      target: null,
      inWindow: false,
      spawned: false,
      x: 0,
      y: 0,
      face: 1,
      lastActive: performance.now(),
      sleeping: false,
      blinkUntil: 0,
      row: null,
      hop: { at: -1e9, count: 0 },
      bubbleUntil: 0,
      pressAt: -1e9,
      shakeAt: -1e9,
      tiltAt: -1e9,
      hideUntil: 0,
      peekAt: -1e9,
      raf: 0,
      last: performance.now(),
    };

    const touch = () => {
      const now = performance.now();
      if (st.sleeping) st.blinkUntil = now + 160; // quick blink as it wakes
      st.sleeping = false;
      st.lastActive = now;
    };

    const onMove = (e) => {
      st.lastPx = st.px;
      st.px = e.clientX;
      st.py = e.clientY;
      st.target = e.target;
      st.inWindow = true;
      if (!st.spawned) {
        st.spawned = true;
        st.x = e.clientX - SIZE / 2;
        st.y = e.clientY - SIZE / 2;
      }
      if (Math.abs(st.px - st.lastPx) > 1.5) st.face = st.px > st.lastPx ? 1 : -1;
      const row = e.target.closest?.(ROW) ?? null;
      if (row && row !== st.row) {
        const now = performance.now();
        st.hop = { at: now, count: 1 };
        st.bubbleUntil = now + 1400;
      }
      st.row = row;
      touch();
    };

    const onDown = () => {
      st.pressAt = performance.now();
      touch();
    };

    const onLeave = () => {
      st.inWindow = false;
    };

    const onEvent = (e) => {
      const now = performance.now();
      switch (e.detail) {
        case "sudo":
          st.shakeAt = now;
          break;
        case "snake":
          st.hop = { at: now, count: 2 };
          break;
        case "rm":
          st.hideUntil = now + 2000;
          st.peekAt = now + 2000;
          break;
        case "error":
          st.tiltAt = now;
          break;
        default:
      }
      touch();
    };

    const loop = (now) => {
      const dt = Math.min((now - st.last) / 1000, 0.05);
      st.last = now;

      if (!st.sleeping && now - st.lastActive > IDLE_MS) st.sleeping = true;

      const t = st.target;
      const overInput = !!t?.closest?.(".term-input"); // the native I-beam shows there
      const hidden = daemon.stopped || overInput || now < st.hideUntil;

      // The click point is the centre of the ghost, so what you aim at is what you hit.
      if (st.spawned && !st.sleeping) {
        st.x = st.px - SIZE / 2;
        st.y = st.py - SIZE / 2;
      }
      const html = document.documentElement;
      const wantCursor = st.spawned && !daemon.stopped;
      if (html.classList.contains("has-custom-cursor") !== wantCursor) html.classList.toggle("has-custom-cursor", wantCursor);

      // Motion on top of the position: float, hop, shake, tilt, peek.
      const sec = now / 1000;
      let dy = Math.floor(sec / 0.6) % 2 ? -2 : 0; // 2-frame idle float (1 sprite pixel)
      if (st.hop.count) {
        const phase = (now - st.hop.at) / 320;
        if (phase < st.hop.count) dy -= Math.abs(Math.sin(Math.PI * phase)) * 12;
      }
      let rot = 0;
      const shakeT = (now - st.shakeAt) / 1000;
      if (shakeT >= 0 && shakeT < 0.55) rot += Math.sin(shakeT * 30) * 10 * (1 - shakeT / 0.55);
      const tiltT = (now - st.tiltAt) / 1000;
      if (tiltT >= 0 && tiltT < 1.4) rot += 14 * Math.min(1, tiltT / 0.15, (1.4 - tiltT) / 0.3);
      const pressT = (now - st.pressAt) / 1000;
      const squish = pressT >= 0 && pressT < 0.14 ? 0.86 : 1; // small press feedback on click
      let peek = 0;
      const peekT = (now - st.peekAt) / 1000;
      if (peekT >= 0 && peekT < 0.45) peek = 40 * (1 - peekT / 0.45) ** 2;

      // Eyes look at the hovered control (or the pointer).
      const hover = !st.sleeping ? t?.closest?.(INTERACTIVE) : null;
      let lookX = st.px;
      let lookY = st.py;
      if (hover) {
        const r = hover.getBoundingClientRect();
        lookX = r.left + r.width / 2;
        lookY = r.top + r.height / 2;
      }
      const ex = clamp(Math.round((lookX - (st.x + SIZE / 2)) / 70), -1, 1) * st.face;
      const ey = clamp(Math.round((lookY - (st.y + SIZE / 2)) / 70), -1, 1);

      const closed = st.sleeping || now < st.blinkUntil;
      eyes.setAttribute("transform", `translate(${ex} ${ey})`);
      eyes.style.display = closed ? "none" : "";
      eyesClosed.style.display = closed ? "" : "none";

      root.classList.toggle("dm-terminal", !!t?.closest?.(".term-window, .unit, .rack-plate"));
      root.style.transform = `translate3d(${st.x}px, ${st.y + peek}px, 0)`;
      sprite.style.transform = `translateY(${dy + (squish < 1 ? 3 : 0)}px) rotate(${rot}deg) scale(${st.face}, ${squish})`;
      const overlay = st.spawned && st.inWindow && !hidden;
      root.style.opacity = overlay ? "1" : "0";

      bubble.style.display = now < st.bubbleUntil && !st.sleeping ? "" : "none";
      zz.style.display = st.sleeping ? "" : "none";
      label.style.display = st.sleeping ? "" : "none";
      if (st.sleeping) {
        const rise = (sec * 6) % 24; // slow
        zz.style.transform = `translate(${st.face > 0 ? 22 : -4}px, ${-rise - 4}px)`;
        zz.style.opacity = String(1 - rise / 24);
      }

      // Mood, for the `daemon` command.
      daemon.mood = daemon.stopped
        ? "stopped"
        : now < st.hideUntil
        ? "hiding"
        : st.sleeping
        ? "sleeping"
        : tiltT >= 0 && tiltT < 1.4
        ? "confused"
        : shakeT >= 0 && shakeT < 0.55
        ? "disapproving"
        : st.hop.count && (now - st.hop.at) / 320 < st.hop.count
        ? st.row ? "curious" : "happy"
        : "riding the pointer";

      st.raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      cancelAnimationFrame(st.raf);
      if (!document.hidden) {
        st.last = performance.now();
        st.raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("keydown", touch);
    window.addEventListener("daemon", onEvent);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    st.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(st.raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("daemon", onEvent);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.classList.remove("has-custom-cursor");
      style.remove();
    };
    // refs are stable objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={refs.root} className="daemon-root" aria-hidden="true" style={{ opacity: 0 }}>
      <div ref={refs.sprite} className="daemon-sprite">
        <svg className="daemon-svg" viewBox="0 0 16 16" width={SIZE} height={SIZE}>
          <Pixels grid={BODY} cls={{ O: "dm-o", B: "dm-b", C: "dm-c" }} />
          {/* cheeks and mouth */}
          <rect x="3" y="9" width="2" height="1" className="dm-c" />
          <rect x="11" y="9" width="2" height="1" className="dm-c" />
          <rect x="7" y="10" width="2" height="1" className="dm-o" />
          {/* open eyes: two 2x2 blocks */}
          <g ref={refs.eyes}>
            <rect x="4" y="6" width="2" height="2" className="dm-o" />
            <rect x="10" y="6" width="2" height="2" className="dm-o" />
          </g>
          {/* closed eyes */}
          <g ref={refs.eyesClosed} style={{ display: "none" }}>
            <rect x="4" y="7" width="2" height="1" className="dm-o" />
            <rect x="10" y="7" width="2" height="1" className="dm-o" />
          </g>
        </svg>
      </div>

      <svg ref={refs.bubble} className="daemon-bubble" viewBox="0 0 8 9" width="16" height="18" style={{ display: "none" }}>
        <rect x="0" y="0" width="8" height="8" className="dm-b" />
        <g transform="translate(2 1)">
          <Pixels grid={QUESTION} cls={{ X: "dm-o" }} />
        </g>
        <rect x="1" y="8" width="1" height="1" className="dm-b" />
      </svg>

      <div ref={refs.zz} className="daemon-zz" style={{ display: "none" }}>
        <svg viewBox="0 0 9 9" width="18" height="18">
          <g transform="translate(0 4)">
            <Pixels grid={Z_SMALL} cls={{ X: "dm-z" }} />
          </g>
          <g transform="translate(4 0)">
            <Pixels grid={Z_BIG} cls={{ X: "dm-z" }} />
          </g>
        </svg>
      </div>

      <span ref={refs.label} className="daemon-label" style={{ display: "none" }}>
        sleeping (pid 1)
      </span>
    </div>
  );
};

export default Daemon;
