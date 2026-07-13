# Rasmussen Recipes

A social, Instagram-style recipe app: a photo-forward feed where every post
is also a fully structured, cookable recipe — built around preserving family
recipes and the stories behind them.

See [GAMEPLAN.md](./GAMEPLAN.md) for the product vision, architecture, and
phased roadmap.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + [daisyUI](https://daisyui.com) 5
- PostgreSQL + [Prisma](https://www.prisma.io)
- Vitest + Testing Library

## Getting started

```bash
cp .env.example .env       # configure DATABASE_URL
npm install                # also runs `prisma generate`
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With Docker (app + Postgres)

```bash
docker compose up
```

The dev server runs on port 3000 and Postgres on 5432. Apply migrations with:

```bash
npm run db:migrate
```

## Scripts

| Command              | What it does                         |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the dev server                 |
| `npm run build`      | Production build                     |
| `npm run lint`       | ESLint                               |
| `npm run typecheck`  | TypeScript type checking             |
| `npm test`           | Run the Vitest suite once            |
| `npm run format`     | Format everything with Prettier      |
| `npm run db:migrate` | Create/apply Prisma migrations       |
| `npm run db:studio`  | Browse the database in Prisma Studio |

## Production image

The `Dockerfile` builds a multi-stage production image using Next.js
standalone output:

```bash
docker build -t rasmussen-recipes .
docker run -p 3000:3000 -e DATABASE_URL=... rasmussen-recipes
```

## CI

GitHub Actions runs lint, typecheck, tests, Prisma schema validation, and a
production build on every push to `main` and every pull request.
