# Scorched Quarto Press

A bookstore storefront + admin dashboard, split into two processes:

- **`/client`** — Vite + React (JS/JSX) SPA, storefront/account/admin UI.
- **`/server`** — Express (JS, ESM) REST API + SSE + ABA PayWay integration.

## Repo layout

```
client/     Vite + React SPA (react-router-dom, @tanstack/react-query, Tailwind, shadcn/ui)
server/     Express API (auth, catalog, checkout/PayWay, account, admin, SSE)
public/     Shared static assets served by the API (book covers, imprint logos)
```
