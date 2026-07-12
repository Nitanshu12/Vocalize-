# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working conventions

Before writing or substantially editing this file (or other planning/architecture docs in this repo), describe what will be written first and write it only after that — don't write first and summarize after also explain like this owner can understand the functionality and concepts better.Teach the owner as a college professor and explain everything to him why and what 

Before writing or substantially editing product code, explain first: what we're building and why, how the code/logic works, what alternative approaches exist, and what other tools or technologies could be used instead — then write the code. Teach like a professor, not a code-vending machine.

After explaining, wait for the owner's explicit go-ahead before writing the code — do not proceed to write it automatically just because the explanation was given.

## Learning goals

This project is deliberately used to learn the full modern AI engineering stack, not just to call an LLM API once. In rough order of what the product will need: AI infrastructure (model serving/clients, embeddings, vector stores, logging/observability around LLM calls), RAG (retrieval-augmented generation), agentic AI (multi-step, tool-calling loops), LangChain.js (chains, prompt templates, output parsers), and LangGraph (stateful multi-step agent workflows). When a feature could be built as either a simple one-shot LLM call or a more elaborate RAG/agentic pipeline, default to whichever teaches more of this stack — as long as it stays within free-tier limits — and always explain that tradeoff explicitly rather than silently picking the simplest option.

## What this is

Vocalize — an AI speech-practice platform (interview prep, presentation practice, public speaking). Three independent top-level packages, not an npm workspace — each has its own `package.json` and `node_modules`:

- `Frontend/` — React 19 + Vite + Tailwind CSS landing page and (eventually) app UI
- `backend/` — Express 5 API, currently just the auth system
- `Database/` — a tiny standalone package (`pg` Pool + `schema.sql`) that `backend` imports via a relative path, not a package dependency

`vocalize/` at the repo root is a stale leftover (just a Vite cache dir) from before the project was split into the three folders above — do not add code there.

There is no root `package.json` and this directory is not yet a git repository.

## Commands

**Frontend** (run from `Frontend/`):
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — Oxlint (config in `.oxlintrc.json`; rules currently scoped to `react/rules-of-hooks` and `react/only-export-components`)
- `npm run preview` — preview a production build

**Backend** (run from `backend/`):
- `npm run dev` — starts the API with `node --watch` on `src/server.js`
- `npm start` — same, without watch
- No test runner or lint script configured yet.
- Requires a `.env` (copy `.env.example`) — `src/config/env.js` validates it with Zod at boot and throws immediately if `DATABASE_URL` or `JWT_ACCESS_SECRET` (min 32 chars) are missing.

**Database**:
- `psql -d <your_db> -f Database/schema.sql` — applies schema v1 (idempotent, uses `create table if not exists`)
- The pool in `Database/postgres.js` reads `process.env.DATABASE_URL` directly and throws if unset — whoever imports it (currently only `backend`) must load `.env` first (`backend` does this via `dotenv/config` in `src/config/env.js`, imported before any DB access).

There's no local Postgres bootstrap script — a dev DB must exist first (e.g. `createdb vocalize_dev`) before running the schema file.

## Architecture

### Backend auth flow (the only backend feature so far)

Deliberately **not** using Supabase — this is a hand-rolled JWT auth system on plain Express + Postgres, chosen so the project demonstrates backend fundamentals rather than hiding them behind a BaaS.

- **Access tokens**: short-lived JWTs (`ACCESS_TOKEN_TTL`, default 15m), signed with `JWT_ACCESS_SECRET`, sent in the JSON response body and expected back as `Authorization: Bearer <token>`. Verified per-request by `middleware/authenticate.js`.
- **Refresh tokens**: opaque random tokens (not JWTs), delivered as an `httpOnly` cookie scoped to `/api/v1/auth`. Only the SHA-256 hash is ever stored in the `refresh_tokens` table — the raw token exists only in the cookie and the response at issue time.
- **Rotation + reuse detection**: every `/refresh` call revokes the presented token and issues a new one (`rotateRefreshToken` in `services/auth.service.js`). If an already-revoked token is ever presented again, that's treated as theft: `revokeAllUserTokens` kills every session for that user, not just the one token. This logic lives in `controllers/auth.controller.js#refresh` — read it before touching refresh-token behavior anywhere else.
- **Request flow**: `routes/auth.routes.js` → `middleware/validate.js` (Zod schemas from `validators/auth.validator.js`) → `controllers/auth.controller.js` (cookie handling, HTTP status codes) → `services/auth.service.js` (Postgres queries, bcrypt) / `services/token.service.js` (JWT + refresh-token crypto). Keep that layering: controllers don't touch `pool` directly, services don't touch `req`/`res`.
- Auth endpoints (`/login`, `/register`) are rate-limited per-IP in `routes/auth.routes.js` — this also protects any downstream free-tier API quota (e.g. Groq) the app will depend on later, so don't remove it without replacing it.
- `errorHandler.js` special-cases Postgres unique-violation (`23505`) into a 409 — new unique constraints should map to a user-facing conflict there rather than leaking a raw 500.

### Frontend design system

The landing page intentionally avoids a generic AI-generated look — a "coach's markup" visual identity: paper background (`#faf7f2`) + ink text (`#1c1917`), Fraunces (serif, display) + Inter (body) + Caveat (handwritten annotations), a grain texture overlay (`.grain` in `index.css`), and a waveform motif (`components/ui/Waveform.jsx`) as the recurring brand element.

- All color tokens are centralized in `Frontend/tailwind.config.js` (`paper`, `ink`, `brand`, plus semantic feedback colors `coral`/`gold`/`leaf` — these are functional, not decorative, and shouldn't be reused as the brand accent). When changing the palette, change it there, not by hardcoding hex values in components — some existing landing components still have hardcoded hex values left over from before this convention (e.g. in `Waveform.jsx`, `Hero.jsx`, `CTA.jsx`, `Footer.jsx`) that should be migrated to Tailwind tokens when touched.
- `components/ui/Reveal.jsx` is the standard scroll-reveal wrapper (IntersectionObserver-based) — landing sections use it for on-scroll fade/slide-in. Reuse it for new sections rather than writing a new observer.
- `components/ui/CursorTrail.jsx` is a canvas-based custom cursor (sound-particle effect) mounted globally in `App.jsx`. It self-gates on `(pointer: fine)` and `prefers-reduced-motion` and toggles the `vocalize-cursor-active` class (defined in `index.css`) to hide the native cursor — don't mount a second custom cursor or fight this class elsewhere.
- New pages should match this system (fonts/colors/motion already defined above) rather than introducing a different visual style — there's only a `Landing` page today, but the same tokens and components apply as auth/app pages are added.
