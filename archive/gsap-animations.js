/**
 * Greyworks GSAP Animations
 * Complements the existing IntersectionObserver scroll reveals (site.js).
 * Uses GSAP + ScrollTrigger for smooth scroll-triggered animations.
 * Respects prefers-reduced-motion: reduce.
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // GSAP not loaded yet — retry once after a short delay
      setTimeout(init, 200);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ── Hero copy parallax ──────────────────────────────────────────
    const heroCopy = document.querySelector('.hero-copy');
    if (heroCopy) {
      gsap.fromTo(
        heroCopy,
        { y: 0 },
        {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: '.home-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        }
      );
    }

    // ── Hero context slide-in ───────────────────────────────────────
    const heroContext = document.querySelector('.hero-context');
    if (heroContext) {
      gsap.from(heroContext, {
        x: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.home-hero',
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      });
    }

    // ── Hero panel (Three.js card) scale-in ─────────────────────────
    const heroPanel = document.querySelector('.hero-panel');
    if (heroPanel) {
      gsap.from(heroPanel, {
        scale: 0.94,
        opacity: 0.6,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.home-hero',
          start: 'top 60%',
          toggleActions: 'play none none none',
        },
      });
    }

    // ── Hero summary stagger ────────────────────────────────────────
    const heroSummary = document.querySelector('.hero-summary');
    if (heroSummary) {
      gsap.from(heroSummary, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.home-hero',
          start: 'top 50%',
          toggleActions: 'play none none none',
        },
      });
    }

    // ── Stat list items stagger ─────────────────────────────────────
    gsap.utils.toArray('.stat-list div').forEach((stat, i) => {
      gsap.from(stat, {
        x: -24,
        opacity: 0,
        duration: 0.5,
        delay: i * 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: stat,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });

    // ── Approach cards stagger ──────────────────────────────────────
    gsap.utils.toArray('.standard-card').forEach((card, i) => {
      gsap.from(card, {
        y: 60,
        opacity: 0,
        duration: 0.7,
        delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // ── Capability cards stagger ────────────────────────────────────
    gsap.utils.toArray('.capability-card').forEach((card, i) => {
      gsap.from(card, {
        y: 50,
        scale: 0.96,
        opacity: 0,
        duration: 0.75,
        delay: i * 0.14,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // ── Section headings slide-up ───────────────────────────────────
    gsap.utils.toArray('.section-heading').forEach((heading) => {
      const eyebrow = heading.querySelector('.eyebrow');
      const h2 = heading.querySelector('h2');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heading,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      });
      if (eyebrow) {
        tl.from(eyebrow, { y: 16, opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
      if (h2) {
        tl.from(h2, { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.15');
      }
    });

    // ── Hero notes pills stagger ────────────────────────────────────
    gsap.utils.toArray('.hero-notes span').forEach((pill, i) => {
      gsap.from(pill, {
        scale: 0.7,
        opacity: 0,
        duration: 0.4,
        delay: i * 0.08,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: '.hero-context',
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      });
    });

    // ── Header shrink on scroll ─────────────────────────────────────
    const header = document.querySelector('.site-header');
    if (header) {
      ScrollTrigger.create({
        trigger: 'body',
        start: 'top -10',
        onEnter: () => header.classList.add('is-scrolled'),
        onLeaveBack: () => header.classList.remove('is-scrolled'),
      });
    }

    console.log('[GSAP] Animations initialized with ScrollTrigger');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
