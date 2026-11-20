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


  function update() {
    ticking = false;
    const vh = window.innerHeight;

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

  /* Mobile menu */
  const toggle = document.querySelector(".menu-toggle");
  if (toggle && header) {
    const setMenu = (open) => {
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
    header.querySelectorAll(".header-nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  }

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
