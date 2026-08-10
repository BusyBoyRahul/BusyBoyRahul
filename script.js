document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Preloader: gates the "js .reveal" fade-in below on real progress loading
// the page's own critical assets (local hero/testimonial images + the two
// videos) rather than a fixed timer, so the percentage means something. It
// deliberately does NOT wait on the ~24 third-party brand-logo <img>s (from
// cdn.simpleicons.org / vapi.ai) or the window `load` event: a single slow,
// blocked (ad-blockers routinely block third-party icon CDNs), or hiccuping
// external request would otherwise hang the preloader indefinitely. A slow
// trickle keeps the number moving even on instant/cached loads so it never
// looks stuck, a minimum visible time keeps it from flashing by, and a hard
// timeout guarantees the site always reveals even if something never settles.
function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const root = document.documentElement;
  const percentEl = preloader.querySelector(".preloader-percent");
  const fillEl = preloader.querySelector(".preloader-bar-fill");
  root.classList.add("is-loading");

  const reveal = () => {
    preloader.classList.add("is-done");
    root.classList.remove("is-loading");
    root.classList.add("is-revealed");
    const remove = () => preloader.remove();
    preloader.addEventListener("transitionend", remove, { once: true });
    setTimeout(remove, 900); // safety net if the transition never fires
  };

  const HARD_TIMEOUT_MS = 5000;

  if (prefersReducedMotion) {
    const timer = setTimeout(reveal, HARD_TIMEOUT_MS);
    window.addEventListener(
      "load",
      () => {
        clearTimeout(timer);
        requestAnimationFrame(reveal);
      },
      { once: true }
    );
    return;
  }

  const trackables = [...document.querySelectorAll('img[src^="assets/"], video')];
  const total = trackables.length;
  let settled = 0;

  const isReady = (el) => (el.tagName === "IMG" ? el.complete : el.readyState >= 2);

  trackables.forEach((el) => {
    if (isReady(el)) {
      settled += 1;
      return;
    }
    const onSettle = () => {
      settled += 1;
      el.removeEventListener("load", onSettle);
      el.removeEventListener("loadeddata", onSettle);
      el.removeEventListener("error", onSettle);
    };
    el.addEventListener("load", onSettle, { once: true });
    el.addEventListener("loadeddata", onSettle, { once: true });
    el.addEventListener("error", onSettle, { once: true });
  });

  const MIN_VISIBLE_MS = 700;
  const TRICKLE_MS = 1600;
  const start = performance.now();
  let shown = 0;
  let timedOut = false;
  setTimeout(() => { timedOut = true; }, HARD_TIMEOUT_MS);

  const tick = (now) => {
    const assetRatio = total ? settled / total : 1;
    const trickleRatio = Math.min(1, (now - start) / TRICKLE_MS);
    const ready = timedOut || settled >= total;
    const target = ready ? 100 : Math.max(assetRatio, trickleRatio) * 92;

    shown += (target - shown) * 0.12;
    if (ready && target - shown < 0.3) shown = 100;
    shown = Math.min(shown, 100);

    const display = Math.round(shown);
    if (percentEl) percentEl.textContent = `${display}%`;
    if (fillEl) fillEl.style.transform = `scaleX(${shown / 100})`;

    if (shown >= 100 && now - start >= MIN_VISIBLE_MS) {
      reveal();
      return;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

initPreloader();

const nav = document.querySelector(".portfolio-nav");
const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
const navCollapse = document.querySelector("#mainNav");
const sections = document.querySelectorAll("section[id]");
const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const skillMeters = document.querySelectorAll(".skill-meter");
const splitTargets = document.querySelectorAll("[data-split]");
const letterWaveTargets = document.querySelectorAll("[data-letter-wave]");
const typedRole = document.querySelector("#typedRole");
const testimonialCards = document.querySelectorAll(".testimonial-card");

const roles = [
  "CRM Builder",
  "PHP Developer",
  "CodeIgniter Developer",
  "SaaS Builder",
  "AI Automation Developer",
  "Server Manager"
];

function setScrolledNav() {
  nav?.classList.toggle("is-scrolled", window.scrollY > 18);
}

window.addEventListener("scroll", setScrolledNav, { passive: true });
setScrolledNav();

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (!navCollapse || !window.bootstrap) return;
    window.bootstrap.Collapse.getOrCreateInstance(navCollapse, { toggle: false }).hide();
  });
});

// The mobile menu panel now overlays the page (position: absolute) instead of
// pushing content down in-flow, so it visually reads as a dropdown — tapping
// anywhere outside it (not just a nav link or the toggler again) should
// dismiss it, the way any overlay menu behaves. Bootstrap's collapse has no
// such "click outside" behavior built in, so wire it up manually.
document.addEventListener("click", (event) => {
  if (!navCollapse || !window.bootstrap) return;
  if (!navCollapse.classList.contains("show")) return;
  if (navCollapse.contains(event.target) || event.target.closest(".navbar-toggler")) return;
  window.bootstrap.Collapse.getOrCreateInstance(navCollapse, { toggle: false }).hide();
});

function prepareSplitText() {
  if (prefersReducedMotion) return;

  splitTargets.forEach((target) => {
    const text = target.textContent.trim();
    if (!text) return;

    target.setAttribute("aria-label", text);
    target.textContent = "";

    text.split(" ").forEach((word, index, words) => {
      const span = document.createElement("span");
      span.className = "split-word";
      span.style.setProperty("--split-delay", `${index * 46}ms`);
      span.textContent = word;
      target.appendChild(span);

      if (index < words.length - 1) {
        target.appendChild(document.createTextNode(" "));
      }
    });

    target.classList.add("split-ready");
  });
}

prepareSplitText();

function prepareLetterWave() {
  if (prefersReducedMotion) return;

  letterWaveTargets.forEach((target) => {
    const text = target.textContent;
    if (!text.trim()) return;

    target.setAttribute("aria-label", text.trim());
    target.textContent = "";

    [...text].forEach((character, index) => {
      const span = document.createElement("span");
      span.className = "name-letter";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--letter-index", index);
      span.textContent = character === " " ? "\u00a0" : character;
      target.appendChild(span);
    });

    target.classList.add("letter-wave-ready");
  });
}

prepareLetterWave();

function initClickSpark() {
  if (prefersReducedMotion) return;

  window.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    const spark = document.createElement("span");
    spark.className = "click-spark";
    spark.style.left = `${event.clientX}px`;
    spark.style.top = `${event.clientY}px`;

    for (let index = 0; index < 8; index += 1) {
      const ray = document.createElement("i");
      ray.style.setProperty("--spark-angle", `${index * 45}deg`);
      spark.appendChild(ray);
    }

    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  });
}

initClickSpark();

function initDotField() {
  const canvas = document.querySelector("#dotFieldCanvas");
  const hero = document.querySelector(".hero-section");
  if (!canvas || !hero || prefersReducedMotion) return;

  const context = canvas.getContext("2d");
  const pointer = { x: -9999, y: -9999, active: false };
  let dots = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  const buildDots = () => {
    const rect = hero.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const gap = width < 768 ? 28 : 34;
    dots = [];

    for (let y = gap * 0.6; y < height; y += gap) {
      for (let x = gap * 0.6; x < width; x += gap) {
        dots.push({
          x,
          y,
          phase: Math.random() * Math.PI * 2,
          size: Math.random() * 0.8 + 0.7,
          glow: Math.random() > 0.88
        });
      }
    }
  };

  const setPointer = (event) => {
    // Skip the layout read entirely once the field has stopped animating
    // (hero off-screen / tab backgrounded) — otherwise every mousemove on the
    // *entire page*, forever, would force a getBoundingClientRect layout read
    // for a canvas that isn't even drawing.
    if (!running) return;
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
  };

  const clearPointer = () => {
    pointer.active = false;
  };

  let running = false;
  let heroVisible = true;

  const draw = (time = 0) => {
    if (!running) return;

    context.clearRect(0, 0, width, height);
    const t = time * 0.001;

    dots.forEach((dot) => {
      const dx = pointer.x - dot.x;
      const dy = pointer.y - dot.y;
      const distance = Math.hypot(dx, dy);
      const influence = pointer.active ? Math.max(0, 1 - distance / 145) : 0;
      const drift = Math.sin(t + dot.phase) * 0.45;
      const push = influence * 11;
      const angle = Math.atan2(dy, dx);
      const x = dot.x - Math.cos(angle) * push;
      const y = dot.y - Math.sin(angle) * push + drift;
      const radius = dot.size + influence * 1.85;
      const alpha = 0.24 + influence * 0.56 + (dot.glow ? 0.12 : 0);

      context.beginPath();
      context.fillStyle = `rgba(196, 181, 253, ${alpha})`;
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      if (influence > 0.18) {
        context.beginPath();
        context.strokeStyle = `rgba(139, 92, 246, ${influence * 0.28})`;
        context.lineWidth = 1;
        context.arc(x, y, radius * 4.2, 0, Math.PI * 2);
        context.stroke();
      }
    });

    requestAnimationFrame(draw);
  };

  // The dot field previously animated with an unconditional requestAnimationFrame
  // loop that never stopped, even once the hero scrolled out of view or the tab
  // was backgrounded — that constant per-frame canvas work (1000+ arcs) competed
  // with the browser's scroll/input handling on the main thread and made
  // scrolling feel janky everywhere on the page, not just in the hero. Only run
  // the loop while the hero is actually visible and the tab is in the foreground.
  const start = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(draw);
  };

  const stop = () => {
    running = false;
  };

  const syncRunning = () => {
    if (heroVisible && document.visibilityState === "visible") {
      start();
    } else {
      stop();
    }
  };

  buildDots();
  syncRunning();
  // Coalesce to one rebuild per frame — buildDots() re-derives the whole dot
  // grid (~1000 objects), and an uncoalesced listener re-runs it for every
  // single resize event a browser fires while a window is actively being
  // dragged to a new size, causing that whole drag to visibly stutter.
  let resizeQueued = false;
  const scheduleBuildDots = () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      buildDots();
    });
  };
  window.addEventListener("resize", scheduleBuildDots);
  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("pointerleave", clearPointer);
  document.addEventListener("visibilitychange", syncRunning);

  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        heroVisible = entries[0]?.isIntersecting ?? true;
        syncRunning();
      },
      { threshold: 0 }
    );
    heroObserver.observe(hero);
  }
}

initDotField();

// Faithful vanilla port of the React Bits <RippleDistortion /> (ogl) component,
// driven by the background <video> instead of a still image. ogl is pulled in as
// an ES module from a CDN (same pattern the hero canvas uses for three.js).
// Localized water ripple on the About video: a disc of refraction that appears
// only while the pointer is over the video, follows the cursor, and fades out
// when it leaves. Drawn with a 2D canvas that samples the video through an
// offscreen buffer — no pixel read-back — so it works even when the page is
// opened directly from disk (file://), where WebGL cannot texture a local video.
// Ripple Distortion (React Bits port) for the About video. Faithful to the
// original wave model: moving the pointer lays down a TRAIL of ripples (one per
// `spacing` px travelled); each ripple grows (`spread`) and fades (`fade`), and
// the video refracts through the combined field with a swirl. When the pointer
// stops or leaves, no new ripples spawn and the surface settles back to still.
//
// Rendered in 2D canvas (not WebGL) so it works when the page is opened from
// disk (file://): the video is only ever drawn (drawImage) — never read back —
// and the displacement field is plain gradients, so nothing taints.
function initRippleDistortion() {
  const frame = document.querySelector(".ripple-video-frame");
  const video = document.querySelector(".ripple-video");
  const canvas = document.querySelector(".ripple-canvas");
  if (!frame || !video || !canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  const buffer = document.createElement("canvas"); // current video frame
  const bctx = buffer.getContext("2d");
  const field = document.createElement("canvas"); // displacement height field
  const fctx = field.getContext("2d", { willReadFrequently: true });

  const settings = {
    brushSize: 150, // px — diameter of each ripple stamp
    spread: 5, // how many times its size a ripple grows to before dying
    fade: 3, // seconds a ripple survives
    spacing: 11, // px of pointer travel between ripples
    rings: 4, // concentric swells inside each ripple
    swirl: 0.6, // twist added to the refraction (liquid feel)
    amplitude: 70, // px — max refraction displacement
    clickStrength: 2, // click ripple starts this much larger
    fieldScale: 0.6, // resolution of the displacement buffer
    cell: 5 // px — displacement sampling grid (smaller = smoother, heavier)
  };

  const MAX_WAVES = 70;
  const START_SCALE = 1.5;
  const LIFE_CONSTANT = Math.log(500);

  const waves = Array.from({ length: MAX_WAVES }, () => ({
    x: 0,
    y: 0,
    scale: START_SCALE,
    target: START_SCALE,
    size: 1,
    opacity: 0
  }));
  let current = 0;
  let previousX = -9999;
  let previousY = -9999;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let fieldW = 2;
  let fieldH = 2;
  let ready = false;

  // Precompute one radial ripple stamp (envelope * concentric rings) once, then
  // just scale/fade it per wave. Matches the React brush/ring shader.
  const stamp = document.createElement("canvas");
  const sctx = stamp.getContext("2d");
  const buildStamp = () => {
    const size = 220;
    stamp.width = size;
    stamp.height = size;
    const image = sctx.createImageData(size, size);
    const half = size / 2;
    const EDGE = Math.exp(-5);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const nx = (x - half) / half;
        const ny = (y - half) / half;
        const r2 = nx * nx + ny * ny;
        let value = 0;
        if (r2 <= 1) {
          // Fuller envelope so the whole disc displaces (broad water, not a dot).
          const envelope = Math.pow(1 - r2, 0.7);
          const ring = 0.6 + 0.4 * Math.cos(Math.sqrt(r2) * Math.PI * 2 * settings.rings);
          value = Math.max(0, envelope * ring);
        }
        const idx = (y * size + x) * 4;
        image.data[idx] = 255;
        image.data[idx + 1] = 255;
        image.data[idx + 2] = 255;
        image.data[idx + 3] = Math.round(value * 255);
      }
    }
    sctx.putImageData(image, 0, 0);
  };
  buildStamp();

  const resize = () => {
    const rect = frame.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    buffer.width = canvas.width;
    buffer.height = canvas.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fieldW = Math.max(2, Math.round(width * settings.fieldScale));
    fieldH = Math.max(2, Math.round(height * settings.fieldScale));
    field.width = fieldW;
    field.height = fieldH;
  };

  const drawVideoToBuffer = () => {
    const vw = video.videoWidth || width;
    const vh = video.videoHeight || height;
    const scale = Math.max(width / vw, height / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(video, (width - dw) / 2, (height - dh) / 2, dw, dh);
  };

  const spawnWave = (x, y, power) => {
    const wave = waves[current];
    current = (current + 1) % MAX_WAVES;
    wave.x = x;
    wave.y = y;
    wave.scale = START_SCALE * power;
    wave.target = START_SCALE * settings.spread * power;
    wave.size = settings.brushSize;
    wave.opacity = 1;
  };

  const readPointer = (event) => {
    const rect = frame.getBoundingClientRect();
    const inside =
      rect.width > 0 &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    return { inside, x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  // Frame lives in a `pointer-events: none` stage — hit-test the window.
  const onMove = (event) => {
    const p = readPointer(event);
    if (!p.inside) return;
    // Only lay down a ripple once the pointer has actually travelled: no
    // movement => no new ripples (the surface settles).
    if (Math.abs(p.x - previousX) > settings.spacing || Math.abs(p.y - previousY) > settings.spacing) {
      spawnWave(p.x, p.y, 1);
      previousX = p.x;
      previousY = p.y;
    }
  };
  const onDown = (event) => {
    const p = readPointer(event);
    if (!p.inside) return;
    spawnWave(p.x, p.y, settings.clickStrength);
    previousX = p.x;
    previousY = p.y;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });

  let previousTime = 0;

  const render = (now) => {
    requestAnimationFrame(render);

    if (video.readyState < 2) return;
    if (!ready) {
      ready = true;
      frame.classList.add("is-canvas-ripple-ready");
    }

    const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;
    previousTime = now;
    const growth = 1 - Math.exp(-delta * 1.09);
    const decay = Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, settings.fade));

    // Advance ripples and build the displacement field. Blur softens the ring
    // gradients so the refraction reads as smooth water rather than torn blocks.
    fctx.clearRect(0, 0, fieldW, fieldH);
    fctx.globalCompositeOperation = "lighter";
    fctx.filter = "blur(3.5px)";
    let live = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let i = 0; i < MAX_WAVES; i += 1) {
      const wave = waves[i];
      if (wave.opacity <= 0) continue;

      wave.opacity *= decay;
      wave.scale += (wave.target - wave.scale) * growth;
      if (wave.opacity < 0.003) {
        wave.opacity = 0;
        continue;
      }
      live += 1;

      const halfDisp = (wave.scale * wave.size) / 2; // radius in display px
      const fx = wave.x * settings.fieldScale;
      const fy = wave.y * settings.fieldScale;
      const fr = halfDisp * settings.fieldScale;

      fctx.globalAlpha = wave.opacity * wave.opacity;
      fctx.drawImage(stamp, fx - fr, fy - fr, fr * 2, fr * 2);

      if (wave.x - halfDisp < minX) minX = wave.x - halfDisp;
      if (wave.x + halfDisp > maxX) maxX = wave.x + halfDisp;
      if (wave.y - halfDisp < minY) minY = wave.y - halfDisp;
      if (wave.y + halfDisp > maxY) maxY = wave.y + halfDisp;
    }
    fctx.globalAlpha = 1;
    fctx.filter = "none";
    fctx.globalCompositeOperation = "source-over";

    ctx.clearRect(0, 0, width, height);
    if (live === 0) return; // nothing disturbed => plain video shows through

    // Refract the video through the field, but only over the disturbed area.
    drawVideoToBuffer();
    const fieldData = fctx.getImageData(0, 0, fieldW, fieldH).data;

    const cell = settings.cell;
    const fs = settings.fieldScale;
    const amp = settings.amplitude;
    const x0 = Math.max(0, Math.floor(minX / cell) * cell);
    const x1 = Math.min(width, Math.ceil(maxX / cell) * cell);
    const y0 = Math.max(0, Math.floor(minY / cell) * cell);
    const y1 = Math.min(height, Math.ceil(maxY / cell) * cell);

    // Height of the displacement field at a display-space point (0..1).
    const heightAt = (px, py) => {
      let fx = (px * fs) | 0;
      let fy = (py * fs) | 0;
      if (fx < 0) fx = 0;
      else if (fx >= fieldW) fx = fieldW - 1;
      if (fy < 0) fy = 0;
      else if (fy >= fieldH) fy = fieldH - 1;
      return fieldData[(fy * fieldW + fx) * 4] / 255;
    };

    for (let y = y0; y < y1; y += cell) {
      const cyp = y + cell / 2;
      for (let x = x0; x < x1; x += cell) {
        const cxp = x + cell / 2;
        const h = heightAt(cxp, cyp);
        if (h < 0.02) continue;

        // Refract along the slope of the field (water-lens), with a swirl twist.
        const gx = heightAt(cxp + cell, cyp) - heightAt(cxp - cell, cyp);
        const gy = heightAt(cxp, cyp + cell) - heightAt(cxp, cyp - cell);
        const theta = h * settings.swirl * Math.PI * 0.5;
        const cs = Math.cos(theta);
        const sn = Math.sin(theta);
        const rx = gx * cs - gy * sn;
        const ry = gx * sn + gy * cs;
        const ox = rx * amp;
        const oy = ry * amp;

        ctx.drawImage(
          buffer,
          (x + ox) * dpr,
          (y + oy) * dpr,
          cell * dpr,
          cell * dpr,
          x,
          y,
          cell + 2,
          cell + 2
        );
      }
    }
  };

  resize();
  video.play?.().catch(() => {});
  window.addEventListener("resize", resize);
  requestAnimationFrame(render);
}

// Chooses the best ripple the current environment can run:
//  - over http(s): the exact React Bits ogl ripple (smooth, GPU per-pixel)
//  - from file://: the 2D trail fallback (browsers block GPU-texturing a local
//    video, so the exact effect is impossible there)
function initRippleDistortionWebGL() {
  const frame = document.querySelector(".ripple-video-frame");
  const video = document.querySelector(".ripple-video");
  const canvas = document.querySelector(".ripple-canvas");
  if (!frame || !video || !canvas || prefersReducedMotion) return;
  frame.classList.add("is-file-ripple");

  // The exact ripple only runs when the video is same-origin over http(s).
  // Opened normally (double-click / file://) the browser blocks WebGL from
  // texturing a local video, so we leave the plain video playing rather than
  // show a lower-quality fallback effect.
  if (location.protocol === "file:") return;

  // Over http: run the exact ogl ripple. If WebGL can't run for some reason,
  // keep the plain video (no fallback effect).
  initRippleWebGL(frame, video, canvas, () => {});
}

// Exact React Bits Ripple Distortion (ogl). Calls onFail() if WebGL/ogl can't
// run so the caller can fall back to the 2D version.
async function initRippleWebGL(frame, video, canvas, onFail) {
  const settings = {
    brushSize: 140,
    strength: 0.4,
    swirl: 1,
    rings: 4,
    spread: 2,
    fade: 3,
    spacing: 0,
    dispersion: 0.015,
    glint: 0,
    tint: "#a855f7",
    tintAmount: 0.1,
    grayscale: false,
    highlightColor: "#ffffff",
    clickStrength: 2,
    quality: "low"
  };
  const MAX_WAVES = 100;
  const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 1 };
  const START_SCALE = 1.5;
  const LIFE_CONSTANT = Math.log(500);

  const hexToRGB = (hex) => {
    const clean = hex.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const value = Number.parseInt(full, 16);
    if (Number.isNaN(value)) return [1, 1, 1];
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
  };

  let ogl;
  try {
    ogl = await import("https://cdn.jsdelivr.net/npm/ogl@1/+esm");
  } catch (error) {
    onFail();
    return;
  }
  const { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } = ogl;

  const waveVertex = `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    attribute vec2 iOffset;
    attribute vec2 iScale;
    attribute float iOpacity;
    varying vec2 vUv;
    varying float vOpacity;
    void main() {
      vUv = uv;
      vOpacity = iOpacity;
      gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
    }
  `;
  const waveFragment = `
    precision highp float;
    varying vec2 vUv;
    varying float vOpacity;
    uniform float uRings;
    const float PI = 3.141592653589793;
    const float EDGE = 0.006737947;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float r = dot(p, p);
      if (r > 1.0) discard;
      float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);
      brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);
      gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
    }
  `;
  const screenVertex = `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
  const compositeFragment = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform sampler2D uDisplacement;
    uniform vec2 uResolution;
    uniform vec2 uTextureSize;
    uniform vec2 uTexel;
    uniform vec3 uTint;
    uniform vec3 uHighlight;
    uniform float uStrength;
    uniform float uSwirl;
    uniform float uDispersion;
    uniform float uGlint;
    uniform float uTintAmount;
    uniform float uGrayscale;
    const float TAU = 6.283185307179586;
    vec2 coverUV(vec2 uv) {
      vec2 safe = max(uTextureSize, vec2(1.0));
      vec2 s = uResolution / safe;
      vec2 scaledSize = safe * max(s.x, s.y);
      vec2 offset = (uResolution - scaledSize) * 0.5;
      return (uv * uResolution - offset) / scaledSize;
    }
    void main() {
      float amount = texture2D(uDisplacement, vUv).r;
      vec2 base = coverUV(vUv);
      float theta = amount * uSwirl * TAU;
      vec2 dir = vec2(sin(theta), cos(theta));
      vec2 push = dir * amount * uStrength;
      vec3 color;
      if (uDispersion > 0.001) {
        float split = uDispersion * 0.25;
        color.r = texture2D(uTexture, base + push * (1.0 + split)).r;
        color.g = texture2D(uTexture, base + push).g;
        color.b = texture2D(uTexture, base + push * (1.0 - split)).b;
      } else {
        color = texture2D(uTexture, base + push).rgb;
      }
      if (uGrayscale > 0.001) {
        color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGrayscale);
      }
      if (uTintAmount > 0.001) {
        color = mix(color, color * uTint * 1.9, clamp(amount * 1.6, 0.0, 1.0) * uTintAmount);
      }
      if (uGlint > 0.001) {
        float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
        float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
        vec3 normal = normalize(vec3(-ex * 26.0, -ey * 26.0, 1.0));
        vec3 light = normalize(vec3(-0.35, 0.55, 1.0));
        float raw = pow(max(dot(normal, light), 0.0), 22.0);
        float flatSpec = pow(max(light.z, 0.0), 22.0);
        color += uHighlight * clamp((raw - flatSpec) / max(1.0 - flatSpec, 0.0001), 0.0, 1.0) * uGlint;
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  let renderer;
  try {
    renderer = new Renderer({
      canvas,
      alpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
  } catch (error) {
    onFail();
    return;
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 1);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  const videoTexture = new Texture(gl, {
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE
  });

  const offsets = new Float32Array(MAX_WAVES * 2);
  const scales = new Float32Array(MAX_WAVES * 2);
  const opacities = new Float32Array(MAX_WAVES);
  const waves = Array.from({ length: MAX_WAVES }, () => ({
    x: 0,
    y: 0,
    scale: START_SCALE,
    target: START_SCALE,
    size: 1,
    opacity: 0
  }));
  let current = 0;

  const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
    uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
    iOffset: { instanced: 1, size: 2, data: offsets },
    iScale: { instanced: 1, size: 2, data: scales },
    iOpacity: { instanced: 1, size: 1, data: opacities }
  });

  const waveProgram = new Program(gl, {
    vertex: waveVertex,
    fragment: waveFragment,
    uniforms: { uRings: { value: settings.rings } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    cullFace: false
  });
  waveProgram.setBlendFunc(gl.ONE, gl.ONE);
  const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false });

  const displacementTarget = new RenderTarget(gl, {
    width: 2,
    height: 2,
    depth: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE
  });

  const compositeUniforms = {
    uTexture: { value: videoTexture },
    uDisplacement: { value: displacementTarget.texture },
    uResolution: { value: [1, 1] },
    uTextureSize: { value: [1, 1] },
    uTexel: { value: [1, 1] },
    uTint: { value: hexToRGB(settings.tint) },
    uHighlight: { value: hexToRGB(settings.highlightColor) },
    uStrength: { value: settings.strength },
    uSwirl: { value: settings.swirl },
    uDispersion: { value: settings.dispersion },
    uGlint: { value: settings.glint },
    uTintAmount: { value: settings.tintAmount },
    uGrayscale: { value: settings.grayscale ? 1 : 0 }
  };

  const compositeMesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, {
      vertex: screenVertex,
      fragment: compositeFragment,
      uniforms: compositeUniforms,
      depthTest: false,
      depthWrite: false
    })
  });

  let width = 1;
  let height = 1;
  const resize = () => {
    width = Math.max(1, frame.clientWidth);
    height = Math.max(1, frame.clientHeight);
    renderer.setSize(width, height);
    compositeUniforms.uResolution.value = [width, height];
    const scale = QUALITY_SCALE[settings.quality] || QUALITY_SCALE.high;
    const fieldW = Math.max(2, Math.round(width * scale));
    const fieldH = Math.max(2, Math.round(height * scale));
    displacementTarget.setSize(fieldW, fieldH);
    compositeUniforms.uTexel.value = [1 / fieldW, 1 / fieldH];
  };
  const ro = new ResizeObserver(resize);
  ro.observe(frame);
  resize();

  const setNewWave = (x, y, power) => {
    const wave = waves[current];
    current = (current + 1) % MAX_WAVES;
    wave.x = x;
    wave.y = y;
    wave.scale = START_SCALE * power;
    wave.target = START_SCALE * Math.max(1, settings.spread) * power;
    wave.size = Math.max(1, settings.brushSize);
    wave.opacity = 1;
  };

  // Frame sits in a `pointer-events: none` stage — hit-test the window. Ripples
  // spawn only as the pointer travels (spacing), so a still cursor lays none.
  // Bail before the layout read once the loop isn't running (frame off-screen
  // / tab backgrounded) — otherwise every mousemove on the *entire page*,
  // forever, would force a getBoundingClientRect read for a ripple that isn't
  // even rendering.
  const localPoint = (clientX, clientY) => {
    if (!running) return null;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }
    return [clientX - rect.left, rect.height - (clientY - rect.top)];
  };
  let previousX = 0;
  let previousY = 0;
  const onMove = (event) => {
    const point = localPoint(event.clientX, event.clientY);
    if (!point) return;
    const step = Math.max(1, settings.spacing);
    if (Math.abs(point[0] - previousX) > step || Math.abs(point[1] - previousY) > step) {
      setNewWave(point[0], point[1], 1);
      previousX = point[0];
      previousY = point[1];
    }
  };
  const onDown = (event) => {
    const point = localPoint(event.clientX, event.clientY);
    if (!point) return;
    setNewWave(point[0], point[1], Math.max(1, settings.clickStrength));
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  // resize() is already driven by the ResizeObserver on `frame` above — a
  // second window "resize" listener here just ran the same WebGL
  // renderer/render-target resize (real GPU work) a second time on every
  // window resize for no benefit.

  let hasFrame = false;
  let failed = false;
  let previousTime = 0;

  // Like the hero dot field, this drove an unconditional requestAnimationFrame
  // loop for the page's entire lifetime — two full WebGL passes every frame,
  // even with the About section scrolled out of view or the tab backgrounded.
  // That constant work competed with the browser's scroll/input handling on
  // the main thread and made scrolling feel janky everywhere. Only run the
  // loop while the frame is actually visible and the tab is in the foreground.
  let running = false;
  let frameVisible = false;

  const start = () => {
    if (running || failed) return;
    running = true;
    requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
  };

  const syncRunning = () => {
    if (frameVisible && document.visibilityState === "visible") {
      start();
    } else {
      stop();
    }
  };

  const loop = (now) => {
    if (failed || !running) return;
    const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;
    previousTime = now;
    const growth = 1 - Math.exp(-delta * 1.09);
    const decay = Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, settings.fade));

    for (let i = 0; i < MAX_WAVES; i += 1) {
      const wave = waves[i];
      if (wave.opacity <= 0) {
        opacities[i] = 0;
        continue;
      }
      wave.opacity *= decay;
      wave.scale += (wave.target - wave.scale) * growth;
      if (wave.opacity < 0.002) {
        wave.opacity = 0;
        opacities[i] = 0;
        continue;
      }
      const half = (wave.scale * wave.size) / 2;
      offsets[i * 2] = (wave.x / width) * 2 - 1;
      offsets[i * 2 + 1] = (wave.y / height) * 2 - 1;
      scales[i * 2] = (half / width) * 2;
      scales[i * 2 + 1] = (half / height) * 2;
      opacities[i] = wave.opacity;
    }
    geometry.attributes.iOffset.needsUpdate = true;
    geometry.attributes.iScale.needsUpdate = true;
    geometry.attributes.iOpacity.needsUpdate = true;

    try {
      if (video.readyState >= 2) {
        videoTexture.image = video;
        videoTexture.needsUpdate = true;
        compositeUniforms.uTextureSize.value = [video.videoWidth || width, video.videoHeight || height];
      }
      renderer.render({ scene: waveMesh, target: displacementTarget, clear: true });
      renderer.render({ scene: compositeMesh });
    } catch (error) {
      // SECURITY_ERR uploading the video (e.g. served cross-origin) — fall back.
      failed = true;
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      onFail();
      return;
    }

    if (!hasFrame && video.readyState >= 2) {
      hasFrame = true;
      frame.classList.add("is-canvas-ripple-ready");
    }
    requestAnimationFrame(loop);
  };

  video.play?.().catch(() => {});
  document.addEventListener("visibilitychange", syncRunning);
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        frameVisible = entries[0]?.isIntersecting ?? true;
        syncRunning();
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(frame);
  } else {
    frameVisible = true;
    syncRunning();
  }
}

initRippleDistortionWebGL();

// Both background videos (`autoplay loop`) otherwise decode and play for the
// entire page lifetime regardless of scroll position — the same "keeps
// running off-screen" problem the dot-field and ripple canvases had (see
// their comments), just for <video> instead of <canvas>. A video decoding
// in the background the whole time you're scrolled elsewhere competes for
// CPU/GPU with whatever section you're actually looking at, and that
// contention spikes right as the browser also has to paint the video back
// into view — which reads as a stutter/stall exactly on scroll. Pause each
// video while it's off-screen and resume it once it's back in view.
function initVisibilityGatedVideo(video) {
  if (!video) return;

  const tryPlay = () => video.play?.().catch(() => {});

  if (!("IntersectionObserver" in window)) {
    tryPlay();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) tryPlay();
        else video.pause?.();
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(video);
}

initVisibilityGatedVideo(document.querySelector(".shared-bg-video"));
initVisibilityGatedVideo(document.querySelector(".ripple-video"));

// Border Glow (React Bits port) for the "What I Do" cards: a purple glow that
// rides the card border and follows the pointer, brightest near the edges.
function initBorderGlow() {
  const cards = document.querySelectorAll("#what-i-do .work-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    const glow = document.createElement("span");
    glow.className = "border-glow";
    glow.setAttribute("aria-hidden", "true");
    card.prepend(glow);

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;

      card.style.setProperty("--glow-x", `${px}%`);
      card.style.setProperty("--glow-y", `${py}%`);
      // Drive the existing inner spotlight (.work-card::after) too.
      card.style.setProperty("--spot-x", `${px}%`);
      card.style.setProperty("--spot-y", `${py}%`);

      // Intensity swells toward the edges. `reach` is how far from a border the
      // glow starts responding (bigger = lower "edge sensitivity"); the exponent
      // controls how quickly it ramps up.
      const distToEdge = Math.min(x, y, rect.width - x, rect.height - y);
      const reach = Math.min(rect.width, rect.height) * 0.95;
      const edge = Math.max(0, 1 - distToEdge / reach);
      const intensity = Math.min(1, 0.28 + Math.pow(edge, 0.85) * 1.0);
      card.style.setProperty("--glow", intensity.toFixed(3));
    };

    const onLeave = () => {
      card.style.setProperty("--glow", "0");
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });
  });
}

initBorderGlow();

// Faithful vanilla port of the React Bits <GradualBlur /> component. Generates
// `divCount` stacked backdrop-filter layers, each with a band mask and a blur
// value derived from the chosen curve/exponential progression — the exact math
// that makes the component's blur smooth.
function initGradualBlur(userConfig) {
  const container = document.querySelector(".gradual-blur");
  if (!container || prefersReducedMotion) return;

  const DEFAULT_CONFIG = {
    position: "bottom",
    strength: 2,
    height: "6rem",
    width: null,
    divCount: 5,
    exponential: false,
    zIndex: 1000,
    opacity: 1,
    curve: "linear",
    target: "parent"
  };
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  const CURVE_FUNCTIONS = {
    linear: (p) => p,
    bezier: (p) => p * p * (3 - 2 * p),
    "ease-in": (p) => p * p,
    "ease-out": (p) => 1 - Math.pow(1 - p, 2),
    "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
  };
  const DIRECTIONS = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" };

  const isVertical = config.position === "top" || config.position === "bottom";
  const isPage = config.target === "page";

  // Container placement.
  container.classList.add(isPage ? "gradual-blur-page" : "gradual-blur-parent");
  container.style.position = isPage ? "fixed" : "absolute";
  container.style.pointerEvents = "none";
  container.style.zIndex = String(isPage ? config.zIndex + 100 : config.zIndex);
  if (isVertical) {
    container.style.height = config.height;
    container.style.width = config.width || "100%";
    container.style.left = "0";
    container.style.right = "0";
    container.style[config.position] = "0";
  } else {
    container.style.width = config.width || config.height;
    container.style.height = "100%";
    container.style.top = "0";
    container.style.bottom = "0";
    container.style[config.position] = "0";
  }

  // Inner wrapper + generated blur layers.
  const inner = document.createElement("div");
  inner.className = "gradual-blur-inner";
  const increment = 100 / config.divCount;
  const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;
  const direction = DIRECTIONS[config.position] || "to bottom";

  for (let i = 1; i <= config.divCount; i += 1) {
    const progress = curveFunc(i / config.divCount);
    const blurValue = config.exponential
      ? Math.pow(2, progress * 4) * 0.0625 * config.strength
      : 0.0625 * (progress * config.divCount + 1) * config.strength;

    const p1 = Math.round((increment * i - increment) * 10) / 10;
    const p2 = Math.round(increment * i * 10) / 10;
    const p3 = Math.round((increment * i + increment) * 10) / 10;
    const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

    let gradient = `transparent ${p1}%, black ${p2}%`;
    if (p3 <= 100) gradient += `, black ${p3}%`;
    if (p4 <= 100) gradient += `, transparent ${p4}%`;
    const mask = `linear-gradient(${direction}, ${gradient})`;

    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.maskImage = mask;
    layer.style.setProperty("-webkit-mask-image", mask);
    layer.style.backdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
    layer.style.setProperty("-webkit-backdrop-filter", `blur(${blurValue.toFixed(3)}rem)`);
    layer.style.opacity = String(config.opacity);
    inner.appendChild(layer);
  }

  container.replaceChildren(inner);
}
// Gradual blur disabled (removed the scroll-time bottom blur).

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
    revealObserver.observe(item);
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sections.forEach((section) => {
          section.classList.toggle("is-section-active", section === entry.target);
        });
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-44% 0px -44% 0px", threshold: 0 }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        if (entry.target.matches("[data-count]")) {
          animateCounter(entry.target);
        }

        if (entry.target.classList.contains("skill-meter")) {
          animateSkill(entry.target);
        }

        if (entry.target.matches("[data-split]")) {
          entry.target.classList.add("split-visible");
        }

        motionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.32 }
  );

  counters.forEach((counter) => motionObserver.observe(counter));
  skillMeters.forEach((meter) => motionObserver.observe(meter));
  splitTargets.forEach((target) => motionObserver.observe(target));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
  counters.forEach(animateCounter);
  skillMeters.forEach(animateSkill);
  splitTargets.forEach((target) => target.classList.add("split-visible"));
}

function animateCounter(counter) {
  const target = Number(counter.dataset.count || 0);
  const suffix = counter.dataset.suffix || "";
  const duration = prefersReducedMotion ? 1 : 850;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function animateSkill(meter) {
  const level = Math.max(0, Math.min(Number(meter.dataset.level || 0), 100));
  meter.style.setProperty("--level", `${level}%`);
  requestAnimationFrame(() => meter.classList.add("animated"));
}

// Experience section: year tabs (with a sliding pill indicator) drive a
// stacked deck of role cards — the next card peeks from behind the active
// one, and the active card can be dragged/swiped left or right to advance.
function initExperienceNav() {
  const tabsEl = document.querySelector(".exp-tabs");
  const stack = document.querySelector(".exp-stack");
  if (!tabsEl || !stack) return;

  const indicator = tabsEl.querySelector(".exp-tab-indicator");
  const tabs = Array.from(tabsEl.querySelectorAll(".exp-tab"));
  const panels = Array.from(stack.querySelectorAll(".exp-panel"));
  const prevBtn = document.querySelector(".exp-prev");
  const nextBtn = document.querySelector(".exp-next");
  const dots = Array.from(document.querySelectorAll(".exp-dots span"));
  const total = panels.length;
  let activeIndex = 0;

  function positionIndicator() {
    const activeTab = tabs[activeIndex];
    if (!indicator || !activeTab) return;
    indicator.style.width = `${activeTab.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeTab.offsetLeft - 5}px)`;
  }

  function render() {
    tabs.forEach((tab, i) => {
      const isActive = i === activeIndex;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    positionIndicator();

    panels.forEach((panel, i) => {
      // Circular offset (0..total-1) so the deck loops both ways instead of
      // stopping dead at either end.
      const offset = (((i - activeIndex) % total) + total) % total;
      panel.classList.toggle("is-active", offset === 0);
      panel.classList.toggle("is-next", offset === 1);
      panel.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
    });

    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === activeIndex));
  }

  function setActive(index) {
    const wrapped = ((index % total) + total) % total;
    if (wrapped === activeIndex) return;
    activeIndex = wrapped;
    render();
  }

  tabs.forEach((tab, i) => tab.addEventListener("click", () => setActive(i)));
  prevBtn?.addEventListener("click", () => setActive(activeIndex - 1));
  nextBtn?.addEventListener("click", () => setActive(activeIndex + 1));

  // Click the peeking "next" card to jump straight to it. Guarded by
  // dragMoved so the trailing click a browser fires after a drag-release
  // doesn't immediately re-trigger on whichever panel the pointer lands on.
  let dragMoved = false;

  panels.forEach((panel, i) => {
    panel.addEventListener("click", () => {
      if (dragMoved) return;
      if (panel.classList.contains("is-next")) setActive(i);
    });
  });

  // Drag / swipe the active card left or right.
  let dragging = false;
  let startX = 0;
  let dragX = 0;

  function onPointerDown(event) {
    const activePanel = panels[activeIndex];
    if (!activePanel || event.target.closest("a, button")) return;
    // Only the active card is draggable — a pointerdown that started on the
    // peeking card (e.g. clicking it to jump forward) must not capture the
    // pointer to the active card, or its trailing click gets redirected here.
    if (!activePanel.contains(event.target)) return;
    event.preventDefault(); // stop the browser starting a text selection as we drag
    dragging = true;
    dragMoved = false;
    startX = event.clientX;
    dragX = 0;
    activePanel.classList.add("is-dragging");
    activePanel.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging) return;
    const activePanel = panels[activeIndex];
    const raw = event.clientX - startX;
    if (Math.abs(raw) > 6) dragMoved = true;
    // Rubber-band past a comfortable range so a long drag doesn't fling the
    // card off-frame before it's released.
    const max = 160;
    dragX = Math.abs(raw) <= max ? raw : Math.sign(raw) * (max + (Math.abs(raw) - max) * 0.15);
    activePanel.style.setProperty("--drag-x", `${dragX}px`);
    activePanel.style.setProperty("--drag-rot", `${Math.max(-14, Math.min(14, dragX / 14))}deg`);
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    const activePanel = panels[activeIndex];
    activePanel.classList.remove("is-dragging");
    activePanel.style.removeProperty("--drag-x");
    activePanel.style.removeProperty("--drag-rot");

    const threshold = 70;
    if (dragX <= -threshold) setActive(activeIndex + 1);
    else if (dragX >= threshold) setActive(activeIndex - 1);
    dragX = 0;
  }

  stack.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", positionIndicator);

  render();
}

initExperienceNav();

if (typedRole && !prefersReducedMotion) {
  let roleIndex = 0;
  let letterIndex = roles[roleIndex].length;
  let isDeleting = true;
  typedRole.textContent = roles[roleIndex];

  const typeRole = () => {
    const role = roles[roleIndex];

    if (isDeleting) {
      letterIndex -= 1;
      typedRole.textContent = role.slice(0, Math.max(letterIndex, 1));

      if (letterIndex <= 0) {
        roleIndex = (roleIndex + 1) % roles.length;
        letterIndex = 1;
        isDeleting = false;
        typedRole.textContent = roles[roleIndex].slice(0, letterIndex);
        window.setTimeout(typeRole, 90);
        return;
      }
    } else {
      letterIndex += 1;
      typedRole.textContent = role.slice(0, letterIndex);
    }

    if (!isDeleting && letterIndex >= role.length) {
      isDeleting = true;
      window.setTimeout(typeRole, 1180);
      return;
    }

    const typingDelay = isDeleting ? 32 : 54 + Math.random() * 42;
    window.setTimeout(typeRole, typingDelay);
  };

  window.setTimeout(typeRole, 1180);
}

if (testimonialCards.length) {
  let activeTestimonial = 0;
  testimonialCards[0].classList.add("is-active");

  if (!prefersReducedMotion) {
    window.setInterval(() => {
      testimonialCards[activeTestimonial].classList.remove("is-active");
      activeTestimonial = (activeTestimonial + 1) % testimonialCards.length;
      testimonialCards[activeTestimonial].classList.add("is-active");
    }, 3200);
  }
}

async function initHeroCanvas() {
  const canvas = document.querySelector("#heroCanvas");
  if (!canvas || prefersReducedMotion) return;

  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    camera.position.z = 7.5;

    const group = new THREE.Group();
    scene.add(group);

    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const violet = new THREE.Color("#8b5cf6");
    const soft = new THREE.Color("#c4b5fd");
    const white = new THREE.Color("#ffffff");

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      const layer = i / count;
      const angle = layer * Math.PI * 18 + Math.random() * 0.4;
      const radius = 1.2 + layer * 5.2 + Math.random() * 0.9;
      positions[index] = Math.cos(angle) * radius;
      positions[index + 1] = (Math.random() - 0.5) * 5.4;
      positions[index + 2] = Math.sin(angle) * radius - 1.2;

      const color = violet.clone().lerp(i % 5 === 0 ? white : soft, Math.random() * 0.55);
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.032,
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        depthWrite: false
      })
    );

    group.add(particles);

    const waveGeometry = new THREE.BufferGeometry();
    const waveCount = 260;
    const wavePositions = new Float32Array(waveCount * 3);

    for (let i = 0; i < waveCount; i += 1) {
      const index = i * 3;
      const t = i / waveCount;
      wavePositions[index] = (t - 0.5) * 9;
      wavePositions[index + 1] = Math.sin(t * Math.PI * 4) * 0.8 - 1.8;
      wavePositions[index + 2] = Math.cos(t * Math.PI * 2) * 0.7;
    }

    waveGeometry.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));
    const wave = new THREE.Points(
      waveGeometry,
      new THREE.PointsMaterial({
        size: 0.06,
        color: "#c4b5fd",
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      })
    );

    group.add(wave);

    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (event) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.45;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.45;
    });

    resize();

    // Unlike the dot-field and video-ripple canvases (see their comments),
    // this WebGL render loop had no visibility gating — it kept rendering
    // ~1,160 particles every frame for the page's entire lifetime, even
    // scrolled far past the hero into other sections. That's a full render
    // pass competing for the GPU/main thread on every scroll frame
    // everywhere on the page, which is exactly what reads as stutter/dropped
    // frames ("skeleton"-looking flashes) while scrolling. Only render while
    // the hero canvas is actually on-screen and the tab is foregrounded.
    let running = false;
    let heroVisible = true;

    const animate = () => {
      if (!running) return;
      group.rotation.y += 0.0012;
      group.rotation.x += 0.00022;
      group.position.x += (pointerX - group.position.x) * 0.025;
      group.position.y += (-pointerY - group.position.y) * 0.025;
      wave.rotation.z += 0.0008;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const start = () => {
      if (running) return;
      running = true;
      requestAnimationFrame(animate);
    };

    const stop = () => {
      running = false;
    };

    const syncRunning = () => {
      if (heroVisible && document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    document.addEventListener("visibilitychange", syncRunning);

    if ("IntersectionObserver" in window) {
      const heroCanvasObserver = new IntersectionObserver(
        (entries) => {
          heroVisible = entries[0]?.isIntersecting ?? true;
          syncRunning();
        },
        { threshold: 0 }
      );
      heroCanvasObserver.observe(canvas);
    } else {
      start();
    }
  } catch (error) {
    canvas.style.display = "none";
  }
}
