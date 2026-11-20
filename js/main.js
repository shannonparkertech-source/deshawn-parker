(function () {
  const header = document.querySelector(".site-header");
  const form = document.getElementById("project-form");
  const success = document.getElementById("form-success");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  /* Header + parallax + process progress share one rAF scroll loop. */
  const parallax = Array.from(document.querySelectorAll("[data-parallax]"));
  const steps = Array.from(document.querySelectorAll(".pstep"));
  const track = document.querySelector(".process-track");
  const fill = document.querySelector(".ptrack-fill");
  const stepNow = document.getElementById("stepNow");
  let ticking = false;
  const hero = document.querySelector(".reveal");
  let revealUpdate = null;

  /* Hero: scroll-scrubbed robot reveal drawn to canvas */
  (function () {
    if (!hero) return;
    const stage = hero.querySelector(".reveal-stage");
    const canvas = hero.querySelector(".reveal-canvas");
    const ctx = canvas.getContext("2d");
    const lines = Array.from(hero.querySelectorAll(".rline > span"));
    const side = Array.from(hero.querySelectorAll(".reveal-side > *"));
    const COUNT = 121;
    const src = (i) => "assets/robot/f" + String(i + 1).padStart(3, "0") + ".webp";
    const frames = new Array(COUNT);
    let drawn = -1, want = reduced ? COUNT - 1 : 0, W = 0, H = 0, dpr = 1;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    function load(i) {
      if (frames[i]) return frames[i];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { img._ok = true; if (Math.abs(i - want) < Math.abs(drawn - want) || drawn < 0) draw(want, true); };
      img.src = src(i);
      frames[i] = img;
      return img;
    }
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      draw(want, true);
    }
    function draw(i, force) {
      let k = i;
      while (k >= 0 && !(frames[k] && frames[k]._ok)) k--;
      if (k < 0) { k = i; while (k < COUNT && !(frames[k] && frames[k]._ok)) k++; if (k >= COUNT) return; }
      if (k === drawn && !force) return;
      const img = frames[k];
      const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
      let dw, dh, dx, dy;
      if (W / H < 1) {
        dh = ch * 0.62; dw = dh * iw / ih; dx = (cw - dw) / 2; dy = ch * 0.05;
      } else {
        const s = Math.max(cw / iw, ch / ih);
        dw = iw * s; dh = ih * s; dx = (cw - dw) / 2; dy = (ch - dh) / 2;
      }
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      drawn = k;
    }
    function setText(p) {
      const portrait = W / H < 1;
      hero.style.setProperty("--intro", (1 - clamp((p - 0.02) / 0.1)).toFixed(3));
      stage.style.setProperty("--scrim", portrait ? 1 : clamp((p - 0.3) / 0.2).toFixed(3));
      lines.forEach((el, i) => {
        const e = ease(clamp((p - (0.36 + i * 0.05)) / 0.14));
        el.style.setProperty("--ty", ((1 - e) * 100).toFixed(1) + "%");
        el.style.setProperty("--op", e.toFixed(3));
      });
      side.forEach((el, i) => {
        const e = ease(clamp((p - (0.54 + i * 0.07)) / 0.14));
        el.style.setProperty("--ty", ((1 - e) * 20).toFixed(1) + "px");
        el.style.setProperty("--op", e.toFixed(3));
        if (el.tagName === "A") el.style.visibility = e < 0.05 ? "hidden" : "visible";
      });
    }
    revealUpdate = function () {
      if (reduced) return;
      const r = hero.getBoundingClientRect();
      const span = hero.offsetHeight - window.innerHeight;
      const p = clamp(-r.top / span);
      want = Math.round(clamp(p / 0.72) * (COUNT - 1));
      if (!frames[want]) load(want);
      draw(want);
      setText(p);
    };
    hero.__progress = () => clamp(-hero.getBoundingClientRect().top / (hero.offsetHeight - window.innerHeight));
    window.__reveal = { get drawn() { return drawn; }, get loaded() { return frames.filter((f) => f && f._ok).length; } };

    if (reduced) {
      load(COUNT - 1);
      setText(1);
      window.addEventListener("resize", size);
      size();
      return;
    }
    load(0);
    size();
    setText(0);
    window.addEventListener("resize", size);
    // Lazy-load the rest in order once the page has settled.
    const rest = () => {
      let i = 1;
      (function next() {
        const batch = Math.min(COUNT, i + 6);
        for (; i < batch; i++) load(i);
        if (i < COUNT) setTimeout(next, 60);
      })();
    };
    if (document.readyState === "complete") rest(); else window.addEventListener("load", rest);
  })();

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    if (header) {
      const heroEnd = hero ? hero.offsetTop + hero.offsetHeight - header.offsetHeight - 2 : 24;
      header.classList.toggle("is-solid", window.scrollY > heroEnd);
    }
    if (revealUpdate) revealUpdate();

    if (!reduced) {
      parallax.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        const k = parseFloat(el.dataset.parallax) || 0.2;
        const offset = (box.top + box.height / 2 - vh / 2) * -k;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
    }

    if (track && steps.length) {
      const line = vh * 0.55;
      const r = track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (line - r.top) / (r.height - 40)));
      if (fill) fill.style.setProperty("--p", reduced ? 1 : p.toFixed(3));
      let active = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) active = i; });
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === active);
        s.classList.toggle("is-done", i < active);
      });
      if (stepNow) stepNow.textContent = String(active + 1).padStart(2, "0");
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* Anchor scrolling */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      if (id === "#contact") {
        const nameField = document.getElementById("name");
        if (nameField) window.setTimeout(() => nameField.focus({ preventScroll: true }), 600);
      }
    });
  });

  /* Contact form */
  if (form && success) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      form.classList.add("is-sent");
      success.classList.add("is-visible");
      success.setAttribute("tabindex", "-1");
      success.focus();
    });
  }

  /* Count-up stats */
  function countUp(el) {
    const end = parseInt(el.dataset.count, 10);
    if (reduced || !end) { el.textContent = end; return; }
    const dur = 1400, t0 = performance.now();
    el.textContent = "0";
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* Reveals: data-reveal, .lines, .mask, [data-count] */
  const items = Array.from(document.querySelectorAll("[data-reveal], .lines, .mask"));
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  if (reduced || !hasIO) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const groups = new Map();
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const key = el.parentElement;
      const index = groups.get(key) || 0;
      el.style.setProperty("--d", Math.min(index, 5) * 90 + "ms");
      groups.set(key, index + 1);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));

    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { el.textContent = "0"; cio.observe(el); });
  }

  /* What I automate: draggable 3D ring (adapted from v6) */
  const scene = document.querySelector(".ring-scene");
  const ring = document.getElementById("ring");
  if (!scene || !ring) return;
  const cards = Array.from(ring.querySelectorAll(".acard"));
  const N = cards.length;
  const STEP = 360 / N;
  const idxEl = document.getElementById("ringIdx");
  let angle = 0, vel = 0, dragging = false, lastX = 0, lastT = 0, moved = 0;
  let target = null, scale = 1, radius = 0, idle = 0, visible = true, raf = 0;
  const AUTO = reduced ? 0 : -0.06;

  function layout() {
    const w = scene.clientWidth;
    scale = w < 520 ? 0.78 : w < 900 ? 0.9 : 1;
    radius = (150 + 26) / Math.tan(Math.PI / N);
    cards.forEach((c, i) => {
      c.style.transform = "rotateY(" + i * STEP + "deg) translateZ(" + radius.toFixed(1) + "px)";
    });
  }

  function frontIndex() {
    let a = (-angle % 360 + 360) % 360;
    return Math.round(a / STEP) % N;
  }

  let lastFront = -1;
  function render() {
    ring.style.transform = "translateZ(" + (-radius * scale).toFixed(1) + "px) scale(" + scale + ") rotateX(-9deg) rotateY(" + angle.toFixed(2) + "deg)";
    const f = frontIndex();
    cards.forEach((c, i) => {
      let d = ((i * STEP + angle) % 360 + 360) % 360;
      if (d > 180) d -= 360;
      const k = Math.cos(d * Math.PI / 180);
      c.style.opacity = k > 0 ? (0.35 + 0.65 * k).toFixed(3) : "0.5";
      c.classList.toggle("is-back", k < 0.05);
    });
    if (f !== lastFront) {
      cards.forEach((c, i) => c.classList.toggle("is-front", i === f));
      if (idxEl) idxEl.textContent = String(f + 1).padStart(2, "0");
      lastFront = f;
    }
  }

  function tick() {
    raf = 0;
    if (!dragging) {
      if (target !== null) {
        const diff = target - angle;
        angle += diff * 0.12;
        if (Math.abs(diff) < 0.05) { angle = target; target = null; }
      } else {
        idle++;
        const base = idle > 90 ? AUTO : 0;
        vel += (base - vel) * 0.05;
        angle += vel;
      }
    }
    render();
    if (visible || dragging || target !== null) raf = requestAnimationFrame(tick);
  }
  const start = () => { if (!raf && (visible || target !== null)) raf = requestAnimationFrame(tick); };

  scene.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true; moved = 0; target = null; idle = 0;
    lastX = e.clientX; lastT = performance.now(); vel = 0;
    scene.classList.add("is-dragging");
    try { scene.setPointerCapture(e.pointerId); } catch (_) {}
    start();
  });
  scene.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const now = performance.now();
    const d = dx * 0.22;
    angle += d; moved += Math.abs(dx);
    vel = d / Math.max(1, (now - lastT) / 16.7);
    lastX = e.clientX; lastT = now;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false; idle = 0;
    scene.classList.remove("is-dragging");
    vel = Math.max(-6, Math.min(6, vel));
    // settle to the nearest card once the throw slows
    const proj = angle + vel * 14;
    target = Math.round(proj / STEP) * STEP;
    vel = 0;
    start();
  };
  scene.addEventListener("pointerup", end);
  scene.addEventListener("pointercancel", end);
  scene.addEventListener("lostpointercapture", end);

  document.querySelectorAll(".ring-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const dir = parseInt(b.dataset.dir, 10);
      const base = target !== null ? target : Math.round(angle / STEP) * STEP;
      target = base - dir * STEP;
      idle = 0;
      start();
    });
  });

  if (hasIO) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      start();
    }).observe(scene);
  }
  layout();
  render();
  start();
  window.addEventListener("resize", () => { layout(); render(); });
  window.__ring = { get angle() { return angle; }, front: frontIndex };
})();
