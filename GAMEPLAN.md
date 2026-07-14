# Rasmussen Recipes — Analysis & Game Plan

**Vision:** A social, Instagram-style recipe app — a beautiful scrolling feed of recipe photos and videos, where every post is also a fully structured, cookable recipe. The twist that makes it special: it's built around _family_ — preserving heritage recipes, the stories behind them, and the people who passed them down.

---

## Part 1: Where the App Stands Today

### What exists

The project is a clean, early-stage scaffold — roughly "day one" of a Next.js app:

| Area      | Status                                                                   |
| --------- | ------------------------------------------------------------------------ |
| Framework | Next.js 15 (App Router) + React 19 RC + TypeScript                       |
| Styling   | Tailwind CSS 3 + DaisyUI (light/dark themes configured)                  |
| Pages     | Home hero, `/recipes`, `/families`, `/login`, `/signup`, `/user-profile` |
| Layout    | Shared `Navbar` (responsive, with mobile dropdown) + `Footer`            |
| Infra     | Dockerfile + docker-compose for local dev                                |
| Build     | ✅ Production build passes; all routes prerender statically              |

The page structure already hints at the right product shape: recipes, family groups, profiles, and auth are exactly the right first four nouns.

### What's missing (everything is a placeholder)

Every page body is an empty comment (`{/* Recipe content will go here */}`). Concretely, there is **no**:

- **Database or data model** — no recipes, users, families, or posts exist anywhere
- **Authentication** — Login/Signup are empty cards; no session handling
- **API layer** — no route handlers, no server actions
- **Image handling** — the core of an Instagram-style app; nothing for upload, storage, or optimized delivery
- **Feed** — no posts, likes, comments, follows, or saves
- **Search or discovery** of any kind
- **Tests, CI, or deployment pipeline**

### Technical debt to fix early (cheap now, expensive later)

1. **React 19 RC pin** — `react@19.0.0-rc-02c0e824-20241028` is a dated release candidate; React 19 is long since stable. Also `@types/react` is pinned to v18, mismatching React 19.
2. **Dockerfile runs `npm run dev`** — fine for local, but there's no production image (multi-stage build with `next build` + standalone output).
3. **Node 18 base image** — Node 18 is end-of-life; move to Node 22 LTS.
4. **No environment variable strategy** — needed the moment a database or storage bucket appears.
5. **DaisyUI 4** — v5 is current; upgrade before building real UI on it, since v5 changed theme syntax.
6. **`package.json` name typo** — `rasmussen_recipies` → `rasmussen_recipes` (cosmetic, but easy).

---

## Part 2: Product Vision — What "Most Incredible Recipe App Ever" Means

Instagram made photos social. This app makes **cooking** social. The core insight that differentiates it from AllRecipes (database-first) and Instagram (photo-first):

> **Every post is both beautiful AND cookable.** A post is a photo/video _plus_ structured ingredients, steps, timing, and servings — so anything you see in the feed, you can cook tonight.

And the family angle is the moat: nobody scrolls Instagram to find Grandma's æbleskiver recipe, and nobody opens AllRecipes to feel connected to their family. This app does both.

### The five pillars

1. **The Feed** — an infinite, gorgeous scroll of recipe cards (photo-forward, Instagram-style) from people and families you follow, plus a discovery feed.
2. **The Recipe** — structured, interactive recipes: scale servings, check off ingredients, step-by-step **Cook Mode** with timers and screen-wake.
3. **The Family** — private family groups, shared family cookbooks, recipe provenance ("Grandma Ruth's, since 1962"), stories and voice notes attached to recipes.
4. **The Kitchen Graph** — likes, comments ("I made this!" with photo), saves, collections, follows, remixes ("forked from Mom's version, made it gluten-free").
5. **The Magic** — AI features that feel like superpowers: snap a photo of a handwritten recipe card and it becomes a structured recipe; paste any recipe URL and import it; generate a shopping list from your week's saved posts.

---

## Part 3: Architecture Plan

### Recommended stack (builds on what's already here)

| Layer         | Choice                                                                                                                  | Why                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 15+ App Router (keep)                                                                                           | Already in place; server components are perfect for feed rendering                                               |
| Database      | **PostgreSQL + Prisma**                                                                                                 | Relational fits the social graph; Prisma gives type-safe queries end-to-end. Host on Neon/Supabase for zero-ops. |
| Auth          | **Auth.js (NextAuth v5)**                                                                                               | Free, self-owned, email + Google/Apple OAuth; families need real accounts                                        |
| Images/video  | **UploadThing or Cloudinary + `next/image`**                                                                            | Upload, transform (thumbnails, feed crops), and CDN delivery in one service                                      |
| Data fetching | Server Components + Server Actions; **TanStack Query** on interactive surfaces (feed infinite-scroll, optimistic likes) | Minimal client JS, snappy interactions                                                                           |
| Validation    | **Zod**                                                                                                                 | Shared schemas between forms, server actions, and AI extraction output                                           |
| Search        | Postgres full-text first; Typesense/Meilisearch when needed                                                             | Don't over-build early                                                                                           |
| AI            | **Claude API** (recipe-card OCR → structured recipe, URL import, ingredient parsing)                                    | Vision + structured output is exactly this use case                                                              |
| Deploy        | Vercel (app) + Neon (db)                                                                                                | Push-to-deploy; keep Docker for local parity                                                                     |
| Testing/CI    | Vitest + Playwright + GitHub Actions                                                                                    | Catch regressions before they hit the family                                                                     |

### Core data model

```
User ──< FamilyMember >── Family
User ──< Recipe (author)          Family ──< Recipe (optional family attribution)
Recipe ──< Ingredient (qty, unit, item, note, sortOrder)
Recipe ──< Step (text, image?, timerSeconds?, sortOrder)
Recipe ──< RecipeImage (url, width, height, isCover)
Recipe ──< Recipe (forkedFromId — the "remix" lineage)
Recipe: title, description, story, servings, prepMin, cookMin,
        difficulty, cuisine, tags[], visibility (public|family|private),
        provenance (originalAuthor, era, origin story)
Post = a Recipe published to the feed (recipes can exist unpublished)
User ──< Like >── Recipe        User ──< Comment >── Recipe (threaded)
User ──< Save >── Recipe        Save ──> Collection ("Weeknight", "Holiday")
User ──< Follow >── User        User ──< MadeIt >── Recipe (photo + rating + notes)
Notification (like, comment, follow, family-invite, made-it)
```

Key decisions baked in:

- **Ingredients and steps are structured rows, not a text blob** — this is what enables scaling servings, shopping lists, ingredient search, and AI features later. Non-negotiable from day one.
- **Visibility on every recipe** (`public` / `family` / `private`) — the family-heirloom use case demands it, and it's brutal to retrofit.
- **`forkedFromId`** — recipe lineage is the single most "incredible" social mechanic for a family recipe app: see how Aunt Linda's chili diverged from Grandma's.

---

## Part 4: The Phased Roadmap

### Phase 0 — Foundations (1–2 weeks of effort)

_Goal: a codebase you can build fast on._

- [x] Upgrade React 19 RC → stable; align `@types/react*` to v19; DaisyUI 4 → 5 (with Tailwind 3 → 4)
- [x] Node 22 base image; multi-stage production Dockerfile (`output: 'standalone'`)
- [x] Add Postgres to docker-compose; set up Prisma with the full schema above
- [x] `.env.example` + environment validation (Zod)
- [x] GitHub Actions CI: lint, typecheck, build, test on every PR
- [x] Vitest + component/unit tests; Prettier config committed (Playwright smoke test deferred to Phase 1, once there are real flows to drive)

### Phase 1 — Recipes exist (2–3 weeks)

_Goal: one user can create, photograph, and cook from a real recipe._

- [x] Auth.js: email sign-in with sessions, protected routes, real Login/Signup pages (Google OAuth pending credentials)
- [x] Recipe creation with structured editor: photos, title/story, ingredients, steps, tags, visibility (edit/delete still to do)
- [x] Image upload with local storage served via `/api/uploads` (client-side crop + CDN delivery still to do)
- [x] Recipe detail page: hero image, story, ingredients with **serving scaler**, steps (print view still to do)
- [x] `/user-profile` shows a real profile: bio, stats, grid of your recipes with visibility badges (avatar upload still to do)
- [x] Seed script with demo users, a family group, and 8 recipes with generated cover images
- [x] Playwright e2e smoke suite (deferred from Phase 0): browse + scale, signup → create → profile, privacy check

**Milestone: you can post the first real Rasmussen family recipe.**

### Phase 2 — The social feed (2–3 weeks)

_Goal: it feels like Instagram._

- [x] The Feed at `/` (when logged in): infinite scroll, cursor-paginated, photo-first cards (cover image, title, author, time, like/comment row)
- [x] Likes (optimistic, double-tap on photo ❤️), comments with delete, saves + `/saved` page (comment threading + collections UI still to do)
- [x] Follow system + follower/following counts + public profiles at `/u/[username]`; feed = followed users ∪ family peers
- [x] **"I Made It"** posts with photo/rating/notes shown on the recipe page (feed interleaving still to do)
- [x] Notifications: in-app bell with unread badge, `/notifications` page, mark-all-read; fired on likes, comments, follows, made-its
- [x] Share links with Open Graph metadata using the cover photo (auto-generated OG card images still to do)

**Milestone: two people can follow each other and interact daily.**

### Phase 3 — Families & heritage (2 weeks)

_Goal: the moat. This is what no other app has._

- [x] Family groups: create, shareable invite links, admin/member roles, leave with last-admin guard (email invites still to do)
- [x] Family cookbook page: the family's collected recipes, filterable by member and tag
- [x] Recipe provenance: original cook, era, and place captured in the form and shown on recipes ("📜 Originally by Grandma Ruth · 1960s · Ballard, WA")
- [x] **Recipe lineage/remix**: 🍴 Remix button prefills a new recipe from the original; both directions of the lineage render (remixed-from + variations)
- [x] Voice notes on recipes: audio upload on the create form, player on the recipe page
- [x] Family-only visibility enforced everywhere (feed, cookbook, profiles, detail)
- [x] Printable family cookbook at `/families/[slug]/cookbook` — print or save as PDF from the browser (designed PDF export still to do)

**Milestone: the whole extended family joins and uploads the heirloom recipes.**

### Phase 4 — Discovery & cooking experience (2–3 weeks)

_Goal: it's not just social — it's the best app to actually cook from._

- [x] Search: one box spans titles, descriptions, ingredients ("what can I make with leeks?"), tags, cuisines, and authors
- [x] Explore page at `/recipes`: 🔥 Trending (most-liked), cuisine and tag filter chips, search results view
- [x] **Cook Mode** at `/recipes/[id]/cook`: full-screen step-by-step, huge type, screen wake-lock, per-step timers auto-detected from step text, keyboard navigation (voice "next step" still to do)
- [x] Shopping list: add any recipe's ingredients (scaled to servings, auto-merged by item+unit across recipes), check off at the store, clear checked
- [x] Ratings via "Made It" shown on recipes (★ average + count badge)

### Phase 5 — The magic (AI) (2–3 weeks)

_Goal: features that make people say "how did it do that?"_

All AI features activate when `ANTHROPIC_API_KEY` is configured and degrade gracefully without it.

- [x] **📸 Recipe card scanner** at `/recipes/scan`: photograph Grandma's handwritten index card → Claude vision (structured outputs) extracts a fully structured recipe, with the original card image preserved on the recipe as an heirloom artifact. Shows a clear "not configured" state without a key.
- [x] **🔗 URL import** at `/recipes/import`: paste any recipe link → schema.org/Recipe JSON-LD parses instantly with no AI; pages without it fall back to Claude extraction (SSRF-guarded fetcher)
- [x] Smart ingredient parsing ("2 heaping cups AP flour, sifted" → qty/unit/item/note) — rule-based, used by import and AI post-processing
- [x] Natural-language search ("cozy fall dinner under 45 minutes") — AI-gated query interpretation on Explore with plain-search fallback
- [x] Weekly meal plan at `/meal-plan` from your saves (topped up with trending), rotating weekly, with one-tap "add the week to my shopping list"

### Phase 6 — Polish & scale (ongoing)

- [x] PWA: installable (manifest + icons), service worker with offline fallback and cached assets/images (push notifications deferred — needs a push service)
- [x] Performance: lazy-loaded grid/feed images, immutable caching on uploads, standalone output (formal LCP budget + edge caching deferred to hosting setup)
- [x] Accessibility & dark mode: labeled controls throughout, keyboard-navigable Cook Mode, DaisyUI dark theme via `prefers-color-scheme` (formal WCAG audit + i18n deferred)
- [ ] _Deferred — needs external services/decisions:_ video reels (video hosting), moderation/reporting tooling (before opening beyond family & friends), analytics (PostHog account)

---

## Part 5: Priorities & Principles

**Build order rationale:** Foundations → single-player value (a great recipe tool) → multiplayer value (feed) → moat (family) → delight (AI). Each phase ships something usable; the app is never broken-in-progress.

**Three principles:**

1. **Photo-first, always.** Every surface leads with imagery. If a recipe has no photo, the create flow makes adding one irresistible (and the card scanner means even old recipes get the original card as their image).
2. **Structured data is sacred.** Never store ingredients/steps as text blobs. Every future feature — scaling, shopping lists, search, AI — depends on this.
3. **The family is the moat.** Instagram has more photos; AllRecipes has more recipes. Nobody else has "your family's food history, alive and growing." Every roadmap decision should be tested against: _does this make the app more indispensable to a family?_

**Suggested immediate next step:** Phase 0 in one PR (upgrades + Prisma schema + CI), then Phase 1 auth. Say the word and I'll start executing.
