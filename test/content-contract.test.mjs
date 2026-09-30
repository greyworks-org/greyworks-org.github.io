import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (file) => readFile(join(root, file), "utf8");

const PAGES = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "usecases/index.html",
  "lullytale/index.html",
  "contact/index.html",
  "support/index.html",
  "privacy/index.html",
  "terms/index.html"
];

const stripTags = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();

/* ── the studio speaks with one voice ─────────────────────────── */

test("every page states the same footer positioning", async () => {
  const taglines = new Set();
  for (const page of PAGES) {
    const html = await read(page);
    const match = html.match(/<div class="footer-brand">[\s\S]*?<p>([\s\S]*?)<\/p>/);
    assert.ok(match, `${page} has no footer positioning line`);
    taglines.add(stripTags(match[1]));
  }
  assert.equal(
    taglines.size,
    1,
    `footer positioning differs across pages: ${[...taglines].join(" | ")}`
  );
});

// Must equal --bg in styles.css so the browser chrome matches the page.
const THEME_COLOUR = "#0a1020";

test("every page declares the theme colour that matches the background", async () => {
  const css = await read("styles.css");
  const bg = css.match(/--bg:\s*(#[0-9a-f]{6})/i);
  assert.ok(bg, "styles.css does not define --bg");
  assert.equal(
    bg[1].toLowerCase(),
    THEME_COLOUR,
    "the --bg token drifted from the theme colour this test pins"
  );

  for (const page of PAGES) {
    const html = await read(page);
    assert.match(
      html,
      new RegExp(`<meta name="theme-color" content="${THEME_COLOUR}">`),
      `${page} does not declare the page background as its theme colour`
    );
  }
});

test("each page has exactly one h1 and no two pages share it", async () => {
  const headings = new Map();
  for (const page of PAGES) {
    const html = await read(page);
    const found = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => stripTags(m[1]));
    assert.equal(found.length, 1, `${page} should have exactly one h1, found ${found.length}`);
    const previous = headings.get(found[0]);
    assert.equal(previous, undefined, `${page} repeats the h1 already used by ${previous}`);
    headings.set(found[0], page);
  }
});

/* ── deep links land on the thing they promised ───────────────── */

/**
 * Maps each anchor id to the text of the first heading that follows it, so a
 * deep link can be checked against the title the visitor actually lands on.
 * Only the heading's own text counts; eyebrow labels beside it are ignored.
 */
async function anchorLabels(page) {
  const html = await read(page);
  const labels = new Map();

  // Scan each id independently. A single sweeping regex would let one match
  // swallow the next id and report a heading for the wrong section.
  for (const match of html.matchAll(/\bid="([a-z][a-z-]*)"/g)) {
    const after = html.slice(match.index + match[0].length);
    const heading = after.match(/<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/);
    if (!heading) continue;
    // Reject it if another id opens before the heading does.
    const gap = after.slice(0, heading.index);
    if (/\bid="[a-z]/.test(gap)) continue;
    labels.set(match[1], stripTags(heading[2]));
  }
  return labels;
}

/** Homepage tiles: the deep-link target paired with the tile's own heading. */
async function homeTiles(section) {
  const home = await read("index.html");
  return [
    ...home.matchAll(
      new RegExp(`href="/${section}/#([a-z-]+)"[\\s\\S]{0,400}?<h3>([\\s\\S]*?)</h3>`, "g")
    )
  ].map(([, id, heading]) => ({ id, heading: stripTags(heading) }));
}

test("home service tiles match the heading they deep-link to", async () => {
  const tiles = await homeTiles("services");
  const labels = await anchorLabels("services/index.html");
  assert.equal(tiles.length, 6, "expected six service tiles on the homepage");

  for (const { id, heading } of tiles) {
    const target = labels.get(id);
    assert.ok(target, `services page has no section with id "${id}"`);
    assert.equal(
      target.toLowerCase(),
      heading.toLowerCase(),
      `home says "${heading}" but /services/#${id} is headed "${target}"`
    );
  }
});

test("home use case tiles match the heading they deep-link to", async () => {
  const tiles = await homeTiles("usecases");
  const labels = await anchorLabels("usecases/index.html");
  assert.equal(tiles.length, 6, "expected six use case tiles on the homepage");

  for (const { id, heading } of tiles) {
    const target = labels.get(id);
    assert.ok(target, `usecases page has no section with id "${id}"`);
    assert.equal(
      target.toLowerCase(),
      heading.toLowerCase(),
      `home says "${heading}" but /usecases/#${id} is headed "${target}"`
    );
  }
});

test("service areas keep their order between home and the services page", async () => {
  const services = await read("services/index.html");

  // A showcase tile may also deep-link into services, so take the first
  // mention of each area rather than every link on the page.
  const homeOrder = [...new Set((await homeTiles("services")).map((t) => t.id))];
  const pageOrder = [...services.matchAll(/id="([a-z-]+)"/g)]
    .map((m) => m[1])
    .filter((id) => homeOrder.includes(id));

  assert.deepEqual(pageOrder, homeOrder, "services page lists the six areas in a different order");
});

/* ── social metadata describes the real file ──────────────────── */

test("open graph image dimensions match the asset that is served", async () => {
  const expected = { "greyworks-banner.jpg": [1200, 655], "greyworks-banner.png": [1916, 821] };

  for (const page of PAGES) {
    const html = await read(page);
    const image = html.match(/property="og:image" content="[^"]*\/(greyworks-banner\.(?:png|jpg))"/);
    if (!image) continue;

    const [width, height] = expected[image[1]];
    assert.match(
      html,
      new RegExp(`property="og:image:width" content="${width}"`),
      `${page} declares the wrong og:image width for ${image[1]}`
    );
    assert.match(
      html,
      new RegExp(`property="og:image:height" content="${height}"`),
      `${page} declares the wrong og:image height for ${image[1]}`
    );
  }
});

/* ── nothing real is hidden, nothing dead is shipped ──────────── */

test("no page ships markup whose driving script was removed", async () => {
  // The cursor glow only ever appears once JS adds .active, and that script is
  // gone, so the element can never render. Anything else decorative is CSS-only
  // and does render; the browser suite checks for hidden-but-present content.
  const orphaned = [/id="cursor-glow"/, /id="particles-canvas"/];
  for (const page of PAGES) {
    const html = await read(page);
    for (const pattern of orphaned) {
      assert.doesNotMatch(html, pattern, `${page} ships ${pattern} with no script to drive it`);
    }
  }
});

test("stylesheet parses: braces balance and no rule is left open", async () => {
  const css = (await read("styles.css")).replace(/\/\*[\s\S]*?\*\//g, "");

  let depth = 0;
  let line = 1;
  for (const char of css) {
    if (char === "\n") line += 1;
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      assert.ok(depth >= 0, `stray closing brace at line ${line}`);
    }
  }
  // Deleting a rule body but leaving its selector shows up here as an
  // unclosed rule, which then swallows everything after it.
  assert.equal(depth, 0, `${depth} unclosed rule(s) in styles.css`);
});

test("stylesheet does not blanket-hide a content class", async () => {
  const css = await read("styles.css");
  assert.doesNotMatch(
    css,
    /\.text-label[^{]*\{[^}]*display:\s*none\s*!important/,
    "a global display:none on .text-label silently deletes real copy from the pages"
  );
});

test("every page can be reached by keyboard past the header", async () => {
  for (const page of PAGES) {
    const html = await read(page);
    assert.match(html, /class="skip-link" href="#main"/, `${page} has no skip link`);
    assert.match(html, /<main id="main">/, `${page} has no #main target for its skip link`);
  }
});

/* ── claims stay sourced ──────────────────────────────────────── */

test("no page presents a headline traction figure for the studio", async () => {
  // Numbers inside prose can be sourced biography (a founder's previous
  // company, for instance). What is banned is the studio quoting its own
  // traction as a display statistic, which is what the stats block did.
  for (const page of PAGES) {
    const html = await read(page);
    assert.doesNotMatch(html, /class="stats-row"/, `${page} still renders a traction stat block`);
    assert.doesNotMatch(html, /class="stat-value"[^>]*data-count/, `${page} animates a counter`);
    assert.doesNotMatch(html, /data-count=/, `${page} ships a count-up statistic`);
  }
});

test("no page invents a contact channel or an unearned superlative", async () => {
  for (const page of PAGES) {
    const html = await read(page);
    const text = stripTags(html.replace(/<script[\s\S]*?<\/script>/g, ""));
    assert.doesNotMatch(html, /\btel:\+?\d/i, `${page} lists a phone number`);
    assert.doesNotMatch(
      text,
      /\b(?:award[- ]winning|industry[- ]leading|world[- ]class|best[- ]in[- ]class)\b/i,
      `${page} makes an unearned claim`
    );
  }
});
