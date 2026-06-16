document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeaderState();
  initMobileNav();
  initAnchorLinks(reduceMotion);

  if (!reduceMotion) {
    initReveals();
  } else {
    // Show everything immediately in reduced motion
    document.querySelectorAll("[data-reveal], [data-reveal-stagger]").forEach(el => {
      el.classList.add("is-visible");
    });
  }
});

/* ── Header scroll state ──────────────────────────────────────── */
function initHeaderState() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const sync = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

/* ── Mobile navigation ────────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav-main");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen);

    // Update icon to X when open
    if (isOpen) {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    }
  });

  // Close on nav link click
  nav.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    }
  });
}

/* ── Smooth anchor links ──────────────────────────────────────── */
function initAnchorLinks(reduceMotion) {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const header = document.getElementById("site-header");
      const offset = header ? header.offsetHeight + 24 : 32;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  });
}

/* ── Scroll reveal ────────────────────────────────────────────── */
function initReveals() {
  const revealItems = Array.from(document.querySelectorAll("[data-reveal], [data-reveal-stagger]"));
  if (!revealItems.length) return;

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -5% 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}
