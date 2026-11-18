(function () {
  const header = document.querySelector(".site-header");
  const form = document.getElementById("project-form");
  const success = document.getElementById("form-success");
  const steps = document.querySelectorAll(".step");

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

  if (steps.length && "IntersectionObserver" in window) {
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motionOk) {
      steps.forEach((step) => step.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.28, rootMargin: "0px 0px -40px 0px" }
      );
      steps.forEach((step, index) => {
        step.style.transitionDelay = index * 110 + "ms";
        io.observe(step);
      });
    }
  } else {
    steps.forEach((step) => step.classList.add("is-in"));
  }
})();
