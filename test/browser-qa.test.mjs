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
    for (const width of measured.inputs) {
      assert.ok(width >= 280, `form field too narrow on mobile: ${width}px`);
    }
    assert.ok(measured.slingshot >= 280, `slingshot canvas too narrow: ${measured.slingshot}px`);
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
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll(".breaker-actions .btn")].map((btn) => ({
        label: btn.textContent.trim(),
        color: getComputedStyle(btn).color,
        hidden: btn.hidden
      }))
    );

    assert.ok(buttons.length >= 3, "expected start, pause and restart controls");
    // The stage gradient bottoms out at the overlay colour over a near-black canvas.
    const stage = "rgb(35, 28, 22)";
    for (const button of buttons) {
      const ratio = contrastRatio(button.color, stage);
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
        const offenders = [...document.querySelectorAll("body *")]
          .filter((el) => {
            if (el.closest("[data-allow-horizontal-scroll]")) return false;
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.right > window.innerWidth + 1;
          })
          .map((el) => `${el.tagName}.${el.className}`.slice(0, 60));
        document.body.style.overflowX = previous;
        return offenders;
      });

      assert.deepEqual(overflow, [], `${route} overflows horizontally on mobile`);
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

// Two limits, because one number cannot describe both a content section and a
// deliberate single-line band:
//   * no section pads more than PADDING_CAP in total, and
//   * a section carrying real content does not pad more than twice its content.
// The 320px doubled padding that made the page read as unfinished fails both.
const PADDING_CAP = 176;
const CONTENT_SECTION_MIN = 120;

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
      const sections = measured.filter((s) => !s.name.includes("hero"));

      const overCap = sections.filter((s) => s.padding > PADDING_CAP);
      assert.deepEqual(overCap, [], `${route} pads a section beyond ${PADDING_CAP}px`);

      const lopsided = sections
        .filter((s) => s.content >= CONTENT_SECTION_MIN)
        .filter((s) => s.padding > s.content * 2);
      assert.deepEqual(lopsided, [], `${route} pads a content section more than twice its content`);
    });
  }
});

test("consecutive section gaps stay within one screen of a phone", async () => {
  await withPage(VIEWPORT_MOBILE, "/", async (page) => {
    const gaps = await page.evaluate(() => {
      const sections = [...document.querySelectorAll("main > section")];
      const out = [];
      for (let i = 0; i < sections.length - 1; i += 1) {
        const current = sections[i];
        const next = sections[i + 1];
        const currentStyle = getComputedStyle(current);
        const nextStyle = getComputedStyle(next);
        const gap =
          parseFloat(currentStyle.paddingBottom) + parseFloat(nextStyle.paddingTop);
        if (gap > 200) {
          out.push({ between: `${current.className} → ${next.className}`, gap: Math.round(gap) });
        }
      }
      return out;
    });

    assert.deepEqual(gaps, [], "more than 200px of empty space between sections on mobile");
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
