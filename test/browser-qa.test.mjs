import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { startStaticServer } from "./helpers/static-server.mjs";
import {
  loadPlaywright,
  contrastRatio,
  VIEWPORT_DESKTOP,
  VIEWPORT_MOBILE
} from "./helpers/browser.mjs";

const ROUTES = [
  "/",
  "/about/",
  "/services/",
  "/usecases/",
  "/lullytale/",
  "/contact/",
  "/support/",
  "/privacy/",
  "/terms/"
];

let server;
let browser;

before(async () => {
  server = await startStaticServer();
  const { chromium } = loadPlaywright();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function withPage(viewport, route, fn) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(`${server.origin}${route}`, { waitUntil: "load" });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = "eager";
    });
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true }))
      )
    );
  });
  try {
    return await fn(page, errors);
  } finally {
    await context.close();
  }
}

/* ── P0-1 · contact form is usable on a phone ─────────────────── */

test("contact form fields are usable at 375px", async () => {
  await withPage(VIEWPORT_MOBILE, "/contact/", async (page) => {
    const measured = await page.evaluate(() => {
      const grid = document.querySelector(".contact-grid");
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        inputs: [...document.querySelectorAll(".form-input, .form-textarea")].map((el) =>
          Math.round(el.getBoundingClientRect().width)
        ),
        slingshot: Math.round(
          document.querySelector("[data-slingshot-canvas]").getBoundingClientRect().width
        )
      };
    });

    assert.equal(measured.columns, 1, "contact grid must collapse to one column on mobile");
    assert.ok(measured.inputs.length >= 4, "expected the four contact fields");
    // A padded card legitimately narrows the field. The defect this guards is
    // the form sharing a two-column grid on a phone, which left it at 147px.
    const MIN_FIELD = 240;
    for (const width of measured.inputs) {
      assert.ok(width >= MIN_FIELD, `form field too narrow on mobile: ${width}px`);
    }
    assert.ok(
      measured.slingshot >= MIN_FIELD,
      `slingshot canvas too narrow: ${measured.slingshot}px`
    );
  });
});

test("slingshot canvas backing store matches its rendered width", async () => {
  for (const viewport of [VIEWPORT_DESKTOP, VIEWPORT_MOBILE]) {
    await withPage(viewport, "/contact/", async (page) => {
      const { cssWidth, bufferWidth, dpr } = await page.evaluate(() => {
        const canvas = document.querySelector("[data-slingshot-canvas]");
        return {
          cssWidth: canvas.getBoundingClientRect().width,
          bufferWidth: canvas.width,
          dpr: Math.min(window.devicePixelRatio || 1, 2)
        };
      });
      const expected = cssWidth * dpr;
      assert.ok(
        Math.abs(bufferWidth - expected) <= 2,
        `slingshot drawing is stretched at ${viewport.width}px: buffer ${bufferWidth} vs expected ${Math.round(expected)}`
      );
    });
  }
});

/* ── P0-2 · the breaker controls are readable ─────────────────── */

test("breaker controls are legible against the dark stage", async () => {
  await withPage(VIEWPORT_DESKTOP, "/", async (page) => {
    const measured = await page.evaluate(() => {
      const opaque = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      return {
        // What a control actually sits on at the foot of the stage.
        stage: opaque(document.querySelector(".breaker-stage")),
        buttons: [...document.querySelectorAll(".breaker-actions .btn")].map((btn) => {
          const style = getComputedStyle(btn);
          return {
            label: btn.textContent.trim(),
            color: style.color,
            background: style.backgroundColor
          };
        })
      };
    });

    assert.ok(measured.buttons.length >= 3, "expected start, pause and restart controls");
    for (const button of measured.buttons) {
      // A filled control is read against its own fill, an outlined one
      // against the stage behind it.
      const behind = /rgba\(0, 0, 0, 0\)|transparent/.test(button.background)
        ? measured.stage
        : button.background;
      const ratio = contrastRatio(button.color, behind);
      assert.ok(
        ratio >= 4.5,
        `breaker "${button.label}" control fails contrast on the dark stage: ${ratio.toFixed(2)}:1`
      );
    }
  });
});

test("breaker overlay copy does not sit on top of the brick field", async () => {
  await withPage(VIEWPORT_MOBILE, "/", async (page) => {
    const overlap = await page.evaluate(() => {
      const canvas = document.getElementById("breaker-canvas");
      const title = document.querySelector("[data-game-title]");
      const canvasBox = canvas.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      // Bricks occupy roughly the top 40% of the playfield.
      const brickFloor = canvasBox.top + canvasBox.height * 0.4;
      return {
        titleTop: Math.round(titleBox.top),
        brickFloor: Math.round(brickFloor),
        overlaps: titleBox.top < brickFloor
      };
    });

    assert.equal(
      overlap.overlaps,
      false,
      `breaker overlay title overlaps the bricks on mobile (title top ${overlap.titleTop} < brick floor ${overlap.brickFloor})`
    );
  });
});

test("the hidden attribute still hides, at every width", async () => {
  for (const viewport of [VIEWPORT_DESKTOP, VIEWPORT_MOBILE]) {
    await withPage(viewport, "/", async (page) => {
      const leaked = await page.evaluate(() =>
        [...document.querySelectorAll("[hidden]")]
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => `${el.tagName}.${el.className}`)
      );
      assert.deepEqual(
        leaked,
        [],
        `elements marked hidden are still displayed at ${viewport.width}px`
      );
    });
  }
});

test("breaker starts with only the start control offered", async () => {
  for (const viewport of [VIEWPORT_DESKTOP, VIEWPORT_MOBILE]) {
    await withPage(viewport, "/", async (page) => {
      const shown = await page.evaluate(() =>
        [...document.querySelectorAll(".breaker-actions .btn")]
          .filter((btn) => btn.getBoundingClientRect().height > 0)
          .map((btn) => btn.textContent.trim())
      );
      assert.deepEqual(shown, ["Start"], `wrong controls visible at rest at ${viewport.width}px`);
    });
  }
});

/* ── P0-3 · the closed mobile menu is really closed ───────────── */

test("closed mobile navigation is removed from the tab order", async () => {
  await withPage(VIEWPORT_MOBILE, "/", async (page) => {
    const state = await page.evaluate(() => {
      const nav = document.getElementById("nav-main");
      const links = [...nav.querySelectorAll("a")];
      links[0].focus();
      return {
        focusEscaped: document.activeElement !== links[0],
        visibility: getComputedStyle(nav).visibility,
        expanded: document.getElementById("nav-toggle").getAttribute("aria-expanded")
      };
    });

    assert.equal(state.expanded, "false", "menu should start closed");
    assert.equal(state.visibility, "hidden", "closed menu must not stay visible to assistive tech");
    assert.equal(state.focusEscaped, true, "keyboard focus must not land inside a closed menu");
  });
});

test("mobile navigation opens, exposes its links, and closes again", async () => {
  await withPage(VIEWPORT_MOBILE, "/", async (page) => {
    await page.click("#nav-toggle");
    const open = await page.evaluate(() => {
      const nav = document.getElementById("nav-main");
      return {
        visibility: getComputedStyle(nav).visibility,
        expanded: document.getElementById("nav-toggle").getAttribute("aria-expanded"),
        reachable: document.activeElement.closest("#nav-main") !== null
      };
    });
    assert.equal(open.expanded, "true");
    assert.equal(open.visibility, "visible");
    assert.equal(open.reachable, true, "opening the menu should move focus into it");

    await page.keyboard.press("Escape");
    const expanded = await page.evaluate(() =>
      document.getElementById("nav-toggle").getAttribute("aria-expanded")
    );
    assert.equal(expanded, "false", "Escape must collapse the menu immediately");

    // visibility is delayed until the fade-out finishes, so wait for the
    // transition rather than reading mid-animation.
    await page
      .waitForFunction(
        () => getComputedStyle(document.getElementById("nav-main")).visibility === "hidden",
        null,
        { timeout: 2000 }
      )
      .catch(() => {
        throw new Error("closed menu never returned to visibility:hidden");
      });

    const focusReturned = await page.evaluate(
      () => document.activeElement === document.getElementById("nav-toggle")
    );
    assert.equal(focusReturned, true, "Escape should return focus to the toggle");
  });
});

/* ── P0-4 · lists read as lists ───────────────────────────────── */

test("every deliverable list renders a visible marker", async () => {
  for (const route of ["/usecases/", "/about/", "/support/"]) {
    await withPage(VIEWPORT_DESKTOP, route, async (page) => {
      const unmarked = await page.evaluate(() =>
        [...document.querySelectorAll("main ul li")]
          .filter((li) => {
            const marker = getComputedStyle(li, "::before");
            const hasPseudo = marker.content !== "none" && marker.content !== "";
            const hasNativeMarker = getComputedStyle(li).listStyleType !== "none";
            return !hasPseudo && !hasNativeMarker;
          })
          .map((li) => li.textContent.trim().slice(0, 40))
      );

      assert.deepEqual(unmarked, [], `${route} has list items with no marker`);
    });
  }
});

/* ── P0-5 · images declare their real size ────────────────────── */

test("image width and height attributes match the real asset", async () => {
  for (const route of ROUTES) {
    await withPage(VIEWPORT_DESKTOP, route, async (page) => {
      const wrong = await page.evaluate(() =>
        [...document.images]
          .filter((img) => img.getAttribute("width") && img.getAttribute("height"))
          .map((img) => ({
            src: img.getAttribute("src"),
            declared: [Number(img.getAttribute("width")), Number(img.getAttribute("height"))],
            natural: [img.naturalWidth, img.naturalHeight]
          }))
          .filter((entry) => {
            const declaredRatio = entry.declared[0] / entry.declared[1];
            const naturalRatio = entry.natural[0] / entry.natural[1];
            return Math.abs(declaredRatio - naturalRatio) > 0.01;
          })
      );

      assert.deepEqual(wrong, [], `${route} declares the wrong aspect ratio for an image`);
    });
  }
});

/* ── cross-cutting regressions ────────────────────────────────── */

test("no route logs a console or page error", async () => {
  for (const route of ROUTES) {
    await withPage(VIEWPORT_DESKTOP, route, async (_page, errors) => {
      assert.deepEqual(errors, [], `${route} reported runtime errors`);
    });
  }
});

test("no route scrolls sideways at 375px", async () => {
  for (const route of ROUTES) {
    await withPage(VIEWPORT_MOBILE, route, async (page) => {
      const overflow = await page.evaluate(() => {
        // overflow-x:hidden on body can mask a real overflow, so measure with it off.
        const previous = document.body.style.overflowX;
        document.body.style.overflowX = "visible";

        // An element wider than the viewport is only a problem if nothing
        // between it and the body clips it. Decorative blobs and the ticker
        // are meant to be oversized inside an overflow:hidden parent.
        const clipped = (el) => {
          for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
            if (node.hasAttribute("data-allow-horizontal-scroll")) return true;
            const overflowX = getComputedStyle(node).overflowX;
            if (overflowX === "hidden" || overflowX === "auto" || overflowX === "scroll") return true;
          }
          return false;
        };

        const offenders = [...document.querySelectorAll("body *")]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.right > window.innerWidth + 1 && !clipped(el);
          })
          .map((el) => `${el.tagName}.${el.className}`.slice(0, 60));

        const documentScrolls = document.documentElement.scrollWidth > window.innerWidth + 1;
        document.body.style.overflowX = previous;
        return { offenders, documentScrolls };
      });

      assert.deepEqual(overflow.offenders, [], `${route} has unclipped content past the viewport`);
      assert.equal(overflow.documentScrolls, false, `${route} scrolls sideways on mobile`);
    });
  }
});

test("body text stays readable on a phone", async () => {
  for (const route of ROUTES) {
    await withPage(VIEWPORT_MOBILE, route, async (page) => {
      const tiny = await page.evaluate(() =>
        [...document.querySelectorAll("main p, main li, main dd, main span, main small")]
          .filter((el) => el.textContent.trim() && el.getBoundingClientRect().height > 0)
          .map((el) => ({
            size: parseFloat(getComputedStyle(el).fontSize),
            text: el.textContent.trim().slice(0, 32)
          }))
          .filter((entry) => entry.size < 13)
      );

      assert.deepEqual(tiny, [], `${route} renders body copy below 13px on mobile`);
    });
  }
});

test("standalone interactive targets are at least 44px tall", async () => {
  for (const route of ROUTES) {
    await withPage(VIEWPORT_MOBILE, route, async (page) => {
      const small = await page.evaluate(() =>
        [...document.querySelectorAll("a, button")]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            if (box.height <= 0 || box.width <= 0 || el.offsetParent === null) return false;
            // WCAG 2.5.8 exempts a target that sits inline in a sentence, so
            // links woven into running prose are measured by their block, not
            // padded out to 44px.
            const prose = el.closest("p, li, dd, figcaption, blockquote");
            if (prose && prose.textContent.trim() !== el.textContent.trim()) return false;
            return true;
          })
          .map((el) => ({
            label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 28),
            height: Math.round(el.getBoundingClientRect().height)
          }))
          .filter((entry) => entry.height < 44)
      );

      assert.deepEqual(small, [], `${route} has standalone tap targets under 44px`);
    });
  }
});

/* ── motion never gates content ───────────────────────────────── */

test("scroll reveals settle visible on every route", async () => {
  for (const route of ROUTES) {
    await withPage(VIEWPORT_DESKTOP, route, async (page) => {
      await page.evaluate(async () => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((r) => setTimeout(r, 700));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 700));
      });

      const invisible = await page.evaluate(() =>
        [...document.querySelectorAll("[data-reveal], [data-reveal-stagger]")]
          .filter((el) => parseFloat(getComputedStyle(el).opacity) < 1)
          .map((el) => el.className.slice(0, 50))
      );

      assert.deepEqual(invisible, [], `${route} leaves revealed blocks transparent`);
    });
  }
});

test("content stays visible when scripts do not run", async () => {
  const context = await browser.newContext({ viewport: VIEWPORT_DESKTOP, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const route of ROUTES) {
      await page.goto(`${server.origin}${route}`, { waitUntil: "load" });
      const invisible = await page.evaluate(() =>
        [...document.querySelectorAll("[data-reveal], [data-reveal-stagger]")]
          .filter((el) => parseFloat(getComputedStyle(el).opacity) < 1)
          .map((el) => el.className.slice(0, 50))
      );
      assert.deepEqual(invisible, [], `${route} hides content without JavaScript`);
    }
  } finally {
    await context.close();
  }
});

/* ── the page reads as dense, not as an empty slogan deck ─────── */

// How much space a section is allowed to spend on nothing. Generous padding is
// a design choice; padding that outweighs the content is the defect this
// catches, which is what a section with 139px of copy and 320px of padding did.
// Short deliberate bands (a CTA line) are exempt below CONTENT_SECTION_MIN.
const CONTENT_SECTION_MIN = 160;
const MOBILE_GAP_MAX = 400;
// Padding may exceed content a little (a closing CTA band is meant to breathe)
// but not by the margin the old layout used: 320px of padding on 139px of copy.
const PADDING_TO_CONTENT_MAX = 1.25;

test("no section drowns its content in whitespace", async () => {
  for (const route of ["/", "/services/", "/usecases/"]) {
    await withPage(VIEWPORT_DESKTOP, route, async (page) => {
      const measured = await page.evaluate(() =>
        [...document.querySelectorAll("main > section")].map((section) => {
          const box = section.getBoundingClientRect();
          const style = getComputedStyle(section);
          const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
          return {
            name: section.id || section.className.split(" ").slice(-1)[0],
            padding: Math.round(padding),
            content: Math.round(box.height - padding)
          };
        })
      );

      // A hero sets the first impression and is allowed its full screen.
      const lopsided = measured
        .filter((s) => !s.name.includes("hero"))
        .filter((s) => s.content >= CONTENT_SECTION_MIN)
        .filter((s) => s.padding > s.content * PADDING_TO_CONTENT_MAX);

      assert.deepEqual(lopsided, [], `${route} pads a section far past its own content height`);
    });
  }
});

test("no pair of sections leaves a void between them on a phone", async () => {
  await withPage(VIEWPORT_MOBILE, "/", async (page) => {
    const gaps = await page.evaluate((max) => {
      const sections = [...document.querySelectorAll("main > section")];
      const out = [];
      for (let i = 0; i < sections.length - 1; i += 1) {
        const current = sections[i];
        const next = sections[i + 1];
        const gap =
          parseFloat(getComputedStyle(current).paddingBottom) +
          parseFloat(getComputedStyle(next).paddingTop);
        if (gap > max) {
          out.push({ between: `${current.className} → ${next.className}`, gap: Math.round(gap) });
        }
      }
      return out;
    }, MOBILE_GAP_MAX);

    assert.deepEqual(gaps, [], `more than ${MOBILE_GAP_MAX}px of dead space between sections`);
  });
});

test("muted text and accents clear WCAG AA on the paper background", async () => {
  await withPage(VIEWPORT_DESKTOP, "/", async (page) => {
    const samples = await page.evaluate(() => {
      const paper = getComputedStyle(document.body).backgroundColor;
      const pick = (selector) => {
        const el = document.querySelector(selector);
        return el ? { selector, color: getComputedStyle(el).color } : null;
      };
      return {
        paper,
        items: [
          pick(".section-note"),
          pick(".product-facts dt"),
          pick(".service-row em"),
          pick(".usecase-line em"),
          pick(".usecase-line span"),
          pick(".service-row small")
        ].filter(Boolean)
      };
    });

    const failures = samples.items
      .map((item) => ({ ...item, ratio: contrastRatio(item.color, samples.paper) }))
      .filter((item) => item.ratio < 4.5)
      .map((item) => `${item.selector} ${item.ratio.toFixed(2)}:1`);

    assert.deepEqual(failures, [], "text below 4.5:1 contrast on the paper background");
  });
});
