import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (file) => readFile(join(root, file), "utf8");

test("homepage uses Greyworks visual anchor without unverified marketplace claims", async () => {
  const html = await read("index.html");

  assert.match(html, /greyworks-banner/i);
  assert.doesNotMatch(html, /play\.google\.com/i);
  assert.doesNotMatch(html, /data-count=/i);
  assert.doesNotMatch(html, /500K\+|130\+|\$5M/i);
  assert.doesNotMatch(html, /class="card (?:service|usecase|game)-card/i);
});

test("navigation exposes its controlled region", async () => {
  const files = ["index.html", "contact/index.html", "about/index.html"];
  for (const file of files) {
    const html = await read(file);
    assert.match(html, /id="nav-toggle"[^>]*aria-controls="nav-main"/i, file);
    assert.match(html, /id="nav-main"/i, file);
    assert.doesNotMatch(html, /href="\/games\/"|>Games<\/a>/i, file);
  }
});

test("contact form has an accessible POST contract", async () => {
  const html = await read("contact/index.html");

  assert.match(html, /<form[^>]*id="contact-form"[^>]*action="\/api\/contact"[^>]*method="post"/i);
  for (const id of ["contact-name", "contact-email", "contact-subject", "contact-message"]) {
    assert.match(html, new RegExp(`for="${id}"`, "i"), id);
    assert.match(html, new RegExp(`id="${id}"`, "i"), id);
  }
  assert.match(html, /name="website"[^>]*tabindex="-1"/i);
  assert.match(html, /aria-live="polite"/i);
  assert.match(html, /id="contact-slingshot"/i);
  assert.match(html, /data-slingshot-canvas/i);
});

test("contact runtime posts to the API and is wired on page load", async () => {
  const js = await read("site.js");

  assert.match(js, /initContactForm\(\);/);
  assert.match(js, /fetch\(["']\/api\/contact["']/);
  assert.doesNotMatch(js, /window\.location\.href\s*=\s*`mailto:/);
  assert.doesNotMatch(js, /header\.classList\.add\(["']hidden["']\)/);
});

test("homepage includes a native breaker experiment", async () => {
  const html = await read("index.html");

  assert.match(html, /<canvas[^>]*id="breaker-canvas"/i);
  assert.match(html, /data-game-action="start"/i);
  assert.match(html, /data-game-status[^>]*aria-live="polite"/i);
  assert.doesNotMatch(html, /play\.google\.com/i);
});

test("published HTML contains no unverified Google Play targets", async () => {
  const files = ["index.html", "about/index.html", "services/index.html", "usecases/index.html", "lullytale/index.html", "contact/index.html", "support/index.html", "privacy/index.html", "terms/index.html"];
  for (const file of files) assert.doesNotMatch(await read(file), /play\.google\.com/i, file);
});

test("public navigation has no games surface or visible Gemini mark", async () => {
  const files = ["index.html", "about/index.html", "services/index.html", "usecases/index.html", "lullytale/index.html", "contact/index.html", "support/index.html", "privacy/index.html", "terms/index.html"];
  for (const file of files) {
    const html = await read(file);
    assert.doesNotMatch(html, /href="\/games\/"|>Games<\/a>|gemini/i, file);
  }
});

test("slingshot runtime is native and does not replace the API path", async () => {
  const js = await read("slingshot.js");
  assert.match(js, /requestSubmit/);
  assert.match(js, /greyworks:contact-result/);
  assert.doesNotMatch(js, /mailto:/i);
});
