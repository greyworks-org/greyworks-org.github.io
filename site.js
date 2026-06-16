document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeaderState();
  initMobileNav();
  initAnchorLinks(reduceMotion);

  if (!reduceMotion) {
    // Use GSAP if available, otherwise fallback to IntersectionObserver
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      initGSAPAnimations();
      initParallax();
    } else {
      initReveals();
    }
    initMagneticCards();
    initGlowCursor();
    initStatCounters();
  } else {
    document.querySelectorAll("[data-reveal], [data-reveal-stagger]").forEach(el => {
      el.classList.add("is-visible");
    });
  }
});

/* ── GSAP Scroll Animations ───────────────────────────────────── */
function initGSAPAnimations() {
  // Reveal animations
  document.querySelectorAll("[data-reveal]").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none"
        }
      }
    );
  });

  // Stagger reveal
  document.querySelectorAll("[data-reveal-stagger]").forEach(container => {
    const children = container.children;
    gsap.fromTo(children,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  });

  // Hero entrance
  const hero = document.querySelector(".hero-content");
  if (hero) {
    const heroTimeline = gsap.timeline({ delay: 0.2 });
    const badge = hero.querySelector(".hero-badge");
    const h1 = hero.querySelector("h1");
    const sub = hero.querySelector(".hero-subtitle");
    const actions = hero.querySelector(".hero-actions");

    if (badge) heroTimeline.from(badge, { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
    if (h1) heroTimeline.from(h1, { opacity: 0, y: 30, duration: 0.6, ease: "power3.out" }, "-=0.2");
    if (sub) heroTimeline.from(sub, { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" }, "-=0.3");
    if (actions) heroTimeline.from(actions, { opacity: 0, y: 16, duration: 0.5, ease: "power3.out" }, "-=0.2");
  }

  // Service cards hover tilt
  document.querySelectorAll(".service-card, .usecase-card, .showcase-card").forEach(card => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, { scale: 1.02, duration: 0.25, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
    });
  });

  // Section headers slide in
  document.querySelectorAll(".section-header").forEach(header => {
    const label = header.querySelector(".text-label");
    const h2 = header.querySelector("h2, .text-headline");
    const p = header.querySelector("p");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    if (label) tl.from(label, { opacity: 0, y: 16, duration: 0.4, ease: "power3.out" });
    if (h2) tl.from(h2, { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" }, "-=0.2");
    if (p) tl.from(p, { opacity: 0, y: 16, duration: 0.4, ease: "power3.out" }, "-=0.2");
  });

  // CTA section special entrance
  const ctaInner = document.querySelector(".cta-inner");
  if (ctaInner) {
    gsap.from(ctaInner, {
      opacity: 0, y: 40, scale: 0.96,
      duration: 0.8, ease: "power3.out",
      scrollTrigger: {
        trigger: ctaInner,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }
}

/* ── Parallax mesh blobs ───────────────────────────────────────── */
function initParallax() {
  const meshes = document.querySelectorAll(".hero-mesh-1, .hero-mesh-2, .hero-mesh-3");
  meshes.forEach((mesh, i) => {
    const speed = [0.15, 0.1, 0.08][i] || 0.1;
    gsap.to(mesh, {
      y: () => window.innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  });
}

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

    if (isOpen) {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    }
  });

  nav.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  });

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

/* ── Scroll reveal (fallback) ─────────────────────────────────── */
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
    { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

/* ── Magnetic hover for cards ─────────────────────────────────── */
function initMagneticCards() {
  document.querySelectorAll(".service-card, .card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${-y * 0.02}deg) rotateY(${x * 0.02}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* ── Glow cursor ──────────────────────────────────────────────── */
function initGlowCursor() {
  const glow = document.createElement("div");
  glow.className = "glow-cursor";
  document.body.appendChild(glow);

  document.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
}

/* ── Stat counters ────────────────────────────────────────────── */
function initStatCounters() {
  document.querySelectorAll(".stat-value").forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute("data-original", text);

    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        el.classList.add("is-counting");
      }
    });
  });
}
