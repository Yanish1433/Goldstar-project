# Gold Star Shoes Nepal: build spec (MERN + scroll-driven 3D)

Version 1.0, 2026-11-04. Written by the lead reviewer. Crewmates follow it exactly. Anything this
document does not decide is listed under §15 "Assumptions"; if you hit a gap that is not there, pick
the simplest option that keeps the API contract stable, write it in your handback under "Deviations",
and carry on.

Words used with fixed meaning: **MUST** = required for approval. **SHOULD** = expected; skipping it
needs a one-line reason in the handback. **MAY** = optional.

---

## 0. What we are building

A pitch/demo prototype of a Goldstar Shoes Nepal website:

- A **Home** page that tells the G10-401 story as one scroll-driven 3D sequence following the
  captain's storyboard (`C:\goldstar-3d\reference\storyboard.jpg`), played with a real 3D sneaker.
- A small shop: catalogue, product detail, cart drawer, **cash on delivery** checkout, accounts with
  order history, and an admin panel for products and orders.
- Stack: MongoDB 8.2 (local Windows service, `mongodb://127.0.0.1:27017`), Express 5, React 19
  (Vite), Node 24. No Docker. No deploy.

Hard constraints that apply to every screen:

1. A **"Concept prototype — not an official Goldstar site."** note is always visible (§8.2).
2. Only public facts. No invented reviews, ratings, stock counts, awards, delivery times or claims.
   The only product claims allowed are the spec lines on Goldstar's own product page (§4.4).
3. Craft and heritage only. No politics, no named politicians, no conflict history.
4. The 3D shoe is a **stand-in** (Shopify's CC-BY "Materials Variants Shoe"), not the G10-401. It
   MUST be credited (§9.9), and the colour section MUST show real G10-401 photographs next to it.
5. English with Nepali touches (गोल्डस्टार) set in Mukta.

---

## 1. Repo layout

Monorepo with npm workspaces at `C:\goldstar-3d`.

```
C:\goldstar-3d\
  package.json            # BACKEND owns. workspaces: ["server", "client"]
  package-lock.json       # generated; BACKEND regenerates last (see §13.3)
  .gitignore              # BACKEND owns
  .nvmrc                  # "24"
  README.md               # BACKEND owns: how to install, seed, run, test
  docs\                   # LEAD REVIEWER owns (this file, REVIEW-CHECKLIST.md). Crew: read only.
  reference\storyboard.jpg  # read only
  _dl\shoe.glb            # read only source model (git-ignored, re-downloadable)
  .taste-skill\           # read only (direction sheet); inspector output may land in .taste-skill\inspect
  server\                 # BACKEND owns everything inside
    package.json
    .env.example
    src\
      app.js              # builds the Express app (no listen) so tests can import it
      index.js            # connects Mongo, listens on PORT
      config\env.js       # reads + validates env with zod; refuses to start on bad config
      db.js
      models\User.js  Product.js  Order.js
      routes\auth.js  products.js  cart.js  orders.js  admin.products.js  admin.orders.js  health.js
      middleware\auth.js  validate.js  error.js  rateLimit.js  jsonOnly.js
      schemas\*.js        # zod schemas, shared by routes and tests
      lib\orderNumber.js  money.js  woo.js  slug.js
      seed\seed.js
      seed\data\woo-products.json   # committed raw Store API snapshot (fallback)
      seed\data\curated.js          # hero spec callouts, colour overrides, swatch hexes
    test\*.test.js
  client\                 # FRONTEND owns everything inside
    package.json
    .env.example
    index.html
    vite.config.js
    public\models\shoe-desktop.glb  shoe-mobile.glb   # produced by scripts/build-model.mjs
    public\posters\*.webp                              # hero poster + static-tier stills
    public\fonts\ (only if not using fontsource)
    scripts\build-model.mjs
    src\
      main.jsx  App.jsx  routes.jsx
      theme\theme.js  tokens.js
      api\client.js  hooks.js  mock\*.js
      store\cart.js  ui.js
      components\  (AppBar, ConceptNote, CartDrawer, Footer, Price, Swatches, SizePicker, ...)
      pages\  Home.jsx Shop.jsx Product.jsx Checkout.jsx OrderConfirmation.jsx Login.jsx Register.jsx
              Account.jsx AccountOrder.jsx NotFound.jsx
      pages\admin\  AdminLayout.jsx AdminProducts.jsx AdminProductEdit.jsx AdminOrders.jsx AdminOrder.jsx
      story\  (DOM side of the Home story: sections, callouts, panels)
      three\  shoe.config.js timeline.js tier.js StoryCanvas.jsx Shoe.jsx LayerSlabs.jsx GoldDust.jsx
              Swoosh.jsx ParticleBox.jsx Lights.jsx useStoryProgress.js
    test\*.test.js(x)
```

### 1.1 Stale files (BACKEND, first task)

`C:\goldstar-3d\package.json`, `package-lock.json` and `node_modules\` are left over from an Astro
attempt. The backend crewmate deletes all three **before anything else**, then writes the new root
`package.json`. Do not delete `.git`, `.taste-skill`, `_dl`, `reference` or `docs`.

### 1.2 Root package.json (BACKEND)

```json
{
  "name": "goldstar-3d",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "workspaces": ["server", "client"],
  "scripts": {
    "dev": "concurrently -k -n server,client -c yellow,cyan \"npm run dev -w server\" \"npm run dev -w client\"",
    "build": "npm run build -w client",
    "start": "npm run start -w server",
    "seed": "npm run seed -w server",
    "test": "npm run test -w server && npm run test -w client",
    "model": "npm run model -w client"
  },
  "devDependencies": { "concurrently": "^9" }
}
```

Workspace scripts each side MUST provide:

| Workspace | Script | Does |
|---|---|---|
| server | `dev` | `node --watch --env-file-if-exists=.env src/index.js` |
| server | `start` | `node --env-file-if-exists=.env src/index.js` |
| server | `seed` | `node --env-file-if-exists=.env src/seed/seed.js` (flags `--offline`, `--reset`) |
| server | `test` | `vitest run` (or `node --test`); uses `MONGODB_URI_TEST` |
| client | `dev` | `vite` (port 5173, strictPort) |
| client | `build` | `vite build` |
| client | `preview` | `vite preview --port 4173` |
| client | `test` | `vitest run` |
| client | `model` | `node scripts/build-model.mjs` |

### 1.3 Ports and proxy

- Server: `5050`. Client dev: `5173`. Vite proxies `/api` to `http://127.0.0.1:5050`
  (`server.proxy['/api'] = { target, changeOrigin: false }`), so the browser sees one origin and the
  auth cookie is first-party. `vite preview` uses the same proxy.
- The client calls relative URLs (`/api/...`) only, with `credentials: 'include'`.

### 1.4 .env files (never commit real `.env`)

`server/.env.example`:

```
NODE_ENV=development
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/goldstar
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/goldstar_test
JWT_SECRET=change-me-to-at-least-32-random-characters
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false
CLIENT_ORIGIN=http://localhost:5173
SEED_ADMIN_EMAIL=admin@goldstar.test
SEED_ADMIN_PASSWORD=change-me-12+chars
SEED_ADMIN_NAME=Demo Admin
SEED_ADMIN_RESET=false
WOO_API_URL=https://goldstarshoes.com/wp-json/wc/store/v1/products
```

`client/.env.example`:

```
VITE_USE_MOCK=false
```

`server/src/config/env.js` validates with zod and exits with a readable message when: `JWT_SECRET`
is missing or shorter than 32 characters, `MONGODB_URI` is not a mongodb URL, or `PORT` is not a
number. The seed additionally requires `SEED_ADMIN_EMAIL` and a `SEED_ADMIN_PASSWORD` of 12+
characters. The backend crewmate creates a local `server/.env` from the example with a random secret
(`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`), and records the
demo admin credentials **only** in that git-ignored `.env`.

### 1.5 .gitignore (BACKEND)

```
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
_dl/
.taste-skill/inspect/
*.log
.DS_Store
```

### 1.6 Dependencies (latest stable at install time; these majors or newer)

Server: `express@5`, `mongoose@8`, `zod@4` (or 3.23+), `bcryptjs@3` (pure JS; avoids native builds
on Windows), `jsonwebtoken@9`, `cookie-parser`, `helmet@8`, `cors`, `express-rate-limit@7`, `morgan`.
Dev: `vitest`, `supertest`.

Client: `react@19`, `react-dom@19`, `react-router@7` (library mode), `@tanstack/react-query@5`,
`@mui/material@7` (or the current major), `@emotion/react`, `@emotion/styled`, `motion` (import from
`motion/react`), `three`, `@react-three/fiber@9`, `@react-three/drei@10`, `zustand@5`,
`lucide-react`, `@fontsource-variable/archivo`, `@fontsource/mukta`. Dev: `vite`,
`@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`,
`@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `meshoptimizer`,
`sharp`.

Not allowed: GSAP, Lenis, Tailwind, any UI kit other than MUI, any icon set other than
`lucide-react` (plus the three custom badge SVGs), `@mui/icons-material`, Draco, remote CDN loaders
(drei's `Environment preset` fetches from a CDN: do not use presets).

---

## 2. Data models (Mongoose, server/src/models)

All schemas: `{ timestamps: true }`, `toJSON` transform that renames `_id` to `id` (string) and
deletes `__v` and `passwordHash`. Mongoose `strictQuery: true` and `sanitizeFilter: true` set
globally in `db.js`. Money is **whole NPR integers** (the Store API reports `currency_minor_unit: 0`).

### 2.1 User

| Field | Type | Rules |
|---|---|---|
| name | String | required, trim, 2–80 |
| email | String | required, trim, lowercase, unique, valid email, max 254 |
| passwordHash | String | required, `select: false` |
| phone | String | optional; Nepali mobile `^(\+977)?9[678]\d{8}$` |
| role | String | enum `user`, `admin`; default `user` |

Indexes: `{ email: 1 }` unique.

### 2.2 Product

```
Product {
  slug:        String, required, unique, lowercase, ^[a-z0-9-]+$
  name:        String, required (e.g. "G10-401")
  series:      String, optional ("G10", "ARC")
  categories:  [String]  // kebab slugs: "trek-collection", "women", "men", "casual", "new-arrival", "trending", "in-stock"
  description: String, plain text, max 4000 (HTML stripped)
  shortSpecs:  [String]  // sentence-cased lines from Goldstar's own list, max 12
  featured:    Boolean, default false   // G10-401 = true
  active:      Boolean, default true    // false = archived, hidden from public API
  sortOrder:   Number, default 100
  colourways:  [Colourway], min 1
  specCallouts:[SpecCallout]
  source:      { wooIds: [Number], fetchedAt: Date, origin: "live" | "snapshot" }
}

Colourway (subdocument, _id: false) {
  key:          String, required, kebab ("black", "olive", "grey-pink"), unique within product
  name:         String, required ("Black")
  nameNe:       String, optional (Devanagari, e.g. "कालो")
  hex:          String, required, ^#[0-9A-Fa-f]{6}$   // swatch colour
  price:        Number, required, integer >= 0        // NPR
  regularPrice: Number, integer >= price              // equals price unless on sale
  sizes:        [String], min 1                       // UK sizes as strings, sorted numerically
  inStock:      Boolean, default true
  images:       [{ src: String(url), thumb: String(url), alt: String }]
  productUrl:   String(url), must start with https://goldstarshoes.com/
  wooIds:       [Number]
}

SpecCallout (subdocument, _id: false) {
  key:      String, required, kebab, unique within product
  title:    String, required, 2–60, sentence case
  body:     String, required, 2–200
  anchor:   String, enum: "upper" | "overlay" | "eyelets" | "collar" | "footbed" | "midsole" | "outsole"
  position: [Number] length 3 or null   // optional override in shoe-local normalised units (§9.3)
  stage:    String, enum: "callout" | "layer"   // "callout" = §9.5 S3, "layer" = §9.5 S4
  badge:    String, enum: "support" | "cushion" | "grip" | null   // layer badges only
  order:    Number, integer
}
```

Virtuals in `toJSON`: `priceFrom` (min colourway price), `priceTo` (max).

Indexes: `{ slug: 1 }` unique; `{ active: 1, featured: -1, sortOrder: 1 }`; `{ categories: 1 }`;
`{ 'colourways.wooIds': 1 }`; text index `{ name: 'text', description: 'text', series: 'text' }`.

### 2.3 Cart: client-side, re-priced by the server

Decision: **the cart lives in the browser** (zustand + `localStorage` key `gs-cart-v1`) and is sent
to the server only for quoting and for placing the order. No Cart collection.

Why: the storyboard's add-to-cart happens on the Home page for any visitor, signed in or not, so a
server cart would need guest sessions and merge logic. A client cart has no such cost. The server
is still the price authority: `POST /api/cart/quote` re-prices every line when the drawer opens, and
`POST /api/orders` re-prices again and ignores any price the client sends. Cross-device carts are
out of scope for a demo.

Cart line (client): `{ productId, slug, name, colourwayKey, colourwayName, size, qty, unitPrice,
image }`. Line identity = `productId + colourwayKey + size`. `qty` 1–5 per line, max 10 lines.

### 2.4 Order

```
Order {
  orderNumber:   String, required, unique   // "GS-261104-7KQ2": GS-YYMMDD-4 chars [A-HJ-NP-Z2-9]
  user:          ObjectId ref User, required, indexed
  items: [{
    product:       ObjectId ref Product
    slug, name, colourwayKey, colourwayName, size: String
    qty:           Number int 1–5
    unitPrice:     Number int   // server price at order time
    lineTotal:     Number int
    image:         String(url)
  }], min 1, max 10
  subtotal:      Number int
  deliveryFee:   Number int, default 0   // see Assumptions
  total:         Number int
  currency:      String, default "NPR"
  paymentMethod: String, enum ["cod"], default "cod"
  paymentStatus: String, enum ["unpaid", "paid"], default "unpaid"
  shipping: {
    fullName:    String 2–80, required
    phone:       String, Nepali mobile regex, required
    addressLine: String 3–160, required   // street / tole / house
    area:        String 2–80, required    // e.g. "Maharajgunj"
    city:        String 2–80, required    // e.g. "Kathmandu"
    landmark:    String max 120, optional
    notes:       String max 300, optional
  }
  status:        String, enum ["placed", "confirmed", "shipped", "delivered", "cancelled"], default "placed"
  statusHistory: [{ status, at: Date, by: ObjectId ref User, note: String max 300 }]
}
```

Status flow (enforced in one function `canTransition(from, to)` with unit tests):

```
placed    -> confirmed | cancelled
confirmed -> shipped   | cancelled
shipped   -> delivered
delivered -> (terminal)    on entering delivered, paymentStatus becomes "paid" (cash collected)
cancelled -> (terminal)
```

A user may cancel only their own order and only while it is `placed`. Admins may make any allowed
transition. Every change appends to `statusHistory`. The first entry (`placed`) is written at
creation.

Indexes: `{ orderNumber: 1 }` unique; `{ user: 1, createdAt: -1 }`; `{ status: 1, createdAt: -1 }`;
`{ 'shipping.phone': 1 }`.

---

## 3. REST API contract

Base path `/api`. JSON in, JSON out, UTF-8. All state-changing requests (POST/PATCH/DELETE) MUST
send `Content-Type: application/json` or get `415`. Request bodies are validated with zod
`.strict()` schemas (unknown keys are a `400`). Path `:id` params that are not valid ObjectIds return
`404`, never `500`.

### 3.1 Error format (every non-2xx)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.",
             "details": [ { "path": "shipping.phone", "message": "Enter a Nepali mobile number, e.g. 98XXXXXXXX." } ] } }
```

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | zod failure (`details` lists every field) |
| 400 | `BAD_JSON` | body is not parseable JSON |
| 401 | `UNAUTHENTICATED` | no/invalid/expired cookie |
| 401 | `INVALID_CREDENTIALS` | wrong email or password (same message for both) |
| 403 | `FORBIDDEN` | signed in but not allowed (non-admin on admin route, other user's order) |
| 404 | `NOT_FOUND` | unknown route, id or slug; archived product on public routes |
| 409 | `EMAIL_TAKEN` | register with an existing email |
| 409 | `SLUG_TAKEN` | admin creates a product with an existing slug |
| 409 | `INVALID_TRANSITION` | status change not allowed by §2.4 |
| 409 | `CART_PROBLEM` | order lines reference missing product/colourway/size or out-of-stock (`details[].path` = `items.N`) |
| 413 | `PAYLOAD_TOO_LARGE` | body > 100 kb |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | non-JSON body on a write |
| 429 | `RATE_LIMITED` | rate limit hit; include `Retry-After` header |
| 500 | `INTERNAL` | anything else; message "Something went wrong." No stack trace outside development |

### 3.2 Shared response shapes

```ts
User        = { id, name, email, phone: string|null, role: "user"|"admin", createdAt }
Image       = { src, thumb, alt }
Colourway   = { key, name, nameNe: string|null, hex, price, regularPrice, sizes: string[], inStock, images: Image[], productUrl, wooIds: number[] }
SpecCallout = { key, title, body, anchor, position: [n,n,n]|null, stage, badge, order }
Product     = { id, slug, name, series, categories, description, shortSpecs, featured, active, sortOrder,
                priceFrom, priceTo, colourways: Colourway[], specCallouts: SpecCallout[], updatedAt }
ProductSummary = { id, slug, name, series, categories, featured, priceFrom, priceTo,
                   colourways: [{ key, name, hex, price, regularPrice, inStock, image: Image|null }] }
QuoteLine   = { productId, slug, name, colourwayKey, colourwayName, size, qty, unitPrice, lineTotal, image }
Order       = { id, orderNumber, status, paymentMethod, paymentStatus, items: QuoteLine-like[], subtotal,
                deliveryFee, total, currency, shipping, statusHistory: [{status, at, note}], createdAt, updatedAt,
                customer?: { id, name, email } }   // customer only in admin responses
OrderSummary = { id, orderNumber, status, total, itemCount, createdAt, firstImage }
Page<T>     = { items: T[], page, limit, total }
```

### 3.3 Routes

Auth levels: **public**, **user** (valid cookie), **owner** (user who owns the resource, or admin),
**admin** (role re-read from the database on every request, not trusted from the token).

| # | Method + path | Auth | Request | 2xx response | Notes |
|---|---|---|---|---|---|
| 1 | `GET /api/health` | public | – | `200 { ok: true, db: "up"\|"down" }` | `db` from `mongoose.connection.readyState` |
| 2 | `POST /api/auth/register` | public, rate-limited | `{ name, email, password, phone? }` | `201 { user }` + sets cookie | password 8–72 chars, at least one letter and one digit |
| 3 | `POST /api/auth/login` | public, rate-limited | `{ email, password }` | `200 { user }` + sets cookie | `401 INVALID_CREDENTIALS` on any mismatch |
| 4 | `POST /api/auth/logout` | public | – | `204` | clears cookie |
| 5 | `GET /api/auth/me` | user | – | `200 { user }` | `401` if not signed in (client treats as "guest") |
| 6 | `GET /api/products` | public | query: `category`, `q` (max 60), `sort` = `featured`\|`price_asc`\|`price_desc`\|`newest` (default `featured`), `page` ≥1 (default 1), `limit` 1–48 (default 12) | `200 Page<ProductSummary>` | active products only |
| 7 | `GET /api/products/:slug` | public | – | `200 { product: Product }` | `404` if missing or archived |
| 8 | `GET /api/categories` | public | – | `200 { items: [{ slug, name, count }] }` | derived from active products; `name` = sentence case ("Trek collection") |
| 9 | `POST /api/cart/quote` | public | `{ items: [{ productId, colourwayKey, size, qty }] }` (1–10) | `200 { lines: QuoteLine[], subtotal, deliveryFee, total, problems: [{ index, code, message }] }` | never errors on bad lines; reports them in `problems` (`NOT_FOUND`, `SIZE_UNAVAILABLE`, `OUT_OF_STOCK`) and leaves them out of `lines` |
| 10 | `POST /api/orders` | user | `{ items: [...as quote], shipping: {...§2.4}, paymentMethod: "cod" }` | `201 { order: Order }` | server re-prices; any problem → `409 CART_PROBLEM`; `paymentMethod` other than `"cod"` → `400` |
| 11 | `GET /api/orders/mine` | user | query `page`, `limit` (≤ 50) | `200 Page<OrderSummary>` | newest first |
| 12 | `GET /api/orders/:id` | owner | – | `200 { order }` | other user → `404` (do not reveal existence) |
| 13 | `POST /api/orders/:id/cancel` | owner | `{ note? }` | `200 { order }` | only from `placed`; else `409 INVALID_TRANSITION` |
| 14 | `GET /api/admin/products` | admin | query `q`, `active` (`true`\|`false`\|`all`, default `all`), `page`, `limit` ≤ 100 | `200 Page<Product>` | includes archived |
| 15 | `GET /api/admin/products/:id` | admin | – | `200 { product }` | by id |
| 16 | `POST /api/admin/products` | admin | full Product body minus `id`, timestamps, virtuals | `201 { product }` | duplicate slug → `409 SLUG_TAKEN` |
| 17 | `PATCH /api/admin/products/:id` | admin | any subset of: `name, series, categories, description, shortSpecs, featured, active, sortOrder, colourways, specCallouts` | `200 { product }` | arrays are replaced whole; `slug` is immutable (`400` if sent) |
| 18 | `GET /api/admin/orders` | admin | query `status` (one of enum or `all`), `q` (order number or phone), `page`, `limit` ≤ 100 | `200 Page<Order>` (with `customer`) | newest first |
| 19 | `GET /api/admin/orders/:id` | admin | – | `200 { order }` (with `customer`) | |
| 20 | `PATCH /api/admin/orders/:id/status` | admin | `{ status, note? }` | `200 { order }` | `409 INVALID_TRANSITION` if not allowed |

There is no product DELETE: archiving is `PATCH { active: false }`. Unknown `/api/*` routes return
`404 NOT_FOUND` JSON.

### 3.4 Validation rules (zod, `server/src/schemas`)

- Email: trimmed, lowercased, RFC-ish (`z.email()`), max 254.
- Phone: strip spaces and dashes, then `^(\+977)?9[678]\d{8}$`.
- Strings: trimmed; reject control characters; max lengths as in §2.
- `qty`: integer 1–5. `items`: 1–10, no duplicate `productId+colourwayKey+size` (merge on the client).
- Colourway `hex` regex; `price`/`regularPrice` integers 0–1,000,000, `regularPrice >= price`.
- Callout `position`: exactly 3 finite numbers each within −5..5, or `null`.
- `productUrl` must be `https://goldstarshoes.com/...`; image URLs must be `https://`.

### 3.5 Seed (`npm run seed`)

`server/src/seed/seed.js`, idempotent (safe to run twice; upserts by `slug`).

1. **Fetch** `WOO_API_URL?per_page=20` with a 10 s timeout and a desktop User-Agent. On any failure,
   or with `--offline`, read `server/src/seed/data/woo-products.json`. Log which source was used.
   The backend crewmate creates that JSON by saving the raw live response once (expected: 9 items)
   and commits it.
2. **Group** the 9 Store API listings into products by normalised model name (trim, collapse
   whitespace, remove spaces around hyphens: `"AX -3"` → `"AX-3"`). Expected result, 5 products:

   | slug | name | Woo listings → colourways |
   |---|---|---|
   | `g10-401` (featured, sortOrder 1) | G10-401 | 27292 + 22960 → **black** NPR 3,400, productUrl `https://goldstarshoes.com/product/g10-401-2/`; 27285 + 22961 → **olive** NPR 2,775, productUrl `https://goldstarshoes.com/product/g10-401/` |
   | `g10-l2102` | G10 L2102 | 27299 → **pink** NPR 3,500; 22798 → **grey-pink** NPR 3,700 |
   | `ax-3` | AX-3 | 27281 → black, coffee, grey (one listing, shared price NPR 2,000, regular 2,700, shared images) |
   | `ax` | AX | 22963 → black, coffee, grey (NPR 2,000, regular 2,700) |
   | `ax-1-a` | AX-1/A | 22962 → olive (attribute says Olive though the slug says coffee; trust the attribute) NPR 3,000 |

   Colour comes from the `Color` attribute. Where it is empty (27285, 22961) use the override map in
   `curated.js` (`{ 27285: "olive", 22961: "olive" }`). When two listings give the same model + colour,
   the newer (higher id) is primary for `productUrl` and images; both ids go into `wooIds`; sizes are
   the union.
3. **Map fields**: `prices.price` → `price` (integer), `prices.regular_price` → `regularPrice`;
   `images[]` → `{ src: image.src, thumb: image.thumbnail, alt: image.alt || "<name> in <colour>" }`;
   `UK-Size` attribute terms → `sizes` (sorted numerically); `Series` attribute → `series`;
   `categories[].name` → kebab slugs; `is_in_stock` → `inStock`; `short_description` `<li>` items →
   `shortSpecs` (HTML-decoded, sentence case: "EVA midsole for bounce", keep acronyms EVA, PU);
   `description` → HTML stripped, entities decoded.
4. **Swatch hexes** from `curated.js`: black `#1E1E1E`, olive `#5F6142`, pink `#D9657F`,
   grey-pink `#B9A3A8`, coffee `#5A4030`, grey `#8A8A8A`. Nepali names only for G10-401: black `कालो`,
   olive `जैतुनी`; all others null.
5. **G10-401 spec callouts** from `curated.js` (exact copy; these are Goldstar's own spec lines,
   rewritten in sentence case, with no claim added):

   | order | key | stage | anchor | badge | title | body |
   |---|---|---|---|---|---|---|
   | 1 | canvas-mesh | callout | upper | – | Canvas mesh upper | Canvas mesh makes up the body of the upper. |
   | 2 | pu-overlays | callout | overlay | – | PU synthetic leather | Synthetic leather overlays sit over the mesh where it meets the sole and heel. |
   | 3 | metal-eyelets | callout | eyelets | – | Metal eyelets | Metal eyelets, fitted for ruggedness. |
   | 4 | foam-collar | callout | collar | – | High-density foam | High-density foam padding around the collar. |
   | 5 | footbed | layer | footbed | support | Arch support | Arch support and a cushioned footbed. |
   | 6 | eva-midsole | layer | midsole | cushion | EVA midsole | An EVA midsole for bounce. |
   | 7 | rubber-outsole | layer | outsole | grip | Rubber outsole | A rubber outsole for durability and slip resistance. |

6. **Admin user**: upsert by `SEED_ADMIN_EMAIL` with role `admin`. If the user exists, keep the
   password unless `SEED_ADMIN_RESET=true`. Never print the password.
7. `--reset` deletes all products first (never users or orders).
8. Print a summary: `source=live|snapshot products=5 colourways=11 admin=<email> (created|kept)`.

### 3.6 Security baseline (all MUST)

- Passwords: `bcryptjs` cost 12. Max 72 bytes (bcrypt limit) enforced by validation.
- JWT: HS256, payload `{ sub: userId, role }`, expiry `JWT_EXPIRES_IN` (7d). Stored only in an
  httpOnly cookie `gs_token`: `httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE, path: '/',
  maxAge: 7d`. Never in localStorage, never in a response body.
- `requireAuth` verifies the token **and** loads the user from the DB (deleted user → 401).
  `requireAdmin` checks the DB role.
- `helmet()` on every response. When the server serves `client/dist` (optional, §13.1) set a CSP:
  `default-src 'self'; img-src 'self' data: blob: https://goldstarshoes.com; script-src 'self';
  style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; worker-src 'self'
  blob:; object-src 'none'; frame-ancestors 'none'`.
- `cors({ origin: CLIENT_ORIGIN, credentials: true })`, no wildcard.
- Rate limits (`express-rate-limit`, standard headers): `/api/auth/login` and `/api/auth/register`
  10 requests / 15 min / IP; all `/api` 300 / 15 min / IP. Disable or raise in tests via env
  (`NODE_ENV=test`), but keep one test that proves the auth limiter fires.
- `express.json({ limit: '100kb' })`; JSON-only on writes (415); zod `.strict()`; `sanitizeFilter`.
- Login error is the same for unknown email and wrong password; still run a bcrypt compare against
  a dummy hash for unknown emails (timing).
- No secrets in git: `.env` ignored, `.env.example` has placeholders only, the seed snapshot holds
  only public Store API data. `git grep -i "secret\|password"` shows only examples and code.
- Error handler: never leaks stack traces or Mongo error text outside `development`.
- `x-powered-by` disabled (helmet does this).

### 3.7 Server tests (MUST, against `MONGODB_URI_TEST`, database dropped in `afterAll`)

1. Health returns `ok`.
2. Register → cookie set, `me` returns the user, `passwordHash` never present in any response.
3. Duplicate register → 409. Bad login → 401 with identical message for unknown email.
4. Auth limiter returns 429 after 10 attempts.
5. Products list paginates, filters by category, sorts by price; archived product hidden; detail by
   slug; unknown slug 404.
6. Quote re-prices, reports bad lines in `problems`.
7. Order: requires auth (401); tampered `unitPrice` in body is rejected by strict schema (400);
   valid order gets server prices, `GS-` number, `placed` history entry; problem line → 409.
8. Ownership: user B gets 404 on user A's order.
9. Cancel allowed from `placed`, 409 from `shipped`.
10. Admin routes: guest 401, user 403, admin 200. Product PATCH updates price and callouts; `slug` in
    PATCH → 400. Status transitions follow §2.4; `delivered` sets `paymentStatus: "paid"`.
11. Non-JSON write → 415. Invalid ObjectId → 404.
12. Seed runs offline against the test DB and yields 5 products, 1 featured, G10-401 with 2
    colourways and 7 callouts.

---

## 4. Frontend: routes and pages

### 4.1 Global shell

- `ThemeProvider` + `CssBaseline` (§5), `QueryClientProvider` (staleTime 60 s, retry 1),
  `RouterProvider`.
- Layout: `ConceptNote` + `AppBar` (sticky) → `<main id="content">` → `Footer`. `CartDrawer`,
  `Snackbar` and the `aria-live` announcer mounted once at the root.
- Skip link "Skip to content" as the first focusable element.
- Every route sets `document.title` (`"G10-401 · Goldstar concept"`, etc.).
- Route-level code splitting with `React.lazy` for: Home's 3D (`three/*`), Admin, Checkout.

### 4.2 Route table

| Path | Page | Auth | Main MUI components |
|---|---|---|---|
| `/` | Home (3D story, §9) | public | Typography, Button, RadioGroup (custom swatch radios), ToggleButtonGroup (sizes), Snackbar, Dialog (photo viewer) |
| `/shop` | Shop | public | Typography, ToggleButtonGroup (category filter), Select (sort), Card, CardActionArea, CardMedia, Skeleton, Pagination |
| `/product/:slug` | Product detail | public | Typography, RadioGroup swatches, ToggleButtonGroup sizes, Button, Link, Dialog (zoom), Skeleton |
| (drawer) | Cart drawer | public | Drawer (anchor right), List, IconButton, Button, Alert |
| `/checkout` | Checkout (COD) | user (else redirect `/login?next=/checkout`) | TextField, RadioGroup (single "Cash on delivery"), Button, Alert, Paper (summary) |
| `/order/:id` | Order confirmation | owner | Typography, Paper, Table (small), Button |
| `/login`, `/register` | Auth | guest (signed-in → redirect to `next` or `/account`) | TextField, Button, Alert, Link |
| `/account` | Account: profile + orders | user | Typography, Table (desktop) / List (phone), Chip (status), Button (log out) |
| `/account/orders/:id` | Order detail | owner | Typography, Table, Chip, Button ("Cancel order" with Dialog confirm), List (history) |
| `/admin` | → redirect `/admin/orders` | admin | – |
| `/admin/products` | Products table | admin | Table, TableSortLabel, TextField (search), Switch (active filter), Chip, Pagination, Button ("New product") |
| `/admin/products/new`, `/admin/products/:id` | Product edit form | admin | TextField, Autocomplete (categories, sizes), Switch, Select (anchor, stage, badge), Accordion (colourways, callouts), Button, Snackbar, Dialog (unsaved changes) |
| `/admin/orders` | Orders table | admin | Tabs (status filter), TextField (search), Table, Chip, Pagination |
| `/admin/orders/:id` | Order detail + status update | admin | Paper, Table, Select (next status, only allowed ones), TextField (note), Button, Dialog (confirm cancel), List (history) |
| `*` | Not found | public | Typography, Button |

Non-admins hitting `/admin/*` see the Not found page (do not advertise the panel). Guests hitting a
`user` route are redirected to `/login?next=<path>`.

### 4.3 Page details

**Shop** (`/shop`): `h1` "Shop all". Category filter (square ToggleButtons from `GET /api/categories`,
plus "All") and a sort Select, both reflected in the URL query. Grid: 3 columns ≥1200px, 2 columns
600–1199px, 2 columns below 600px (cards 1:1 photo). Card = photo on a lit tile (§5.5), name (h3
size 20px), colour dots (12px squares in colourway hexes, with an accessible label "2 colours:
Black, Olive"), price "NPR 2,775" or "NPR 2,775 – 3,400"; sale shows the regular price struck
through after it. Hover (pointer devices): photo swaps to the second image, 240ms opacity. Loading:
Skeleton cards with the same aspect ratio (no layout shift). Empty: "No shoes in this category yet."
+ "Show all" button.

**Product detail** (`/product/:slug`): two columns ≥900px (gallery 7/12, buy panel 5/12), stacked
below. Gallery: main image 1:1 on the lit tile, thumbnail rail (vertical left on desktop,
horizontal scroll-snap row on phones), click opens a Dialog. Buy panel: `h1` product name, price
(display size, tabular figures), colourway radios (swatch + name + price), size toggle (UK sizes,
44×44 min), quantity (−/+ IconButtons, 1–5), primary "Add to cart", secondary text link
"View on goldstarshoes.com" (`productUrl`, `target="_blank" rel="noopener noreferrer"`), spec list
(`shortSpecs` as a `<ul>`), and for `g10-401` a link "See it come apart" → `/#story-explode`. Without
a chosen size, "Add to cart" shows the inline error "Choose a size" under the size group (and moves
focus there), it is not disabled.

**Cart drawer**: opens from the cart IconButton and from the Snackbar "View cart" action. Width
420px, full width below 600px. Title "Your cart" (h2 at 24px). On open, calls quote; if a price
changed, an `Alert severity="info"` "A price changed since you added this. Totals are updated." and
the store updates. Lines: thumb 64px, name, "Olive · UK 8", qty stepper, line total, remove
IconButton (`aria-label="Remove G10-401 Olive UK 8"`). Footer: subtotal, line "Cash on delivery.
Delivery fee confirmed by phone." and primary "Checkout". Empty: "Your cart is empty." + "Shop all".

**Checkout** (`/checkout`): `h1` "Checkout". Left: form sections "Contact" (full name, phone,
prefilled from the account), "Delivery address" (address line, area, city, landmark optional, notes
optional), "Payment" (RadioGroup with one checked option "Cash on delivery" and the helper line "Pay
in cash when the shoes arrive. This is a demo: no order will be delivered."). Right (sticky on
desktop): summary from quote. Submit "Place order (cash on delivery)": shows a CircularProgress in
the button while pending, disables double submit, maps `400 details` to field errors (error text
under each field, focus the first invalid field), `409 CART_PROBLEM` to an Alert above the summary
listing affected lines. Success: clear cart, navigate to `/order/:id`. Labels are visible (never
placeholder-only); `autocomplete` attributes set (`name`, `tel`, `address-line1`, `address-level2`).

**Order confirmation**: `h1` "Order placed", order number in large tabular figures, the items, total,
"Cash on delivery", status, and buttons "View my orders" and "Keep shopping".

**Login / Register**: single column 440px max, `h1` "Log in" / "Create an account", visible labels,
password visibility toggle (IconButton with aria-label), password rule visible under the field and
tied with `aria-describedby` ("8 or more characters, with a letter and a number"), server errors in an
Alert at the top **and** on the field when field-specific. Links between the two.

**Account**: `h1` "Your account", name/email/phone, "Log out" button, "Your orders" table (order
number, date, items, total, status chip, link). Phone: list rows instead of a table.

**Admin** (app screen, §5.7): left sidebar 232px ("Orders", "Products", "View site") on the page
ground, content column fluid with 32px gutters. Products table columns: photo (40px), name, series,
colourways, price range, featured, active, updated; row click opens edit. Edit form: sections
"Details", "Colourways" (one Accordion per colourway: key (read-only after save), name, Nepali name,
swatch (`<input type="color">` + hex text), price, regular price, sizes Autocomplete, in stock
Switch, product URL, images (list of src/thumb/alt rows with add/remove)), "Spec callouts"
(repeatable rows: title, body, anchor Select, stage Select, badge Select, order, optional position
x/y/z). Sticky bottom bar "Save changes" / "Discard". Unsaved changes trigger a confirm Dialog on
navigation (`useBlocker`). Validation errors from the API map onto fields. Orders: Tabs "All, Placed,
Confirmed, Shipped, Delivered, Cancelled"; search box (order number or phone); table columns order
number, date, customer, phone, items, total, status chip. Order detail: items, shipping, history list,
and a status form showing **only** allowed next statuses; "Cancelled" requires a confirm Dialog.

### 4.4 Copy deck (exact text; Home)

| Section | Heading (tag) | Supporting text | Action |
|---|---|---|---|
| Hero | `h1` "G10-401" + second line "Built for the trail." (one h1, two lines) | "Goldstar's trek shoe from Kathmandu. From NPR 2,775." | Button "Shop the G10-401" → `/product/g10-401`; text link "Explore further" → `#story-performance` |
| Performance | `h2` "Performance, redefined." | "Seven parts, each one named on Goldstar's own spec sheet." | – |
| Callouts | `h2` "What it's made of" | the 4 `stage: "callout"` items from the API | – |
| Explode | `h2` "From the footbed down" | the 3 `stage: "layer"` items with badges | – |
| Endure | `h2` "Designed to endure." | "Rubber underfoot, EVA in between, metal at the laces." | – |
| Colour | `h2` "Pick your colour" | Price of the selected colourway ("NPR 3,400"), colour name in English and Nepali ("Black · कालो"), size picker, "Add to cart"; caption under the photo rail: "Photos: the real G10-401. 3D: a stand-in sneaker." | Button "Add to cart" |
| Finale | `h2` "Your adventure begins now." | "Order today and pay in cash when it arrives." | Button "Shop all" → `/shop` |
| Footer | the name गोल्डस्टार set full width in Mukta 600, gold | nav: "Shop all" `/shop`, "Technology" `/#story-callouts`, "About Goldstar" → `https://goldstarshoes.com/about/` (external), "Stores" → `https://goldstarshoes.com/stores/` (external); concept note; credits (§9.9); "Made with love in Nepal" is Goldstar's own footer line: do not reuse it | – |

All copy is sentence case except the h1/h2 display styles, which are set uppercase by the theme
(CSS `text-transform`, so screen readers get normal text). No eyebrows, no index numbers, no emoji.

---

## 5. Design tokens and MUI theme

Direction: the captain's "Night Shift" mixed with the storyboard, under tasteskill's dealt direction
"The dark room" (seed 974625661): one near-black warm ground top to bottom, lit objects, gold display
type, Goldstar blue as a rare secondary. Where the tasteskill house rules conflict with the captain's
storyboard, the storyboard wins on the items listed in §5.8; everything else follows the house rules.

### 5.1 Palette (`client/src/theme/tokens.js`; components use tokens/theme only, no raw hex)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `ground` (background.default) | `#0B0A08` | the whole page, every route | – |
| `surface1` (background.paper) | `#15130F` | Drawer, Dialog, cards, admin panels | ink 15.9:1 |
| `surface2` | `#1C1915` | hover rows, inputs, concept strip, Skeleton | secondary 8.1:1 |
| `surface3` | `#24201A` | menus, selected rows | – |
| `ink` (text.primary) | `#F2EDE3` | all running text | 17.0:1 on ground |
| `inkSecondary` (text.secondary) | `#B8AF9F` | captions, meta, table heads | 9.1:1 on ground |
| `inkDisabled` (text.disabled) | `#6E675C` | disabled only | – |
| `gold` (primary.main) | `#E2B857` | display headings, primary button fill, leader lines, swatch selection, badge strokes | 10.6:1 on ground |
| `goldLight` (primary.light) | `#F0CF7A` | button hover, focus ring, rim light | 13.1 (as fill under ground text) |
| `goldDark` (primary.dark) | `#C99A3A` | button pressed | 7.7:1 |
| `onGold` (primary.contrastText) | `#0B0A08` | text on gold | 10.6:1 |
| `blue` (secondary.main) | `#2A27E9` | Goldstar blue as fills only: the "Cash on delivery" radio's selected fill, the shipped status chip, the 2px underline of external links to goldstarshoes.com | white on blue 8.2:1; **never** blue text on ground (2.4:1) |
| `blueLight` (secondary.light) | `#8C8AFF` | blue as text/icon on dark (external-link icon, info Alert) | 6.8:1 |
| `blueDark` (secondary.dark) | `#120FBF` | blue hover | – |
| `error.main` | `#FF7A72` | errors | 7.8:1 |
| `success.main` | `#5BB98C` | delivered, success | 8.3:1 |
| `warning.main` | `#F0A85A` | warnings | – |
| `info.main` | `#8C8AFF` | info | 6.8:1 |
| `divider` | `rgba(242,237,227,0.10)` | tables and form fields **only** (app-screen exception) | – |
| `tile` | `#EDE7DC` | lit product-photo tile (§5.5) | – |
| 3D: `slabFootbed` `#C9B79A`, `slabMidsole` `#E8E2D6`, `slabOutsole` `#1A1918`, `dust` `#E2B857`, `rim` `#F0CF7A` | | | |

Blue is used at most once per screen (house rule: one accent per screen; gold is the page's accent,
blue is the brand nod). The cart badge is gold.

### 5.2 Typography

Fonts: `@fontsource-variable/archivo` (import the stylesheet that includes the **wdth** axis; check
the package's files, e.g. `wdth.css`, and verify in DevTools that changing `font-stretch` changes the
glyphs) and `@fontsource/mukta` weights 400 and 600, Devanagari + Latin subsets. `font-display: swap`.
Family stack for everything: `"Archivo Variable", "Mukta", system-ui, sans-serif` (Archivo has no
Devanagari, so Devanagari falls through to Mukta). A `lang="ne"` span uses `fontFamily: "Mukta"`
explicitly.

| Variant | Size | Weight | Width (`font-stretch`) | Line height | Tracking | Case | Use |
|---|---|---|---|---|---|---|---|
| `display` (custom) / `h1` | `clamp(44px, 6.5vw, 104px)` | 600 | 115% | 0.95 | −0.03em | uppercase | Home h1, gold |
| `h2` | `clamp(34px, 4.6vw, 76px)` | 600 | 112% | 1.0 | −0.025em | uppercase | Home section heads, gold |
| `h3` | `clamp(24px, 2.2vw, 32px)` | 600 | 100% | 1.15 | −0.01em | sentence | page titles outside Home (Shop, Checkout use h1 at this size via `component`), card names at 20px |
| `h4` | 22px | 600 | 100% | 1.2 | 0 | sentence | panel titles |
| `h5` | 18px | 600 | 100% | 1.3 | 0 | sentence | callout titles (condensed: width 88%) |
| `h6` | 16px | 600 | 100% | 1.4 | 0 | sentence | table section heads |
| `body1` | 17px | 400 | 100% | 1.6 | 0 | sentence | running text, ink |
| `body2` | 15px | 400 | 100% | 1.55 | 0 | sentence | dense UI, admin |
| `button` | 16px | 600 | 105% | 1 | 0.01em | **none** (sentence case) | buttons |
| `caption` | 14px | 400 | 100% | 1.45 | 0 | sentence | meta, credits, concept note |
| `price` (custom) | `clamp(28px, 3vw, 44px)` | 600 | 100% | 1 | −0.01em | – | prices, `font-variant-numeric: tabular-nums` |
| `overline` | mapped to caption; never uppercase-tracked | | | | | | |

Rules: on non-Home pages the page `h1` uses the h3 visual size (pages are tools, not posters). No
text under 14px except admin meta at 13px. Running text 45–75 characters per line (`maxWidth: 62ch`).
Headlines: two lines or fewer at 1440, 768 and 390px (check the copy deck at 390px: "PERFORMANCE,"
/ "REDEFINED." must each fit on one line at `clamp` minimum 34px → reduce width to 100% below 600px if
needed). Five type sizes on the Home page at most: display, h2, h5, body1, caption (+ price).

### 5.3 Shape, spacing, motion tokens

- `shape.borderRadius: 0` everywhere (square). Exceptions: Badge dot (circle), status Chip (pill,
  13px radius, admin and account only), Avatar (none used).
- Spacing unit 8. Page margins: 16px (<600), 24px (600–1199), 32px (≥1200), equal on both sides.
  Max content width 1440px centred. Section gap on Home is defined by the story heights (§9.4);
  other pages 96–160px between major blocks.
- Breakpoints: MUI defaults (xs 0, sm 600, md 900, lg 1200, xl 1536). "Phone layout" = below md.
- Motion tokens (from tasteskill motion.md): `easeOut cubic-bezier(0.22,1,0.36,1)`, `easeExpo
  cubic-bezier(0.16,1,0.3,1)`, `easeInOut cubic-bezier(0.76,0,0.24,1)`, `easeExit
  cubic-bezier(0.55,0.055,0.675,0.19)`; `press 140ms`, `hover 180ms`, `ui 240ms`, `drawer 320ms`,
  `reveal 800ms`, `staggerItem 70ms`, `staggerLine 90ms`. MUI `transitions.duration` and `easing` are
  set from these. Leaving is ~70% of arriving.

### 5.4 Component overrides (`theme.components`)

| Component | Override |
|---|---|
| `MuiCssBaseline` | `body` ground + ink, `-webkit-font-smoothing: antialiased`; `::selection` gold bg, onGold text; `:focus-visible` outline `2px solid goldLight`, offset 2px, on every focusable element; `color-scheme: dark`; images `display:block`; `@media (prefers-reduced-motion: reduce)` sets all transition/animation durations to 0.01ms except opacity fades ≤ 150ms |
| `MuiButton` | `disableElevation: true`, `disableRipple: false` (ripple colour gold at 0.24); radius 0; minHeight 48 (`size="large"` 56), padding `0 24px`; `contained+primary`: bg gold, text onGold, hover goldLight, active goldDark, transition `background-color 180ms ease`; `outlined`: 2px border `rgba(226,184,87,0.6)`, gold text, hover border gold + bg `rgba(226,184,87,0.08)`; `text`: gold, hover underline 2px offset 4px; disabled: bg surface2, text inkDisabled; pressed state `transform: scale(0.98)` 140ms |
| `MuiIconButton` | min 44×44, colour ink, hover bg surface2, radius 0 |
| `MuiTextField` / `MuiOutlinedInput` | default variant `outlined`; bg surface2; radius 0; border 1px `rgba(242,237,227,0.18)`, hover 0.32, focused 2px gold; input height 52, font 17px; label ink secondary, focused gold; helper text 14px; error border/text `error.main`; autofill background patched to surface2 |
| `MuiCard` | elevation 0, bg surface1, radius 0, no border, no shadow; `CardActionArea` hover bg surface2 + photo swap; focus-visible ring inset |
| `MuiCardMedia` | 1:1 aspect via `aspectRatio`, sits on `tile` with `mix-blend-mode: multiply` (§5.5) |
| `MuiDrawer` | paper bg surface1, width 420 / 100vw (<600), shadow `0 24px 64px rgba(0,0,0,0.6)` (it floats), no border; `Backdrop` `rgba(5,4,3,0.72)`, **no blur**; enter 320ms easeOut, exit 220ms easeExit |
| `MuiDialog` | paper bg surface1, radius 0, padding 32 (16 on phone), same shadow; title h4; actions right-aligned, primary last |
| `MuiTable` / `MuiTableCell` | head: 14px 600, ink secondary, sentence case, no background band; body 15px; row rule `1px solid divider`; no zebra; row hover surface2; numeric cells right-aligned tabular-nums; padding 12px 16px |
| `MuiChip` | status chips only: height 26, radius 13, 13px 600, pale tint + same-hue text: placed `rgba(140,138,255,0.16)`/`#B9B8FF`, confirmed `rgba(226,184,87,0.16)`/`#F0CF7A`, shipped `rgba(42,39,233,0.28)`/`#C9C8FF`, delivered `rgba(91,185,140,0.16)`/`#8FD9B3`, cancelled `rgba(255,122,114,0.14)`/`#FFB0AA`; never above a heading |
| `MuiAppBar` | `position="sticky"`, elevation 0, bg ground (solid, **no blur, no glass**), no bottom border; Toolbar height 64 (56 phone) |
| `MuiBadge` | gold bg, onGold text, 12px 700; bump animation hook (§9.8) |
| `MuiToggleButton` | radius 0, min 48×48 (sizes), 1px `rgba(242,237,227,0.18)` border, selected: 2px gold border + gold text + bg `rgba(226,184,87,0.10)` |
| `MuiRadio` (swatches) | hidden native radio + custom 44×44 swatch square; selected: 2px gold outline offset 3px; focus ring visible |
| `MuiMenu` / `MuiPopover` / `MuiSelect` paper | bg surface3, radius 0, shadow `0 12px 32px rgba(0,0,0,0.5)` |
| `MuiAlert` | `variant="outlined"` off: use filled tone surface2 with a 4px left bar in the severity colour; text ink |
| `MuiSnackbar` | bottom-left desktop, bottom full width phone, surface3, auto-hide 4000ms |
| `MuiSkeleton` | bg surface2, `animation="wave"` off when reduced motion |
| `MuiTabs` | indicator 2px gold, tab text sentence case 15px 600, min height 44 |
| `MuiLink` | gold, underline on hover 2px offset 4px; external links show a lucide `ArrowUpRight` 16px |
| `MuiTooltip` | surface3, ink, 14px, radius 0 |

### 5.5 Product photos

Woo product photos are studio shots. Before relying on it, check a few images: if their backgrounds
are white/near-white, show them on a `tile` (`#EDE7DC`) box with the `<img>` at `mix-blend-mode:
multiply` so the white becomes the warm tile ("a lit plinth in a dark room"). If backgrounds are dark
or busy, drop the blend and use `filter: brightness(0.85) contrast(1.05)` instead. Same treatment
everywhere, square corners, 1:1 crops, `loading="lazy"` except the first visible image, `width` and
`height` attributes set (no CLS), `srcset` from `thumb` (800w) and `src` (full). Use
`referrerPolicy="no-referrer"`; if the host blocks hotlinking, report it (do not download the photos
into the repo without the first mate's approval).

### 5.6 Icons

`lucide-react`, 20px, stroke 1.75, colour inherits ink; every icon-only button has an `aria-label`.
Decorative icons `aria-hidden`. The three layer badges (support, cushion, grip) are custom inline
SVGs (2px gold strokes, 28px, square tiles) drawn in `client/src/story/badges.jsx`: support = an
arch curve over a flat line; cushion = three stacked wavy lines; grip = a row of chevron treads.
No emoji anywhere.

### 5.7 Admin and account screens (tasteskill app-screen rules)

Same ground and fonts; quiet. 1px row rules and input borders are allowed; small labels 13–14px
sentence case; status pills beside values only; one icon set; shadows only on menus/dialogs; no
gradients, no glows, no icon tiles, no invented metrics (no "revenue this week" cards). Tables first.

### 5.8 Where the storyboard overrides tasteskill (explicit, so nobody "fixes" it)

| Storyboard element | House rule it bends | How we keep it tasteful |
|---|---|---|
| Uppercase gold display headings | dark-room "light weights" | weight 600 not 900; max 6.5vw; gold flat colour, no gradient text, no glow |
| Gold dust particles | "no decorative shapes" | captain allowed it: ≤1500 points, small, slow, opacity ≤ 0.6, dims after the hero |
| Gold swoosh | "no glows / gradients" | a flat-coloured 3D ribbon, no bloom, drawn once during the explode |
| Icon badges on the layers | "no icon-topped cards" | three small square SVG badges tied to real spec lines, not a card row |
| Vertical thumbnail rail | – | real G10-401 photos, not decoration |
| Soft rim light | "no glows" | a light in the 3D scene, not a CSS glow |

Still banned on every screen: glassmorphism/backdrop blur, CSS gradients (backgrounds, buttons,
text), neon, heavy bloom/post-processing, eyebrow labels, tiny tracked caps, 01/02/03 numbering,
monospace, hairline decorative rules, pill navigation, emoji, shadows on resting elements, more than
two typefaces.

---

## 6. Client data layer

- `api/client.js`: `apiFetch(path, { method, body })` → JSON; throws `ApiError { status, code,
  message, details }` built from §3.1. Always `credentials: 'include'`.
- `api/hooks.js`: TanStack Query hooks: `useMe`, `useProducts(params)`, `useProduct(slug)`,
  `useCategories`, `useQuote(items)`, `useMyOrders`, `useOrder(id)`, mutations `useLogin`,
  `useRegister`, `useLogout`, `usePlaceOrder`, `useCancelOrder`, admin `useAdminProducts`,
  `useAdminProduct`, `useSaveProduct`, `useAdminOrders`, `useAdminOrder`, `useSetOrderStatus`.
  Query keys are arrays (`['products', params]`). Mutations invalidate the affected keys.
- `store/cart.js` (zustand + persist): `lines`, `add(line)`, `setQty`, `remove`, `clear`,
  `replacePrices(quoteLines)`, selectors `count` (sum of qty) and `subtotal`; plus
  `pendingFlights` (number, not persisted) for §9.8.
- `store/ui.js`: `cartOpen`, `openCart()`, `closeCart()`, `announce(text)` (feeds the aria-live
  region), `snackbar`.
- **Mock mode**: `api/mock/` holds fixtures that match §3.2 exactly (the 5 seed products with the
  G10-401 callouts of §3.5, a demo user, two orders) and an in-memory implementation of every route
  in §3.3. It is used when `VITE_USE_MOCK=true`, or in **dev only** when `GET /api/health` fails at
  boot (then a small dev-only line under the concept note reads "Mock data: API not reachable").
  Mock mode never ships in `vite build` unless the env var is set.
- Price format: `formatNPR(n)` → `"NPR 3,400"` via `Intl.NumberFormat('en-IN')`. Ranges: `"NPR 2,775 – 3,400"`.

---

## 7. Accessibility and UX rules (all screens, MUST)

From ui-ux-pro-max (priorities 1–9) and tasteskill:

1. Contrast: running text ≥ 7:1 (ink on ground is 17:1); secondary ≥ 4.5:1; never gold text on
   `tile`, never blue text on ground.
2. Keyboard: every control reachable in reading order; visible focus ring (§5.4); Drawer and Dialog
   trap focus and return it to the opener; Escape closes them.
3. Touch targets ≥ 44×44 with ≥ 8px between them (swatches, sizes, qty, icon buttons).
4. Forms: visible labels, error text under the field (`aria-describedby`), focus first invalid
   field on submit, loading state in the submit button, no double submit.
5. Images: meaningful `alt` ("G10-401 in Olive, side view" where known; else "G10-401 in Olive");
   decorative images `alt=""`. Canvas `aria-hidden="true"`; all 3D story content exists as DOM text.
6. `aria-live="polite"` announcer for cart changes ("Added G10-401, Olive, UK 8 to your cart.").
7. Colour pickers are radio groups (arrow keys move, name + price read out). Sizes are a
   single-select group with `aria-label="UK size"`.
8. No horizontal scroll at 390px on any route (`document.documentElement.scrollWidth <= 390`).
9. Reserve space for every image and the canvas (CLS < 0.1). Skeletons match final sizes.
10. Active nav item is marked (gold text + `aria-current="page"`).
11. Back button works everywhere; filters/sort/tabs live in the URL; deep links to products and
    orders work on reload (Vite history fallback).
12. `prefers-reduced-motion` honoured everywhere (§9.10).
13. Language: `<html lang="en">`; Devanagari spans `lang="ne"`.

---

## 8. Chrome: AppBar, concept note, footer

### 8.1 AppBar

Left: wordmark = a 5-point star SVG (gold, 20px) + "Goldstar" (Archivo 600, 105% width, 20px, ink)
+ "गोल्डस्टार" (Mukta 400, 15px, ink secondary, `lang="ne"`, hidden below 600px). Centre/right:
links "Shop" `/shop`, "Technology" `/#story-callouts`, "Account" (or "Log in" for guests), "Admin"
(admins only). Far right: cart IconButton (lucide `ShoppingBag`) with gold Badge showing
`count - pendingFlights`, `aria-label="Cart, 2 items"`. Phone (<900): links collapse into a menu
IconButton (lucide `Menu`) opening a full-height Drawer from the right with the same links at 24px.
No search (catalogue has 5 products).

### 8.2 Concept note (always visible)

A 32px strip inside the sticky AppBar, above the Toolbar, bg surface2, caption 14px ink secondary,
left-aligned to the page margin: **"Concept prototype — not an official Goldstar site."** followed by
a text link "Credits" → `#credits` (footer). It scrolls with nothing: because it sits inside the
sticky AppBar it is on screen on every route at every scroll position, including Admin. It is never
dismissible. On phones it wraps to two lines if needed (min 14px).

### 8.3 Footer

Designed close, not a sitemap. Top: the name गोल्डस्टार at full width (`font-size` fitted to the
container, ~18vw, Mukta 600, gold, `lang="ne"`, `aria-hidden` with a visually hidden "Goldstar").
Below, two columns (one on phones): nav (§4.4) and the `#credits` block (§9.9) + concept note + "Demo
build, November 2026". Footer bg = ground; it scrolls over the fixed canvas, so it MUST have an
opaque background.

---

## 9. The Home 3D story

### 9.1 Architecture

```
<Home>
  <StoryCanvas/>        position: fixed; inset: 0; z-index: 0; pointer-events: none; aria-hidden
  <main id="story">     position: relative; z-index: 1; seven <section>s with fixed heights (§9.4)
     <CalloutLayer/>    DOM overlay (fixed, z-index 2) for leader lines, dots and badges
  </main>
  <Footer/>             z-index: 1, opaque
```

- R3F `<Canvas>`: `dpr={[1, 1.5]}` (lite tier `[1, 1.25]`), `gl={{ antialias: true, alpha: false,
  powerPreference: 'high-performance' }}`, `camera={{ fov: 35, position: [0, 0.4, 7.5], near: 0.1,
  far: 50 }}`, `flat={false}`, tone mapping ACES Filmic, exposure 1.0, scene background `#0B0A08`.
  The camera never moves; the shoe rig moves.
- Scroll: `motion`'s `useScroll({ target: storyRef, offset: ['start start', 'end end'] })` gives
  `scrollYProgress` 0–1 over the story. Smooth it with `useSpring(scrollYProgress, { stiffness: 140,
  damping: 30, mass: 0.5, restDelta: 0.0005 })` (no spring under reduced motion). Inside the canvas,
  `useFrame` reads `progress.get()` every frame and calls the pure function
  `sampleTimeline(p, layout)` from `three/timeline.js`, then writes to object refs. **No React state
  per frame**; DOM overlays are updated through refs in the same `useFrame` callback.
- DOM text in sections uses `useTransform(scrollYProgress, [...], [...])` MotionValues on
  `motion.div` `style` (opacity, y). Same progress source as the canvas, so they never drift apart.
- `drei`: `useGLTF(url, false, true)` (no Draco, meshopt on, decoder bundled, no CDN), `Environment`
  with `Lightformer`s (no preset, no HDR download), `ContactShadows`, `AdaptiveDpr`,
  `PerformanceMonitor`, `useProgress` (for the poster crossfade).
- Lazy: `StoryCanvas` is `React.lazy` and mounts after the hero poster has painted
  (`requestIdleCallback`, 1500 ms timeout). Poster `client/public/posters/hero.webp` (≤ 120 KB) is an
  `<img>` in the hero at the same framing as keyframe K0; it fades out (400 ms) once the first frame
  with the model renders.
- Pausing: `frameloop` = `'always'` only while the story is intersecting the viewport and
  `document.visibilityState === 'visible'`; otherwise `'never'`. Reduced motion: `'demand'` (§9.10).

### 9.2 The model (what `_dl/shoe.glb` actually contains)

Inspected 2026-11-04 by parsing the GLB JSON chunk:

| Item | Finding |
|---|---|
| File | 7.83 MB, glTF 2.0, generator THREE.GLTFExporter |
| Scene graph | `Shoeobj` (matrix: uniform scale 0.1489, translate [0.0016, 0.0759, 0.0049]) → `g_Shoe` → `Shoe` (mesh) |
| Meshes | **1 mesh, 1 primitive**, 13,540 vertices, 22,700 triangles; attributes POSITION, NORMAL, TEXCOORD_0 |
| Bounds (mesh space) | x −1..1 (length), y −0.514..0.514 (height), z −0.389..0.389 (width). Real size ≈ 29.8 × 15.3 × 11.6 cm. Length is **X**, up is **Y**. Toe direction not yet confirmed |
| Materials | 3 (all named `phong1SG`), identical except baseColor texture; PBR metal/rough with ORM + normal |
| Textures | 5 JPEGs, all 2048²: `occlusionRougnessMetalness` 1.12 MB, `normal` 2.30 MB, `diffuseMidnight` 1.25 MB, `diffuseBeach` 1.25 MB, `diffuseStreet` 1.20 MB |
| Extensions | `KHR_materials_variants` (variants `midnight`, `beach`, `street`) |
| Licence | © 2021 Shopify, Inc., CC BY 4.0, logos/trademarks excluded |

Consequences for the design:

- There are **no separable parts**. The explode therefore moves the whole shoe (as "upper") and
  builds three **code slabs** (footbed, midsole, outsole) from the shoe's own footprint (§9.6). The
  storyboard does the same: the boot keeps its sole and the layers fan out beneath it.
- Callout anchors are **points on the single mesh** defined in config, not node names.
- Colour switch = one neutral (greyscale) base texture tinted by `material.color` (§9.7). The three
  variant textures and the extension are dropped in the pipeline.
- Swappable: `three/shoe.config.js` (§9.3) maps part names to GLB node names. A future part-split
  GLB lists real nodes for `upper`, `footbed`, `midsole`, `outsole`, …; any part without nodes falls
  back to its code slab. No component code changes.

### 9.3 `client/src/three/shoe.config.js` (the one file to swap the model)

```js
export const SHOE = {
  urls: { desktop: '/models/shoe-desktop.glb', mobile: '/models/shoe-mobile.glb' },
  normalise: { length: 3.0, axis: 'x', yawOffset: 0 },   // yawOffset = Math.PI if the toe points -X
  // Part -> GLB node names. Empty array = no such node: use the code slab for that part.
  parts: {
    upper:   ['Shoe'],
    footbed: [],
    midsole: [],
    outsole: [],
  },
  // Code slabs (used when parts[x] is empty). Thickness in normalised units.
  slabs: {
    footbed: { thickness: 0.05, inset: 0.94, color: '#C9B79A', roughness: 0.9, metalness: 0 },
    midsole: { thickness: 0.16, inset: 0.98, color: '#E8E2D6', roughness: 0.7, metalness: 0 },
    outsole: { thickness: 0.09, inset: 1.00, color: '#1A1918', roughness: 0.95, metalness: 0 },
  },
  // Callout anchors in normalised shoe-local fractions: u along length (-1 heel .. +1 toe),
  // v up (-1 bottom .. +1 top), w across (-1 medial .. +1 lateral, +1 faces camera at yaw 0).
  // Starting guesses: TUNE with ?debug=anchors and record the final values here.
  anchors: {
    collar:  [-0.55,  0.80, 0.00],
    eyelets: [ 0.05,  0.62, 0.35],
    upper:   [ 0.35,  0.15, 0.95],
    overlay: [-0.50, -0.20, 0.95],
    footbed: 'slab:footbed',     // slab anchors resolve to the slab's lateral-toe edge midpoint
    midsole: 'slab:midsole',
    outsole: 'slab:outsole',
  },
  tints: {                                   // multiplied over the neutral base texture
    black: { color: '#4A4846', roughness: 1.0 },
    olive: { color: '#8C8A5A', roughness: 1.0 },
    fallback: { color: '#B0AAA0', roughness: 1.0 },   // any other colourway key
  },
  credit: {
    title: 'Materials Variants Shoe', author: 'Shopify, Inc.', year: 2021,
    licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe',
    changes: 'Recoloured, textures resized and compressed.',
  },
};
```

Normalising (in `Shoe.jsx`): compute the scene `Box3`, scale uniformly so the X extent = 3.0,
centre X and Z on 0, and put the **bottom at y = −0.77** (half the normalised height ≈ 1.54), so the
shoe's visual centre is the rig origin. Apply `yawOffset`. First task when the model loads: confirm
which end is the toe (look at it) and set `yawOffset` so the toe points +X. Anchor world position =
`(u·1.5, v·0.77, w·0.585)` in rig space, then `localToWorld`. A DB `specCallouts[].position` (if not
null) overrides the config anchor for that callout.

`?debug=anchors` (dev only) renders 0.04-radius spheres at every anchor and logs them; `?debug=perf`
shows drei `<Stats>` / `r3f-perf`-style FPS. Neither ships enabled.

### 9.4 Story sections and scroll ranges

Seven sections with fixed heights. Story total 1000vh; `scrollYProgress` runs over 900vh of
scrolling (start-start to end-end), so **p = s / 900** where `s` is scroll distance into the story in
vh. Sections marked sticky hold their inner content with `position: sticky; top: 0; height: 100svh`.

| id | Height | Sticky | Section top at s | Active range (s) | p range |
|---|---|---|---|---|---|
| `story-hero` | 100vh | no | 0 | 0–100 | 0.000–0.111 |
| `story-performance` | 100vh | no | 100 | 100–200 | 0.111–0.222 |
| `story-callouts` | 200vh | yes | 200 | 200–400 | 0.222–0.444 |
| `story-explode` | 200vh | yes | 400 | 400–600 | 0.444–0.667 |
| `story-endure` | 100vh | no | 600 | 600–700 | 0.667–0.778 |
| `story-colour` | 200vh | yes | 700 | 700–900 | 0.778–1.000 |
| `story-finale` | 100vh | no | 900 | after p = 1 | 1.000 (+ footer) |

Heights and keyframes live in one constant table in `three/timeline.js` (`SECTIONS`), imported by
both the DOM sections and the canvas. Section ids are anchor targets (`/#story-explode`).

### 9.5 Choreography (desktop, ≥ 900px)

Rig pose = position `[x, y, z]`, rotation `[rx, ry, rz]` (radians, Euler XYZ; `ry = 0` shows the
lateral side with the toe to the right), uniform scale `S`. Between keyframes interpolate with
`easeInOutCubic` per segment; holds are flat. Idle float (hero and colour only): `y += 0.05 ·
sin(t·2.2)`, `ry += 0.06 · sin(t·0.9)`.

| Key | s (vh) | p | pos | rot | S | What happens | DOM |
|---|---|---|---|---|---|---|---|
| K0 | 0 | 0.000 | [1.1, 0.05, 0] | [0.12, −0.55, 0.04] | 1.25 | **Hero.** Shoe floats right of centre, three-quarter view, gold dust at full density drifting up around it. Rim light visible on the heel edge. | h1 + sentence + button at left (columns 1–5), bottom-aligned at 62% of viewport height |
| K1 | 30 | 0.033 | [1.1, 0.05, 0] | [0.12, −0.45, 0.04] | 1.25 | hold (float continues) | hero text starts to rise and fade (s 30–90: y −40px, opacity 1→0) |
| K2 | 100 | 0.111 | [2.7, −0.55, −1.4] | [0.05, 0.95, 0] | 0.85 | **"Performance, redefined."** Shoe swings to the far right and back, turning to show the heel; dust density falls to 35%. Nothing overlaps the headline. | h2 occupies columns 1–8, vertically centred; supporting line under it. In s 70–110 h2 rises 32px + opacity 0→1; out at s 160–200 |
| K3 | 200 | 0.222 | [−1.0, −0.1, 0] | [0.16, −0.70, 0] | 1.30 | **Callouts.** Shoe big on the left half, three-quarter front view. | h2 "What it's made of" top-right (columns 8–12) |
| – | 205–220 | 0.228–0.244 | | | | callout 1 (canvas mesh, `upper`) draws in | for each callout: dot scales 0→1 over the first 3vh, leader line draws (SVG `pathLength` 0→1) over the next 6vh, then title+body rise 16px + opacity over 6vh |
| – | 225–240 | 0.250–0.267 | | | | callout 2 (PU, `overlay`) | |
| – | 245–260 | 0.272–0.289 | | | | callout 3 (eyelets) | |
| – | 265–280 | 0.294–0.311 | | | | callout 4 (foam collar) | |
| K4 | 300 | 0.333 | [−1.0, −0.1, 0] | [0.16, −0.45, 0] | 1.30 | slow yaw drift during the hold (all 4 callouts visible, leader lines follow the anchors as it turns) | callouts fade out s 300–330 (lines retract first) |
| K5 | 400 | 0.444 | [−0.3, 0.05, 0] | [0.38, −0.15, 0] | 1.10 | **Explode set-up.** Shoe near centre-left, tilted toward the camera (seen from slightly above) so the stack reads. | h2 "From the footbed down" top-left |
| E | 400–450 | 0.444–0.500 | | | | **Explode** `e: 0 → 1` (§9.6). | – |
| – | 430–480 | 0.478–0.533 | | | | **Gold swoosh** draws along its curve (`drawRange` 0→100%) and its trailing points follow. | – |
| – | 440 / 455 / 470 | 0.489 / 0.506 / 0.522 | | | | layer badges appear: footbed (support), midsole (cushion), outsole (grip), each over 8vh | badge tile + title + body to the **right** of its slab, short 2px leader to the slab anchor |
| K6 | 500 | 0.556 | same as K5 | [0.38, 0.10, 0] | 1.10 | hold, slight yaw drift so the layers parallax | badges and swoosh fade s 500–530 |
| E′ | 520–570 | 0.578–0.633 | | | | **Re-assemble** `e: 1 → 0` | – |
| K7 | 600 | 0.667 | [−1.7, −0.1, 0] | [0.10, −1.00, 0] | 1.05 | **"Designed to endure."** Shoe left, near profile, rests above a soft contact shadow. | h2 right (columns 7–12), vertically centred, supporting line under it |
| K8 | 700 | 0.778 | [0.4, −0.15, 0] | [0.12, −0.50, 0] | 1.20 | **Colour.** Shoe centre-right. | sticky panel: photo rail at far left (vertical, 4–6 real photos 88px square, 12px gap), copy + swatches + sizes + Add to cart at left (columns 2–5); shoe sits in columns 6–12 |
| – | 700–800 | 0.778–0.889 | | | | turntable: `ry = −0.50 + π · ((s−700)/100)` eased; float on | swatch/size interaction live (§9.7) |
| K9 | 820 | 0.911 | [0.4, −0.15, 0] | [0.12, 2.64, 0] | 1.20 | hold end of turn | – |
| K10 | 900 | 1.000 | [0.0, 1.6, −2.5] | [0.30, 3.2, 0] | 0.60 | **Finale.** Shoe drifts up and back and is hidden (`visible = false`) when S < 0.62; dust rises to 80% density and drifts up faster (×1.6) behind the finale text. | finale section enters: h2 centred (the page's one centred moment), sentence, "Shop all"; then the footer |

Gold dust density multiplier (`uDensity`, 0–1, controls opacity and point size): 1.0 at s 0–60,
0.35 by s 110, 0.25 at s 200–700 (it never covers callout text: dust sits behind the shoe at z −1.5
to −4 outside the hero), 0.5 at s 700–800, 0.8 at s 900.

**Phones (< 900px).** The shoe occupies the top 55svh; text sits in the lower part. Use the same
keyframes with these overrides: every `x` → 0 except K2 (`x = 0, y = 1.4, S = 0.6`: the shoe parks
small and high, above the headline, never behind it) and K10; every `y += 0.55`;
every `S × 0.72`. Hero text bottom-aligned at 92svh. Callouts and layers use the **stepped bottom
panel** (§9.5.1). Colour section: rail becomes a horizontal 64px row above the swatches.

#### 9.5.1 Phone callouts: the stepped bottom panel

- In `story-callouts` and `story-explode`, a sticky bottom panel (surface1, min-height 34svh, max
  42svh, 16px padding, full width, no shadow, 0 radius) shows **one** callout at a time: title (h5),
  body (body1), and for layers its badge.
- Which one is active is derived from scroll (callouts: s 200–300 split into 4 equal steps; layers:
  s 430–500 into 3). The active anchor gets a 12px gold dot with a 2px ring on the shoe (projected
  DOM dot); no leader lines on phones.
- Above the text, a row of the part names (15px, ink secondary; active = gold, `aria-current="step"`)
  and two IconButtons (lucide `ChevronLeft`/`ChevronRight`, `aria-label="Previous part"`/"Next part")
  that `window.scrollTo` the matching step (smooth unless reduced motion). No "2 of 4" numbering.
- The panel never covers the h2 (h2 sits at the top of the section's sticky frame, the shoe between).

### 9.6 Explode mechanics

`e ∈ [0, 1]`, eased with `easeInOutCubic`. All offsets in rig-local normalised units (shoe length
3.0, bottom at y −0.77). Movement is along straight axes, no wobble, no overshoot.

| Part | Assembled (e = 0) | Exploded (e = 1) | Extra |
|---|---|---|---|
| `upper` (the whole GLB) | y 0 | y **+0.95** | rotation x −0.06·e (nose dips slightly) |
| `footbed` slab | top at y −0.74 (inside the shoe), hidden | top at y **+0.10** (just under the lifted upper's sole) | x −0.10·e; rotation y +0.05·e |
| `midsole` slab | top at y −0.74, hidden | top at y **−0.30** | x 0; rotation y −0.03·e |
| `outsole` slab | top at y −0.74, hidden | top at y **−0.62** | x +0.10·e; rotation y +0.02·e |

Note: the footbed's exploded top sits 0.08 below the lifted upper's bottom (upper bottom at
−0.77 + 0.95 = +0.18). Gaps between slabs ≈ 0.25 so the badges have room.

Slabs: `visible = e > 0.02`; scale `0.94 + 0.06·e` on X/Z; material opacity is not animated (opaque),
they simply slide out from under/inside the shoe. Slab geometry is built once at load:

1. Take all mesh vertices (in normalised space) with `y < bottom + 0.04·height`.
2. Project to the XZ plane, take the 2D convex hull, smooth it with two passes of Chaikin
   subdivision, scale by the slab's `inset`.
3. `THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.015,
   bevelSize: 0.015, bevelSegments: 2, curveSegments: 24 })`, rotated so the extrusion is along Y.
4. Material `MeshStandardMaterial` with the slab colour/roughness from config. The outsole gets a
   procedural tread: none (keep it plain) unless time allows (MAY: a small canvas-drawn normal map
   of chevrons).

Slab anchors resolve to the midpoint of the slab's lateral edge nearest the toe (`'slab:midsole'`).

**Swoosh**: a `CatmullRomCurve3` through 6 points that spiral around the exploded stack (start
lower-left behind at [−2.0, −0.9, −0.6], pass in front of the midsole at [0.2, −0.3, 0.9], end
upper-right at [2.2, 0.9, −0.4]; tune visually). `TubeGeometry(curve, 240, 0.012, 6)`,
`MeshBasicMaterial({ color: '#E2B857', toneMapped: false })`. Draw with
`geometry.setDrawRange(0, indexCount · t)`. 200 trailing points sampled along the curve, size 0.02,
following the tube's head with a falloff. No bloom.

### 9.7 Colour switch

- Pipeline (§11) produces one **neutral base colour texture** (greyscale, mean luminance ≈ 0.55).
- On load, clone the GLB material once; tint = `material.color.set(SHOE.tints[key].color)`. Switch
  is a colour lerp in linear space over 600 ms with `easeOut` inside `useFrame` (instant under reduced
  motion). No texture swaps, no material recompiles.
- The colourway list, prices and photos come from `GET /api/products/g10-401` (Black NPR 3,400,
  Olive NPR 2,775). Swatches: 44px squares in `colourways[].hex`, radio group, label "Black · NPR
  3,400". Selecting updates: tint, price display, Nepali name, the photo rail (that colourway's
  `images`), and the size options (that colourway's `sizes`).
- Photo rail: up to 6 thumbs (`thumb` URL) on the lit tile; activating one opens a Dialog with the
  full image. Caption under the rail: "Photos: the real G10-401. 3D: a stand-in sneaker."
- Unknown colourway keys use `tints.fallback`.

### 9.8 Add to cart: "fly into the gold-particle box" (button-triggered, not scroll)

Trigger: "Add to cart" in `story-colour` with a size chosen (no size → inline "Choose a size",
focus to the size group, no animation). On click:

1. `cart.add(line)` immediately (so a reload never loses it) and `pendingFlights += 1`. The badge
   shows `count − pendingFlights`, so the visible number changes only when the box lands.
2. Freeze the scroll pose (the flight owns the rig until it ends; scroll keeps working, the rig
   rejoins the timeline at the end with a 300 ms blend).
3. Timeline (ms from click), driven by a clock in `useFrame`:

| t (ms) | Phase | What moves |
|---|---|---|
| 0–450 | **Gather** | `ParticleBox`: 2,400 gold points start scattered on a sphere (r 2.6) around the shoe and converge (per-point delay 0–150 ms, `easeOut`) onto a shoebox shape: 60% on the 12 edges, 40% on the 5 faces of an open box 1.7 × 0.9 × 1.1 centred 0.35 below the shoe; 600 more points form the lid, hinged on the back top edge, open at −1.9 rad |
| 300–900 | **Drop** | shoe scales S → S·0.42, moves into the box centre, `ry += π/2`, `easeInOut` |
| 900–1150 | **Close** | lid rotates −1.9 → 0 rad, `easeOut` |
| 1150–1650 | **Fly** | box group flies to the cart icon: target = the cart IconButton's DOM rect centre → NDC → `unproject` at 6 units from the camera; scale → 0.08; `easeExit` curve; shoe inside travels with it |
| 1650 | **Land** | `pendingFlights −= 1` → badge number increments with a bump (scale 1 → 1.3 → 1 over 240 ms); points burst out 0.3 units and fade over 200 ms; `announce("Added G10-401, Olive, UK 8 to your cart.")`; Snackbar "Added to cart" with action "View cart" |
| 1650–2100 | **Return** | shoe reappears at its current timeline pose, scale 0 → pose S with `easeExpo` |

- During the flight the button shows "Adding…" and ignores clicks (`aria-disabled`); it is never
  `disabled` (keeps focus).
- Other pages (Shop, Product): no flight; cart adds instantly, badge bumps, Snackbar, announcement.
- Reduced motion or static tier: no flight, badge increments at once (bump replaced by a 150 ms
  colour flash), Snackbar + announcement.

### 9.9 Lights, materials, credits

- `Environment resolution={256} frames={1}` with Lightformers: top softbox (form rect, intensity 1.2,
  `#FFF6E6`, scale [6, 3], position [0, 5, 0] rotated −π/2 x), left strip (intensity 0.8, [−5, 1, 2]),
  warm right-rear strip as rim (intensity 1.5, `#F0CF7A`, [4, 1.5, −3]).
- `directionalLight` key [−3, 5, 4] intensity 1.6 `#FFFFFF`; rim `directionalLight` [2.5, 2, −4]
  intensity 2.2 `#F0CF7A`. No realtime shadows (`castShadow` off).
- `ContactShadows` at y −1.05 under the shoe, following its x/z: opacity 0.5, blur 2.6, far 2.5,
  resolution 256, `frames={Infinity}` on the full tier; lite tier uses a static soft shadow (a plane
  with a pre-rendered radial alpha texture generated once on a 2D canvas).
- No post-processing (no EffectComposer, no bloom).
- **Gold dust**: `THREE.Points`, 1,500 (full) / 600 (lite) points in a box [−6..6, −3..4, −4..1.5],
  custom `ShaderMaterial`: round soft point drawn in the fragment shader, size 2–5 px × DPR with
  size attenuation, colour `#E2B857`, alpha ≤ 0.6 × `uDensity`, upward drift `uTime·0.04` wrapping in
  y, slight x sway; `depthWrite: false`, `blending: AdditiveBlending`, `toneMapped: false`.
- **Credits block** (`#credits` in the footer, and in the code comment of `shoe.config.js`):
  "3D shoe: 'Materials Variants Shoe' © 2021 Shopify, Inc., licensed CC BY 4.0
  (link), from the Khronos glTF Sample Assets (link). Recoloured and compressed. Logos and
  trademarks excluded. The 3D model is a stand-in sneaker, not the Goldstar G10-401."
  "Product names, photos and prices: goldstarshoes.com public store data, shown for a pitch."
  "Fonts: Archivo and Mukta, SIL Open Font License."

### 9.10 Device tiers, reduced motion and fallbacks (`three/tier.js`)

| Tier | Chosen when | Gets |
|---|---|---|
| `full` | WebGL2 + fine pointer + width ≥ 900 + not low-end | desktop GLB, dpr [1, 1.5], 1,500 dust, live ContactShadows, leader lines |
| `lite` | WebGL2 and (coarse pointer or width < 900) | mobile GLB, dpr [1, 1.25], 600 dust, static shadow, stepped bottom panel |
| `static` | no WebGL2, or `navigator.connection.saveData`, or `deviceMemory ≤ 2`, or `hardwareConcurrency ≤ 2`, or the PerformanceMonitor fallback below | **no canvas**. Each story section shows a real G10-401 photo (lit tile) or a pre-rendered poster still, with **all** its callouts visible as a list beside it; colour section swaps photos instead of tinting; add-to-cart without flight |

`PerformanceMonitor` (bounds 45–60 fps, flipflops 3): first `onDecline` → dpr 1, dust halved,
ContactShadows off; on `onFallback` (flipflops exceeded) → switch to `static` and unmount the canvas.
`AdaptiveDpr pixelated={false}` on.

**Reduced motion** (`prefers-reduced-motion: reduce`, via `motion`'s `useReducedMotion`): the canvas
stays (it is not motion by itself) but: no spring smoothing, no interpolation: the rig **snaps** to
the section's keyframe pose when a section crosses the viewport centre (IntersectionObserver), with
`frameloop="demand"` and one `invalidate()` per change; explode shown fully open (e = 1) in the
explode section; swoosh fully drawn; dust static (no drift) at 0.25 density; idle float off; all
callouts and badges of a section visible at once (desktop leader lines static; phones show all
callouts stacked as a list instead of the stepped panel); DOM entrances are opacity-only ≤150 ms; no
add-to-cart flight. The page reads completely with zero movement.

Poster stills for the static tier: `client/public/posters/{hero,callouts,explode,endure,colour-black,colour-olive}.webp`,
≤ 120 KB each at 1440 wide, captured from the running app with a dev-only `?capture=<section>`
route that calls `gl.domElement.toBlob` after rendering that section's pose, then converted to WebP
with sharp (`scripts/posters.mjs`). Where a poster is not ready, the real product photo is the
fallback.

---

## 10. Performance budgets

Measured on `vite build` output and the production preview.

| Item | Budget | How to check |
|---|---|---|
| Initial JS for `/` (excluding the lazy 3D chunk), gzip | ≤ 250 KB | `vite build` report (gzip column) |
| 3D chunk (three + r3f + drei parts used + story), gzip | ≤ 320 KB | same |
| `shoe-mobile.glb` | ≤ 1.5 MB | `ls -l client/public/models` |
| `shoe-desktop.glb` | ≤ 4.0 MB | same |
| Hero poster | ≤ 120 KB | same |
| Fonts (Archivo variable woff2 latin + Mukta 400/600 devanagari+latin) | ≤ 250 KB total | network panel |
| Triangles in scene | ≤ 60k | `gl.info.render.triangles` in `?debug=perf` |
| Draw calls | ≤ 20 | `gl.info.render.calls` |
| Desktop scroll FPS (dev machine, full tier) | ≥ 50 fps sustained through the story | `?debug=perf` |
| CLS on `/`, `/shop`, `/product/g10-401` | < 0.1 | Lighthouse or Performance panel |
| LCP on `/` (Lighthouse mobile, simulated) | < 2.5 s target (poster is LCP) | Lighthouse, if available; else report "not measured" |
| Console | 0 errors, 0 React warnings, on every route | DevTools console |

Also: dispose geometries/materials/textures on unmount (ui-ux-pro-max three.js rule), one canvas
only, no per-frame allocations in `useFrame` (reuse vectors), images lazy and sized.

---

## 11. GLB compression pipeline (`client/scripts/build-model.mjs`, FRONTEND)

Input: `C:\goldstar-3d\_dl\shoe.glb` (path resolved from the repo root, `../_dl/shoe.glb` from
`client/`). Output: `client/public/models/shoe-desktop.glb` and `shoe-mobile.glb`. Uses
`@gltf-transform/core` (NodeIO with `ALL_EXTENSIONS` and `MeshoptEncoder` registered),
`@gltf-transform/functions`, `meshoptimizer`, `sharp`.

1. Read the GLB. Log nodes, meshes, materials, textures with sizes (sanity check against §9.2).
2. **Neutral base colour**: compute the mean luminance of the three diffuse textures with sharp
   `stats()`; take the lightest, convert to greyscale (`sharp().greyscale()`), `normalise()`, then
   `linear(a, b)` so mean ≈ 0.55 (140/255). Set it as `baseColorTexture` of material 0.
3. Remove `KHR_materials_variants` (dispose the extension), point the primitive at material 0,
   then `prune()` to drop the other materials and the two unused diffuse textures.
4. `dedup()`, `weld()`, `prune()`. No `simplify` (22.7k triangles is within budget).
5. Textures: `textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [N, N], quality })`
   with N = 2048 / quality 82 for desktop and N = 1024 / quality 78 for mobile. (KTX2 would need
   the external `toktx` binary; WebP via `EXT_texture_webp` is supported by three's GLTFLoader and
   keeps the pipeline pure Node. KTX2 is a later upgrade.)
6. `meshopt({ encoder: MeshoptEncoder, level: 'medium' })` (adds `EXT_meshopt_compression` +
   quantization).
7. Write both files; print their sizes; **exit 1** if mobile > 1.5 MB or desktop > 4 MB.
8. `npm run model` is idempotent; the outputs are committed so a fresh clone runs without the
   source GLB.

---

## 12. Work split

Both crewmates work **in parallel**. Neither edits the other's folder. Neither edits `docs\`.
Neither commits, pushes or deploys (the first mate commits after review).

### 12.1 BACKEND crewmate owns

`C:\goldstar-3d\package.json`, `package-lock.json` (final regeneration), `.gitignore`, `.nvmrc`,
`README.md`, and everything in `C:\goldstar-3d\server\`.

Order of work:
1. **B0 (first, ~10 min):** delete stale root `package.json`, `package-lock.json`, `node_modules\`;
   write root `package.json` (§1.2), `.gitignore`, `.nvmrc`. Create `server/package.json`. Run
   `npm install` at the root once. (The frontend may already be writing `client/`; that's fine.)
2. Env + config validation, db connection, app skeleton, error format, health.
3. Models + indexes, zod schemas.
4. Auth (register/login/logout/me, cookie, rate limit), middleware.
5. Products + categories + quote; orders; admin routes.
6. Seed (live + snapshot fallback, admin upsert); commit the snapshot JSON.
7. Tests (§3.7). README (install, `.env` setup, `npm run seed`, `npm run dev`, demo admin via env).
8. Final: from a clean state run `npm install` at the root (after the frontend's `client/package.json`
   exists) so the lockfile covers both workspaces, then `npm test -w server`.

### 12.2 FRONTEND crewmate owns

Everything in `C:\goldstar-3d\client\`.

Order of work:
1. Scaffold `client/` (Vite React), `client/package.json`, `vite.config.js` with the `/api` proxy.
   If the root `package.json` with workspaces does not exist yet, wait for it before the first
   `npm install` (check every couple of minutes; meanwhile write code). Install with
   `npm install <pkgs> -w client` from the root. If npm reports a lockfile conflict or `EBUSY`,
   wait a minute and re-run; never edit the root `package.json`.
2. Theme + tokens, shell (AppBar, concept note, footer, cart drawer), mock API (§6) so everything
   renders without the server.
3. Model pipeline (§11) → GLBs. Confirm toe direction, tune anchors (`?debug=anchors`).
4. Home story: DOM sections first (static, readable with no canvas), then the canvas, timeline,
   callouts, explode, swoosh, colour switch, add-to-cart flight, tiers and reduced motion.
5. Shop, Product, Checkout, Auth, Account, Admin.
6. Tests: `sampleTimeline` (poses at every keyframe, monotonic p, clamping outside 0–1), cart store
   (add/merge/limits/count), `formatNPR`, `canTransition` mirror if used client-side, and a smoke
   render of each route with the mock API.
7. Run against the real server (`npm run dev` at root) and fix any contract mismatch on the client
   side; report any server bug to the first mate rather than editing `server/`.
8. Gates: tasteskill `lint.mjs` on `client/src` and `inspect.mjs` on the production preview for `/`,
   `/shop`, `/product/g10-401` (and `--app` for `/admin/orders`); fix every FAIL.

### 12.3 The contract is the interface

If the frontend needs a field the contract does not have, it does **not** invent an endpoint; it
lists the need in its handback. If the backend finds the contract unworkable, it implements the
nearest compatible shape and lists the deviation. The lead reviewer resolves both.

---

## 13. Definition of done

### 13.1 BACKEND: done when all are true

- [ ] Stale Astro root files are gone; root `package.json` matches §1.2; `.gitignore` matches §1.5.
- [ ] `npm install` at the root succeeds from a clean clone (no `node_modules`), Node 24.
- [ ] `server/.env.example` matches §1.4; real `.env` is git-ignored; server refuses to start with a
      short `JWT_SECRET` (readable error, exit code ≠ 0).
- [ ] `npm run seed` succeeds live, `npm run seed -- --offline` succeeds from the committed snapshot;
      both print `products=5` and an admin line; running twice changes nothing (idempotent).
- [ ] MongoDB has the indexes of §2 (`db.products.getIndexes()` etc. listed in the handback).
- [ ] `npm run dev -w server` serves on 5050; `GET /api/health` → `{ ok: true, db: "up" }`.
- [ ] Every route in §3.3 responds with the shapes in §3.2 (handback includes one `curl` per route
      with status code, using a cookie jar for auth routes).
- [ ] Error bodies match §3.1 for 400/401/403/404/409/415/429.
- [ ] Security items of §3.6 are all in place (handback ticks each).
- [ ] `npm test -w server` passes, covering all 12 items of §3.7, with no open handles.
- [ ] `git grep` shows no secrets; no `console.log` of passwords or tokens.
- [ ] README explains setup in ≤ 10 steps.
- [ ] Nothing outside the backend-owned paths was modified.
- [ ] MAY: `NODE_ENV=production npm start` serves `client/dist` with the CSP of §3.6 and an SPA
      fallback (only if `client/dist` exists; never builds the client itself).

### 13.2 FRONTEND: done when all are true

- [ ] `npm run dev` (root) shows the client on 5173 talking to the server through the proxy;
      `VITE_USE_MOCK=true npm run dev -w client` works with the server off.
- [ ] `npm run build` succeeds with no warnings about chunk errors; budgets of §10 met for JS, GLB,
      poster (handback pastes the build size table and `ls -l public/models public/posters`).
- [ ] `npm run model` regenerates both GLBs within budget and exits 0.
- [ ] Every route in §4.2 renders against the real server, with no console errors or React
      warnings, at 1440, 768 and 390 px; **no horizontal overflow at 390 px**.
- [ ] Home story matches §9.5 at every keyframe: handback includes screenshots at s = 0, 100, 250,
      300, 470, 600, 750, 900 (desktop) and s = 0, 250, 470, 750 (390 px phone), plus the
      add-to-cart flight mid-way (t ≈ 1000 ms) and after landing (badge incremented).
- [ ] Colour switch tints the shoe and swaps price (NPR 3,400 / 2,775), Nepali name, photos and
      sizes; works from the keyboard.
- [ ] Add-to-cart: sequence of §9.8 plays, badge increments on landing, cart persists on reload,
      Snackbar + aria-live announcement fire.
- [ ] Reduced motion (DevTools emulation) shows static poses with all callouts visible and no
      flight; static tier (force with `?tier=static`) shows photos/posters with all callouts and no
      canvas.
- [ ] Checkout places a COD order against the real server and shows the confirmation; field errors
      from the server land on the right fields.
- [ ] Login/register/logout work; account shows the new order; user can cancel a `placed` order.
- [ ] Admin: edit G10-401 Olive price → the Home colour section shows the new price after reload;
      edit a callout title → the Home callout text changes; move an order placed → confirmed →
      shipped → delivered; invalid transitions are not offered.
- [ ] Concept note visible on every route at every scroll position; credits block present and
      correct.
- [ ] tasteskill `lint.mjs client/src` and `inspect.mjs` on the production preview: 0 FAIL on `/`,
      `/shop`, `/product/g10-401`; `--app` 0 FAIL on `/admin/orders`; every WARN either fixed or
      defended in one sentence in the handback (the §5.8 overrides are the expected WARNs).
- [ ] `npm test -w client` passes (§12.2 step 6).
- [ ] FPS ≥ 50 on desktop full tier through the story (`?debug=perf` reading in the handback).
- [ ] Nothing outside `client/` was modified.

---

## 14. Handback format (both crewmates)

```
STATUS: done | blocked | partial
Files changed: (tree or list)
Commands run + results: install, test, build, seed, dev (paste the key lines)
DoD checklist: §13.x with each box ticked or explained
Deviations from SPEC: (each with reason)
Open questions / needs from the other side:
Screenshots: paths (frontend)
```

---

## 15. Assumptions (decided by the lead reviewer; flag to the first mate)

1. **Cart is client-side** and re-priced by the server (§2.3).
2. **Checkout requires an account** (guest checkout not supported) so every order has an owner and
   appears in order history. The cart itself works for guests.
3. **Delivery fee = 0** in data, with the line "Delivery fee confirmed by phone" — we do not invent
   Goldstar's shipping rates.
4. **9 Store API listings become 5 products** (grouped by model; G10-401 has Black and Olive
   colourways, G10 L2102 has Pink and Grey-Pink). AX-1/A is "Olive" per its attribute despite its
   "coffee" slug. AX and AX-3 colours share one price and one image set.
5. **Product photos are hotlinked** from goldstarshoes.com (public data, pitch only), not copied
   into the repo.
6. The storyboard's **"Water repellent" badge is dropped** (not a published Goldstar spec) and
   replaced by **"Arch support"** (published). Badges are support, cushion (EVA), grip (rubber).
7. Storyboard's four swatches (with invented names) become the **two real colourways**: Black and
   Olive.
8. "High-density foam" is placed at the **collar** (Goldstar lists the material without a location;
   the captain's brief places it at the collar).
9. Nepali touches: wordmark गोल्डस्टार, colour names (कालो, जैतुनी), the footer monument. Other copy is
   English. Devanagari copy needs a native-speaker check before any public showing.
10. The vertical thumbnail rail shows **real G10-401 photos** of the selected colourway (not angle
    presets of the 3D stand-in), which also keeps the stand-in honest.
11. Textures ship as **WebP inside the GLB** (EXT_texture_webp), not KTX2, to avoid an external
    `toktx` binary; budgets still hold.
12. Explode is **whole shoe + three code slabs** because the GLB is one mesh; a part-split GLB later
    only needs `shoe.config.js` changes.
13. No search box, no wishlist, no reviews, no stock counts, no payment gateway, no email sending.
14. Order numbers `GS-YYMMDD-XXXX`; payment marked "paid" automatically when delivered.
15. Crewmates do not commit; the first mate commits after review on branch `prototype`.

---

## Addendum A (2026-11-04, after the backend review): contract details the frontend must follow

The backend is reviewed and these behaviours are final. They match the code under `server/`.

1. **Admin writes are strict.** `POST /api/admin/products` and `PATCH /api/admin/products/:id`
   reject unknown keys with `400 VALIDATION_ERROR`. Before sending a product from the edit form,
   strip the read-only fields: `id`, `slug` (PATCH only; it is required on POST), `priceFrom`,
   `priceTo`, `createdAt`, `updatedAt`, `source`. Send only the fields that changed. Arrays
   (`colourways`, `specCallouts`, `categories`, `shortSpecs`) are replaced whole.
2. **Empty optional values are `null`, not `""`.** Send `nameNe: null`, `series: null`,
   `position: null`, `badge: null` for "no value". An empty string fails validation (min length 1).
   `regularPrice` may be omitted; it then defaults to `price`. Image `alt` may be omitted (defaults to `""`).
3. **Responses carry explicit nulls**: `series`, `nameNe`, `phone`, `image`, `shipping.landmark`,
   `shipping.notes`, `statusHistory[].note` are `null` when empty (never missing). `customer` is
   `null` on an admin order whose user no longer exists.
4. **Order items include `productId`** (string or `null`), so "buy again" or links to the product page
   can use it.
5. `paymentMethod` on `POST /api/orders` may be omitted (defaults to `"cod"`); the client SHOULD still
   send `"cod"`. Any other value is `400`.
6. **Repeated query params are a `400`** (`?sort=a&sort=b`). Build query strings with one value per key.
7. `POST /api/orders/:id/cancel` cancels only a `placed` order, for admins too; admins cancel a
   `confirmed` order through `PATCH /api/admin/orders/:id/status`. The cancel body is optional.
8. Login and register have **separate** 10 / 15 min limits. A `429` carries `Retry-After` (seconds);
   show "Too many attempts. Try again in N minutes."
9. `details[]` never contains an empty `path` when field errors exist; a whole-form error (e.g. PATCH
   with no fields) comes back as one entry with `path: ""`, so show it in the form-level Alert.
10. Re-running the seed restores the 5 seeded products to the Store API data, which **overwrites admin
    edits** to those products. Do the DoD "admin edit shows on Home" check without re-seeding in between.


---

## Addendum B (2026-11-05): fix round + "Advanced upgrade"

Captain: "make it look more advanced and use every skill you have." The frontend crewmate does
**B.1 (review fixes) and B.3 (MUST upgrades) in one pass**, then B.4 (SHOULD) if time allows, in the
order listed. House rules still hold: no neon, no glass, no CSS gradients, no heavy bloom, no
preloader or gate, no custom cursor, no scroll hijacking, no overshoot on interface elements, and
every move has a reduced-motion equivalent (tasteskill motion.md §10). Perf budgets in §10 still hold,
and the 3D chunk must stay ≤ 320 KB gzip. That rules out `postprocessing` and
`@react-three/postprocessing` (+40–60 KB), so there is **no bloom and no depth of field**.

Tiers below: **D** = desktop/full, **M** = mid/lite, **S** = static.

### B.0 Contract change (backend, small)

`ProductSummary.colourways[]` gains `secondImage: Image | null`, the colourway's `images[1]`, so
Shop cards can swap photos on hover. Backend: `server/src/lib/serialize.js` `productSummary()`, plus
one test assertion. Frontend: the mock fixtures in `client/src/api/mock/` mirror it.

### B.1 Fixes from review gate #2 (MUST, all)

| ID | Sev | File(s) | Change | Accept when |
|---|---|---|---|---|
| FX1 | B | `client/scripts/build-model.mjs` (+ new `client/scripts/model-patches.json`) | **Remove third-party marks from the stand-in model.** Paint out the "///FOAM" sole lettering (lateral **and** medial side) and the heel-counter "///" emblem, plus any other printed mark you find on the tongue or pull tabs. Do it in UV space on all three textures. **baseColor**: fill each region with the surrounding sole/upper texture (sharp: extract a neighbouring strip, then composite it with a feathered 8–12 px mask), or a blurred median of the border. **normal**: set each region to flat `(128,128,255)` with the same feather, so the embossing disappears. **ORM**: same fill. Find the regions by dumping the textures to your scratchpad and locating the marks. Keep UV rectangles or polygons in `model-patches.json`. Rebuild both GLBs. | Zoomed screenshots of the sole (lateral and medial) and the heel at 1440 (s = 0, 470, 750, and the turntable at s = 760 and 790) show no letters or emblem. GLB budgets still hold. `npm run model` stays idempotent. |
| FX2 | M | `client/src/story/Sections.jsx` (callout list), `client/src/three/StoryScene.jsx` | Callout leader lines cross each other and run under the "High-density foam" text. Assign card slots by the anchors' projected screen y (top anchor → top card), re-sorted only when the section enters (no reshuffling mid-hold). End each line at the card's left edge, vertically centred on the title. Lines must not cross and must not pass behind any card text. | 1440 screenshots at s = 250 and 300 show four lines, none crossing, each ending at its own card. |
| FX3 | M | `client/src/story/Sections.jsx` `EndureSection` | Text window is wrong: it fades in at s 615–645, so the screen at s = 600 is empty (the real cause of part of the inspector's `empty-screens` FAIL). Use `inS [570, 600]`, `outS [650, 690]`, and add the B.3 U4 content. | s = 600 screenshot shows the h2, its sentence and the U4 tile beside the shoe. |
| FX4 | M | `client/src/three/timeline.js` `layoutKeyframes`, phone camera in `StoryScene.jsx` | On phones the shoe is about 55% of the width with a large empty band above the panel. Scale the phone shoe so it spans **80–90% of viewport width** at K0, K3, K5 and K8, centred in the space between the AppBar and the panel/text. Keep the sticky panel height. | 390 screenshots at s = 0, 250, 470 and 750: the shoe fills the band, with no empty band taller than about 15% of the screen. |
| FX5 | M | `client/src/three/ParticleBox.jsx` | At t ≈ 1000 the box reads as a cloud, and the lid points float as a loose swarm. See B.3 U5. | – |
| FX6 | m | `client/src/story/ColourSection.jsx`, `client/src/three/StoryScene.jsx` | The flight clock uses clamped frame delta, so on slow GPUs it stretches past 8 s and the safety timer lands it early. Advance the flight with real elapsed time (`performance.now()` deltas, each frame capped at 100 ms). Keep the safety-timer id in `useStory` and clear it on normal landing. | Two quick add-to-carts in a row behave; the badge increments on landing only. |
| FX7 | m | new `client/.gitignore` | Add `shots/` (the screenshots stay local). | `git status` does not list `client/shots/`. |
| FX8 | m | Home | The inspector WARNs `off-centre` (32 px vs 73 px at 1440) and `size-count` (10 sizes). Find the right-hand inset; it's probably the story's negative margin or the scrollbar. Cut Home to ≤ 6 type sizes (display, h2, price, h5, body1, caption; the footer monument is exempt). | WARN gone or defended in one line. |
| FX9 | m | handback | Include an Olive-colourway screenshot at s = 750 (tint check) and the 1440/390 screenshot set re-taken after all changes. | – |

### B.2 What reads flat now (from the 1440 and 390 screenshots)

1. **The shoe is black on black.** The silhouette dissolves into the ground (s = 0, 600, 750). The
   only edge light is a weak warm wash on the toe. This is the biggest flatness.
2. **The camera never moves**, so chapters feel like the same shot re-posed.
3. **The display type just fades.** It never *arrives*.
4. **Endure and Finale screens hold one line on an empty field** (inspector `empty-screens`).
5. **The add-to-cart box is unreadable mid-flight.**
6. **The product page is a good shop page, but nothing on it is "advanced".**

### B.3 MUST upgrades (biggest visual gain)

| ID | Upgrade | Files | Approach | Tier | Accept when |
|---|---|---|---|---|---|
| U1 | **Studio lighting that sculpts a black shoe** | `three/Lights.jsx`, `three/Shoe.jsx`, `three/shoe.config.js` (new `look` block) | Re-light as a product studio: (a) a large soft key Lightformer above-front-left (intensity ~2.0); (b) **two** narrow strip Lightformers behind left and right as rims (warm `#F0CF7A`, intensity 2.5–3), positioned so a thin highlight runs along the collar, heel and toe spring; (c) the fill dropped to 0.3 so the shoe keeps shape. Set `envMapIntensity` ~1.4 on the shoe material and `toneMappingExposure` 1.1. Keep `Environment resolution={256} frames={1}` (baked once, no per-frame cost). | D, M | At s = 0 and 750 the shoe's outline is readable against the ground in the screenshots, judged by eye. |
| U2 | **Fresnel gold edge** (the "rim light" the captain allowed) | `three/Shoe.jsx` (`onBeforeCompile` on the cloned material) | Add `rimColor` (`#E2B857`), `rimPower` (3.0) and `rimStrength` (0.35, set per chapter). In the fragment shader add `rimColor * pow(1.0 - saturate(dot(normal, viewDir)), rimPower) * rimStrength` to `totalEmissiveRadiance`. It is emissive-only, so there is no post pass and no bloom. Strength by chapter: hero 0.35, callouts 0.2 (so lines and dots read), explode 0.25, colour 0.3, flight 0.5 while in the box. Lite tier: × 0.8. | D, M | A thin gold edge is visible on the silhouette in hero and colour; it never spreads beyond the edge like a halo. |
| U3 | **Camera dolly and pointer parallax between chapters** | `three/timeline.js` (new `CAMERA` keyframes in the same table), `three/StoryScene.jsx` | Add camera keyframes `{ s, pos, lookAt, fov }`, eased the same way as the rig. Hero: [0, 0.4, 7.5], fov 35. Performance: dolly out to z 8.2. Callouts: dolly in to z 6.6 with lookAt biased to the shoe. Explode: pedestal up y +0.5 and look down. Endure: low angle y −0.1. Colour: z 7.0. Finale: crane up. Desktop only: pointer parallax ±0.12 world units on x/y with a critically damped follow (no overshoot), off during the flight and under reduced motion. `sampleTimeline` returns the camera too, and the tests cover it. | Dolly D, M; parallax D | Scrubbing between chapters shows a camera move, not only a pose change; the camera tests pass; no parallax on touch. |
| U4 | **Every story screen carries content** (fixes `empty-screens` and `few-pictures` honestly) | `story/Sections.jsx`, `story/StaticStory.jsx` | **Endure**: beside the h2, a 3-row list of the real materials it names, each with its spec line from the API (rubber outsole: durability and slip resistance; EVA midsole: bounce; metal eyelets: ruggedness), plus **one real G10-401 photo of the outsole** (the sole view in the Black image set) on the lit tile at ~28vw. **Performance**: a row of 4 real G10-401 photos (lit tiles, 1:1, ~11vw each) along the bottom of the screen, under the headline, never overlapping it. **Finale**: the Black and Olive colourway photos at ~22vw flanking the centred h2, both linking to the product. All are real Goldstar photos, so no captions saying what they are not. | D, M, S | `inspect.mjs` on the production preview shows no `few-pictures` and no `empty-screens` FAIL. |
| U5 | **A readable gold-particle box** | `three/ParticleBox.jsx` | Points sampled **70% on the 12 edges** (dense, size 1.2×) and 30% on the faces (size 0.7×, alpha 0.5), so the box reads as a wireframe drawn in dust. The lid is its own point group (4 edges + face) hinged on the back edge, visibly rotating closed. The gather converges with per-point delay **ordered along each edge**, so edges draw like a pen stroke. The fly leaves a 120-point trail (short-lived, alpha falling off over 250 ms). On landing, the burst is 0.3 units, synced with the badge bump. | D, M | Frames at t ≈ 450, 900, 1150 and 1400 (real-time clock, FX6) show a clear box, then a lid closing, then a box flying with a trail. |
| U6 | **Display type that arrives: masked line rise** | new `client/src/components/LineReveal.jsx`; used in `story/Sections.jsx`, `pages/Shop.jsx` h1, `pages/Product.jsx` h1 | Split each display heading into lines **after `document.fonts.ready`** (one span per line, wrapped in an `overflow: hidden` mask). Story h2s: the lines rise from `translateY(105%)`, **scrubbed by the same scroll MotionValue** (reversible), with 90 ms equivalent stagger. Hero h1: on-load masked rise, 800 ms expo, settled by 1.2 s, and painted at full opacity on the first frame (the mask starts only once JS runs). The h1 is never at opacity 0 in the DOM (fixes the inspector `no-title`). Screen readers get the unsplit text (`aria-label` on the heading, line spans `aria-hidden`). Reduced motion: no split, a 150 ms opacity fade. | D, M, S (S: static, no split) | `inspect.mjs` shows 0 FAIL on `/`; the headline reads whole in every screenshot where its section is on screen. |
| U7 | **360° viewer + hotspots on the G10-401 product page** | new `client/src/three/ProductViewer.jsx` (lazy; reuses `Shoe.jsx`, `Lights.jsx`, `shoe.config.js`, the tint lerp), `pages/Product.jsx` | For `g10-401` only, add a **"Photos / 3D" ToggleButtonGroup** above the gallery (photos default). The 3D view is its own `<Canvas>` (the Home canvas is not mounted on this route, so there is still one renderer per page) at the gallery's 1:1 size. drei `OrbitControls` rotate-only: `enablePan=false`, polar 0.35–1.45 rad, distance 5.5–9, damping 0.08, auto-rotate 0.6 until the first interaction; keyboard ←/→ rotate 15° and +/− zoom. **Hotspots** (Switch "Show parts") project the 4 callout anchors and 3 slab anchors as 44 px buttons with a dot and a sentence-case label, which open the callout body in a Popover; no numbers. The colour radios drive the tint with the 600 ms material lerp. Caption: "3D: a stand-in sneaker. Photos: the real G10-401." `frameloop="demand"` with invalidate on interaction and auto-rotate; pause when the tab is hidden. | D, M (S and reduced motion: toggle hidden, photos only) | Drag, zoom, keyboard and hotspots work; the viewer shares the three/R3F chunk with Home (no second copy); Product route initial JS unchanged; 0 console errors. |
| U8 | **Spring badge and cart feedback** | `components/AppBar.jsx` | The badge number changes with a `motion` spring `{ stiffness: 500, damping: 40 }` (critically damped, **no overshoot**): scale 1 → 1.25 → 1 and a 180 ms colour flash to `goldLight`. The cart icon nudges 2 px on landing. Reduced motion: colour flash only. | D, M, S | Visible bump on every add; no bounce past 1.0. |

### B.4 SHOULD upgrades (if time remains, in this order)

| ID | Upgrade | Files | Approach | Tier | Accept when |
|---|---|---|---|---|---|
| S1 | **Material realism from the existing maps** | `three/Shoe.jsx` | Switch the cloned material to `MeshPhysicalMaterial`. **Clearcoat masked to the PU overlays**: in `onBeforeCompile`, derive `clearcoat = smoothstep(0.55, 0.3, roughness from ORM)` (the overlays are the glossy areas), clearcoat 0.6, clearcoatRoughness 0.25. Add a fabric **sheen** (0.4, sheenColor `#3A352C`) on the rough areas only (inverse mask). Raise `normalScale` to 1.25 so the canvas weave reads. | D only (lite keeps Standard) | Overlays catch a sharp highlight while the mesh reads soft; desktop FPS still ≥ 50 in `?debug=perf`. |
| S2 | **Gold dust with depth** | `three/GoldDust.jsx` | In the shader: size attenuation `gl_PointSize = size * (300.0 / -mvPosition.z)`; **depth fade** so alpha falls off beyond z −4 and near the camera (no particle crosses a heading at full alpha); 8% of particles become slow large bokeh discs (alpha 0.15); slight twinkle via `sin(uTime + seed)` on alpha (stops under reduced motion). Same counts (1500 / 600). | D, M | Dust reads as having depth; same draw calls. |
| S3 | **Chapter index (where am I)** | new `story/ChapterNav.jsx` | Desktop only: a fixed list at the right margin, vertically centred, with the 7 chapter names in 14px body face, ink secondary; the active one gold with `aria-current="true"`. Each is a link to its `#story-*` anchor. **No hairline bar, no ticks, no numbers** (tasteskill: plain words instead of progress rails). It hides over the footer and on phones. | D | Keyboard reachable; active state follows the scroll; inspector passes. |
| S4 | **Route transitions** | `components/Layout.jsx` | `AnimatePresence mode="wait"` around the outlet: enter opacity 0→1 + y 12→0 in 240 ms ease-out; exit opacity → 0 in 160 ms. Not on Home ↔ story anchors. Move focus to the new page's h1 after the enter (`tabIndex=-1`). Reduced motion: opacity only, 120 ms. | D, M, S | Back/forward still restore the scroll; no flash of unstyled content. |
| S5 | **Shop card hover** | `pages/Shop.jsx`, `components/ProductPhoto.jsx` | Hover/focus-visible: crossfade to `secondImage` (240 ms) and scale the photo to 1.03 inside its mask (400 ms ease-out); the name gets a 2 px underline. **No tilt and no light sweep**: the sweep is a moving gradient (banned) and tilt reads as a gimmick. No hover effect on touch. | D, M | Works with keyboard focus too. |
| S6 | **Admin polish (app-screen rules)** | `pages/admin/AdminOrders.jsx`, `AdminProducts.jsx` | Sticky table headers (`stickyHeader`), an **inline status Select in each order row** (only allowed next statuses; optimistic update with rollback and a Snackbar on 409), row hover surface2, tabular figures, a compact density toggle, and skeleton rows while loading. Empty states with one action ("No orders yet. View the shop."). | D, M | Status change from the table works and rolls back on error; the header stays visible on scroll. |
| S7 | **Form micro-interactions** | `pages/Checkout.jsx`, `Login.jsx`, `Register.jsx` | Validate on blur (not on every key), show a quiet valid state for the phone field, keep errors under the field, and add a 140 ms press scale on submit. Keep the existing loading state. | D, M, S | ui-ux-pro-max form rules still hold (labels, `aria-describedby`, focus first invalid field). |

### B.5 Considered and cut (with reasons)

- **Selective bloom and depth of field**: needs a post-processing pass, which costs the 3D budget (+40–60 KB) and ~25% GPU on mid phones, and the captain banned heavy bloom. U2's emissive fresnel gives the gold edge without it.
- **Branded intro / loader**: tasteskill house rule (no preloader; the first frame must be readable). The poster → canvas crossfade plus U6's hero line rise already make the entrance.
- **Magnetic buttons, custom cursor**: house rule (system cursor); magnetic pull fights touch and keyboard and adds nothing a press state doesn't.
- **Card tilt and light sweep**: the sweep is a moving gradient (banned) and tilt is a gimmick; S5 replaces them.
- **Scroll progress bar**: house rule (no hairline progress rails); S3 is the house version.

### B.6 Checks to re-run before handing back

1. `npm test -w client`: keep all 45 tests and add tests for the camera keyframes, the flight real-time clock and `LineReveal` (full text in the DOM and as the accessible name).
2. `npm run model`: both GLBs within budget, with the FX1 zoom screenshots attached.
3. `npm run build -w client`: paste the size table. Initial JS for `/` ≤ 250 KB gzip (now 244: U6, U8 and S3 must fit, so keep them in the Home chunk where possible). StoryCanvas ≤ 320 KB gzip (ProductViewer shares it, never duplicates three).
4. tasteskill `lint.mjs client/src` (0 FAIL), `inspect.mjs` on `vite preview` for `/`, `/shop` and `/product/g10-401` (**0 FAIL**, WARNs defended), and `inspect.mjs --app` for `/admin/orders`.
5. Re-take the screenshots:
   - at 1440: s = 0, 100, 250, 300, 470, 600, 750 (Black), 750 (Olive), 900;
   - at 390: s = 0, 250, 470, 750;
   - the flight at t ≈ 450, 900, 1150 and 1400, and after landing;
   - reduced motion (3 shots) and the static tier (2 shots);
   - the product page 3D view with hotspots on, at 1440 and 390.
6. A keyboard pass on the product 3D viewer and the chapter index, and a reduced-motion pass on everything in B.3 and B.4.
7. 0 console errors on every route; no overflow at 390.

---

## Addendum C (2026-11-06): review gate #3 fix list (frontend, minimal)

| ID | Sev | File(s) | Change | Accept when |
|---|---|---|---|---|
| C1 | M | `client/src/pages/Home.jsx` / `components/Layout.jsx` / `components/Footer.jsx` | About one screen of empty ground sits **below the footer**: the inspector's screen 12 is blank except the chapter index, and the page is 10,683 px at a 900 px viewport. Remove the trailing space so the document ends at the footer's bottom edge (check min-heights, the story wrapper, and any spacer after `<footer>`). | The last 1440 screenshot shows the footer with nothing below it; the ChapterNav is hidden there. |
| C2 | M | `client/src/story/ChapterNav.jsx`, `client/src/story/Sections.jsx` (layer badges, callout cards) | At s = 470 the layer-badge text ("…cushioned footbed.") runs into the chapter index ("Adventure", "Colour"). Reserve the index's column: cap the badge/callout column's right edge at `100vw − 32px − 160px` on desktop, or hide the index while a held stage's cards are visible. Nothing may overlap the index. | 1440 shots at s = 250, 300, 470 and 490 show no text touching the index. |
| C3 | M | `client/src/theme/theme.js` (`MuiBackdrop`) | The scrim override also paints **invisible** backdrops, so every Popover, Menu and Select (product hotspots, admin status selects, sort) dims the whole page. Change it to `root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: t.scrim } }`. | Opening a hotspot Popover or a Select leaves the page undimmed; Drawer and Dialog still dim. |
| C4 | M | `client/src/pages/admin/AdminOrders.jsx` `StatusCell` | Choosing **Cancelled** inline bypasses the confirm Dialog required by §4.3. Open the same confirm Dialog before the PATCH; Cancel in the dialog leaves the row unchanged. | Cancel from the table asks first; the other statuses stay one-step. |
| C5 | m | `client/src/story/ColourSection.jsx` `PhotoRail` | After a colour switch the rail shows blank tiles while lazy thumbs load (seen in `1440-750-olive.jpg`). Load the rail thumbs eagerly (6 × 88 px) and prefetch the other colourway's thumbs on idle. | The Olive switch shows its photos immediately on the live preview. |
| C6 | m | `client/src/components/LineReveal.jsx` | `motion.create(Typography)` is called inside render, which re-creates the component (and remounts the heading) every render. Hoist it to module scope. | No remount on re-render (React DevTools or a test). |
| C7 | m | `client/src/story/Sections.jsx` (Performance photo row) | At s = 100 the four photos read as about 40% dimmed. Make sure they settle at full opacity on the lit tile once the section is in view. | s = 100 screenshot shows full-strength photos. |

Re-run before handback: `npm test -w client`, `npm run build -w client` (initial `/` must stay ≤ 250 KB gzip; it is 249.2 now), tasteskill `inspect.mjs` on `/`, and screenshots of the affected frames only (C1–C3, C5, C7) plus the 390 set.
