# Goldstar Shoes Nepal: concept prototype

Concept prototype. Not an official Goldstar site. A MERN shop with a scroll-driven 3D story for
the G10-401 trek shoe: Express 5 + MongoDB 8 API (`server/`) and a React 19 + Vite client (`client/`).
Cash on delivery only; no real orders are fulfilled.

Requirements: Node 24 (`.nvmrc`), MongoDB running locally on `mongodb://127.0.0.1:27017`.

## Setup (7 steps)

1. Install everything from the repo root:
   ```
   npm install
   ```
2. Create the server env file and fill in two values:
   ```
   cp server/.env.example server/.env
   ```
   - `JWT_SECRET`: at least 32 random characters. Generate one with
     `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
   - `SEED_ADMIN_PASSWORD`: 12 or more characters. This is the password of the demo admin
     (`SEED_ADMIN_EMAIL`, default `admin@goldstar.test`). `server/.env` is git-ignored; never commit it.
3. Seed the catalogue and the admin account (5 products, 11 colourways):
   ```
   npm run seed
   ```
   No internet? `npm run seed -- --offline` uses the committed snapshot
   (`server/src/seed/data/woo-products.json`). Running it again changes nothing.
   `--reset` deletes all products first (never users or orders). Re-seeding restores the seeded
   products to their Goldstar values, so admin edits to those five are overwritten.
4. Start the API (port 5050) and the client (port 5173) together:
   ```
   npm run dev
   ```
   Or just the API: `npm run dev -w server`. Check it: `curl http://localhost:5050/api/health`
   returns `{"ok":true,"db":"up"}`.
5. Open http://localhost:5173. Log in to `/admin` with the seeded admin email and password.
6. Run the server tests (uses the separate `goldstar_test` database, dropped afterwards; never the dev data):
   ```
   npm test -w server
   ```
7. Optional production-style run: build the client, then `NODE_ENV=production npm start`. The server
   then also serves `client/dist` with the CSP from the spec (it never builds the client itself).

## Other commands

| Command | Does |
|---|---|
| `npm run build` | Builds the client |
| `npm test` | Server tests, then client tests |
| `npm run model` | Rebuilds the 3D model files (client) |
| `npm start` | Runs the API without file watching |

## Server environment (`server/.env`)

See `server/.env.example` for every variable. The server refuses to start (readable message, exit
code 1) when `JWT_SECRET` is missing or shorter than 32 characters, `MONGODB_URI` is not a MongoDB
URL, or `PORT` is not a number. Tests do not read `.env`; they use `MONGODB_URI_TEST`
(default `mongodb://127.0.0.1:27017/goldstar_test`) and refuse to run against a database whose name
does not end in `_test`.

## API at a glance

Base path `/api`, JSON only, errors shaped `{ "error": { "code", "message", "details?" } }`.
Auth is an httpOnly cookie (`gs_token`); the client calls relative URLs and Vite proxies `/api`
to port 5050, so the cookie is first-party. Full contract: `docs/SPEC.md` section 3.

## Credits

3D stand-in sneaker: "Materials Variants Shoe" by Shopify, CC BY 4.0. Product photos and prices
come from goldstarshoes.com's public Store API (hotlinked, for this pitch only).
