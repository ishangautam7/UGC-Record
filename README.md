# UGC-Record

Simple records app with an Express API and a Next.js frontend.

## Prerequisites

- Node.js 18+ recommended
- PostgreSQL (for the API)

## Backend (API)

```bash
npm install
```

Create a `.env` file based on `.env.example`, then run:

```bash
node server.js
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend runs on `http://localhost:3001`.

## Database

SQL schema and migrations live in `db/`. See scripts in `scripts/` for setup and seeding helpers.
