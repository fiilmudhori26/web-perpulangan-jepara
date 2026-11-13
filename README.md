# SantriFlow

Full-stack web app for managing **pondok pesantren** (Islamic boarding school) homecomings ("pulang pergi") and student finance. It exposes a JWT-protected admin dashboard plus a public portal for guardians (wali) to track their child's status and balance.

> Live demo: <https://web-perpulangan-jepara.vercel.app>

## Features

- **Authentication** — email/password login with JWT, protected admin routes.
- **Student management** — list, detail, and search santri (students).
- **Homecoming (pulang pergi)** — track departure/return per period, with ×2 fee logic for round trips.
- **Finance** — payments, income/expense records, balance tracking.
- **Periods** — manage academic/homecoming periods.
- **Reports** — financial reports and PDF/Excel export.
- **Public wali portal** — guardians can view their child's homecoming & balance without logging in.
- **Settings** — brand/config management.

## Tech Stack

- **Backend** — Node.js + Express 4, PostgreSQL (`pg`), JWT (`jsonwebtoken`), `bcryptjs`, `uuid`, `cors`, `dotenv`
- **Frontend** — React 19 + Vite 8 + Tailwind CSS v4 + React Router v7 + Axios + Heroicons + jsPDF/xlsx (export)
- **Database** — PostgreSQL (Neon-compatible connection string via `DATABASE_URL`)

## Project Structure

```
backend/          # Express API (src/index.js entry)
  src/
    routes/       # auth, students, homecomings, payments, finance, periods, config, public
    middleware/   # JWT auth
    config/       # DB + brand settings
  src/seed.js     # seed data
web/              # React + Vite frontend
  src/
    pages/        # AdminDashboard, StudentList, Homecoming, Finance, PaymentList, ...
    api/          # Axios API clients
    context/      # AuthContext, BrandContext
    components/   # Layout, DataTable, RupiahInput, ...
```

## Local Development

```bash
# install both sides
npm run install:all

# backend
cd backend && cp .env.example .env   # fill DATABASE_URL, JWT_SECRET
npm run dev                          # http://localhost:5000 (or configured port)

# frontend
cd web && npm run dev                # http://localhost:5173
```

### Environment (backend `.env`)

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret for signing tokens
- `PORT` — API port

## Scripts (root)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run backend in dev mode |
| `npm run build` | Build frontend |
| `npm start` | Start backend |
| `npm run seed` | Seed database |
| `npm run install:all` | Install backend + frontend deps |

## Deploy

- Backend + DB: any Node/Postgres host (e.g. Render/Railway + Neon)
- Frontend: Vercel (build from `web/`)

Live: <https://web-perpulangan-jepara.vercel.app>

## Author

fiilmudhori26 — <https://github.com/fiilmudhori26>
