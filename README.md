# Mini ERP + CRM Operations Portal

Live Website : https://erp-crm-ochre-two.vercel.app

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, JWT |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| DB | PostgreSQL (Neon / Supabase — any standard Postgres works) |
| Deploy target | Backend → Render/Railway/Fly.io · Frontend → Vercel/Netlify |

See `/erp-crm-build-plan.md` (shared earlier in this conversation) for the
full design rationale and timeline this was built against.

## Project layout

```
backend/    Express API — see backend/src/modules/{auth,customers,products,challans}
frontend/   React admin UI — see frontend/src/pages
postman/    Postman collection covering every endpoint
```

Each backend module follows the same shape: `*.routes.ts` (wiring + role
guards) → `*.controller.ts` (thin HTTP layer) → `*.service.ts` (business
logic, the part worth reading) → `*.schema.ts` (Zod validation).

## 1. Local setup

### Backend

```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init   # creates tables in your Postgres DB
npm run seed                          # creates one login per role + sample data
npm run dev                           # http://localhost:4000
```

`DATABASE_URL` is a standard Postgres connection string — a Neon or Supabase
free-tier pooled connection string works without any extra configuration.

**Seeded logins** (password provided via `SEED_PASSWORD` env var)

| Role | Email |
|---|---|
| Admin | admin@wholesaleco.test |
| Sales | sales@wholesaleco.test |
| Warehouse | warehouse@wholesaleco.test |
| Accounts | accounts@wholesaleco.test |

### Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL, defaults to localhost:4000
npm install
npm run dev                # http://localhost:5173
```

## 2. Environment variables

**Backend (`backend/.env`)**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signing secret for auth tokens — generate with `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Token lifetime, defaults to `12h` |
| `PORT` | API port, defaults to `4000` |
| `CORS_ORIGIN` | Allowed frontend origin |

**Frontend (`frontend/.env`)**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the deployed/local API, e.g. `https://your-api.onrender.com/api/v1` |

## 3. Deployment

1. **Database** — create a free Postgres instance on Neon or Supabase. Copy the connection string.
2. **Backend** — push this repo to GitHub, create a new Web Service on Render (or Railway/Fly.io) pointing at `/backend`, set the build command `npm install && npx prisma generate && npm run build`, start command `npm run prisma:deploy && npm start`, and add the env vars above.
3. **Frontend** — create a new project on Vercel (or Netlify) pointing at `/frontend`, set `VITE_API_BASE_URL` to the deployed backend's `/api/v1` URL, and deploy.
4. After first deploy, run `npm run seed` once against the production `DATABASE_URL` (or via Render's shell) to create the four role logins. Ensure `SEED_PASSWORD` environment variable is set when running the seed script.

## 4. Architecture notes

- **Auth**: JWT issued on login, verified per-request by `authenticate` middleware; `requireRole(...)` middleware enforces the access matrix below on top of that.
- **Role access matrix**:

  | Action | Admin | Sales | Warehouse | Accounts |
  |---|---|---|---|---|
  | Customers write | ✅ | ✅ | read-only | read-only |
  | Products write | ✅ | read-only | ✅ | read-only |
  | Challans create/confirm/cancel | ✅ | ✅ | read-only | read-only |

- **Challan confirmation** (`challans.service.ts::confirmChallan`) is the core
  business rule: inside a single DB transaction, it re-checks every line
  item's stock, rejects the whole confirmation with a 409 and a per-item
  shortfall breakdown if anything is short, and otherwise decrements stock
  and writes a `StockMovement` per item before flipping the challan to
  `CONFIRMED`. Cancelling a `CONFIRMED` challan reverses the movement.
- **Challan items store a snapshot** (`productNameSnapshot`, `skuSnapshot`,
  `unitPriceSnapshot`) rather than only a `productId`, so a challan's record
  stays accurate even if the product is later renamed or repriced.
- **Challan numbering** is a gap-free per-year sequence backed by a
  row-locked `Counter` table (`CH-2026-0001`, …), updated atomically inside
  the same transaction as challan creation.
- **Pagination & search** are implemented consistently across `/customers`,
  `/products`, and `/challans` (`?page=&limit=&search=`).

## 5. Design notes (frontend)

The UI deliberately avoids a generic admin-template look: a navy/indigo +
amber/teal/rose palette tied to the domain's real states (draft, confirmed,
cancelled, low stock), Space Grotesk / IBM Plex Sans / IBM Plex Mono as the
type system, and a recurring "stamp" treatment for status pills — styled
like a mark on a shipping manifest rather than a soft SaaS badge, since this
is a tool for people who work with physical goods and paperwork.

## 6. Known limitations / assumptions

- No self-registration flow — users are seeded directly. Documented here
  rather than built, to keep scope inside the 48-hour window.
- Challan confirmation is **all-or-nothing**: if any single line item is
  short on stock, the entire confirmation is rejected rather than partially
  fulfilled. This was chosen for correctness and simplicity over partial
  fulfilment.
- The very first challan number issued in a new calendar year has a narrow
  theoretical race on the counter's initial `create`; every number after
  that is fully atomic via row-level locking on `UPDATE`.
- No PDF export or AWS S3 image upload — listed as bonus items in the brief
  and out of scope for the core deliverable.
- No automated test suite — validated via the Postman collection and manual
  QA across all four roles.

## 7. API documentation

Import `postman/ERP-CRM.postman_collection.json` into Postman. It includes
every endpoint, grouped by module, with a `{{baseUrl}}` variable and an
auth flow that automatically stores the JWT from `/auth/login` into
`{{token}}` for subsequent requests.
