document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeaderState();
  initMobileNav();
  initAnchorLinks(reduceMotion);
  initParticles(reduceMotion);

  if (!reduceMotion) {
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
    initTiltCards();
  } else {
    document.querySelectorAll("[data-reveal], [data-reveal-stagger]").forEach(el => {
      el.classList.add("is-visible");
    });
  }

  // Always init image lazy load
  initLazyImages();
});

/* ── Floating Particles ───────────────────────────────────────── */
function initParticles(reduceMotion) {
  if (reduceMotion) return;

  const canvas = document.createElement("canvas");
  canvas.id = "particles-canvas";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let particles = [];
  let w, h;
  let animationId;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.1,
      hue: Math.random() > 0.5 ? 258 : 199 // purple or teal
    };
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((w * h) / 25000), 60);
    particles = Array.from({ length: count }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    });

    // Draw connections between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108, 71, 255, ${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(draw);
  }

  // Only animate when visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animationId) draw();
      } else {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    });
  });

  init();
  draw();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });
}

/* ── GSAP Scroll Animations ───────────────────────────────────── */
function initGSAPAnimations() {
  // Reveal animations
  document.querySelectorAll("[data-reveal]").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.9,
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
      { opacity: 0, y: 30, scale: 0.97 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.7,
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

  // Hero entrance with timeline
  const hero = document.querySelector(".hero-content");
  if (hero) {
    const heroTimeline = gsap.timeline({ delay: 0.3 });
    const badge = hero.querySelector(".hero-badge");
    const h1 = hero.querySelector("h1");
    const sub = hero.querySelector(".hero-subtitle");
    const actions = hero.querySelector(".hero-actions");

    if (badge) heroTimeline.from(badge, { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
    if (h1) heroTimeline.from(h1, { opacity: 0, y: 40, duration: 0.7, ease: "power3.out" }, "-=0.2");
    if (sub) heroTimeline.from(sub, { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" }, "-=0.3");
    if (actions) heroTimeline.from(actions, { opacity: 0, y: 16, duration: 0.5, ease: "power3.out" }, "-=0.2");
  }

  // Service cards hover tilt with GSAP
  document.querySelectorAll(".service-card, .usecase-card, .showcase-card").forEach(card => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, { scale: 1.03, duration: 0.3, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: "power2.out" });
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

    if (label) tl.from(label, { opacity: 0, x: -20, duration: 0.4, ease: "power3.out" });
    if (h2) tl.from(h2, { opacity: 0, y: 25, duration: 0.6, ease: "power3.out" }, "-=0.2");
    if (p) tl.from(p, { opacity: 0, y: 16, duration: 0.4, ease: "power3.out" }, "-=0.2");
  });

  // CTA section special entrance
  const ctaInner = document.querySelector(".cta-inner");
  if (ctaInner) {
    gsap.from(ctaInner, {
      opacity: 0, y: 50, scale: 0.95,
      duration: 1, ease: "power3.out",
      scrollTrigger: {
        trigger: ctaInner,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }

  // Stats counter animation
  document.querySelectorAll(".stat-value[data-count]").forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const original = el.textContent;
    gsap.from(el, {
      textContent: 0,
      duration: 2,
      ease: "power2.out",
      snap: { textContent: 1 },
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        once: true
      },
      onUpdate: function() {
        const val = Math.round(gsap.getProperty(el, "textContent"));
        if (target >= 1000) {
          el.textContent = (val / 1000).toFixed(0) + "K+";
        } else {
          el.textContent = val + "+";
        }
      }
    });
  });

  // Floating badges
  document.querySelectorAll(".hero-badge").forEach(badge => {
    gsap.to(badge, {
      y: -4,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  });
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

  let lastScroll = 0;
  const sync = () => {
    const current = window.scrollY;
    header.classList.toggle("is-scrolled", current > 20);

    // Auto-hide on scroll down, show on scroll up
    if (current > 200) {
      if (current > lastScroll + 5) {
        header.classList.add("hidden");
      } else if (current < lastScroll - 5) {
        header.classList.remove("hidden");
      }
    } else {
      header.classList.remove("hidden");
    }
    lastScroll = current;
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
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen);

    if (isOpen) {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    }
  });

  nav.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains("open")) {
      nav.classList.remove("open");
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
  document.querySelectorAll(".service-card, .card:not(.contact-info-card)").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${-y * 0.015}deg) rotateY(${x * 0.015}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* ── 3D Tilt Cards ────────────────────────────────────────────── */
function initTiltCards() {
  document.querySelectorAll(".showcase-card, .game-card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 10;
      const tiltY = (x - 0.5) * 10;

      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;

      // Highlight effect
      card.style.background = `
        radial-gradient(
          circle at ${x * 100}% ${y * 100}%,
          rgba(108, 71, 255, 0.06) 0%,
          rgba(255, 255, 255, 0.55) 50%
        )
      `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.background = "";
    });
  });
}

/* ── Glow cursor ──────────────────────────────────────────────── */
function initGlowCursor() {
  const glow = document.getElementById("cursor-glow");
  if (!glow) return;

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    glow.classList.add("active");
  });

  document.addEventListener("mouseleave", () => {
    glow.classList.remove("active");
  });

  function animate() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    glow.style.left = glowX + "px";
    glow.style.top = glowY + "px";
    requestAnimationFrame(animate);
  }
  animate();
}

/* ── Stat counters ────────────────────────────────────────────── */
function initStatCounters() {
  document.querySelectorAll(".stat-value[data-count]").forEach(el => {
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

/* ── Lazy image loading ───────────────────────────────────────── */
function initLazyImages() {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete) {
      img.classList.add("loaded");
    } else {
      img.addEventListener("load", () => img.classList.add("loaded"));
      img.addEventListener("error", () => img.classList.add("loaded"));
    }
  });
}

/* ── Contact form handler ─────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get("name");
    const email = data.get("email");
    const message = data.get("message");

    if (!name || !email || !message) {
      if (status) status.textContent = "Please fill in all required fields.";
      return;
    }

    // Build mailto
    const subject = encodeURIComponent(data.get("subject") || "Website enquiry");
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:contact@greyworks.com?subject=${subject}&body=${body}`;

    if (status) status.textContent = "Opening your email client...";
    setTimeout(() => {
      if (status) status.textContent = "";
    }, 5000);
  });
}
