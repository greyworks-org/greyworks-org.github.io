document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeaderState();
  initAnchorLinks(reduceMotion);

  if (!reduceMotion) {
    initReveals();
  }
});

function initHeaderState() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const sync = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };

  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

function initAnchorLinks(reduceMotion) {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const header = document.querySelector(".site-header");
      const offset = header ? header.getBoundingClientRect().height + 24 : 32;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  });
}

function initReveals() {
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!revealItems.length) return;

  document.body.classList.add("motion-ready");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}
