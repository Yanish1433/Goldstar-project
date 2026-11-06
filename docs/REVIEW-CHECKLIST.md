# Review checklist (lead reviewer)

Used to approve or reject each crewmate's handback against `docs/SPEC.md`. Each item is
**B** (blocker: reject until fixed), **M** (major: fix before final approval, may approve a partial
handback with it listed), or **m** (minor: note it, fix if cheap). The reviewer runs the commands
personally; a crewmate's claim is not evidence.

Verdicts: **APPROVE** (no B or M open) · **APPROVE WITH NOTES** (only m open) · **REJECT** (any B, or
three or more M). A rejection lists each failed item by ID with the observed evidence and the fix
expected.

---

## 0. Process (both)

| ID | Sev | Check | How |
|---|---|---|---|
| P1 | B | Only owned paths changed (backend: root files + `server/`; frontend: `client/`); `docs/`, `reference/`, `_dl/`, `.taste-skill/direction.json` untouched | `git status --porcelain`, `git diff --stat` |
| P2 | B | No commits, pushes or deploys made by the crew | `git log`, `git remote -v` |
| P3 | M | Handback follows SPEC §14 and ticks every DoD box with evidence | read |
| P4 | M | Every deviation from SPEC is listed with a reason; none silently changes the API contract | diff contract vs code |
| P5 | B | No secrets committed: no real `.env`, no JWT secret, no admin password in tracked files | `git ls-files | findstr /i ".env"`; `git grep -n -i "secret\|password" -- ":!*.example" ":!docs"` |

---

## 1. Backend

### 1.1 Setup and scripts

| ID | Sev | Check | How |
|---|---|---|---|
| B1 | B | Stale Astro `package.json`, lockfile and `node_modules` replaced; root `package.json` matches §1.2 (workspaces, scripts `dev/build/start/seed/test/model`) | read file |
| B2 | B | Clean install works on Node 24: delete `node_modules`, `npm ci` (or `npm install`) at root succeeds | run |
| B3 | B | Server refuses to start with missing/short `JWT_SECRET` (clear message, non-zero exit) | temporarily run with `JWT_SECRET=short` |
| B4 | M | `.env.example` (server, client) match §1.4; `.gitignore` matches §1.5 | read |
| B5 | M | README: install, env, seed, dev, test in ≤ 10 steps; works when followed literally | follow it |

### 1.2 Data and seed

| ID | Sev | Check | How |
|---|---|---|---|
| B6 | B | Models match §2 field-for-field (types, enums, required, limits); money is integer NPR | read models |
| B7 | M | Indexes exist as §2 lists (unique `email`, `slug`, `orderNumber`; compound and text indexes) | `mongosh goldstar --eval "db.products.getIndexes()"` (and users, orders) |
| B8 | B | `npm run seed` (live) and `npm run seed -- --offline` both succeed and print `products=5`; second run is a no-op | run twice each |
| B9 | B | G10-401: Black NPR 3,400 + Olive NPR 2,775, correct `productUrl`s and `wooIds` (27292, 22960 / 27285, 22961), 7 callouts exactly as §3.5 table, `featured: true` | `curl /api/products/g10-401` |
| B10 | M | Grouping matches §3.5 (5 slugs; G10 L2102 pink 3,500 / grey-pink 3,700; AX-1/A olive 3,000; AX/AX-3 2,000 reg 2,700); `shortSpecs` sentence-cased; descriptions HTML-free | `curl /api/products?limit=48` |
| B11 | M | Snapshot `server/src/seed/data/woo-products.json` is the raw Store API response (9 items), committed-ready | read |
| B12 | B | Admin user created from env; password never printed; existing admin kept unless `SEED_ADMIN_RESET=true` | run seed, read output |
| B13 | M | Status machine `canTransition` matches §2.4 exactly; `delivered` sets `paymentStatus: "paid"`; history appended on every change | tests + curl |

### 1.3 API contract

| ID | Sev | Check | How |
|---|---|---|---|
| B14 | B | All 20 routes of §3.3 exist with the stated method, path and auth level | curl script with cookie jar (guest, user, admin) |
| B15 | B | Response shapes match §3.2 (`id` not `_id`, no `__v`, never `passwordHash`; `priceFrom/priceTo` present) | curl + read |
| B16 | B | Error body is `{ error: { code, message, details? } }` for every non-2xx, codes per §3.1 | provoke 400, 401, 403, 404, 409, 415, 429 |
| B17 | B | Order prices come from the DB, never the request: sending `unitPrice`/`total` in the body → 400 (strict); order totals equal DB price × qty | curl |
| B18 | B | Ownership: user B gets 404 for user A's order (get and cancel) | curl |
| B19 | M | Quote never errors on bad lines; reports `problems` with codes | curl |
| B20 | M | Pagination, `limit` caps (48 / 50 / 100), category filter, sort options all work | curl |
| B21 | M | Invalid ObjectId → 404 (not 500); unknown `/api/*` → 404 JSON | curl |
| B22 | m | `GET /api/categories` names are sentence case with counts | curl |

### 1.4 Security

| ID | Sev | Check | How |
|---|---|---|---|
| S1 | B | bcryptjs cost 12; passwords 8–72 chars with letter + digit | read code |
| S2 | B | JWT only in httpOnly cookie `gs_token` (`sameSite=lax`, `secure` from env, 7d); never in JSON or localStorage | inspect `Set-Cookie`; grep client for `localStorage` token use |
| S3 | B | `requireAuth` reloads the user from the DB; `requireAdmin` checks the DB role (forged `role: admin` token for a user → 403) | read + test |
| S4 | B | helmet on; CORS restricted to `CLIENT_ORIGIN` with credentials; no `*` | `curl -i -H "Origin: http://evil.test"` |
| S5 | B | Auth rate limit 10/15 min/IP returns 429 with `Retry-After`; global 300/15 min | loop curl |
| S6 | B | zod `.strict()` on every body; `sanitizeFilter`/`strictQuery`; `{ "email": { "$gt": "" } }` login attempt → 400 | curl |
| S7 | M | JSON-only writes (415), body limit 100 kb (413) | curl |
| S8 | M | Same login error for unknown email and wrong password; dummy compare on unknown email | read + curl |
| S9 | M | No stack traces or Mongo messages in error bodies outside development | run with `NODE_ENV=production`, provoke 500 |
| S10 | m | If static serving is implemented: CSP of §3.6 present | `curl -I` |

### 1.5 Tests

| ID | Sev | Check | How |
|---|---|---|---|
| T1 | B | `npm test -w server` passes on a fresh DB, uses `goldstar_test`, drops it, exits without hanging | run |
| T2 | M | All 12 cases of §3.7 present (map each to a test name) | read |
| T3 | m | Tests do not depend on the live Woo API (offline seed in tests) | read |

---

## 2. Frontend

### 2.1 Build, structure, data

| ID | Sev | Check | How |
|---|---|---|---|
| F1 | B | `npm run build` succeeds; `npm run dev` (root) runs both apps; proxy `/api` works; cookie auth works through the proxy | run |
| F2 | B | Dependencies per §1.6; none of the forbidden ones (GSAP, Lenis, Tailwind, other UI kits, `@mui/icons-material`, Draco, CDN-loaded assets/presets) | `client/package.json`, grep for `preset=`, `https://` in `three/` |
| F3 | B | Client uses the API exactly as §3 (paths, shapes, error mapping); no invented endpoints | read `api/`, run against real server |
| F4 | M | Mock mode works with the server off (`VITE_USE_MOCK=true`); fixtures match §3.2; mock not bundled into normal builds | run; grep `dist` for fixture strings |
| F5 | M | Cart store: persisted `gs-cart-v1`, line identity product+colour+size, qty 1–5, ≤ 10 lines, re-priced from quote on drawer open | test + manual |
| F6 | B | `npm test -w client` passes; `sampleTimeline` tests cover every keyframe in §9.5 and clamping | run + read |
| F7 | M | Route-level lazy loading: 3D, admin and checkout are separate chunks | build output |

### 2.2 Pages and flows (run against the real server)

| ID | Sev | Check | How |
|---|---|---|---|
| F8 | B | Every route of §4.2 renders at 1440 / 768 / 390 with no console errors or React warnings | browser, console |
| F9 | B | No horizontal overflow at 390 px on any route | `document.documentElement.scrollWidth <= 390` |
| F10 | B | Full COD flow: add → drawer → checkout (login redirect and back) → order placed → confirmation → visible in account → cancel while placed | manual |
| F11 | B | Admin: price edit shows on Home after reload; callout edit shows on Home; order status moves through the allowed flow only; non-admin sees Not found on `/admin/*` | manual |
| F12 | M | Form UX: visible labels, errors under fields from API `details`, first invalid field focused, submit shows loading and blocks double submit, `autocomplete` set | manual |
| F13 | M | Product page: swatches, sizes, qty, "Choose a size" inline error, external Goldstar link with `rel="noopener noreferrer"` | manual |
| F14 | M | Shop: category filter and sort in the URL, back button restores them; skeletons match card size | manual |
| F15 | m | Every route sets `document.title`; Not found page exists | manual |

### 2.3 Brand and honesty constraints

| ID | Sev | Check | How |
|---|---|---|---|
| H1 | B | "Concept prototype — not an official Goldstar site." visible on every route at every scroll position (incl. admin, drawer open) | scroll each route |
| H2 | B | Credits block present and exact: model title, © 2021 Shopify, CC BY 4.0 link, Khronos source link, "stand-in sneaker, not the G10-401", photo/price source, fonts | read footer |
| H3 | B | No invented facts: no reviews/ratings/stock counts/delivery promises/awards; only the 7 spec lines; no "water repellent"; no politics | read all copy |
| H4 | M | Copy matches §4.4 exactly (headings, sentences, button labels); storyboard typos not copied | compare |
| H5 | M | Nepali touches set in Mukta with `lang="ne"`: wordmark गोल्डस्टार, colour names, footer monument | inspect DOM |
| H6 | M | Real G10-401 photos beside the 3D in the colour section with the caption of §4.4 | view |

### 2.4 Design quality (tasteskill + ui-ux-pro-max)

| ID | Sev | Check | How |
|---|---|---|---|
| D1 | B | tasteskill `lint.mjs client/src` and `inspect.mjs` (production preview) report 0 FAIL on `/`, `/shop`, `/product/g10-401`; `inspect.mjs --app` 0 FAIL on `/admin/orders`. WARNs fixed or defended (only §5.8 overrides accepted as defended) | run the gates myself |
| D2 | B | Palette exactly §5.1; no raw hex in components (tokens/theme only) | grep `#[0-9a-fA-F]{6}` outside `theme/` and `three/shoe.config.js` |
| D3 | B | Banned on every screen: glass/backdrop blur, CSS gradients, neon, glows, bloom, eyebrows, tiny tracked caps, 01/02/03, monospace, decorative hairlines, pill nav, emoji, resting shadows | grep `backdrop-filter`, `gradient`, `letterSpacing`, `monospace`; inspector |
| D4 | M | Typography per §5.2: Archivo variable with working `wdth` axis, Mukta for Devanagari, sizes/weights/widths as the table, ≤ 5 sizes on Home, headlines ≤ 2 lines at all widths | inspector + DevTools |
| D5 | M | Square corners everywhere except the listed exceptions; buttons flat, 48px min, sentence case | view |
| D6 | M | Equal outer margins at every width (16/24/32); no section huddled on one side; no blank stretch > half a screen (story sticky frames always carry text) | inspector frame checks + screenshots |
| D7 | M | Product photos treated per §5.5 consistently (lit tile + multiply, or the darken filter), 1:1, sized, lazy | view |
| D8 | M | Admin follows app-screen rules: tables first, 1px rules ok, status pills beside values, no invented metric cards, no icon tiles | view |
| D9 | m | Hover/press/focus feedback on every control at the motion tokens of §5.3; exits faster than entrances | view |
| D10 | m | Critique pass (tasteskill `references/critique.md`) on the final screenshots: top three problems named and either fixed or listed | write in review |

### 2.5 Animation fidelity to the storyboard

Compare against `reference/storyboard.jpg` and SPEC §9.5 using the crewmate's screenshots **and** my
own scroll-through.

| ID | Sev | Check | Storyboard frame |
|---|---|---|---|
| A1 | B | One fixed R3F canvas behind the content; scroll drives it via `motion` `useScroll` → `useSpring` → `useFrame` with no per-frame React state | (architecture) |
| A2 | B | Hero (s 0): shoe floating right of the h1 with gold dust and a visible rim light; "Explore further" link present | row 1 left |
| A3 | M | Performance (s 100): big gold "PERFORMANCE, REDEFINED." with the shoe moved away; nothing overlaps the headline | row 1 right |
| A4 | B | Callouts (s 205–300): four callouts draw in one after another (dot → line → text), lines track their anchors while the shoe turns, anchors land on sensible parts of the shoe (eyelets on the lace area, collar at the opening, etc.) | row 2 left |
| A5 | B | Explode (s 400–500): shoe lifts, three slabs fan out beneath along straight axes with no wobble, three badges (support, cushion, grip) appear beside their layers, gold swoosh draws around the stack | row 2 middle |
| A6 | M | Re-assembles cleanly; "DESIGNED TO ENDURE." beside the shoe | row 2 right |
| A7 | B | Colour (s 700–800): swatches recolour the shoe (Black/Olive) with a smooth tint, vertical thumbnail rail of real photos, price changes, slow turntable | row 3 |
| A8 | B | Add to cart: gather → drop → close → fly to cart icon → badge increments on landing → shoe returns (≈ 2.1 s); triggered by the button only; works repeatedly; scroll during the flight does not break it | row 4 left + middle |
| A9 | M | Finale: shoe drifts away, dust intensifies, "YOUR ADVENTURE BEGINS NOW." centred, footer nav (Shop all, Technology, About Goldstar, Stores) | row 4 right |
| A10 | M | Scrubbing backwards reverses every move exactly (no one-shot triggers in the story) | scroll up and down |
| A11 | M | Phone (390 px): shoe in the top area, stepped bottom panel with part names + prev/next, one callout at a time, active anchor dot; nothing overlaps the h2 | phone emulation |
| A12 | m | Motion feels mechanical and exact (eased segments, no bounce/overshoot), idle float subtle | judgement |
| A13 | B | `shoe.config.js` is the only file that knows node names, anchors, slabs and tints; a part-split GLB would need config changes only | read code |

### 2.6 Performance

| ID | Sev | Check | How |
|---|---|---|---|
| R1 | B | `shoe-mobile.glb` ≤ 1.5 MB, `shoe-desktop.glb` ≤ 4 MB; `npm run model` reproduces them and exits non-zero on budget breach | `ls -l`, run |
| R2 | M | Initial JS for `/` ≤ 250 KB gzip; 3D chunk ≤ 320 KB gzip; hero poster ≤ 120 KB; fonts ≤ 250 KB | build output, network panel |
| R3 | B | DPR capped at 1.5 (1.25 lite); `PerformanceMonitor` + `AdaptiveDpr` wired with the step-down of §9.10 | read code, `gl.getPixelRatio()` |
| R4 | B | Rendering pauses when the story is off screen and when the tab is hidden | DevTools performance / log frame count |
| R5 | M | ≤ 60k triangles, ≤ 20 draw calls, ≥ 50 fps desktop through the story | `?debug=perf` |
| R6 | M | No per-frame allocations in `useFrame`; geometries/materials/textures disposed on unmount (navigate Home → Shop → Home three times, `gl.info.memory` stable) | read code + check |
| R7 | M | Meshopt decoder and all assets self-hosted (no network requests to CDNs) | network panel |
| R8 | M | Poster shown first, canvas lazy and crossfaded; CLS < 0.1 on `/`, `/shop`, `/product/g10-401` | Performance panel |

### 2.7 Accessibility and fallbacks

| ID | Sev | Check | How |
|---|---|---|---|
| X1 | B | Reduced motion: static poses per section, explode shown open, all callouts visible, no flight, no drift; page fully readable | DevTools emulate `prefers-reduced-motion` |
| X2 | B | Static tier (`?tier=static`, or no WebGL): no canvas, photos/posters per section, all callouts listed, colour swap via photos, add-to-cart works | run |
| X3 | B | Keyboard only: skip link, nav, swatches (arrow keys), sizes, add to cart, drawer (focus trap, Escape, focus return), checkout, admin forms | tab through |
| X4 | B | Visible focus ring on every focusable element; touch targets ≥ 44×44 | view + measure |
| X5 | M | Contrast: running text ≥ 7:1, secondary ≥ 4.5:1; no blue text on ground; no gold text on the photo tile | inspector contrast report |
| X6 | M | Canvas `aria-hidden`; every story text exists in the DOM in reading order with h1/h2 structure; images have alt text | read DOM |
| X7 | M | `aria-live` announcement on add to cart; icon-only buttons have `aria-label`; cart button label includes count | screen reader / DOM |
| X8 | m | `lang="en"` on html, `lang="ne"` on Devanagari spans | DOM |

---

## 3. Review record template

```
Crewmate: backend | frontend      Handback date:
Verdict: APPROVE | APPROVE WITH NOTES | REJECT
Commands I ran: (list with result)
Failed items: ID — evidence — expected fix
Notes (m items):
Accepted deviations: (with reason)
```
