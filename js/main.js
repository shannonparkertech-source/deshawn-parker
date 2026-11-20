(function () {
  const header = document.querySelector(".site-header");
  const form = document.getElementById("project-form");
  const success = document.getElementById("form-success");

  const onScroll = () => {
    if (!header) return;
    const hero = document.querySelector(".hero");
    const limit = hero ? hero.offsetHeight - header.offsetHeight - 8 : 8;
    header.classList.toggle("is-solid", window.scrollY > limit);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (id === "#contact") {
        const nameField = document.getElementById("name");
        if (nameField) {
          window.setTimeout(() => nameField.focus({ preventScroll: true }), 500);
        }
      }
    });
  });

  if (form && success) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      form.classList.add("is-sent");
      form.closest(".contact-form")?.classList.add("is-sent");
      success.classList.add("is-visible");
      success.setAttribute("tabindex", "-1");
      success.focus();
    });
  }


  // Hero hub: draws connector lines between chips and the AI node.
  const hub = document.querySelector("[data-hub]");
  const svgNS = "http://www.w3.org/2000/svg";
  const hubLines = {};
  const drawHub = () => {
    if (!hub) return;
    const svg = hub.querySelector(".hub-lines");
    const node = hub.querySelector(".hub-node-wrap");
    const base = hub.getBoundingClientRect();
    const n = node.getBoundingClientRect();
    const N = { l: n.left - base.left, r: n.right - base.left, t: n.top - base.top, b: n.bottom - base.top };
    N.cx = (N.l + N.r) / 2; N.cy = (N.t + N.b) / 2;
    svg.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);
    svg.innerHTML = "";
    const chips = Array.from(hub.querySelectorAll(".hub-chip")).filter((c) => c.offsetParent !== null);
    const groups = { left: [], right: [], below: [] };
    chips.forEach((c) => {
      const r = c.getBoundingClientRect();
      const C = { l: r.left - base.left, r: r.right - base.left, t: r.top - base.top, b: r.bottom - base.top };
      C.cx = (C.l + C.r) / 2; C.cy = (C.t + C.b) / 2;
      const side = C.t >= N.b ? "below" : C.r < N.l ? "left" : C.l > N.r ? "right" : "below";
      groups[side].push({ el: c, C });
    });
    const R = 10;
    const elbowH = (x1, y1, x2, y2) => {
      const mx = (x1 + x2) / 2;
      if (Math.abs(y2 - y1) < 1) return `M${x1},${y1} L${x2},${y2}`;
      const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
      const r = Math.min(R, Math.abs(y2 - y1) / 2, Math.abs(mx - x1));
      return `M${x1},${y1} L${mx - dx * r},${y1} Q${mx},${y1} ${mx},${y1 + dy * r} L${mx},${y2 - dy * r} Q${mx},${y2} ${mx + dx * r},${y2} L${x2},${y2}`;
    };
    const elbowV = (x1, y1, x2, y2) => {
      const my = (y1 + y2) / 2;
      if (Math.abs(x2 - x1) < 1) return `M${x1},${y1} L${x2},${y2}`;
      const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
      const r = Math.min(R, Math.abs(x2 - x1) / 2, Math.abs(my - y1));
      return `M${x1},${y1} L${x1},${my - dy * r} Q${x1},${my} ${x1 + dx * r},${my} L${x2 - dx * r},${my} Q${x2},${my} ${x2},${my + dy * r} L${x2},${y2}`;
    };
    const add = (name, d, ends) => {
      const p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", d); p.setAttribute("class", "ln");
      svg.appendChild(p);
      ends.forEach(([x, y]) => {
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 2.2); c.setAttribute("class", "end");
        svg.appendChild(c);
      });
      hubLines[name] = p;
    };
    const spread = (list, i, span) => (list.length === 1 ? 0 : (i / (list.length - 1) - 0.5) * span);
    groups.left.forEach(({ el, C }, i) => {
      const y2 = N.cy + spread(groups.left, i, 36);
      add(el.dataset.chip, elbowH(C.r, C.cy, N.l, y2), [[C.r, C.cy], [N.l, y2]]);
    });
    groups.right.forEach(({ el, C }, i) => {
      const y2 = N.cy + spread(groups.right, i, 24);
      add(el.dataset.chip, elbowH(N.r, y2, C.l, C.cy), [[N.r, y2], [C.l, C.cy]]);
    });
    groups.below.forEach(({ el, C }, i) => {
      const x1 = N.cx + spread(groups.below, i, 36);
      add(el.dataset.chip, elbowV(x1, N.b, C.cx, C.t), [[x1, N.b], [C.cx, C.t]]);
    });
    // Lines are drawn chip to node except on the right and below, where they start at the node.
    Object.keys(hubLines).forEach((k) => { if (!hubLines[k].isConnected) delete hubLines[k]; });
    groups.left.forEach(({ el }) => { hubLines[el.dataset.chip].dataset.dir = "in"; });
  };
  if (hub) {
    drawHub();
    window.addEventListener("resize", drawHub);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawHub);
  }

  // Sends a scarlet pulse along a hub line. toNode: true travels from chip to the AI node.
  const pulse = (name, toNode) => new Promise((resolve) => {
    const path = hubLines[name];
    const chip = hub && hub.querySelector(`[data-chip="${name}"]`);
    if (!path || !chip) return resolve();
    const svg = path.ownerSVGElement;
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("r", 3.5); dot.setAttribute("class", "pulse");
    svg.appendChild(dot);
    path.classList.add("is-live");
    const len = path.getTotalLength();
    const lineIn = path.dataset.dir === "in"; // path drawn from chip toward node
    const fromStart = lineIn ? toNode : !toNode;
    const dur = 650;
    let t0 = null;
    const step = (ts) => {
      if (t0 === null) t0 = ts;
      const k = Math.min(1, (ts - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const pt = path.getPointAtLength((fromStart ? e : 1 - e) * len);
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
      if (k < 1) requestAnimationFrame(step);
      else {
        dot.remove();
        path.classList.remove("is-live");
        if (!toNode) {
          chip.classList.add("is-hit");
          setTimeout(() => chip.classList.remove("is-hit"), 1200);
        }
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  // Hero automation demo: loops through leads, checking off each step, synced with hub pulses.
  const demo = document.querySelector("[data-demo]");
  if (demo) {
    const body = demo.querySelector(".demo-body");
    const lead = demo.querySelector(".demo-lead");
    const leadText = demo.querySelector(".demo-lead-text");
    const steps = Array.from(demo.querySelectorAll(".demo-step"));
    const aiNode = document.querySelector(".hub-node");
    const leads = [
      "Mike R., roof repair quote",
      "Sarah K., HVAC tune-up",
      "James T., buyer inquiry on 3 bed home",
    ];
    // Which hub chip each step sends to. Falls back when a chip is hidden on small screens.
    const targets = [["email"], ["calendar"], ["crm"], ["sms", "email"]];
    const pick = (list) => list.find((n) => hubLines[n]) || null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      steps.forEach((s) => s.classList.add("is-done"));
    } else {
      let inView = true;
      let wakers = [];
      const watched = document.querySelector(".hero-stage") || demo;
      const isActive = () => inView && !document.hidden;
      const update = () => {
        demo.classList.toggle("is-paused", !isActive());
        if (isActive()) { wakers.forEach((w) => w()); wakers = []; }
      };
      const whenVisible = () => (isActive() ? Promise.resolve() : new Promise((r) => wakers.push(r)));
      const wait = (ms) => new Promise((r) => setTimeout(r, ms)).then(whenVisible);
      const go = (p) => whenVisible().then(() => p());

      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; update(); }).observe(watched);
      }
      document.addEventListener("visibilitychange", update);

      const run = async () => {
        let i = 0;
        for (;;) {
          steps.forEach((s) => s.classList.remove("is-running", "is-done"));
          leadText.textContent = leads[i % leads.length];
          lead.classList.add("is-entering");
          body.classList.remove("is-out");
          await wait(60);
          lead.classList.remove("is-entering");
          await go(() => pulse(pick(["email"]), true));
          for (let s = 0; s < steps.length; s++) {
            steps[s].classList.add("is-running");
            if (aiNode) aiNode.classList.add("is-thinking");
            await wait(380);
            if (aiNode) aiNode.classList.remove("is-thinking");
            await go(() => pulse(pick(targets[s]), false));
            steps[s].classList.remove("is-running");
            steps[s].classList.add("is-done");
            await wait(220);
          }
          await wait(1500);
          body.classList.add("is-out");
          await wait(450);
          i += 1;
        }
      };
      run();
    }
  }

  // Scroll reveals: small fade and slide up, staggered within each group.
  const items = Array.from(document.querySelectorAll("[data-reveal]"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const showAll = () => items.forEach((el) => el.classList.add("is-in"));

  if (!items.length) return;
  if (reduced || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  // Stagger siblings that share a parent.
  const groups = new Map();
  items.forEach((el) => {
    const key = el.parentElement;
    const index = groups.get(key) || 0;
    el.style.setProperty("--d", Math.min(index, 5) * 90 + "ms");
    groups.set(key, index + 1);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
})();
