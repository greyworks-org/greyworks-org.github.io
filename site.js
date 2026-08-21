// Reveal styles are scoped to .js so a failed or blocked script leaves every
// block visible instead of stuck at opacity 0.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeaderState();
  initMobileNav();
  initAnchorLinks(reduceMotion);
  initScrollProgress();
  initContactForm();
  initReveals(reduceMotion);
  initLazyImages();
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

  toggle.setAttribute("aria-controls", nav.id);

  // The icon is swapped by CSS from aria-expanded. Replacing the button's
  // innerHTML here would detach the clicked node, which made the document
  // listener below read the click as "outside" and close the menu instantly.
  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  const close = (returnFocus = false) => {
    if (!nav.classList.contains("open")) return;
    setOpen(false);
    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    setOpen(open);
    if (open) {
      const firstLink = nav.querySelector("a");
      if (firstLink) firstLink.focus();
    } else {
      toggle.focus();
    }
  });

  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => close());
  });

  document.addEventListener("click", (event) => {
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close(true);
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

      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
}

/* ── Scroll reveal ────────────────────────────────────────────── */
/* One short fade as a block arrives, no library. Anything the observer
   cannot watch is shown immediately, so content never depends on motion. */
function initReveals(reduceMotion) {
  const items = Array.from(document.querySelectorAll("[data-reveal], [data-reveal-stagger]"));
  if (!items.length) return;

  const showAll = () => items.forEach((item) => item.classList.add("is-visible"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
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
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
  );

  items.forEach((item) => observer.observe(item));
}

/* ── Lazy image loading ───────────────────────────────────────── */
function initLazyImages() {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete) {
      img.classList.add("loaded");
      return;
    }
    img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
    img.addEventListener("error", () => img.classList.add("loaded"), { once: true });
  });
}

/* ── Contact form handler ─────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton ? submitButton.textContent : "";
  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  const announce = (detail) => {
    window.dispatchEvent(new CustomEvent("greyworks:contact-result", { detail }));
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    if (data.get("website")) {
      setStatus("Please try again.", "error");
      announce({ ok: false, code: "honeypot" });
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Check the highlighted fields.", "error");
      announce({ ok: false, code: "validation" });
      return;
    }

    const payload = Object.fromEntries(data.entries());
    form.setAttribute("aria-busy", "true");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    setStatus("Sending your message...", "pending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        form.reset();
        setStatus("Message sent. We will get back to you soon.", "success");
        announce({ ok: true });
      } else if (response.status === 429) {
        setStatus("Too many attempts. Please wait and try again.", "error");
        announce({ ok: false, code: "rate_limited" });
      } else if (response.status === 400 && result.fieldErrors) {
        setStatus("Check the highlighted fields.", "error");
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          const input = form.elements.namedItem(field);
          if (input) input.setCustomValidity(message);
        });
        announce({ ok: false, code: "validation" });
      } else {
        setStatus(
          "Message could not be sent right now. Email contact@greyworks.com and it will reach us.",
          "error"
        );
        announce({ ok: false, code: "delivery_failed" });
      }
    } catch {
      setStatus(
        "No connection to the server. Your message is still here, or email contact@greyworks.com.",
        "error"
      );
      announce({ ok: false, code: "network" });
    } finally {
      form.removeAttribute("aria-busy");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    }
  });

  form.addEventListener("input", (event) => event.target.setCustomValidity(""));
}

/* ── Scroll progress bar ──────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}
