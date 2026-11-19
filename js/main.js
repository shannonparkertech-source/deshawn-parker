(function () {
  const header = document.querySelector(".site-header");
  const form = document.getElementById("project-form");
  const success = document.getElementById("form-success");

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

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
