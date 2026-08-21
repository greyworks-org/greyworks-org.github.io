import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

/**
 * Playwright is not a dependency of this static site, so it is resolved from
 * whatever install the machine already has. If it cannot be found the browser
 * suite fails loudly instead of skipping, so a missing gate is never silent.
 */
export function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const roots = [];

  try {
    roots.push(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim());
  } catch {
    // npm not on PATH; fall through to the npx cache scan
  }

  try {
    const npxCache = execFileSync(
      "sh",
      ["-c", 'ls -d "$HOME"/.npm/_npx/*/node_modules 2>/dev/null'],
      { encoding: "utf8" }
    );
    roots.push(...npxCache.split("\n").filter(Boolean));
  } catch {
    // no npx cache
  }

  const attempts = ["playwright", ...roots.map((root) => `${root}/playwright`)];
  for (const specifier of attempts) {
    try {
      return require(specifier);
    } catch {
      // try next location
    }
  }

  throw new Error(
    "playwright could not be resolved. Browser gates did NOT run. " +
      "Install it with `npm i -D playwright && npx playwright install chromium`."
  );
}

/** Relative luminance / contrast ratio for `rgb(r, g, b)` strings. */
export function contrastRatio(a, b) {
  const channels = (value) => value.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
  const luminance = (rgb) => {
    const [r, g, bl] = rgb.map((raw) => {
      const c = raw / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const first = luminance(channels(a));
  const second = luminance(channels(b));
  const light = Math.max(first, second);
  const dark = Math.min(first, second);
  return (light + 0.05) / (dark + 0.05);
}

export const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
export const VIEWPORT_MOBILE = { width: 375, height: 812 };
