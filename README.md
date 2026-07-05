# Scorched Quarto Press

A bookstore storefront + admin dashboard, split into two processes:

- **`/client`** — Vite + React (JS/JSX) SPA, storefront/account/admin UI. Runs on `http://localhost:5173`.
- **`/server`** — Express (JS, ESM) REST API + SSE + ABA PayWay integration. Runs on `http://localhost:4000`.

## Getting started

Install dependencies for each package separately:

```bash
cd client && npm install
cd ../server && npm install
```

Copy/create env files (see `client/.env` and `server/.env` for the required variables — Firebase, MySQL, SMTP, PayWay credentials).

Run both dev servers side by side, in two terminals:

```bash
cd server && npm run dev   # http://localhost:4000
cd client && npm run dev   # http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## Repo layout

```
client/     Vite + React SPA (react-router-dom, @tanstack/react-query, Tailwind, shadcn/ui)
server/     Express API (auth, catalog, checkout/PayWay, account, admin, SSE)
public/     Shared static assets served by the API (book covers, imprint logos)
scripts/    One-off Node scripts (seeding, admin creation) — read env from server/.env
```

## Payments

See `PAYWAY.md` for ABA PayWay sandbox integration details.
