# Deploying: Cloudflare Pages + Render + MongoDB Atlas

```
Browser ──► Cloudflare Pages (static site + /api proxy function)
                 │  /api/*  (same origin, so the login cookie stays first-party)
                 ▼
            Render web service (Express API)  ──►  MongoDB Atlas (free M0)
```

All three have a free tier. Do the steps in this order, because each one needs a value from the step before.
Throughout, replace `<...>` with your own values. Never paste passwords into git.

## 1. MongoDB Atlas (database)

1. Create an account at <https://cloud.mongodb.com> and a **free M0** cluster (any region near you / near Render's region).
2. **Database Access** → Add New Database User → password auth, e.g. user `goldstar`, a long generated password, role *Read and write to any database*. Keep the password; avoid `@ : / ?` in it (or URL-encode them).
3. **Network Access** → Add IP Address → **Allow access from anywhere (`0.0.0.0/0`)**. Render's free tier has no fixed IP, so this is required. The database password is what protects it.
4. **Database** → Connect → Drivers → copy the `mongodb+srv://...` string and put the database name `goldstar` before the `?`:

   ```
   mongodb+srv://goldstar:<password>@<cluster>.mongodb.net/goldstar?retryWrites=true&w=majority
   ```

   This is your **ATLAS_URI**.

## 2. Copy the local database to Atlas

The local data (5 products, 1 admin, 0 orders) is in `mongodb://127.0.0.1:27017/goldstar`. Local MongoDB must be running.

```powershell
cd server
$env:SOURCE_URI = "mongodb://127.0.0.1:27017/goldstar"
$env:TARGET_URI = "<ATLAS_URI>"
node scripts/copy-db.mjs --dry-run   # prints the counts, writes nothing
node scripts/copy-db.mjs             # copies documents + indexes
```

- It refuses to run if the Atlas database already has documents; add `--force` only if you really want to overwrite matching `_id`s.
- The source is only read. Nothing is ever deleted.
- The admin account is copied too, so you log in with your existing local admin email and password.

## 3. Render (API)

1. Push the repo to GitHub (the Blueprint is read from the branch you pick, normally `main`; `render.yaml` must be on it).
2. Render dashboard → **New → Blueprint** → connect the GitHub repo → it finds `render.yaml` (service `goldstar-api`, free plan).
3. Fill in the two prompted variables:
   - `MONGODB_URI` = the **ATLAS_URI** from step 1.
   - `CLIENT_ORIGIN` = anything valid for now, e.g. `https://goldstar-3d.pages.dev` (you set the real value in step 5).
   - The rest is preset: `NODE_ENV=production`, `TRUST_PROXY` (Cloudflare + private + loopback address ranges, see render.yaml), `COOKIE_SECURE=true`, `JWT_SECRET` (generated), Node 24.
4. Apply. Wait for the first deploy, then open `https://<service>.onrender.com/api/health`. You should see `{"ok":true,"db":"up"}`.
   Note this URL: it is your **API_ORIGIN** (just the origin, no `/api`).

Free tier note: the service sleeps after ~15 minutes without traffic, and the first request afterwards takes ~30-50 s to wake it. The proxy waits up to 65 s for it. The site's own 15 s request timeout can show "Can't reach the server" once on that first visit; a retry or reload works.

## 4. Cloudflare Pages (site + proxy)

`wrangler` is not in `package.json`; it runs through `npx`.

```powershell
cd client
npx wrangler@4 login                                   # opens the browser, approve once
npx wrangler@4 pages project create goldstar-3d --production-branch main
npm run build
npx wrangler@4 pages deploy dist --project-name goldstar-3d
```

The deploy prints the site URL, `https://goldstar-3d.pages.dev` (or similar). `wrangler.toml` already sets the project name and the `dist` output; `functions/api/[[path]].js` is picked up automatically as the `/api` proxy.

Set the proxy target (do this **before** the site works end to end):

```powershell
npx wrangler@4 pages secret put API_ORIGIN --project-name goldstar-3d
# paste: https://<service>.onrender.com   (no trailing /api)
```

Or in the dashboard: Workers & Pages → goldstar-3d → Settings → Variables and Secrets → add `API_ORIGIN` for Production. Secrets and variables apply to the **next** deployment, so redeploy afterwards:

```powershell
npx wrangler@4 pages deploy dist --project-name goldstar-3d
```

Do not put `API_ORIGIN` in `[vars]` of `wrangler.toml` unless you want the file to be the source of truth (it then overrides the dashboard).

## 5. Point the API at the site

Render → goldstar-api → Environment → set `CLIENT_ORIGIN` to the exact Pages URL (scheme + host, no trailing slash; several allowed, comma-separated, e.g. a custom domain too). Save; Render redeploys.

## 6. Verify

1. `https://<pages-url>/api/health` returns `{"ok":true,"db":"up"}` (this goes through the proxy).
2. Open the site: the 5 products appear; deep links work (reload `/g10`, a product page, `/admin/products`).
3. Log in at `/admin` with the admin from your local DB. DevTools → Application → Cookies: `gs_token` is set on the Pages host, `HttpOnly`, `Secure`.
4. Place a test order as a customer, check it appears in admin → Orders, then delete or cancel it there.
5. Rate limit sanity: 11 wrong logins in a row should give a "Too many attempts" message **for you only**. TRUST_PROXY is a list of trusted address ranges (render.yaml), not a hop count: a hop count cannot be right for both proxied and direct requests on Render. If Cloudflare publishes new ranges (https://www.cloudflare.com/ips/), add them.
6. Stop the API (Render → Suspend) and reload the site: it shows the "Can't reach the server" state, not a blank page. Resume it afterwards.

## Updating later

- Site: `cd client; npm run build; npx wrangler@4 pages deploy dist --project-name goldstar-3d`.
- API: push to the branch Render watches (auto-deploy is on).
- A new Pages variable only takes effect on the next `pages deploy`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Every page shows "Can't reach the server" | `API_ORIGIN` unset/wrong on Pages (the proxy answers 502), or the Render service is asleep/failed. Check `<render-url>/api/health` directly. |
| Login succeeds but you are logged out immediately | `COOKIE_SECURE` is not `true` on Render, or the site is being opened over `http`. Use the `https://` Pages URL. |
| Browser console CORS error | `CLIENT_ORIGIN` on Render does not exactly match the site URL. |
| Render deploy fails at start | `MONGODB_URI` wrong, or Atlas Network Access does not allow `0.0.0.0/0`. Logs show "Could not connect to MongoDB". |
| `wrangler pages dev dist` for local testing | `npx wrangler@4 pages dev dist --port 5196 --binding API_ORIGIN=http://localhost:5050` (run from `client/`). |
