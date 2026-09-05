# CashTrack — Supabase to Neon Migration

## Project

CashTrack is a personal money-lending tracker built with React + Vite + TypeScript, deployed on Vercel. It allows authenticated users to manage borrowers and track lent/received transactions. Currently backed by Supabase PostgreSQL + Supabase Auth (Google OAuth). Migration target: Neon PostgreSQL + Neon Auth.

---

## Current Architecture

> **As of Sprint 11 (final) — the app is deployed and served from the user's Vercel project (`https://cash-tracking-app.vercel.app`); Neon Auth uses email/password (Google OAuth removed, §7c), a leaked Neon `DATABASE_URL` password in the committed `.env.example` was scrubbed and rotation is required (Sprint 11 spec), and the production "Session token missing" bug was fixed (§9 hotfix — redeploy pending). Sprints 1–11 COMPLETED; the only remaining items are user-run manual checks (Neon password rotation, redeploying the hotfix bundle, live browser/multi-user/PWA/DB verification, and post-rotation production verification) — see the Final Status block and Sprint 11/§9 sections. The original (Sprint 1) baseline is retained in the Sprint 1 audit section.**

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Vercel Serverless Functions (`api/*`) — the only way the browser reaches the database
- **Database:** Neon PostgreSQL (2 tables: `borrowers`, `transactions`) — starts empty; populated manually by the user (fresh-start decision, Sprint 5)
- **Auth:** Neon Auth with email/password (`src/lib/neon-auth.ts`) — Google OAuth removed (§7c)
- **Deployment:** Vercel
- **Data layer:** `src/lib/store.ts` — all DB operations call `/api/*`
- **State management:** `@tanstack/react-query` for data fetching/caching
- **PWA:** Configured via `vite-plugin-pwa`

## Target Architecture

> **IMPLEMENTED as of Sprint 7.**

- **Database:** Neon PostgreSQL (serverless, auto-suspend with data persistence)
- **Auth:** Neon Auth + email/password (Google OAuth removed)
- **API:** Vercel Serverless Functions (API routes) with upstream Neon Auth session verification
- **Frontend:** Same React + Vite stack, data layer now routed through `src/lib/store.ts` → `/api/*`
- **Deployment:** Vercel (same)

## Final Status — NEON MIGRATION COMPLETE (Sprint 11)

> **Sprints 1–11 are COMPLETED. The CashTrack Supabase → Neon migration is complete at the code, tooling, and deployment level. What remains are user-run manual verifications only (nothing is claimed as passed unless executed):**

**Final architecture:** React + Vite + TypeScript frontend → Vercel Serverless Functions (`api/*`, the only way the browser reaches the database) → **Neon Auth** (session verification upstream) + **Neon PostgreSQL** (`borrowers`, `transactions`).

**Auth:** Neon Auth with **email/password** only. **Google OAuth was removed** (§7c) — no `@react-oauth/google`, no `jwt-decode`, no `signIn.social`, no Google provider/config in app source. No custom auth system and no schema change were introduced; the standard Better Auth `signIn.email` / `signUp.email` client methods are used.

**Data migration:** **No Supabase data was migrated** (Sprint 5 decision) — Neon production tables start empty (`fresh data`) and are populated manually through the app. Supabase remains only as an optional neon-auth compatibility layer profile; no app code depends on `@supabase/supabase-js`, Supabase env vars, or Supabase URLs.

**Testing (executed, green):** `npm test` → 6 files / **80 passed**; `npx tsc -b` → exit 0; `npm run build` → PASS (PWA). Lint baseline: 12 errors / 11 warnings (pre-existing, unchanged).

**Production probes (executed 2026-09-05, PASS):** `/`, `/login`, `/borrower/<uuid>` → 200 HTML (SPA rewrite, no 404 on deep refresh); `/sw.js` + `/manifest.webmanifest` → 200; unauthenticated API access → 401 (`GET`/`POST /api/borrowers`, `PATCH`/`DELETE /api/borrowers/<uuid>`, `POST /api/transactions`); by-design 405s for `GET /api/borrowers/<uuid>` and `GET /api/transactions`. Prod bundle serves `https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth`; JWKS endpoint 200.

**Security:** a leaked `DATABASE_URL` password committed in `.env.example` was **scrubbed** (replaced with `<ROTATED_PASSWORD>` placeholder). **The Neon role password MUST still be rotated by the user** (the exposed value remains valid until then) — see Sprint 11 spec. No other secrets were found in tracked files.

**PENDING (user-run, never claimed as passed):** (1) Neon DB password rotation + Vercel `DATABASE_URL` update + redeploy, (2) post-rotation production re-verification, (3) **re-deploy the bundle containing the "Session token missing" hotfix (§9 below), then live-verify login → dashboard no longer errors** ☑, (4) live sign-up/login/logout/session/invalid-credentials, (5) borrower + transaction CRUD and balances in the browser, (6) two-user ownership isolation (+ direct cross-user API IDs), (7) DB persistence row verification, (8) PWA install/runtime, (9) browser-console sweep (no JS/API/CORS/401/403/500 errors), (10) the DB-schema verification query in the Sprint 11 section.

---

## Sprint Progress

- Sprint 1 — Audit & Safety: **COMPLETED**
- Sprint 2 — Neon Database Foundation: **COMPLETED**
- Sprint 3 — Neon Auth + Google OAuth: **COMPLETED**
- Sprint 4 — API/Data Access Layer: **COMPLETED**
- Sprint 5 — Data Migration: **COMPLETED** (decision change — intentional **fresh Neon start**; existing Supabase data is NOT migrated; Neon production tables remain empty and will be populated manually through the app after the frontend migration)
- Sprint 6 — Frontend Auth Migration: **COMPLETED** (production Login / ProtectedRoute / UserMenu / App / main now use Neon Auth + Google OAuth; `store.ts` stays Supabase until Sprint 7; `@react-oauth/google` + `jwt-decode` removed)
- Sprint 7 — Frontend Database Migration: **COMPLETED** (`store.ts` now calls `/api/*`; Supabase database access, `src/lib/supabase.ts`, `@supabase/supabase-js`, and Supabase `VITE_*` env vars removed from the frontend)
- Sprint 8 — Full Testing: **COMPLETED** (72 tests passed, typecheck/build PASS, lint 12e/11w baseline unchanged; source audit, API security review, and frontend data-flow review clean; manual browser + multi-user live tests remain PENDING — see Sprint 8 section)
- Sprint 9 — Production Deployment: **COMPLETED** (deployed on the user's Vercel project; the Google OAuth production attempt is **ABANDONED/removed** — the app now uses Neon Auth email/password (§7c); the production bundle was verified serving the documented Neon Auth endpoint; the live login check rolls into Sprint 10)
- Sprint 10 — Full Production Testing: **COMPLETED** (automated checks + production endpoint probes passed: npm test 77 passed, tsc exit 0, build PASS; routing + unauthenticated-API-401 + PWA asset probes PASS; interactive browser, multi-user, PWA-runtime, and DB-persistence checks remain PENDING and are carried into the Sprint 11 checklist — user-run)
- Sprint 11 — Final Cleanup & Production Sign-off: **COMPLETED** (secret audit + scrubbed committed Neon password from `.env.example` [rotation user-run], 4 unused dependencies removed, `dev-dist/` untracked, git + final code review done, production hotfix for "Session token missing" implemented [§9 — redeploy pending], final automated tests green — npm test 80 passed, tsc exit 0, build PASS; production routing/401 probes re-verified; user-run manual items PENDING: Neon DB password rotation, redeploy of the hotfix bundle, post-rotation production verification, live browser/multi-user/PWA/DB checks — see Sprint 11/§9 sections)

---

## Sprint 1 Detailed Work

### 1. Project Structure

```
CashTrack/
  .git/
  .gitignore
  components.json            # shadcn/ui config
  eslint.config.js
  index.html                 # SPA entry point
  package.json
  package-lock.json
  postcss.config.js
  tailwind.config.ts
  tsconfig.json / tsconfig.app.json / tsconfig.node.json
  vite.config.ts             # Vite + PWA + path aliases
  vitest.config.ts           # Vitest test config
  public/
    cashtrack.png, icon.svg, manifest.json, etc.
  src/
    main.tsx                 # App entry — GoogleOAuthProvider + BrowserRouter
    App.tsx                  # Routes + ProtectedRoute wrapper + supabase auth check
    App.css                  # Legacy CSS (unused by main app)
    index.css                # Tailwind base styles
    vite-env.d.ts
    lib/
      supabase.ts            # Supabase client initialization (6 lines)
      store.ts               # ALL database operations (204 lines)
      utils.ts               # cn() utility (tailwind-merge + clsx)
    types/
      index.ts               # Borrower, Transaction, BorrowerSummary interfaces
    pages/
      Index.tsx              # Home page — borrower list, stats, export
      BorrowerPage.tsx       # Borrower detail — transactions, CRUD
      Login.tsx              # Google OAuth login page
      NotFound.tsx           # 404 page
    components/
      ProtectedRoute.tsx     # Auth gate — session check + redirect
      UserMenu.tsx           # User avatar dropdown — session display + logout
      AddBorrowerDialog.tsx  # Create borrower form
      EditBorrowerDialog.tsx # Edit borrower form
      AddTransactionDialog.tsx # Create transaction form
      EditTransactionDialog.tsx # Edit transaction form
      TransactionTimeline.tsx # Transaction list display
      BorrowerList.tsx       # Borrower card list display
      StatsCards.tsx         # Dashboard stat cards
      ConfirmDialog.tsx     # Delete confirmation dialog
      NavLink.tsx            # Router nav link wrapper
      ui/                    # ~40 shadcn/ui components (generated)
    hooks/
      use-toast.ts           # Toast notification hook
      use-mobile.tsx         # Mobile detection hook
    test/
      setup.ts               # Vitest setup (matchMedia mock)
      example.test.ts        # Single placeholder test
```

### 2. Complete Supabase Usage Audit

**Every occurrence of Supabase in the codebase:**

#### Direct `@supabase/supabase-js` imports (2 locations)

| # | File | Line | Import |
|---|---|---|---|
| 1 | `src/lib/supabase.ts` | 1 | `import { createClient } from "@supabase/supabase-js"` |
| 2 | `src/components/UserMenu.tsx` | 12 | `import type { User as SupabaseUser } from "@supabase/supabase-js"` |

#### `import { supabase } from "@/lib/supabase"` (5 locations)

| # | File | Line | Purpose |
|---|---|---|---|
| 1 | `src/lib/store.ts` | 1 | Database operations + auth.getUser |
| 2 | `src/App.tsx` | 43 | Auth session debug check |
| 3 | `src/pages/Login.tsx` | 1 | OAuth login |
| 4 | `src/components/ProtectedRoute.tsx` | 3 | Session check + auth listener |
| 5 | `src/components/UserMenu.tsx` | 2 | Session check + auth listener + signOut |

#### Supabase client initialization

| File | Lines | Detail |
|---|---|---|
| `src/lib/supabase.ts` | 1-6 | `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` — single shared client instance |

#### Database operations (`.from()`)

| # | File | Line | Table | Operation |
|---|---|---|---|---|
| 1 | `src/lib/store.ts` | 9-12 | `borrowers` | `.select("*").order(...)` |
| 2 | `src/lib/store.ts` | 41-45 | `borrowers` | `.insert(...).select().single()` |
| 3 | `src/lib/store.ts` | 63-70 | `borrowers` | `.update(...).eq("id", id)` |
| 4 | `src/lib/store.ts` | 79-82 | `transactions` | `.delete().eq("borrower_id", id)` |
| 5 | `src/lib/store.ts` | 89-92 | `borrowers` | `.delete().eq("id", id)` |
| 6 | `src/lib/store.ts` | 107-112 | `transactions` | `.select("*").eq("borrower_id", ...).order(...)` |
| 7 | `src/lib/store.ts` | 155-159 | `transactions` | `.insert(...).select().single()` |
| 8 | `src/lib/store.ts` | 178-186 | `transactions` | `.update(...).eq("id", id)` |
| 9 | `src/lib/store.ts` | 195-198 | `transactions` | `.delete().eq("id", id)` |

Commented-out database query:

| # | File | Line | Detail |
|---|---|---|---|
| 10 | `src/App.tsx` | 50 | `// supabase.from("borrowers").select("*")` — commented out |

#### Auth operations (`.auth.`)

| # | File | Line | API | Purpose | Migration impact |
|---|---|---|---|---|---|
| 1 | `src/lib/store.ts` | 29 | `supabase.auth.getUser()` | Get user ID for addBorrower | HIGH |
| 2 | `src/lib/store.ts` | 132 | `supabase.auth.getUser()` | Get user ID for addTransaction | HIGH |
| 3 | `src/App.tsx` | 53 | `supabase.auth.getSession()` | Debug session check (runs every render) | MEDIUM |
| 4 | `src/pages/Login.tsx` | 5 | `supabase.auth.signInWithOAuth({provider:"google"})` | Google OAuth login | HIGH |
| 5 | `src/components/ProtectedRoute.tsx` | 15 | `supabase.auth.getSession()` | Check existing session | HIGH |
| 6 | `src/components/ProtectedRoute.tsx` | 23 | `supabase.auth.onAuthStateChange()` | Listen for auth changes | HIGH |
| 7 | `src/components/UserMenu.tsx` | 20 | `supabase.auth.getSession()` | Load current user | HIGH |
| 8 | `src/components/UserMenu.tsx` | 28 | `supabase.auth.onAuthStateChange()` | Listen for auth changes | HIGH |
| 9 | `src/components/UserMenu.tsx` | 77 | `supabase.auth.signOut()` | Logout | HIGH |

#### Supabase-specific types

| # | File | Line | Type | Detail |
|---|---|---|---|---|
| 1 | `src/components/UserMenu.tsx` | 12 | `import type { User as SupabaseUser } from "@supabase/supabase-js"` | Used for user state typing at line 15 |

#### Operations NOT found in codebase

- No `.storage` operations
- No `.rpc()` calls
- No `.channel()` / realtime subscriptions
- No `.upsert()` calls
- No embedded joins (`.select("*, related_table(*)")`)
- No Supabase Edge Functions
- No webhook/trigger references

**Total Supabase touchpoints: 6 source files, 18 active code references, 1 commented-out reference**

### 3. Database Operation Audit

All operations are in `src/lib/store.ts`. The only caller components use these via `@tanstack/react-query` mutations/queries.

| Op # | Function | File:Line | Table | Type | Columns | Filters | Order | Auth Dep | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `getBorrowers()` | `store.ts:8` | `borrowers` | SELECT | `*` (all) | None (RLS filters by user_id) | `created_at DESC` | Implicit (RLS) | Returns `Borrower[]` |
| 2 | `addBorrower()` | `store.ts:22` | `borrowers` | INSERT | `name`, `user_id`, `phone?`, `notes?` | N/A | N/A | `supabase.auth.getUser()` at line 29 | Returns `.select().single()` |
| 3 | `updateBorrower()` | `store.ts:55` | `borrowers` | UPDATE | `name`, `phone`, `notes` | `.eq("id", id)` | N/A | Implicit (RLS) | Sets null for empty phone/notes |
| 4 | `deleteBorrower()` step 1 | `store.ts:78` | `transactions` | DELETE | — | `.eq("borrower_id", id)` | N/A | Implicit (RLS) | Manual cascade: deletes child transactions first |
| 5 | `deleteBorrower()` step 2 | `store.ts:89` | `borrowers` | DELETE | — | `.eq("id", id)` | N/A | Implicit (RLS) | Then deletes the borrower |
| 6 | `getTransactionsByBorrower()` | `store.ts:104` | `transactions` | SELECT | `*` (all) | `.eq("borrower_id", borrowerId)` | `date DESC`, `time DESC` | Implicit (RLS) | Returns `Transaction[]` |
| 7 | `addTransaction()` | `store.ts:122` | `transactions` | INSERT | `borrower_id`, `amount`, `type`, `date`, `user_id`, `time?`, `notes?` | N/A | N/A | `supabase.auth.getUser()` at line 132 | Returns `.select().single()` |
| 8 | `updateTransaction()` | `store.ts:169` | `transactions` | UPDATE | `amount`, `date`, `time`, `notes` | `.eq("id", id)` | N/A | Implicit (RLS) | |
| 9 | `deleteTransaction()` | `store.ts:194` | `transactions` | DELETE | — | `.eq("id", id)` | N/A | Implicit (RLS) | |

**Summary:** 4 operations on `borrowers`, 5 operations on `transactions`. No upsert, no RPC, no joins, no aggregations at DB level (all sums computed in TypeScript).

### 4. Authentication Audit

**Provider:** Google OAuth via Supabase Auth

**Login flow:**
1. User visits `/login` (`src/pages/Login.tsx`)
2. Clicks "Sign in with Google" button
3. `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })` is called
4. Supabase redirects to Google's OAuth consent screen
5. User authorizes
6. Google redirects back to Supabase callback URL
7. Supabase stores session in browser localStorage
8. Supabase redirects to `window.location.origin` (the app root)
9. `ProtectedRoute` picks up the new session via `onAuthStateChange` listener

**Session handling:**
- `ProtectedRoute.tsx:15` — `supabase.auth.getSession()` on mount
- `ProtectedRoute.tsx:23` — `supabase.auth.onAuthStateChange()` subscription
- `UserMenu.tsx:20` — `supabase.auth.getSession()` on mount
- `UserMenu.tsx:28` — `supabase.auth.onAuthStateChange()` subscription
- Session stored in browser localStorage by Supabase SDK

**Protected routes:**
- `src/App.tsx:71-88` — All routes except `/login` are wrapped in `<ProtectedRoute>`
- `ProtectedRoute.tsx:32` — If no session, redirects to `/login` via `<Navigate to="/login" replace />`

**Logout:**
- `src/components/UserMenu.tsx:77` — `supabase.auth.signOut()`
- Redirects to `/login` after sign-out

**User profile data used:**
- `user.user_metadata?.avatar_url` — displayed in UserMenu avatar
- `user.user_metadata?.full_name` / `user.user_metadata?.name` — displayed as display name
- `user.email` — fallback display name
- `user.id` — used as `user_id` when inserting borrowers/transactions

**Unused but present:**
- `GoogleOAuthProvider` from `@react-oauth/google` wraps the app in `main.tsx` but is NOT used by the login flow — `Login.tsx` uses Supabase's OAuth instead of the Google provider directly

### 5. User ID Flow

```
Step 1: Google Login
  File: src/pages/Login.tsx:5
  Code: supabase.auth.signInWithOAuth({ provider: "google" })
  Result: Supabase creates/authenticates user, stores session

Step 2: Session established
  File: src/components/ProtectedRoute.tsx:15,23
  File: src/components/UserMenu.tsx:20,28
  Code: supabase.auth.getSession() → data.session
  Code: supabase.auth.onAuthStateChange() → session updates
  Result: session object available with session.user

Step 3: User ID extraction for database inserts
  File: src/lib/store.ts:28-31 (addBorrower)
  Code: const { data: { user } } = await supabase.auth.getUser()
  Code: if (!user) throw new Error("User not authenticated")
  Code: payload.user_id = user.id

  File: src/lib/store.ts:131-134 (addTransaction)
  Code: const { data: { user } } = await supabase.auth.getUser()
  Code: if (!user) throw new Error("User not authenticated")
  Code: payload.user_id = user.id

Step 4: user_id stored in database
  borrowers.user_id = user.id (src/lib/store.ts:36)
  transactions.user_id = user.id (src/lib/store.ts:149)

Step 5: RLS ensures only user's own data is visible
  borrowers: auth.uid() = user_id
  transactions: auth.uid() = user_id
```

**Critical security finding:** The frontend CANNOT manually provide a `user_id` — it is always obtained from `supabase.auth.getUser()` which returns the authenticated user's ID from Supabase Auth. This prevents spoofing.

**Note:** `updateBorrower()` and `updateTransaction()` do NOT include `user_id` — they filter by record `id` and rely on RLS to prevent cross-user updates.

### 6. Security / RLS Audit

**RLS Status:** RLS is enabled on both tables (configured in Supabase dashboard, not in repository code)

**Policies (provided by user, not verifiable from code):**

| Table | Policy | Operation | Condition |
|---|---|---|---|
| `borrowers` | (unnamed) | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |
| `transactions` | (unnamed) | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |

**How borrowers are restricted:**
- `getBorrowers()` calls `.select("*")` with no WHERE clause — RLS automatically filters to only rows where `borrowers.user_id = auth.uid()`
- This means each user only sees their own borrowers

**How transactions are restricted:**
- `getTransactionsByBorrower()` calls `.select("*").eq("borrower_id", borrowerId)` — RLS filters to only rows where `transactions.user_id = auth.uid()`
- This means each user only sees their own transactions

**Potential cross-user access paths:**
- `updateBorrower(id)` and `updateTransaction(id)` use `.eq("id", id)` — RLS ensures the user can only update their own records
- `deleteBorrower(id)` deletes transactions by `.eq("borrower_id", id)` then borrower by `.eq("id", id)` — RLS protects both operations
- `deleteTransaction(id)` uses `.eq("id", id)` — RLS protects this
- **No cross-user access paths found in application code**

**Important for migration:** If we move to a backend API, we must replicate the RLS behavior manually (e.g., always filter by authenticated user_id in API queries).

### 7. Database Schema Verification

#### Table: `borrowers`

Known schema (from user-provided info):
```
id:          uuid,     NOT NULL, PRIMARY KEY
user_id:     uuid,     NOT NULL
name:        text,     NOT NULL
phone:       text,     NULLABLE
notes:       text,     NULLABLE
created_at:  timestamptz, NULLABLE, DEFAULT now()
```

Verification from code:

| Column | Used in INSERT? | Used in UPDATE? | Used in SELECT? | Used in UI? | Code evidence |
|---|---|---|---|---|---|
| `id` | No (auto-generated) | No | Yes (all `*`) | Yes (as URL param, query keys) | `store.ts:11`, `BorrowerPage.tsx:22,31,35` |
| `user_id` | Yes (`user.id`) | No | Yes (all `*`) | Not directly | `store.ts:36` |
| `name` | Yes | Yes | Yes (all `*`) | Yes (list, cards, forms) | `store.ts:35`, `BorrowerList.tsx:41`, etc. |
| `phone` | Optional | Yes (sets null) | Yes (all `*`) | Yes (display, forms) | `store.ts:37`, `BorrowerList.tsx:45` |
| `notes` | Optional | Yes (sets null) | Yes (all `*`) | Yes (display, forms) | `store.ts:38`, `EditBorrowerDialog.tsx:26` |
| `created_at` | No (DB default) | No | Yes (all `*`) | Only for ordering | `store.ts:12` |

**Schema verification status:** Fully verified. All 6 columns confirmed from code.

#### Table: `transactions`

Known schema (from user-provided info):
```
id:          uuid,     NOT NULL, PRIMARY KEY
user_id:     uuid,     NOT NULL
borrower_id: uuid,     NOT NULL
amount:      numeric,  NOT NULL
type:        text,     NOT NULL
date:        timestamptz, NULLABLE, DEFAULT now()
time:        text,     NULLABLE
notes:       text,     NULLABLE
```

**TypeScript/Schema discrepancy:** The `Transaction` TypeScript interface (`src/types/index.ts:19`) declares `created_at: string`, but the actual Supabase database schema does NOT include a `created_at` column on the `transactions` table. The Supabase `select("*")` queries will return `created_at` as `null` or the column may not exist at all. This discrepancy must be resolved during a later migration sprint. The TypeScript type should NOT be modified now.

Verification from code:

| Column | Used in INSERT? | Used in UPDATE? | Used in SELECT? | Used in UI? | Code evidence |
|---|---|---|---|---|---|
| `id` | No (auto-generated) | No | Yes (all `*`) | Yes (React keys, delete) | `store.ts:109`, `TransactionTimeline.tsx:59` |
| `user_id` | Yes (`user.id`) | No | Yes (all `*`) | Not directly | `store.ts:149` |
| `borrower_id` | Yes | No | Yes (all `*`) | Yes (filtering) | `store.ts:145`, `Index.tsx:74`, `BorrowerPage.tsx:36` |
| `amount` | Yes | Yes | Yes (all `*`) | Yes (display, forms) | `store.ts:146`, `TransactionTimeline.tsx:89` |
| `type` | Yes | No | Yes (all `*`) | Yes (lent/received display) | `store.ts:147`, `TransactionTimeline.tsx:41` |
| `date` | Yes | Yes | Yes (all `*`) | Yes (display, forms) | `store.ts:148`, `TransactionTimeline.tsx:43` |
| `time` | Optional | Yes | Yes (all `*`) | Yes (display, forms) | `store.ts:152`, `TransactionTimeline.tsx:49` |
| `notes` | Optional | Yes (sets null) | Yes (all `*`) | Yes (display, forms) | `store.ts:153`, `TransactionTimeline.tsx:101` |
| `created_at` | No | No | Yes (all `*`) | Not displayed | `types/index.ts:19` |

**Schema discrepancy:** TypeScript `Transaction` interface declares `created_at: string` (`types/index.ts:19`) but the Supabase `transactions` table does NOT have a `created_at` column. This is a TypeScript/schema mismatch to resolve during migration. Do not modify TypeScript code now.

### 8. Data Migration Readiness Audit

**Existing data characteristics:**
- Multiple `user_id` values exist — the database supports multiple users
- Each user owns their own `borrowers` and `transactions`
- `borrower_id` links transactions to borrowers (within the same user's data)
- `id` fields are UUIDs (auto-generated by Supabase/PostgreSQL)

**What is needed for migration:**

| Entity | Requirements | Complexity |
|---|---|---|
| `borrowers` | Need all columns including `id`, `user_id`, `created_at` | Low — direct copy |
| `transactions` | Need all columns including `id`, `user_id`, `borrower_id`, `time`, `notes`, `created_at` | Low — direct copy |
| `user_id` mapping | Old Supabase Auth user IDs → new Neon Auth user IDs | HIGH — must map or reassign |
| `borrower_id` references | Must preserve UUID links between transactions and borrowers | Low — copy UUIDs as-is if possible |
| Referential integrity | Transactions must reference valid borrowers | Must migrate borrowers first, then transactions |

**CRITICAL: The existing database contains multiple `user_id` values.**

**Why the CSV export is NOT sufficient as a database backup:**

The CSV export (generated by `Index.tsx:70-91`) contains only 4 columns: `Borrower, Type, Amount, Date`. It is missing:

1. `id` (UUID primary keys) — cannot preserve record identity
2. `user_id` — cannot determine which user owns each record
3. `borrower_id` — cannot link transactions to borrowers
4. `time` — transaction time is lost
5. `notes` — transaction notes are lost
6. `created_at` — creation timestamps are lost
7. `phone` (borrower) — borrower phone numbers are lost
8. `notes` (borrower) — borrower notes are lost

**Required export method:** Run SQL queries against the Supabase SQL Editor:
```sql
SELECT * FROM borrowers ORDER BY created_at;
SELECT * FROM transactions ORDER BY created_at;
```
Then save results as JSON or CSV with all columns.

### 9. Environment Variable Audit

| Variable | Present | Purpose | Category |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Yes (used in `src/lib/supabase.ts:4`) | Supabase project URL | Supabase, Production |
| `VITE_SUPABASE_ANON_KEY` | Yes (used in `src/lib/supabase.ts:5`) | Supabase anonymous API key | Supabase, Auth, Production |

**Additional env vars found:**
- `GOOGLE_OAUTH_CLIENT_ID` — hardcoded in `src/main.tsx:9` as `Client_ID` (NOT in env vars — this is a security concern but out of scope for migration)

**Note:** `.env` files are gitignored and not present in the repository. No `.env.example` or `.env.local` files exist.

### 10. Package Dependency Audit

#### Supabase-related

| Package | Version | Purpose | Migration impact |
|---|---|---|---|
| `@supabase/supabase-js` | `^2.97.0` | Supabase client SDK | REMOVE — replaced by Neon + custom API |

Transitive Supabase packages (auto-installed, will be removed with `@supabase/supabase-js`):
- `@supabase/auth-js` `2.97.0`
- `@supabase/functions-js` `2.97.0`
- `@supabase/postgrest-js` `2.97.0`
- `@supabase/realtime-js` `2.97.0`
- `@supabase/storage-js` `2.97.0`

#### Auth-related

| Package | Version | Purpose | Migration impact |
|---|---|---|---|
| `@react-oauth/google` | `^0.13.4` | Google OAuth provider (wrapped but unused) | Evaluate — may keep or remove |
| `jwt-decode` | `^4.0.0` | JWT token decoding (imported but not visibly used in source) | Evaluate — may be unused |

#### Database/API-related

| Package | Version | Purpose | Migration impact |
|---|---|---|---|
| `@tanstack/react-query` | `^5.83.0` | Data fetching/caching | KEEP — still needed |
| `react-router-dom` | `^6.30.3` | Client-side routing | KEEP |

#### Packages to potentially ADD in later sprints
- PostgreSQL client (e.g., `@neondatabase/serverless` or `pg`)
- New auth library (TBD based on Sprint 3 decision)

### 11. Build / Test Baseline

#### `npm run lint`
- **Result:** 12 errors, 11 warnings
- **Errors:** All in generated files (`dev-dist/workbox-*.js`, `components/ui/*.tsx`, `tailwind.config.ts`)
  - `dev-dist/workbox-*.js` — 9 errors from auto-generated workbox PWA file
  - `components/ui/command.tsx` — 1 error (`@typescript-eslint/no-empty-object-type`)
  - `components/ui/textarea.tsx` — 1 error (`@typescript-eslint/no-empty-object-type`)
  - `tailwind.config.ts` — 1 error (`@typescript-eslint/no-require-imports`)
- **Warnings:** Mostly `react-refresh/only-export-components` in UI components
- **Conclusion:** All lint issues are pre-existing in generated/shadcn-ui files. No application code lint errors.

#### `npm test`
- **Result:** 1 test file, 1 test — PASSED
- **Test:** `src/test/example.test.ts` — placeholder test (`expect(true).toBe(true)`)
- **Conclusion:** Test infrastructure works but has no meaningful tests

#### `npm run build`
- **Result:** BUILD SUCCESSFUL
- **Output:** `dist/` directory with PWA service worker
- **Warnings:**
  - CSS `@import` order warning (pre-existing)
  - Large chunk size warning (612 KB, from all shadcn-ui components bundled together)
  - Browserslist data 7 months old
- **Output files:**
  - `dist/index.html` (1.76 KB)
  - `dist/assets/index-CgdeM4CO.css` (64 KB)
  - `dist/assets/index-Bmk30fbJ.js` (612 KB)
  - `dist/sw.js` + `dist/workbox-8c29f6e4.js` (PWA)

**Build baseline: Application builds and all pre-existing checks pass.**

### 12. Migration Risks

| Risk | Severity | Detail |
|---|---|---|
| User ID mapping | HIGH | Supabase Auth user IDs must be mapped to new Neon Auth user IDs during migration |
| RLS behavior replication | HIGH | Current app relies on Supabase RLS for security; must replicate in API layer |
| `created_at` discrepancy | MEDIUM | TypeScript `Transaction` type has `created_at` but Supabase `transactions` table does not — resolve during Sprint 2 or Sprint 5 |
| GoogleOAuthProvider unused | LOW | `@react-oauth/google` wraps app but isn't used by login flow — cleanup opportunity |
| Google Client ID hardcoded | LOW | OAuth client ID is in source code, not env var — security concern but out of scope |
| Manual cascade in deleteBorrower | MEDIUM | App manually deletes transactions before borrower (no DB-level CASCADE) — must preserve this behavior or add DB-level CASCADE |
| No `.env.example` file | LOW | New developers won't know what env vars are needed |

### 13. Files Expected to Change Later

| File | Sprint | Change |
|---|---|---|
| `src/lib/supabase.ts` | 2-3 | Replace with new DB client |
| `src/lib/store.ts` | 4-7 | Rewrite all operations to use new API |
| `src/App.tsx` | 6 | Remove Supabase auth check, update imports |
| `src/pages/Login.tsx` | 3, 6 | Replace Supabase OAuth with new auth |
| `src/components/ProtectedRoute.tsx` | 6 | Replace session handling |
| `src/components/UserMenu.tsx` | 6 | Replace session handling, remove SupabaseUser type |
| `src/main.tsx` | 3 | Update/remove GoogleOAuthProvider |
| `package.json` | 2-4 | Remove `@supabase/supabase-js`, add new deps |
| `src/types/index.ts` | 4 | Possibly adjust types |
| `.env` / env vars | 2, 6 | Replace Supabase vars with Neon vars |

**Files that will NOT need changes** (call store.ts functions indirectly, not Supabase directly):
- `src/pages/Index.tsx`
- `src/pages/BorrowerPage.tsx`
- `src/components/AddBorrowerDialog.tsx`
- `src/components/AddTransactionDialog.tsx`
- `src/components/EditBorrowerDialog.tsx`
- `src/components/EditTransactionDialog.tsx`
- `src/components/TransactionTimeline.tsx`
- `src/components/BorrowerList.tsx`
- `src/components/StatsCards.tsx`
- `src/components/ConfirmDialog.tsx`
- All `src/components/ui/*` (shadcn)

---

## Files Modified During Sprint 1

**Created:**
- `CASH_TRACK_MIGRATION.md` (this file)

**Modified:** None

## Files Modified During Sprint 2

**Created:**
- `migrations/001_initial_schema.sql` — reproducible migration SQL (corrected)

**Modified:**
- `CASH_TRACK_MIGRATION.md` — Sprint 2 documented

**Confirmed NOT modified:**
- No application source files
- No frontend code
- No authentication code
- No Supabase configuration
- No production data migrated

## Files Modified During Sprint 3

**Created:**
- `src/lib/neon-auth.ts` — Neon Auth client configuration
- `src/pages/AuthTest.tsx` — isolated auth test page
- `.env.example` — environment variable documentation

**Modified:**
- `src/App.tsx` — added AuthTest import and `/auth-test` route
- `package.json` / `package-lock.json` — added `@neondatabase/neon-js@0.7.0-beta`
- `CASH_TRACK_MIGRATION.md` — Sprint 3 documented

**Confirmed NOT modified:**
- `src/lib/supabase.ts` — unchanged
- `src/lib/store.ts` — unchanged
- `src/pages/Login.tsx` — unchanged
- `src/components/ProtectedRoute.tsx` — unchanged
- `src/components/UserMenu.tsx` — unchanged
- `src/main.tsx` — unchanged
- `src/types/index.ts` — unchanged
- `migrations/001_initial_schema.sql` — unchanged
- No Supabase configuration changed
- No production data migrated

## Files NOT Modified

Confirmed: No application logic, authentication, database configuration, or production data was modified during Sprint 1. Only this migration tracking file was created.

The `npm install` command was run to install existing dependencies from `package.json` for build/test baseline — this did not modify `package.json` or any source files.

---

## Risks / Unknowns

1. **`created_at` on transactions table:** TypeScript `Transaction` type declares it (`src/types/index.ts:19`) but the Supabase `transactions` table does NOT have this column. This is a TypeScript/schema mismatch to resolve during Sprint 2 or Sprint 5.
2. **Multiple user IDs in database:** How many users exist? Is this single-user or multi-user? If multi-user, user ID mapping during migration is critical.
3. **Supabase SQL Editor access:** Must export full data via `SELECT * FROM borrowers/transactions` before Supabase project is paused.
4. **Neon Auth Google OAuth compatibility:** Verify Neon Auth supports Google OAuth with the same client ID.
5. **PWA service worker:** Will the service worker need reconfiguration after the migration? Vercel deployment should handle this.
6. **`@react-oauth/google` and `jwt-decode`:** Both appear unused — confirm before removing in later sprint.
7. **RLS policies:** Policies exist in Supabase dashboard only, not in code. Must recreate equivalent security in the new architecture.

---

## Decisions

| Decision | Sprint | Rationale |
|---|---|---|
| Sprint 1 is audit-only | 1 | Establish baseline before any changes |
| Do not install Neon deps yet | 1 | Premature until architecture is decided in Sprint 2 |
| Do not create .env.example | 1 | Out of scope for audit sprint |
| Document all findings in this file | 1 | Single source of truth for migration progress |
| Neon schema omits `created_at` on transactions | 2 | Match real Supabase schema (column does not exist in Supabase despite TypeScript type) |
| Added CHECK constraint on `type` column | 2 | Data integrity — only `lent`/`received` values allowed (enforced by app code, now enforced by DB too) |
| Foreign key with default RESTRICT | 2 | Matches current app behavior (manual cascade in deleteBorrower) |
| API key auth instead of browser OAuth | 2 | Browser auth timed out; API key is more reliable for CLI automation |
| Corrected 4 column defaults post-creation | 2 | Initial schema missed defaults present in Supabase source; corrected via ALTER TABLE on empty tables |
| Use Neon shared Google OAuth app | 3 | Simpler setup for Sprint 3; custom Google client can be configured later if needed |
| Install @neondatabase/neon-js (not standalone @neondatabase/auth) | 3 | Provides both Auth and Data API in one package — needed for future Sprint 4+ |
| Isolated /auth-test route outside ProtectedRoute | 3 | Does not interfere with existing Supabase auth flow during migration |
| Create .env.example | 3 | Document required env vars for new developers |
| Server-side auth verifies via upstream `get-session` | 4 | Delegates session validation to managed Neon Auth using the exact mechanism `@neondatabase/auth/server` uses internally (`fetchSessionWithCookie`); no JWKS parsing or key management; requires only `NEON_AUTH_URL` |
| Use `pg` Pool + parameterized SQL | 4 | Neon-compatible; every user-influenced value is a bound parameter — no string concatenation into SQL |
| Accept session via Bearer header or session-token cookie | 4 | `Authorization: Bearer <session_token>` or `__Secure-neon-auth.session_token` / `neon-auth.session_token` cookie; both forwarded upstream for validation |
| No CORS headers added | 4 | API is same-origin on Vercel; the build emits no `Access-Control-Allow-Origin` — no permissive CORS requirement demonstrated |
| Keep manual cascade in API deleteBorrower | 4 | Preserve existing app behavior (transactions then borrower), executed inside a DB transaction with ownership checks; no DB-level `ON DELETE CASCADE` added |
| Validate `date` as `YYYY-MM-DD`, `time` as `HH:MM` | 4 | Matches the formats the existing app forms send (`<input type="date">` / `<input type="time">`) — does not change app behavior |
| Removed `jose`, left `pg`/`@types/pg`/`@vercel/node` | 4 | After switching to upstream `get-session` verification, `jose` was no longer needed; minimum required dependencies only |
| Fix pre-existing `AuthTest.tsx` type errors | 4 | Only remaining `tsc` failure before Sprint 4 (Sprint 3 file typed `expiresAt` as `string`; SDK returns `Date`). Fixed minimally to unblock full type-check. Not part of Sprint 4 feature scope |

---

## Sprint 2 Detailed Work

### Neon Project

- Project: `morning-recipe-20657117` (name: "CashTrack")
- Region: `aws-ap-southeast-1`
- Branch: `production` (`br-noisy-band-b3y131b1`)
- Database: `neondb`
- Role: `neondb_owner`
- Auth: API key (not browser OAuth — browser auth timed out, API key used instead)

### Schema Created (Corrected)

Migration file: `migrations/001_initial_schema.sql`

#### Table: `borrowers`

```sql
CREATE TABLE IF NOT EXISTS borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | `gen_random_uuid()` | Matches Supabase source default |
| `name` | text | NO | — | |
| `phone` | text | YES | — | |
| `notes` | text | YES | — | |
| `created_at` | timestamptz | YES | `now()` | |

#### Table: `transactions`

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  borrower_id uuid NOT NULL DEFAULT gen_random_uuid() REFERENCES borrowers(id),
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('lent', 'received')),
  date timestamptz DEFAULT now(),
  time text,
  notes text
);
```

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | `gen_random_uuid()` | Matches Supabase source default |
| `borrower_id` | uuid | NO | `gen_random_uuid()` | Foreign key → `borrowers.id` |
| `amount` | numeric | NO | — | |
| `type` | text | NO | — | CHECK constraint: `lent` or `received` |
| `date` | timestamptz | YES | `now()` | Matches Supabase source default |
| `time` | text | YES | — | |
| `notes` | text | YES | — | |

**Schema discrepancy confirmed:** TypeScript `Transaction` interface declares `created_at: string` (`src/types/index.ts:19`) but the Supabase `transactions` table does NOT have this column. The Neon schema intentionally omits it to match the real Supabase schema. This discrepancy must be resolved in a later sprint.

### Schema Correction (Sprint 2 post-completion)

Initial schema was created with missing defaults. The following 4 `ALTER TABLE` statements were applied to match the actual Supabase source schema:

```sql
ALTER TABLE borrowers ALTER COLUMN user_id SET DEFAULT gen_random_uuid();
ALTER TABLE transactions ALTER COLUMN user_id SET DEFAULT gen_random_uuid();
ALTER TABLE transactions ALTER COLUMN borrower_id SET DEFAULT gen_random_uuid();
ALTER TABLE transactions ALTER COLUMN date SET DEFAULT now();
```

| Column | Was | Corrected To |
|---|---|---|
| `borrowers.user_id` | No default | `gen_random_uuid()` |
| `transactions.user_id` | No default | `gen_random_uuid()` |
| `transactions.borrower_id` | No default | `gen_random_uuid()` |
| `transactions.date` | No default | `now()` |

Tables were NOT dropped/recreated. `ALTER TABLE ... ALTER COLUMN ... SET DEFAULT` was used (safe on empty tables).

### Indexes Created

| Index | Table | Column | Purpose |
|---|---|---|---|
| `idx_borrowers_user_id` | `borrowers` | `user_id` | Fast lookup by user (replaces RLS filter) |
| `idx_transactions_user_id` | `transactions` | `user_id` | Fast lookup by user (replaces RLS filter) |
| `idx_transactions_borrower_id` | `transactions` | `borrower_id` | Fast lookup by borrower (FK join support) |

### Constraints Verified

| Table | Constraint Name | Type | Detail |
|---|---|---|---|
| `borrowers` | `borrowers_pkey` | PRIMARY KEY | On `id` |
| `transactions` | `transactions_pkey` | PRIMARY KEY | On `id` |
| `transactions` | `transactions_borrower_id_fkey` | FOREIGN KEY | `borrower_id` → `borrowers(id)` |
| `transactions` | `transactions_type_check` | CHECK | `type IN ('lent', 'received')` |

### Verification Results

All schema elements verified via `information_schema.columns`, `information_schema.table_constraints`, `pg_constraint`, and `pg_indexes` queries against the live Neon production database. All 4 corrected defaults confirmed present.

### Files Created/Modified

**Created:**
- `migrations/001_initial_schema.sql` — reproducible migration SQL (corrected)

**Modified:**
- `CASH_TRACK_MIGRATION.md` — Sprint 2 marked COMPLETED, correction documented

---

## Sprint 3 Detailed Work

### Neon Auth

- **Enabled:** Yes — on existing project `morning-recipe-20657117`, branch `production`
- **Provider:** Managed Better Auth (`better_auth`)
- **Base URL:** `https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth`
- **JWKS URL:** `https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json`
- **Auth Schema:** `neon_auth` (created automatically by Neon Auth)
- **Synced Users Table:** `neon_auth.users_sync` (not yet present — created on first user signup)
- **Configuration status:** Enabled, Google OAuth provider configured (shared Neon app), localhost allowed

#### neon_auth Schema Tables (created by Neon Auth)

| Table | Purpose |
|---|---|
| `neon_auth.user` | User accounts (id, name, email, image, etc.) |
| `neon_auth.session` | Active sessions (token, expiresAt, userId) |
| `neon_auth.account` | OAuth provider account links |
| `neon_auth.verification` | Email/OTP verification tokens |
| `neon_auth.jwks` | JSON Web Key Sets |
| `neon_auth.organization` | Organization management |
| `neon_auth.member` | Organization membership |
| `neon_auth.invitation` | Organization invitations |
| `neon_auth.project_config` | Project configuration |

**Confirmed NOT modified:**
- `public.borrowers` — untouched
- `public.transactions` — untouched

### Google OAuth

- **Provider status:** Configured using Neon's **shared** Google OAuth app
- **Provider type:** `google` (shared — shows Neon branding on consent screen)
- **Custom client reuse:** The existing Google OAuth client ID (`1025090742622-...`) in `src/main.tsx` was NOT used. Neon Auth uses its own shared OAuth app by default. To use a custom Google client instead, run: `npx neon neon-auth oauth-provider update --provider-id google --oauth-client-id <CLIENT_ID> --oauth-client-secret <SECRET>`
- **Trusted domains:** None configured yet (localhost is allowed by default)
- **Redirect URI requirements:** The `callbackURL` parameter in `signIn.social()` specifies where the user is redirected after Google auth. Must be in trusted domains for production.
- **Manual Google Console changes required:** None for shared Neon app. If switching to custom Google client: add `https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/*` as an authorized redirect URI in Google Cloud Console.
- **DO NOT expose or print the actual Google client secret in this document.**

### User ID

- **Neon Auth user ID format:** `uuid` (PostgreSQL `uuid` type, `DEFAULT gen_random_uuid()`)
- **UUID compatibility result:** FULLY COMPATIBLE with `borrowers.user_id` (uuid) and `transactions.user_id` (uuid)
- **neon_auth.user schema:**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `name` | text | NO | — |
| `email` | text | NO | — |
| `emailVerified` | boolean | NO | — |
| `image` | text | YES | — |
| `createdAt` | timestamptz | NO | `CURRENT_TIMESTAMP` |
| `updatedAt` | timestamptz | NO | `CURRENT_TIMESTAMP` |
| `role` | text | YES | — |
| `banned` | boolean | YES | — |
| `banReason` | text | YES | — |
| `banExpires` | timestamptz | YES | — |

- **Implications:** Neon Auth user IDs are UUIDs. They can be stored directly in `borrowers.user_id` and `transactions.user_id` without type conversion. However, existing Supabase Auth user IDs are different UUIDs — mapping will be required during Sprint 5 data migration.

### Session

- **Login mechanism:** `authClient.signIn.social({ provider: 'google', callbackURL: '...' })` — redirects to Google OAuth, then back to the app
- **Session mechanism:** `authClient.getSession()` — returns cached session if available, auto-refreshes expired tokens. Session stored in browser by Better Auth client.
- **Logout:** `authClient.signOut()` — clears local session cache, notifies other tabs
- **User retrieval:** `result.data.user` from `getSession()` — contains `id`, `email`, `name`, `image`
- **OAuth callback:** After Google auth, user is redirected to `callbackURL`. SDK picks up session automatically.
- **Session persistence:** Managed by Better Auth client (browser storage)
- **Session refresh:** Automatic via `getSession()` — expired tokens are refreshed
- **Unauthenticated state:** `getSession()` returns `{ data: { session: null, user: null } }`

### Environment Variables

| Variable | Client-safe | Purpose | Required |
|---|---|---|---|
| `VITE_NEON_AUTH_URL` | Yes (VITE_*) | Neon Auth base URL for client SDK | Yes — for Neon Auth |
| `VITE_SUPABASE_URL` | Yes (VITE_*) | Supabase project URL | Yes — existing Supabase flow (not yet replaced) |
| `VITE_SUPABASE_ANON_KEY` | Yes (VITE_*) | Supabase anonymous key | Yes — existing Supabase flow (not yet replaced) |

**Note:** The Google OAuth client ID is currently hardcoded in `src/main.tsx` (not in env vars). This is a pre-existing security concern documented in Sprint 1. It does NOT need to be in env vars for Neon Auth since Neon's shared OAuth app is used.

**If switching to a custom Google client in the future:**
- `GOOGLE_CLIENT_ID` — server-side only (or VITE_ if needed client-side)
- `GOOGLE_CLIENT_SECRET` — **MUST remain server-side only** (never VITE_*)
- These would only be needed if not using Neon's shared OAuth app

**`.env.example` created** with placeholder names.

### Testing

#### Tests Performed

| Test | Result |
|---|---|
| Neon Auth enabled on production branch | PASS — `neon-auth enable` succeeded |
| neon_auth schema created | PASS — 9 tables verified in `neon_auth` schema |
| public.borrowers untouched | PASS — table exists with correct schema |
| public.transactions untouched | PASS — table exists with correct schema |
| Google OAuth provider configured | PASS — shared Neon app (`google`, type: shared) |
| localhost allowed | PASS — default `true` |
| `@neondatabase/neon-js@0.7.0-beta` installed | PASS |
| Auth client config created (`src/lib/neon-auth.ts`) | PASS |
| Isolated test page created (`src/pages/AuthTest.tsx`) | PASS |
| Route `/auth-test` added to App.tsx | PASS |
| Build succeeds | PASS |
| Existing test passes | PASS |
| User ID UUID compatibility | PASS — `neon_auth.user.id` is `uuid` |

#### Manual Steps Still Required

1. **Set `VITE_NEON_AUTH_URL`** in `.env`:
   ```
   VITE_NEON_AUTH_URL=https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth
   ```
2. **Run `npm run dev`** and open `http://localhost:5173/auth-test`
3. **Click "Sign in with Google (Neon Auth)"** — complete Google OAuth flow
4. **Verify** the test page shows: user ID (UUID), email, name, avatar
5. **Click "Sign Out"** — verify session is cleared
6. **For production Vercel deployment:** add the Vercel domain as a trusted domain:
   ```
   npx neon neon-auth domain add <vercel-domain> --project-id morning-recipe-20657117 --branch production
   ```

**Note:** Google OAuth end-to-end test cannot be completed in this sprint because it requires manual browser interaction. The test page is created and ready for manual verification.

### Security Model (Future API Layer)

Neon Auth identifies the authenticated user via:
- `getSession()` returns `user.id` (UUID)
- This UUID can be used as `borrowers.user_id` and `transactions.user_id`
- The future API layer must enforce: `WHERE user_id = <authenticated_user_id>` on all queries
- This replicates the current Supabase RLS behavior: `auth.uid() = user_id`

### Files Created/Modified

**Created:**
- `src/lib/neon-auth.ts` — Neon Auth client configuration
- `src/pages/AuthTest.tsx` — isolated auth test page (NOT integrated into main app flow)
- `.env.example` — environment variable documentation

**Modified:**
- `src/App.tsx` — added `AuthTest` import and `/auth-test` route (public, outside ProtectedRoute)
- `package.json` / `package-lock.json` — added `@neondatabase/neon-js@0.7.0-beta`
- `CASH_TRACK_MIGRATION.md` — Sprint 3 documented

**NOT modified:**
- `src/lib/supabase.ts` — unchanged
- `src/lib/store.ts` — unchanged
- `src/pages/Login.tsx` — unchanged
- `src/components/ProtectedRoute.tsx` — unchanged
- `src/components/UserMenu.tsx` — unchanged
- `src/main.tsx` — unchanged (GoogleOAuthProvider still wraps app, hardcoded client ID untouched)
- `src/types/index.ts` — unchanged
- `migrations/001_initial_schema.sql` — unchanged

### Safety Confirmation

- **Supabase database unchanged** — no queries sent to Supabase
- **Supabase production data unchanged** — no data read or modified
- **Existing user IDs unchanged** — no user_id values modified
- **No production data migrated** — borrowers and transactions tables remain empty in Neon
- **borrowers unchanged** — no schema or data changes
- **transactions unchanged** — no schema or data changes
- **Frontend production auth flow NOT replaced** — Login.tsx, ProtectedRoute.tsx, UserMenu.tsx all still use Supabase Auth
- **Sprint 4 NOT started** — no API layer or data access changes

---

## Sprint 4 Detailed Work

### 1. API Architecture

New server-side API layer coexists with the existing Supabase frontend flow (unchanged during this sprint). The architecture now has the target shape:

```
React/Vite frontend (still on Supabase during Sprint 4)
        ↓   (Sprint 7 will point the store at the API)
Vercel API/serverless functions   /api/...
        ↓
Neon Auth session verification   (upstream get-session via NEON_AUTH_URL)
        ↓
Neon PostgreSQL                  (public.borrowers / public.transactions)
```

### 2. Server-Side Database Connection

File: `api/_lib/db.ts`

- Uses `pg` (`pg.Pool`) against `process.env.DATABASE_URL` with `ssl: { rejectUnauthorized: false }` (Neon requires TLS).
- `DATABASE_URL` is a **server-side only** environment variable. It is never exposed through any `VITE_*` variable and never referenced in browser code.
- Every query in every handler uses parameterized SQL (`$1, $2, ...` placeholders). User-influenced values are only ever bound parameters — never concatenated into SQL text.

### 3. Authentication / Session Verification

File: `api/_lib/auth.ts`

Approach (no invented verification):

1. The session token is read from the request — either `Authorization: Bearer <session_token>` or the Neon Auth session-token cookie (`__Secure-neon-auth.session_token`, or its non-secure-prefix form `neon-auth.session_token` used over plain HTTP).
2. The token is forwarded as a cookie to the managed Neon Auth `get-session` endpoint: `GET <NEON_AUTH_URL>/get-session`. This is the **same documented mechanism the official `@neondatabase/auth/server` toolkit uses internally** (its `fetchSessionWithCookie` helper — verified against the installed package source). Session validation, token expiry, and key rotation are all handled by the managed server; nothing is faked locally.
3. The response gives the verified session + user. The authenticated user id is taken from `user.id`.
4. That id is used for every database query. A `user_id` supplied in the request body is **never** trusted.

- No session → HTTP 401 (`AuthError` with status, surfaced by handlers).
- `NEON_AUTH_URL` not configured on the server → HTTP 500 (`AuthError` status 500).
- Unverified/invalid token → HTTP 401 `{ "error": "Unauthorized" }`.

### 4. Implemented Endpoints

| Method | Route | File | Behavior |
|---|---|---|---|
| GET | `/api/borrowers` | `api/borrowers/index.ts` | `SELECT * FROM borrowers WHERE user_id = $1 ORDER BY created_at DESC` — only the authenticated user's borrowers |
| POST | `/api/borrowers` | `api/borrowers/index.ts` | Insert with `user_id = <verified session user id>`; returns 201 + created row |
| PATCH | `/api/borrowers/:id` | `api/borrowers/[id]/index.ts` | Update `name`/`phone`/`notes` with `WHERE id = $n AND user_id = $n`; 404 if not found/not owned |
| DELETE | `/api/borrowers/:id` | `api/borrowers/[id]/index.ts` | Manual cascade inside a transaction: delete child transactions (`WHERE borrower_id = $1 AND user_id = $2`), then the borrower (`WHERE id = $1 AND user_id = $2`); COMMIT only if the borrower was owned; ROLLBACK + 404 otherwise |
| GET | `/api/borrowers/:borrowerId/transactions` | `api/borrowers/[id]/transactions.ts` | `SELECT t.* FROM transactions t JOIN borrowers b ON t.borrower_id = b.id WHERE t.borrower_id = $1 AND b.user_id = $2 ORDER BY t.date DESC NULLS LAST, t.time DESC NULLS LAST` — ownership enforced through the borrower's `user_id` |
| POST | `/api/transactions` | `api/transactions/index.ts` | Verify borrower ownership first (`SELECT id FROM borrowers WHERE id = $1 AND user_id = $2` — 404 if not owned), then insert with verified user id; returns 201 + created row |
| PATCH | `/api/transactions/:id` | `api/transactions/[id]/index.ts` | Update `amount`/`date`/`time`/`notes` with `WHERE id = $n AND user_id = $n`; 404 if not found/not owned |
| DELETE | `/api/transactions/:id` | `api/transactions/[id]/index.ts` | `DELETE FROM transactions WHERE id = $1 AND user_id = $2`; 404 if not found/not owned |

Route layout matches Vercel's file-system routing. Each handler dispatches on `req.method`; unsupported methods return **405**.

### 5. Request / Response Behavior

- Responses are JSON via `api/_lib/response.ts`: `json(res, status, data)` and `error(res, status, message)`.
- Error body is always `{ "error": "Human-readable message" }`.
- Success bodies for GET return the array/row(s); mutations return the created row (201), or `{ "success": true }` (200), and borrower DELETE additionally returns `{ "deletedTransactions": N }`.

### 6. Ownership / Security Enforcement

Replicates Supabase RLS (`auth.uid() = user_id`) at the application layer:

- List/read: filtered by verified user id.
- Update/delete (borrower + transaction): `WHERE ... AND user_id = <verified id>`.
- Create: `user_id` is always the verified session id; the server never reads `user_id` from the request body.
- Transaction creation: borrower must belong to the verified user (checked before insert).
- Transactions-by-borrower: ownership enforced via the borrower's `user_id` (join), not just `borrower_id`.

### 7. Validation

File: `api/_lib/validation.ts` (zod schemas)

- `createBorrowerSchema`: `name` required non-empty string (≤255), `phone` optional (≤50), `notes` optional (≤1000).
- `updateBorrowerSchema`: partial update of the same fields.
- `createTransactionSchema`: `borrower_id` required valid UUID; `amount` required positive number; `type` must be exactly `lent` or `received`; `date` required matching `YYYY-MM-DD` (the format the app's `<input type="date">` sends); `time` optional matching `HH:MM`; `notes` optional (≤1000).
- `updateTransactionSchema`: partial update of `amount`/`date`/`time`/`notes`.

Status codes: 400 invalid input, 401 unauthenticated, 404 not found/inaccessible, 405 method not allowed, 500 unexpected server error. (403 not emitted — a resource you cannot access is treated as 404 to avoid leaking existence.)

### 8. Error Handling

- Handlers distinguish `AuthError` (returns its own status/message) from unexpected errors (logged server-side, client receives generic `{ "error": "Internal server error" }`).
- No `DATABASE_URL`, SQL text, stack traces, or credentials are ever returned to the client.

### 9. CORS Behavior

- No CORS headers are emitted by the API. Requests are intended to be same-origin on Vercel (SPA at domain X calls `/api/*` on domain X).
- No permissive `Access-Control-Allow-Origin: *`. If cross-origin access is ever required, it must be added deliberately with an allow-list and documented — none was demonstrated during this sprint.

### 10. Manual Cascade Behavior

- `deleteBorrower` preserves the existing application's manual cascade: delete the borrower's transactions first, then the borrower.
- Both deletes are scoped by `user_id`; wrapped in `BEGIN` / `COMMIT` (or `ROLLBACK` when the borrower isn't owned or an error occurs).
- No `ON DELETE CASCADE` added to the schema (no blocker required it).

### 11. Tests Created

- `src/test/api-auth.test.ts` (6 tests) — real `auth.ts`: Bearer extraction, `__Secure-neon-auth.session_token` cookie extraction, http-prefix cookie extraction, no-token → null, empty Bearer → null, `AuthError` default status.
- `src/test/api-validation.test.ts` (16 tests) — real validation schemas: valid/invalid borrower creation, partial updates, transaction type/amount/uuid/date/missing-field rejection.
- `src/test/api-handlers.test.ts` (24 tests) — endpoints with mocked `verifySession` and `pg` pool:
  - unauthenticated → 401 (borrowers list, borrower PATCH)
  - authenticated borrower list (query filtered by session user id)
  - create borrower (uses authenticated id; `user_id` spoofing attempt cannot change ownership)
  - update borrower (200 / 404 not-owned)
  - delete borrower: manual cascade call order inside a transaction; rollback + 404 when not owned
  - list transactions by borrower (join + ownership params asserted)
  - create transaction (201; 404 when borrower not owned; spoofed `user_id` rejected; 400 for invalid type/amount/uuid/date)
  - update/delete transaction (200; 404 for not-owned/missing; delete scoped by user id)
  - 405 for unsupported methods
  - SQL injection-style name (`'...'; DROP TABLE borrowers; --`) passed as a bound parameter, never interpolated into the SQL string
  - plus `src/test/example.test.ts` (1 pre-existing placeholder)

Total: **47 tests, 4 files, all passing** (was 1 placeholder test at Sprint 1).

### 12. Test Results

| Check | Sprint 1 baseline | Sprint 4 result |
|---|---|---|
| `npm test` | 1 test passed | **4 files, 47 tests passed** |
| `npm run build` | PASSED | **PASSED** (same pre-existing warnings: CSS `@import` order, >500 kB chunk, browserslist data age) |
| `npm run lint` | 12 errors, 11 warnings (all pre-existing/generated) | **12 errors, 11 warnings — identical pre-existing set** (workbox generated file, `ui/command.tsx`, `ui/textarea.tsx`, `tailwind.config.ts`; warnings are shadcn `react-refresh` + unused eslint-disable directives). **Zero issues in `api/` or test files.** |
| `npx tsc -b` | not previously run | **PASSED** after fixing the one pre-existing `AuthTest.tsx` type error (below) |

**Honest scope note:** All endpoint tests are mock-based (mocked session verification and mocked `pg` pool) and were actually executed — they assert behavior, SQL parameterization, ownership filtering, and spoofing resistance. They are **not** live-database integration tests. Live E2E (real Google OAuth login → real session token → real Neon queries) is documented as a manual step because it requires a human browser interaction for OAuth and would exercise the production Neon database; no test branch/database was provisioned for this sprint. Do not interpret the 47 passing tests as a live end-to-end certification.

### 13. Files Created

- `api/_lib/db.ts` — Neon `pg` connection pool
- `api/_lib/auth.ts` — session-token extraction + upstream `get-session` verification (`AuthError`)
- `api/_lib/response.ts` — `json` / `error` / `methodNotAllowed` helpers
- `api/_lib/validation.ts` — zod schemas
- `api/borrowers/index.ts` — GET list + POST create
- `api/borrowers/[id]/index.ts` — PATCH + DELETE (manual cascade in transaction)
- `api/borrowers/[id]/transactions.ts` — GET transactions by owned borrower
- `api/transactions/index.ts` — POST create (ownership-checked)
- `api/transactions/[id]/index.ts` — PATCH + DELETE
- `tsconfig.api.json` — TypeScript project for `api/` (NodeNext ESM, server-oriented)
- `src/test/api-auth.test.ts`
- `src/test/api-validation.test.ts`
- `src/test/api-handlers.test.ts`

### 14. Files Modified

- `package.json` / `package-lock.json` — added `pg`, `@types/pg` (dev), `@vercel/node` (dev); `jose` added (dev) then removed after the auth approach switched to upstream `get-session`
- `tsconfig.json` — added `./tsconfig.api.json` reference
- `vitest.config.ts` — added `resolve.extensionAlias: { ".js": [".ts", ".tsx", ".js"] }` so tests can import API modules that use ESM `.js` specifiers
- `.env.example` — added server-side `DATABASE_URL` and `NEON_AUTH_URL` (initially wrote `NEON_AUTH_JWKS_URL`, corrected to `NEON_AUTH_URL` once the verification approach was finalized)
- `src/pages/AuthTest.tsx` — **pre-existing type error fix** (Sprint 3 file): the Neon SDK returns `expiresAt` as `Date`, but the local `SessionInfo` interface declared `string`. Changed the interface to `Date` and rendered `expiresAt.toISOString()`. Required only so `npx tsc -b` could pass; not part of Sprint 4 feature scope.
- `CASH_TRACK_MIGRATION.md` — this report

### 15. Files Intentionally NOT Modified

- `src/lib/store.ts` — unchanged, still Supabase-backed (Sprint 7 will switch it to the API)
- `src/lib/supabase.ts` — unchanged
- `src/lib/neon-auth.ts` — unchanged
- `src/pages/Login.tsx` — unchanged (Supabase Google OAuth still the production login)
- `src/components/ProtectedRoute.tsx` — unchanged
- `src/components/UserMenu.tsx` — unchanged
- `src/main.tsx` — unchanged
- `src/types/index.ts` — unchanged (`Transaction.created_at` discrepancy intentionally not "fixed")
- `migrations/001_initial_schema.sql` — unchanged (no `created_at` added to `transactions`, no cascade, no new columns)
- Supabase configuration / RLS — untouched

### 16. Environment Variables Required (server-side only, never `VITE_`)

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (used by `api/_lib/db.ts`) | Yes |
| `NEON_AUTH_URL` | Neon Auth base URL, e.g. `https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth` (used by `api/_lib/auth.ts` for `get-session`) | Yes |

To deploy on Vercel, set these in the Vercel project settings (not in the repo, not in client bundling). The browser never sees either value.

### 17. Blocker

None. Live-database integration testing remains a **manual step** (see §12) because it requires a real Neon Auth session from the browser OAuth flow and would run queries against the production Neon database.

### 18. Safety Confirmation

- Supabase production data unchanged
- Supabase RLS unchanged
- Supabase auth flow unchanged (Login/ProtectedRoute/UserMenu/store still on Supabase)
- No production data migrated
- No Supabase tables deleted
- Neon schema/data not destructively changed (API only reads/writes through the same tables, nothing touched during this sprint — tests are mock-based)
- No database credentials in `VITE_*`/client code; `DATABASE_URL` + `NEON_AUTH_URL` are server-only
- API never trusts a browser-supplied `user_id`; verified session id is used everywhere
- API enforces authenticated-user ownership on every query (RLS equivalent)
- Sprint 5 was NOT started

---

## Sprint 5 Detailed Work

**Status: COMPLETED — Decision Change (fresh Neon start, NOT a data migration).**

### 1. Decision: Fresh Neon Start

- Sprint 5 originally began as a **data migration** of the existing Supabase `borrowers` / `transactions` into Neon.
- Complete Supabase exports (`borrowers_rows.csv`, `transactions_rows.csv`) were received and audited (11 borrowers / 51 transactions / 4 distinct Supabase users; all references and ownership consistent). Migration tooling (`scripts/migrate-supabase-to-neon.js`, `scripts/user-mapping.json`) was designed, built, and dry-run-validated.
- Exploration surfaced a blocker: **no Neon Auth users exist** (verified live: `neon_auth.user` = 0 rows, `neon_auth.account` = 0 rows), so a verified Supabase → Neon user mapping could not be produced without guessing or creating artificial users — which the migration contract forbids.
- **Final decision:** the project starts **fresh in Neon**. The existing Supabase data is intentionally **NOT migrated** and is treated as legacy data.

### 2. What Is NOT Happening

- No Supabase users are migrated or mapped to Neon Auth users.
- No `borrowers` / `transactions` rows from the Supabase exports are copied into Neon.
- No Supabase → Neon Auth user mapping exists and none is required.
- No fake/manual Neon Auth users are created.
- No Supabase data is deleted, modified, truncated, or otherwise changed.
- The existing Neon schema (`migrations/001_initial_schema.sql`) is not deleted or modified.

### 3. End State (verified)

- Neon `public.borrowers` — **empty (0 rows, verified via read-only connection)**.
- Neon `public.transactions` — **empty (0 rows, verified via read-only connection)**.
- `neon_auth.user` — 0 rows; `neon_auth.account` — 0 rows.
- Supabase — **untouched**; its data remains the only production data.
- Sprint 4 API layer (`api/`) — **intact and unchanged** (all 9 source files present).
- No destructive SQL was executed against Neon or Supabase; the only Neon connections during this sprint were read-only inspections.

### 4. Abandoned Tooling — Removed

The following migration-only artifacts were created for the abandoned data migration and have been **removed**, because they are no longer useful (nothing in the application or `api/` referenced them):

- `borrowers_rows.csv` (Supabase export — contained PII)
- `transactions_rows.csv` (Supabase export — contained PII)
- `scripts/migrate-supabase-to-neon.js`
- `scripts/user-mapping.json`
- `scripts/` directory (left empty; removed)

No application or API code was removed or modified. The migration script was **never executed**.

### 5. How Data Is Created Going Forward

- A real Neon Auth account will be created through the normal **Neon Auth Google OAuth sign-in flow** (the built-in `/auth-test` page now, or the production login once Sprint 6 wires auth in) — no artificial users.
- Borrowers and transactions will be **manually added by the user through the application** after the frontend is switched to Neon (Sprint 6 — auth, Sprint 7 — database).
- Neon begins as the empty production database and is populated naturally through the app.

### 6. Verification (performed before marking COMPLETED)

| Check | Result |
|---|---|
| Neon `public.borrowers` empty | PASS — 0 rows (read-only query) |
| Neon `public.transactions` empty | PASS — 0 rows (read-only query) |
| No destructive SQL executed | PASS — only read-only `SELECT`s on Neon; nothing sent to Supabase |
| No Supabase data modified | PASS — Supabase never connected to from this repo |
| Sprint 4 API intact | PASS — all 9 `api/**/*.ts` files present, unchanged |
| `npm test` | PASS — 47 tests, 4 files |
| `npm run build` | PASS (same pre-existing warnings as Sprint 4) |
| `npx tsc -b` | PASS |
| `npm run lint` | PASS — 12 errors / 11 warnings, identical pre-existing baseline, zero in `api/` or tests |

### 7. Safety Confirmation

- Supabase production data unchanged (the exports were copies and have been deleted locally).
- Supabase RLS / auth / configuration unchanged.
- Neon schema unchanged; Neon tables remain empty.
- No `TRUNCATE`, `DELETE`, `UPDATE`, or schema DDL executed anywhere.
- The abandoned migration script was never run.
- Sprint 4 API layer untouched and still in place.
- Frontend auth/database flow untouched by Sprint 5 (auth moved to Neon in Sprint 6; database still Supabase until Sprint 7).
- Sprints 7–10 remain **NOT STARTED** (Sprint 6 completed afterwards).

---

## Sprint 6 Detailed Work

**Status: COMPLETED — Frontend Auth Migration (Supabase Auth → Neon Auth + Google OAuth).**

### 1. Objective

Replace the production frontend authentication — Login, route protection, user menu, app/session hooks — from Supabase Auth + Google OAuth to the existing **Neon Auth + Google OAuth** client (`src/lib/neon-auth.ts`), preserving UI and behavior exactly, while leaving the database layer on Supabase until Sprint 7.

### 2. What Was Changed (auth only)

| File | Change |
|---|---|
| `src/main.tsx` | Removed `GoogleOAuthProvider` wrapper and the hardcoded Google client ID (was unused by the login flow); only `BrowserRouter` remains |
| `src/pages/Login.tsx` | `supabase.auth.signInWithOAuth({ provider: "google" })` → `authClient.signIn.social({ provider: "google", callbackURL: window.location.origin })`; **UI identical** |
| `src/components/ProtectedRoute.tsx` | Replaced Supabase `getSession` + `onAuthStateChange` subscription with a single `authClient.getSession()`; existing loading (`null`) and `<Navigate to="/login" replace />` behavior preserved |
| `src/components/UserMenu.tsx` | Replaced Supabase user/session/subscription with `authClient.getSession()`; avatar from Neon `image` (not `user_metadata.avatar_url`), name/email from Neon user; logout = `authClient.signOut()` then `navigate("/login")` |
| `src/App.tsx` | Removed the `supabase.auth.getSession()` debug block and the `supabase` import; all routes unchanged, `/auth-test` kept |
| `package.json` / `package-lock.json` | Removed `@react-oauth/google` and `jwt-decode` — both confirmed unused (`GoogleOAuthProvider` wrapped the app but the login used Supabase OAuth; `jwt-decode` had zero source references) |

### 3. What Was Intentionally NOT Changed

- `src/lib/store.ts` — stays Supabase-backed (**Sprint 7**). Its `supabase.auth.getUser()` calls (to obtain `user_id` for inserts) remain the only Supabase Auth usage left in the app, and only in the data layer.
- `src/lib/supabase.ts` — unchanged (client still used by `store.ts`).
- `src/lib/neon-auth.ts` — reused as-is: `authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL)`.
- `src/pages/AuthTest.tsx` — kept as the isolated Neon Auth verification page (`/auth-test`) and the manual OAuth test target.
- `src/types/index.ts`, `api/**`, `migrations/001_initial_schema.sql`, `.env.example` — unchanged.
- No database rows created; no test data inserted; no production data touched.

### 4. Security / User ID

- No browser-supplied `user_id` is trusted; the authenticated Neon Auth user (UUID) is the source of identity.
- No server-only values moved into `VITE_*`; the only client env var remains `VITE_NEON_AUTH_URL`.

### 5. Tests Added

`src/test/frontend-auth.test.tsx` — **11 tests**:
- **Login** calls `authClient.signIn.social({ provider: "google", callbackURL: window.location.origin })` on click; no Supabase OAuth involved.
- **ProtectedRoute**: redirects unauthenticated users to `/login`; renders children for an authenticated session; preserves the existing loading state (`null`) while checking.
- **UserMenu**: shows the Neon user's name and avatar image; logout invokes `authClient.signOut()`; renders nothing when unauthenticated.
- **Source checks**: `Login.tsx`, `ProtectedRoute.tsx`, `UserMenu.tsx`, `App.tsx`, `main.tsx` contain no `supabase.auth` / `signInWithOAuth` / `SupabaseUser` / `onAuthStateChange` / `GoogleOAuthProvider` / `@react-oauth/google`.

### 6. Verification Results

| Check | Result |
|---|---|
| `npm test` | PASS — **5 files, 58 tests** (47 baseline + 11 new) |
| `npm run build` | PASS (same pre-existing warnings: >500 kB chunk, CSS import order, browserslist data age) |
| `npx tsc -b` | PASS (one catch fixed: better-auth `email` is optional → `NeonUser.email?` in `UserMenu.tsx`) |
| `npm run lint` | **12 errors / 11 warnings — identical pre-existing baseline**; zero issues reported in the changed files or the new test file |
| `git diff` scope | Only the 5 auth files + `package.json`/lock changed; `api/`, `migrations/`, `src/lib/store.ts`, `src/lib/supabase.ts`, `src/lib/neon-auth.ts` untouched |
| Supabase Auth out of production auth components | Verified by tests + source checks; only `store.ts` (data layer, Sprint 7) still touches `supabase.auth` |

### 7. Manual Steps Still Required (human action — documented, not blockers)

- **Browser Google OAuth sign-in** cannot be automated (requires a human at the Google consent screen). With `VITE_NEON_AUTH_URL` set locally, open `/auth-test` → "Sign in with Google (Neon Auth)" → complete consent → confirm the session/user table and UUID format, then confirm end-to-end: `/login` → Google → protected dashboard, avatar/menu, logout → `/login`.
- **Neon Auth trusted domains:** `allow_localhost=true` and the domains list is currently empty. Before/at production deploy, add the production Vercel domain(s) in the Neon dashboard trusted domains. The production domain is intentionally NOT invented here.
- **Live DB emptiness re-check** could not be re-run this sprint: `.env` is absent locally (gitignored). This is why the Sprint 6 verification relies on `git diff` (no `api/`/`migrations`/data changes) rather than a live query; frontend-only work could not alter the database.

### 8. Transitional State

- Auth = **Neon Auth** (login, route guard, user menu, logout).
- Database = **Supabase** until Sprint 7 (`store.ts`), so `supabase.auth.getUser()` still runs in the data layer to obtain `user_id`.
- On Sprint 7, `store.ts` will switch to the Sprint 4 API endpoints; the last Supabase Auth usage disappears and `@supabase/supabase-js` can be dropped.

### 9. Safety Confirmation

- No Supabase or Neon data modified (frontend-only change; no inserts; API/database code untouched).
- Sprint 4 API layer intact and unchanged.
- Existing UI preserved exactly (no redesign; same buttons, avatars, dropdown, redirects).
- `/auth-test` still available for the manual sign-in verification.
- Sprints 7–10 remain **NOT STARTED**.

---

## Sprint 7 Detailed Work

**Status: COMPLETED — Frontend Database Migration (store.ts now talks to the Sprint 4 API; Supabase fully removed from the frontend).**

### 1. Objective

Replace the last direct-Supabase frontend data access with calls to the existing Vercel API endpoints (`api/*`, created in Sprint 4). The data layer now flows:

```
React UI → src/lib/store.ts → /api/* → (std Neon Auth session verification) → Neon PostgreSQL
```

with **no** `store.ts → Supabase database` path remaining.

### 2. store.ts Migration (`src/lib/store.ts`)

Rewritten as a thin API client. Exported function names and signatures are unchanged, so no UI component needed edits.

| Function | Now calls | Notes |
|---|---|---|
| `getBorrowers` | `GET /api/borrowers` | returns rows as-is |
| `addBorrower` | `POST /api/borrowers` | body `{ name, phone?, notes? }`; **user_id never sent** |
| `updateBorrower` | `PATCH /api/borrowers/:id` | sends `name`, `phone`/`notes` normalized to `""` when cleared (API stores that as `NULL`, matching the old store's `null` behavior) |
| `deleteBorrower` | `DELETE /api/borrowers/:id` | relies on the API's transaction-cascade |
| `getTransactionsByBorrower` | `GET /api/borrowers/:borrowerId/transactions` | response `amount` normalized string→number |
| `addTransaction` | `POST /api/transactions` | body `{ borrower_id, amount, type, date, time?, notes? }`; **user_id never sent**; empty optionals omitted |
| `updateTransaction` | `PATCH /api/transactions/:id` | sends `amount`, `date`, `time` (when present) and `notes` (normalized to `""` to clear) |
| `deleteTransaction` | `DELETE /api/transactions/:id` | — |

Key points:
- Supabase client import and `supabase.auth.getUser()` are gone. The server derives the user from Neon Auth; the client never sends or controls the authoritative `user_id`.
- Small internal helper `apiRequest<T>(path, options)` (same file) does GET/POST/PATCH/DELETE, JSON encode/decode, and HTTP error handling. Non-2xx responses throw `ApiError` using the API's `{ error: ... }` message (fallback: `Request failed with status N`), plus `Network error: could not reach the API` for fetch failures. `ApiError` is exported.
- Same-origin `fetch` with `credentials: "same-origin"` — the browser automatically sends the Neon Auth session cookie (the installed client has **no** `getToken`/`sessionToken`/`getAccessToken` methods to use; cookies are the supported transport — see the API's `extractSessionToken`).
- `amount` normalization: Neon returns NUMERIC as a string via `pg`; `normalizeTransaction` converts it to a number so UI math/formatting behaves as it did under Supabase.
- No `DATABASE_URL`/`NEON_AUTH_URL` and no new `VITE_*` variables are exposed to the browser.

### 3. Transaction Type Correction (`src/types/index.ts`)

- Removed `created_at` from the `Transaction` interface. The Neon/Supabase `transactions` table has no `created_at` column (documented since Sprint 2), and no component reads `transaction.created_at` (verified by search). `Borrower.created_at` stays (the `borrowers` table has the column and the API returns it).
- No DB schema changes were made (nothing added to satisfy the type).

### 4. Supabase Removed from the Frontend

- Deleted `src/lib/supabase.ts`.
- Removed `@supabase/supabase-js` from `package.json` and the lockfile.
- Removed `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env.example`.

### 5. Auth NOT Changed

Sprint 6's Neon Auth implementation is untouched (`src/lib/neon-auth.ts`, `Login.tsx`, `ProtectedRoute.tsx`, `UserMenu.tsx`). No auth SDK methods were invented; authentication relies on the Neon Auth session cookie that the browser already holds.

### 6. Tests Added (`src/test/store.test.ts` — 13 tests, `fetch` mocked)

1. `getBorrowers` → `GET /api/borrowers`
2. `addBorrower` → `POST /api/borrowers` with expected body and **no** `user_id`
3. `updateBorrower` → `PATCH /api/borrowers/:id`
4. `deleteBorrower` → `DELETE /api/borrowers/:id`
5. `getTransactionsByBorrower` → `GET /api/borrowers/:borrowerId/transactions` (+ amount normalization)
6. `addTransaction` → `POST /api/transactions` with expected body, no `user_id`, no Supabase dependency
7. `updateTransaction` → `PATCH /api/transactions/:id`
8. `deleteTransaction` → `DELETE /api/transactions/:id`
9. Non-2xx `{ error }` response → throws `ApiError` with the useful message + status
10. Non-JSON error body → useful fallback message
11. Source check: `store.ts` contains no `supabase`, `@supabase/supabase-js`, `getUser`, or `.from(`; it fetches `/api` endpoints
12–13. Extra: empty optional fields omitted in `addTransaction`; undefined→`""` clearing in `updateBorrower`

Tests are mock-based; **no test connects to Neon and no real records are created**.

### 7. Verification Results

| Check | Result |
|---|---|
| `npm test` | PASS — **6 files, 71 tests** (58 from Sprints 4/6 + 13 new) |
| `npm run build` | PASS (same pre-existing warnings) |
| `npx tsc -b` | PASS |
| `npm run lint` | **12 errors / 11 warnings — identical pre-existing baseline**; zero issues in changed/new files |
| `git diff` scope | Frontend only (`store.ts`, `types/index.ts`, deleted `supabase.ts`, `package.json`/lock, `.env.example`); `api/**`, `migrations/**`, `src/lib/neon-auth.ts`, auth components untouched |

### 8. Remaining Supabase References (intentional)

- `src/lib/store.ts:62` — a comment explaining the conversion ("Supabase behavior it replaced"). Comment text only.
- `src/test/frontend-auth.test.tsx` and `src/test/store.test.ts` — negative assertions (must NOT contain Supabase). Test text only.
- No `@supabase/supabase-js`, no `supabase.auth` usage, no `VITE_SUPABASE_*` anywhere in `src/` or `package.json`/`.env.example`.

### 9. Manual Browser Testing Status

**NOT performed in this environment** (each item requires a human in the browser):
1. Google login 6. Add transaction
2. View borrowers 7. View borrower transactions
3. Add borrower 8. Edit transaction
4. Edit borrower 9. Delete transaction
5. Delete borrower 10. Logout/login again

Neon starts fresh (Sprint 5 decision), so existing Supabase data must NOT be expected in the UI. `npm test` / `build` / `tsc` / `lint` are green, but manual browser testing remains pending and is a documented manual step. For local dev, `vercel dev` (or a `/api` proxy) is required because the plain Vite dev server has no `/api` backend.

### 10. Neon Data Status

- Neon `public.borrowers` / `public.transactions` remain **empty** (0 rows as verified in Sprint 5; no inserts were made in this sprint — `git diff` shows no `api/`/`migrations`/schema changes and frontend code never touches the DB directly).
- No Supabase data was migrated, copied, modified, or deleted.

### 11. Safety Confirmation

- No destructive SQL, no inserts, no fake users, no migration script executed.
- Supabase data untouched.
- Sprint 4 API intact and unchanged.
- Auth unchanged (still Neon Auth).
- UI unchanged (same components, signatures, no redesign).
- Nothing outside Sprint 7's scope was implemented (no Sprint 8 work).

---

## Sprint 8 Detailed Work

**Status: COMPLETED — Full Testing.** Automated verification (tests / typecheck / build / lint), source audit, API security review, and frontend data-flow review all pass. Manual browser and multi-user tests are **PENDING** (require real Google account(s), live Neon credentials, and a deployed/`vercel dev` API — not possible from this environment).

### 1. Sprint Status Confirmed

- Sprints 1–7 COMPLETED (Sprint 5 = fresh Neon start). Sprint 8 was NOT STARTED. Sprints 9–10 NOT STARTED.
- Migration architecture unchanged (no new backend invented, no redesign).

### 2. Automated Test Suite

Command: `npm test`

| Metric | Result |
|---|---|
| Test files | **6** |
| Tests | **72 passed** (was 71 in Sprint 7) |
| Failed | **0** |
| Skipped | **0** |

- 1 test added in Sprint 8 (see §8) with justification.
- No tests were weakened or deleted.

### 3. Typecheck

Command: `npx tsc -b` → **PASS** (exit 0).

### 4. Build

Command: `npm run build` → **PASS** (built in ~4–8s).

Warnings: identical to the documented baseline (pre-existing, not introduced by Sprint 8):
- Rollup chunk-size warning (>500 kB) for the single JS chunk
- CSS import-order warning
- Browserslist data age warning

### 5. Lint

Command: `npm run lint` → **12 errors / 11 warnings — identical to the recorded pre-existing baseline.**

Confirmation the errors are pre-existing, not introduced by Sprints 6–7:
- 9 errors: `eslint.config.js` references rule names not present in the installed `@typescript-eslint` version ("Definition for rule … was not found") — config/version mismatch, not app code.
- 3 errors: generated `src/components/ui/command.tsx` and `src/components/ui/textarea.tsx` (empty-object interface) and legacy `tailwind.config.ts` (`require()` import).
- All 11 warnings: `react-refresh/only-export-components` in shadcn/ui button/form/navigation-menu/sidebar/sonner/toggle + fixable warnings.
- **Zero errors/warnings in app files** changed by Sprints 6–8 (`store.ts`, components, pages, tests, `api/**`) and none in the new test.

No shadcn/ui or unrelated legacy files were refactored.

### 6. Source-Level Migration Audit

Searched the full source tree for: `@supabase/supabase-js`, `supabase.auth`, `VITE_SUPABASE`, `from("borrowers")`, `from("transactions")`, Supabase `createClient`, `SupabaseUser`, `signInWithOAuth`, `onAuthStateChange`.

Result:
- **No active Supabase application dependency.** The only `src` matches are negative test assertions (`frontend-auth.test.tsx` asserts the absence of `supabase.auth`/`signInWithOAuth`/`SupabaseUser`/`onAuthStateChange`; `store.test.ts` asserts `store.ts` has no `@supabase/supabase-js`/`getUser`/`.from(`).
- All remaining matches are **text-only documentation** in `CASH_TRACK_MIGRATION.md` (historical audit record).
- `package.json` / `package-lock.json`: no `@supabase/supabase-js`; no Supabase entry remains. `node_modules/@supabase` is an **empty leftover directory** (npm artifact) — unreferenced, harmless.

Additional verifications:
- `store.ts` calls `/api/*` (GET/POST/PATCH/DELETE against `/api/borrowers`, `/api/borrowers/:id`, `/api/borrowers/:id/transactions`, `/api/transactions`, `/api/transactions/:id`). Source assertion test enforces this.
- API routes exist: `api/borrowers/index.ts`, `api/borrowers/[id]/index.ts`, `api/borrowers/[id]/transactions.ts`, `api/transactions/index.ts`, `api/transactions/[id]/index.ts`, plus `api/_lib/{auth,db,response,validation}.ts`.
- Neon Auth client remains active (`src/lib/neon-auth.ts` used by `Login.tsx`, `ProtectedRoute.tsx`, `UserMenu.tsx`, `AuthTest.tsx`).
- `DATABASE_URL` is **server-only** (`api/_lib/db.ts` only).
- `NEON_AUTH_URL` is **server-only** (`api/_lib/auth.ts` only); the browser uses the separate public `VITE_NEON_AUTH_URL`.
- **No database credentials are exposed via `VITE_*`** (`.env.example` defines only `VITE_NEON_AUTH_URL` for the client).
- Built bundle (`dist/`): no `supabase.co`, no `createClient`. The one `"supabase"` string in the bundle (`supabase.gotrue-js.locks.debug`) comes from **`@supabase/auth-js` — a transitive dependency of the official `@neondatabase/auth` client** (its cross-tab session-lock debug key). It performs no Supabase network calls and is expected.

### 7. API Test Coverage Audit

Reviewed `src/test/api-auth.test.ts`, `src/test/api-handlers.test.ts`, `src/test/api-validation.test.ts`. Coverage confirms:

- **Authentication:** missing session → 401 (GET borrowers, PATCH borrower); invalid/unusable session → `AuthError` 401 path; token extraction (Bearer, `__Secure-neon-auth.session_token`, non-secure `neon-auth.session_token`, empty/missing). Authenticated identity source is `verifySession` → Neon Auth `get-session` (reviewed in code; unit-level, no live call).
- **Borrowers:** list own (scoped by `user_id=$1`), create with server-derived user id, update own, 404 for another user's borrower, delete own, transactional cascade delete removing child transactions (BEGIN/DELETE txn/DELETE borrower/COMMIT) and rollback path when borrower not owned.
- **Transactions:** list for owned borrower (JOIN `b.user_id`), reject inaccessible borrower (404, no INSERT), create for owned only, update own, 404 for another user's transaction, delete own.
- **Validation:** invalid UUID, non-positive amount, invalid type, malformed date, missing required fields — all covered; **malformed `time` added in Sprint 8** (see §8).
- **Security:** user_id spoofing rejected (POST borrowers + POST transactions — spoofed `user_id` in body is ignored), SQL-injection-style input passed as bound parameter (not interpolated), parameterized SQL asserted on every write path.
- Unsupported methods → 405.

Test approach: mock-based (as required) — `pool.query`/`pool.connect` mocked, `verifySession` mocked. No live production calls, no fake users.

### 8. Issues Found & Fixed

Only one coverage gap found (no functional bugs):
- **`TIME_REGEX` was untested.** Added `api-validation.test.ts`: createTransactionSchema rejects a malformed `time` value (`"14:3"`). +1 test (71 → 72). The regex is format-only (`HH:MM`), so `"25:99"` is intentionally accepted by the schema (documented behavior) — the test asserts what the schema actually enforces.

No application bugs were discovered; no source changes were required for the audits.

### 9. API / DB Security Review

Inspected `api/_lib/auth.ts`, `api/_lib/db.ts`, `api/_lib/validation.ts`, `api/_lib/response.ts`, and all 5 handlers.

1. **Every protected endpoint verifies Neon Auth** — all handlers call `verifySession(req)` first (401 on missing/invalid session). ✓
2. **Every query uses the authenticated user ID** — `userId` from `verifySession` is used in every WHERE/INSERT. ✓
3. **Client-provided `user_id` is never trusted** — no handler reads a `user_id` field; inserts use the server-derived id (spoofing tests confirm). ✓
4. **Transaction creation verifies borrower ownership** — `SELECT id FROM borrowers WHERE id=$1 AND user_id=$2` before INSERT. ✓
5. **Borrower deletion is safely transactional** — single connection, `BEGIN` → delete transactions → delete borrower → `COMMIT`, `ROLLBACK` on failure or non-owned borrower, `client.release()` in `finally`. ✓
6. **SQL values are parameterized** — every statement uses `$n` placeholders; dynamic SET clauses are built only from a whitelist of hard-coded column names (never user input). ✓
7. **`DATABASE_URL` is never imported by frontend code** — only `api/_lib/db.ts`. ✓
8. **`NEON_AUTH_URL` never exposed via `VITE_*`** — separate public `VITE_NEON_AUTH_URL` is the only client var. ✓
9. **Errors do not expose internals** — all catch blocks return generic `{ error: "Internal server error" }` (500) or a safe `AuthError` message; `console.error` is server-side only; validation returns the first zod message (no SQL/stack/credentials/URLs). ✓

Observation (non-issue, pre-existing, not changed): path `:id` values are not pre-validated as UUIDs at the [id] routes; an invalid UUID produces a PostgreSQL error → generic 500. Parameterized and non-leaking, so not a security issue; noted for potential refinement in a later sprint.

### 10. Frontend Data-Flow Review

Reviewed `src/pages/Index.tsx`, `src/pages/BorrowerPage.tsx`, `src/components/AddBorrowerDialog.tsx`, `EditBorrowerDialog.tsx`, `AddTransactionDialog.tsx`, `EditTransactionDialog.tsx`, `TransactionTimeline.tsx`, `BorrowerList.tsx`, `StatsCards.tsx`.

- All data components import from `@/lib/store` only (`getBorrowers`, `getTransactionsByBorrower`, `addBorrower`, `updateBorrower`, `deleteBorrower`, `addTransaction`, `updateTransaction`, `deleteTransaction`).
- Auth components import from `@/lib/neon-auth` only (`identityToken`-free; session via cookies).
- `BorrowerList.tsx` / `StatsCards.tsx` are pure presentational (props only).
- **No component touches Supabase, Neon PostgreSQL directly, or API internals / raw `fetch`.**
- No rewrites were needed — no regressions found.

### 11. Manual Browser Testing — PENDING

Could not be executed in this environment. Documented as **PENDING**, not certified:
- No `.env` file locally (needs real `DATABASE_URL`, `NEON_AUTH_URL`, `VITE_NEON_AUTH_URL` — user-managed).
- `vercel` / `@vercel/node` dev CLI is not installed, and the plain Vite dev server cannot serve `/api/*`.
- Real Google OAuth requires a human at the consent screen with a real account.

Checklist for the human/user (same as Sprint 7's, still required): Google login/redirect/dashboard load; UserMenu identity; logout→/login; login again; add/list/refresh-persist borrower; edit-persist; delete; add "lent" txn → appears; refresh persists; add "received" txn → stats update; edit/delete txn; borrower cascade delete (its transactions disappear); unauth access to a protected API → 401; UI error handling does not expose server internals.

### 12. Multi-User Ownership Test — PENDING

Two-account isolation test documented as **PENDING**. Not performed: it requires two real Neon Auth Google accounts and a live API; creating fake/artificial users is explicitly prohibited. Correctness is instead backed by automated ownership tests (User A vs User B rows in `api-handlers.test.ts`). Instruction-following note: `verifySession` rejects any cookie/token not recognized by Neon Auth, and all queries are scoped by `user_id`, so cross-tenant reads return empty.

### 13. PWA / Application Regression Check

- Build emits `dist/sw.js` + `dist/workbox-*.js` via `vite-plugin-pwa` (generateSW, `registerType: "autoUpdate"`), precaching 15 entries including the JS/CSS/HTML/icons. ✓
- A static-SPA route-refresh check (e.g. refresh on `/borrower/:id`) requires a working deployment which does not exist yet; this belongs to Sprint 9 (production deployment / SPA rewrites on Vercel). No PWA configuration was changed.
- No Supabase assets/config in generated output (see §6 bundle scan).

### 14. Production Configuration Review (`.env.example`)

```
# Client
VITE_NEON_AUTH_URL=

# Server-only
DATABASE_URL=
NEON_AUTH_URL=
```

- No Supabase environment variables remain. No real credentials are present anywhere in source, tests, or this document.

### 15. Test Regression Summary

Sprint 6 → 58 tests; Sprint 7 → 71 tests; **Sprint 8 → 72 tests** (all passing, 0 failures). Lint stays at **12 errors / 11 warnings** (unchanged baseline).

### 16. Neon Data Status

- No changes made this sprint: no inserts, no destructive SQL, no fake users, no data migration. Tests are mock-based (never touch Neon).
- `public.borrowers` / `public.transactions` remain at the Sprint 5-verified **0 rows**; a live re-verification requires the real `DATABASE_URL` and belongs with the human-run manual testing/deploy steps.
- Supabase production data untouched.

### 17. Safety Confirmation

- No architecture changes, no redesign, no new dependencies, no source rewrites.
- Only change: +1 validation test (`api-validation.test.ts`).
- Sprint 9 (Production Deployment) and Sprint 10 (Final Cutover) were **not** started.

---

## Sprint 9 Detailed Work

**Status: COMPLETED.** (This section records the original Sprint 9 work — deployment configuration, env-var mapping, and the Google OAuth blocker that led to §7c. Production deployment was later confirmed on the user's Vercel project; the remaining live-login check was carried into Sprint 10 (see the Sprint 10 section).)

Everything that can be done from this repository is done (deployment configuration prepared, build re-verified). The deployment itself, production environment variables, the Neon Auth trusted-domain add, and all live production verification require real credentials/accounts that must not be invented. This sprint is therefore NOT COMPLETED.

### 1. Sprint Status Confirmed

- Sprints 1–8 COMPLETED. Sprint 9 was NOT STARTED. Sprint 10 NOT STARTED.
- Historical information in earlier sprint sections intentionally left intact.

### 2. Repository Deployment Configuration

| Item | Finding |
|---|---|
| `vercel.json` | Did not exist → **added in this sprint** (see §4). |
| `.vercel/` project link | **Absent** — no Vercel project is linked locally and Vercel CLI is not installed; the actual Vercel project/domain cannot be read from this environment. |
| `package.json` | `@vercel/node@^12.0.0` already present (devDependency) — API function types available for the Vercel functions runtime. Build script is `vite build` (Vercel zero-config). No `vercel-build` override needed. |
| `vite.config.ts` | Standard Vite + React + PWA; no `/api` dev proxy (only relevant to local dev). |
| API layer | `api/**/*.ts` serverless functions (Vercel auto-detect); types via `tsconfig.api.json` (`moduleResolution: nodenext` → correct for the `.js`-extension imports used throughout `api/`). |
| `tsconfig.json` | Contains the Vite app + test config; `tsconfig.api.json` referenced separately. |

No production domain, project id, or team id exists in the repository (README deployment instructions are the original Lovable boilerplate and do not reflect the current Vercel target). **A production Vercel domain is therefore NOT inventable here — it must come from the user's real Vercel project.**

### 3. Environment Variable Mapping (verified in source)

| Variable | Where used | Scope |
|---|---|---|
| `VITE_NEON_AUTH_URL` | `src/lib/neon-auth.ts` (browser `createAuthClient`), `src/pages/AuthTest.tsx` display | Client (public, safe) |
| `DATABASE_URL` | `api/_lib/db.ts` only | Server-only |
| `NEON_AUTH_URL` | `api/_lib/auth.ts` only (upstream `get-session` verification) | Server-only |

Confirmed: no `DATABASE_URL`/`NEON_AUTH_URL` in any `VITE_*` variable, source file, `.env.example`, or committed file. The documented real value `https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth` (Neon project `morning-recipe-20657117`) is used by the server-side API via `NEON_AUTH_URL`.

**Manual prerequisite (NOT done, NOT invented):** set `DATABASE_URL`, `NEON_AUTH_URL`, and `VITE_NEON_AUTH_URL` as Production environment variables in the Vercel project settings. `DATABASE_URL` and `NEON_AUTH_URL` are server-only and must never be placed in client-bundled variables.

### 4. Deployment Configuration Added (`vercel.json`)

```
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Purpose: enables **client-side routing on Vercel** (refresh of non-root SPA routes like `/borrower/:id` returns the app instead of a 404) while explicitly excluding `/api/...` so the serverless functions are never shadowed (Vercel routing precedence: filesystem → rewrites → functions; only unmatched non-API paths are rewritten). This is standard Vercel SPA + serverless configuration, documented in the Sprint 8 review as belonging to Sprint 9. No domain, credentials, or environment values are embedded.

### 5. Production Build Verification (before deployment)

| Check | Result |
|---|---|
| `npm test` | PASS — 6 files / **72 tests**, 0 failed, 0 skipped |
| `npx tsc -b` | PASS (exit 0) |
| `npm run build` | PASS — PWA output generated (`sw.js`, 15 precached entries) |

No new lint/build/type/test problems were introduced (lint baseline unchanged at 12 errors / 11 warnings; `vercel.json` is not part of the linted source set).

### 6. Deployment — BLOCKED (manual)

Deployment to Vercel was **NOT performed**. Prerequisites that require the user's real account/credentials:

1. A Vercel account/login (no Vercel CLI installed, no auth session in this environment, and no `.vercel` link). Recommended commands once available: `vercel login`, `vercel link`, then `vercel --prod`.
2. Production environment variables (see §3) set in the Vercel project.
3. After first deployment: verify `/api/*` functions resolve and SPA routes rewrite (feature of §4).

No Supabase project/data was touched and none will be; Neon remains the fresh production database.

### 7. Neon Auth Trusted Domain — BLOCKED (manual)

The required command is documented (Sprint 3 §manual steps): add the real production Vercel domain:

```
npx neon neon-auth domain add <vercel-domain> --project-id morning-recipe-20657117 --branch production
```

- The exact `<vercel-domain>` was later confirmed by the user as `https://cash-tracking-app.vercel.app` and it has been added as a Neon Auth trusted domain (user-confirmed, Sprint 9).
- `allow_localhost=true` remains intact for development (do NOT remove valid existing OAuth config).
- **Google callback/redirect note (updated by the production OAuth diagnosis below):** the Google OAuth redirect URI always points at the Neon Auth host (`{NEON_AUTH_BASE_URL}/callback/google`), never at Vercel. The Neon **shared** Google app is intended for development; a custom Google OAuth client is required for production (see §7b). (**Superseded by §7c:** Google OAuth was removed — the app now uses email/password, so no custom Google client is needed.)

### 7b. OAuth Diagnosis — Production Google Login `redirect_uri_mismatch` (Sprint 9)

**Symptom:** production Google login at `https://cash-tracking-app.vercel.app/` fails with `Error 400: redirect_uri_mismatch` / "Access blocked: This app's request is invalid".

**Root cause (application code is CORRECT — no code fix was needed):** Google rejected the OAuth `redirect_uri` parameter because it is not registered as an authorized redirect URI on the Google OAuth Client currently bound to the Neon Auth Google provider.

**What the app sends:** Better Auth's social sign-in builds the Google redirect URI entirely server-side from the Neon Auth base URL (verified against the installed `@neondatabase/auth` / `better-auth@1.6.23` client and the Neon docs):

```
https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth/callback/google
```

- This equals `{NEON_AUTH_BASE_URL}/callback/google` (no `/api/auth` segment — the base URL already carries the `/neondb/auth` path; better-auth's `withPath` uses the URL verbatim when it has a path).
- The frontend `callbackURL` passed in `signIn.social({ provider: "google", callbackURL: window.location.origin })` is `https://cash-tracking-app.vercel.app/` — this is only the **post-OAuth landing** URL, validated against Neon Auth **trusted domains**, NOT the Google redirect URI.
- Google OAuth host is live (JWKS endpoint `.../neondb/auth/.well-known/jwks.json` responds).

**The fix is a console configuration step (manual — credentials/consoles cannot be accessed or invented from this environment):**

1. **Google Cloud Console** → https://console.cloud.google.com (correct OAuth consent project) → **APIs & Services → Credentials → OAuth 2.0 Client IDs →** select/open the Web application client that is entered in the Neon project's Google OAuth provider settings.
   - Under **Authorized redirect URIs**, add exactly:
     ```
     https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth/callback/google
     ```
   - (If a URI already exists there, correct it to this exact value. Neon docs: "Using only your marketing site's URL … or only the `callbackURL`, is a common cause of `redirect_uri_mismatch`." Wildcards are NOT allowed by Google — an entry like `...neon.tech/*` must be replaced with the exact URI above.)
   - Under **Authorized JavaScript origins** (only if Google requires it): the app origin `https://cash-tracking-app.vercel.app` and/or the Neon Auth origin.
2. **Neon Console** → project **morning-recipe-20657117** → **Auth/Neon Auth → Social authentication → Google**: set/confirm the OAuth client ID + secret are the ones from the Google client edited in step 1 (production uses a **custom** Google OAuth client; the shared dev app is for local development). The Neon **Auth base URL** shown in the console for the **production** branch must match the host used in the redirect URI above and the `VITE_NEON_AUTH_URL` / `NEON_AUTH_URL` values set in Vercel (each Neon branch has its own base URL).

**How to confirm the exact `redirect_uri` being sent (before/after):** click "Sign in with Google" and inspect the failing Google URL (browser address bar or DevTools → Network → `accounts.google.com/o/oauth2/v2/auth` request) — the `redirect_uri` query parameter must equal the URI above. If it differs, the `VITE_NEON_AUTH_URL` in Vercel is pointing at a different Neon endpoint/branch than the one whose credentials are registered.

**Status — SUPERSEDED/ABANDONED (§7c):** production Google OAuth was removed instead of fixing the redirect URI. The app now uses Neon Auth email/password. §7b is retained as the historical diagnosis; no further Google console / redirect-URI work is required.

### 7c. Auth Change (Sprint 9) — Google OAuth REMOVED → Neon Auth Email/Password

**Decision:** the production Google OAuth path (shared Neon keys → `redirect_uri_mismatch`, §7b) is **ABANDONED/removed**. CashTrack now authenticates with **Neon Auth email/password only**. No custom Google client or Google Cloud Console work is needed.

**Why no DB/architecture change was required:** Neon Auth is built on Better Auth, whose default API is email/password. The existing client (`src/lib/neon-auth.ts` → `createAuthClient(VITE_NEON_AUTH_URL)`) already exposes `authClient.signIn.email({ email, password })` and `authClient.signUp.email({ email, password, name })` — verified against the installed `@neondatabase/neon-js` (0.7.0-beta) / `@neondatabase/auth` (0.5.0-beta) and by the passing typecheck. Email/password is enabled by default on Neon Auth; **no database schema change was made**, `DATABASE_URL` was not modified, and no user/data records were migrated.

**Frontend changes (this switch):**
- `src/pages/Login.tsx` — removed the "Sign in with Google" button and `signIn.social({ provider: "google", callbackURL })`. Now a Neon Auth email/password form with: email input, password input, login/sign-up toggle, client-side validation (required fields; ≥ 8-char password on sign-up), clear inline error messages (including server-provided ones), and a disabled loading state ("Logging in…"). Success navigates to `/`.
- `src/pages/AuthTest.tsx` — Google social sign-in button replaced with an email/password sign-in form.
- `src/test/frontend-auth.test.tsx` — Google OAuth tests replaced with email/password tests (sign-in, sign-up, error display, loading state, empty-field and min-length validation). Source checks now assert **no** `signIn.social`, `provider: "google"`, `@react-oauth/google`, or `GoogleOAuthProvider` in application source.

**Unchanged (per requirements):** Neon Auth, Neon PostgreSQL, Vercel API routes + `verifySession`, `ProtectedRoute` session gate, `UserMenu` logout, `src/lib/store.ts` API client, borrower/transaction logic, ownership/security, `DATABASE_URL`, Vercel env vars. No `@react-oauth/google`, no `jwt-decode`; `main.tsx` already had no Google wrapper.

**Note — email verification:** Neon Auth manages email verification itself. New accounts may require email verification before sign-in; Neon's verification/verification-required messaging surfaces through the login page error area. Confirm in the Neon Console that email/password (email plugin) is enabled on the **production** branch — this is a config check only, no code or schema change.

**Automated results (2026-09-05):** `npm test` → **77 passed** (6 files; +5 auth tests vs. the 72-test Sprint 8 baseline); `npx tsc -b` → **exit 0**; `npm run build` → **PASS** (PWA; `sw.js`, 15 precached entries). Pre-existing `npm run lint` baseline (12 errors / 11 warnings, all in config/shadcn files) unchanged.

**Remaining Sprint 9 blocker:** a user-run production check — sign up (email/password), verify email, login, protected dashboard, logout — then Sprint 9 can be marked COMPLETED. **Sprint 10 remains NOT STARTED.**

### 8. Production Verification — PENDING

All live checks in the required checklist (login page load, **email/password** sign-up + login, dashboard load, UserMenu identity, logout/login-again, borrower CRUD, transaction CRUD, refresh persistence, direct navigation to protected routes, non-root refresh (SPA rewrite), PWA/service-worker in production, browser console, Vercel function logs) **cannot be executed from this environment and remain PENDING** — they require the user's browser session with a real Neon Auth email account on the deployed URL.

### 9. Security Verification (production posture)

Re-verified statically (passed):
- `DATABASE_URL` and `NEON_AUTH_URL` are server-side only; `VITE_NEON_AUTH_URL` contains no database credentials.
- All API routes require Neon Auth (`verifySession`).
- API uses authenticated user identity only; client-supplied `user_id` is never trusted.
- Borrower and transaction ownership enforced; transaction creation validates borrower ownership.
- SQL remains parameterized.
- No secrets committed; no Supabase credentials exposed in the client bundle.

### 10. Two-User Production Isolation — PENDING

Automated ownership tests (Sprint 8, `api-handlers.test.ts`) remain the supporting coverage. A live two-account production check is **PENDING** (requires two real Neon Auth email accounts + deployed API) and is not claimed as passed.

### 11. Data Verification — PENDING

- Neon remains the fresh production database (0-row baseline from Sprint 5/8; intentionally empty until real users add data). No migration of Supabase records, ever.
- Live confirmation that the tables contain only sprint-test records requires the deployed API + real session; remains **PENDING**.

### 12. Blockers (summary)

1. No Vercel project link / CLI / login → deployment not possible from this environment.
2. Production env vars (`DATABASE_URL`, `NEON_AUTH_URL`, `VITE_NEON_AUTH_URL`) are real credentials the user must supply in the Vercel dashboard.
3. The real production Vercel domain is unknown/not inventable → Neon Auth trusted domain cannot be added.
4. Live email/password login + production CRUD + two-user isolation require a human browser session with real Neon Auth email accounts.

### 13. Safety Confirmation

- No Supabase data touched, no Supabase project modified.
- No credentials written to the repo; no secrets exposed or printed.
- No architecture changes, no new dependencies, no redesign; the only feature work was the authorized §7c auth switch (Google OAuth removed ↔ email/password).
- Repository changes in this sprint: `vercel.json` (SPA rewrite config) and the §7c auth switch (`src/pages/Login.tsx`, `src/pages/AuthTest.tsx`, `src/test/frontend-auth.test.tsx`).
- Sprint 10 was NOT started as of Sprint 9; it later began as the authorized **Full Production Testing** sprint (see Sprint 10 section). Sprint 11 NOT started.

---

## Sprint 10 — Full Production Testing (COMPLETED)

**Target:** verify the deployed CashTrack application (React + Vite → Vercel → Vercel API → Neon Auth → Neon PostgreSQL) end-to-end in production at `https://cash-tracking-app.vercel.app`.

**Status: COMPLETED** (user-confirmed). **Executed results (2026-09-05) PASSED** — automated checks and production endpoint probes. The interactive browser, multi-user, PWA-runtime, and database-persistence checks remain **PENDING** (they require a human browser session at the deployed URL with real Neon Auth email/password accounts); they are re-listed in the Sprint 11 PENDING checklist and have never been claimed as passed. All items marked PASSED below were actually executed.

### 1. Automated verification (executed, local)

- `npm test` → **passed** — 6 files, **77 tests**, 0 failures.
- `npx tsc -b` → **exit 0** (no type errors).
- `npm run build` → **PASS** — PWA emitted (`dist/sw.js`, `workbox-*`, `manifest.webmanifest`), 15 precached entries. Only pre-existing warnings: CSS `@import` order and chunk >500 kB.

### 2. Production probes (executed against the deployed URL)

Routing:
- `GET /` → **200** (`text/html`) — app served.
- `GET /login` → **200** — direct deep link loads.
- `GET /borrower/<uuid>` → **200** (index.html) — SPA rewrite works; refreshing a protected route does **not** 404.

API auth enforcement (unauthenticated → **401** JSON, as designed):
- `GET /api/borrowers` → 401.
- `POST /api/borrowers` → 401.
- `PATCH /api/borrowers/<uuid>` → 401.
- `DELETE /api/borrowers/<uuid>` → 401.
- `POST /api/transactions` → 401.
- Unsupported verbs are rejected by design: `GET /api/borrowers/<uuid>` and `GET /api/transactions` → 405 (handlers implement only PATCH/DELETE and POST respectively).
- No unauthenticated request returned 200. Security/ownership code unchanged (Sprint 8 review still stands).

Auth configuration:
- Production bundle (`assets/index-DfalAdZo.js`) contains `VITE_NEON_AUTH_URL = https://ep-wispy-pond-b34jwwoo.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth` — matches the documented Sprint 3 value (this reconciles the §7b host mismatch).
- Neon Auth host live: `…/neondb/auth/.well-known/jwks.json` → **200** (JWKS published).

PWA assets:
- `GET /sw.js` → **200** (workbox service worker).
- `GET /manifest.webmanifest` → **200**, `name: CashTrack`, `start_url: /`.
- `index.html` includes the `rel="manifest"` link and `registerSW.js`.

### 3. PENDING — manual browser tests (require human action; NOT claimed as passed)

1. **Authentication:** create an account (email + password; Neon-managed email verification may gate first sign-in), login with valid credentials, verify invalid credentials show an appropriate error, logout, login again, refresh and confirm the session persists, confirm unauthenticated users are redirected away from protected pages.
2. **Borrower CRUD:** create a borrower → appears in the list → edit → changes persist after refresh → add phone/notes if supported by the existing UI (fields exist) → delete → removed.
3. **Transaction CRUD:** add a "lent" transaction → add a "received" transaction → amounts/balances displayed correctly → edit → delete → page refresh after each operation and persistence confirmed.
4. **Multi-user isolation:** User A creates borrower(s) + transactions; User B verifies none of A's data is visible and creates their own; A verifies it cannot see B's data; direct API access with the other user's IDs is rejected (ownership-scoped SQL returns 404 "not found or access denied" and cross-user reads return empty).
5. **PWA runtime:** service worker registers, app is installable, navigation/refresh works after install, no service-worker errors in the console.
6. **Browser/console:** no JavaScript runtime errors, no failed API requests, no auth errors, no CORS errors, no unexpected 401/403/500 under normal authenticated use.
7. **Database persistence:** confirm production operations actually create/update/delete rows in Neon PostgreSQL (`borrowers`, `transactions`) — requires authenticated writes plus a Neon Console/query check. No Supabase data is migrated, ever.

### 4. Sprint 10 result summary

- **PASSED (executed):** automated test suite (77), TypeScript (exit 0), production build (PASS), production routing (/ , /login, SPA rewrite on protected deep link), unauthenticated API rejection (401 on every method), production PWA asset availability (sw.js, manifest, wiring), Neon Auth endpoint liveness + prod env reconciliation.
- **PENDING (manual):** sign-up/login/logout/session-refresh, invalid-credential message, borrower CRUD, transaction CRUD + balances, two-user isolation, PWA install/runtime, browser-console sweep, and live DB row verification.
- **Remaining blockers:** none in code; only the user-run manual account/browser/DB-rotation steps (see Sprint 11). **Sprint 11 (final) executed** — see below. No architecture change. Google OAuth NOT reintroduced. No security check removed. No Supabase data migration. No secret value printed in this document.

---

## Sprint 11 — Final Cleanup & Production Sign-off (COMPLETED)

**Target:** finish the migration: rotate the leaked Neon `DATABASE_URL` password (user-run), audit and remove secrets and obsolete Supabase/Google residue, remove only genuinely unused dependencies, final code/git review, final automated tests, final production + DB checks, final document statuses, and a final report. This is the FINAL sprint — **Sprint 12 NOT started, no architecture change**.

### 1. Security audit (executed)

- `git ls-files` tracked only one env-style file: `.env.example`; no other `.env*` committed. `.gitignore` ignores `.env`, `.env.*`, then re-includes `!.env.example`.
- **Finding:** the committed `.env.example` contained a **real** `DATABASE_URL` value with the role password for the production connection string. This was the **only** committed secret.
- **Remediation (done):** the value in `.env.example` was scrubbed to `postgresql://neondb_owner:<ROTATED_PASSWORD>@…` with a comment that the real `DATABASE_URL` belongs only in Vercel environment variables.
- **Rotation (user-run, REQUIRED):** the exposed password value is not self-revoking — the role password on Neon **must be regenerated** (see §6 runbook) and Vercel's `DATABASE_URL` updated, otherwise the previously-committed value remains valid. Do not print or commit the new password.
- Greps for `postgres://`, `PGPASSWORD`, `BEGIN PRIVATE KEY`, `SK-`, `eyJ…`, and Google client IDs found no other secrets in tracked files.

### 2. Obsolete-residue audit (executed)

- **Supabase:** no app-source dependency — no `@supabase/supabase-js`, no `createClient`, no `VITE_SUPABASE` env vars, no Supabase URLs. `package-lock.json` entries (`@supabase/auth-js`, `@supabase/postgrest-js`) are transitive inside `@neondatabase/auth`'s Supabase-compatibility adapter (kept — they are required by the auth package, not the app). Remaining source matches are negative test assertions only.
- **Google OAuth:** fully removed (§7c). No `@react-oauth/google`, `jwt-decode`, `signIn.social`, Google provider/config in app source; negative assertions in `src/test/frontend-auth.test.tsx` assert their absence. No dependency.

### 3. Dependency cleanup (executed)

- **Removed (verified unused — no imports anywhere, not referenced in configs or scripts):** `@hookform/resolvers`, `@tailwindcss/typography`, `@vite-pwa/assets-generator`, `sharp`.
- **Kept (verified in use):** `react-hook-form` (via `src/components/ui/form.tsx`), `jsdom` (Vitest `environment` in `vitest.config.ts`), `@testing-library/jest-dom` (via `src/test/setup.ts`), `@types/*`.
- No unrelated upgrades; no `--force`; only pre-existing ERESOLVE peer warnings from `@neondatabase/auth-ui`'s better-auth pins (audit vulnerabilities acknowledged as baseline).

### 4. Git + code review (executed)

- **Git cleanup:** `dev-dist/` (3 generated PWA files: `registerSW.js`, `sw.js`, `workbox-5a5d9309.js`) was accidentally tracked → added `dev-dist/` to `.gitignore` and `git rm -r --cached dev-dist` (staged). `dist/` was already ignored. `migrations/001_initial_schema.sql` remains tracked intentionally (migration history). Nothing committed in this session.
- **Code review (final):** `api/_lib/db.ts` (pg.Pool from `process.env.DATABASE_URL`, ssl `rejectUnauthorized:false`), `api/_lib/auth.ts` (Better Auth session verification via `NEON_AUTH_URL`; Bearer or `__Secure-neon-auth.session_token` cookie), `vercel.json` (SPA rewrite excluding `api/`), all `api/borrowers` + `api/transactions` route handlers (auth-first via `verifySession`, owner-scoped `user_id` WHERE clauses, parameterized queries, zod validation), `src/lib/store.ts` (all DB ops via `/api/*`, same-origin credentials), `Login.tsx`/`ProtectedRoute.tsx`/`UserMenu.tsx` (email/password, composed correctly). **No new auth system; result:** architecture confirmed clean.

### 5. Final automated verification (executed, green)

- `npm test` → 6 test files / **80 passed** (frontend-auth 16, api-handlers 24, api-validation 17, store 15, api-auth 6, example 1).
- `npx tsc -b` → exit 0.
- `npm run build` → PASS (PWA, 15 precache entries; pre-existing warnings only).
- **Production probes re-verified 2026-09-05 (pre-rotation baseline still valid post-cleanup):** `/`, `/login`, `/borrower/<uuid>` → 200; `/sw.js` → 200; unauth `GET /api/borrowers` + `POST /api/transactions` → 401.

### 6. Neon DB password rotation — user runbook (MANUAL, PENDING)

1. **Rotate the password** in the Neon Console (project `morning-recipe-20657117` → production branch → Database → role `neondb_owner` → “Generate new password”), or equivalent `ALTER ROLE` via `psql`. The new password must not be printed to chat, committed, or written into this document.
2. **Update Vercel:** Project → Settings → Environment Variables → set `DATABASE_URL` (Production) to the new pooled connection string (`…@ep-wispy-pond-b34jwwoo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb\?...`), then remove any stale value.
3. **Redeploy** the production deployment (Redeploy button on the latest deployment, or a new commit).
4. **Verify:** production login works and borrower/transaction create+read writes succeed; confirm the old password fails.

### 7. User-run DB schema + live verification — MANUAL, PENDING (never claimed as passed)

Run the following **read-only** queries in the Neon Console's SQL editor (production branch) to confirm the schema (this is the Sprint 9/10/11 “DB check”; requires an authenticated, deployed app to populate rows before verifying persistence):

```sql
-- 1) Tables (expect exactly: borrowers, transactions)
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2) Constraints (expect FKs/checks):
--    transactions.borrower_id -> borrowers.id (FOREIGN KEY)
--    transactions.type CHECK (type IN ('lent','received'))
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('public.borrowers'::regclass, 'public.transactions'::regclass)
ORDER BY conname;

-- 3) Indexes (expect idx_borrowers_user_id, idx_transactions_user_id, idx_transactions_borrower_id)
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- 4) Row counts (fresh Neon data only — no Supabase migration data expected)
SELECT 'borrowers' AS tbl, count(*)::text AS n FROM public.borrowers
UNION ALL SELECT 'transactions', count(*)::text FROM public.transactions;
```

Then perform the live browser checklist (see Sprint 10 §3): sign-up/login/logout/session-refresh, invalid-credential message, borrower CRUD, transaction CRUD + balances, two-user ownership isolation (+ direct cross-user API IDs return 404/empty), DB persistence row verification, PWA install/runtime, browser-console sweep (no JS/API/CORS/401/403/500 errors).

### 8. Sprint 11 result summary

- **COMPLETED (executed):** secret audit + `.env.example` leakage scrubbed; Supabase/Google residue confirmed removable with no source changes; 4 unused dependencies removed; `dev-dist/` untracked; final code review + git audit clean; final automated tests green (77 / tsc 0 / build PASS); production routing + 401 probes re-verified.
- **PENDING (user-run):** Neon DB password rotation + Vercel `DATABASE_URL` update + redeploy; post-rotation production re-verification; live browser/multi-user/PWA/DB-persistence checklist; the §7 read-only schema queries.
- **No architecture change. Google OAuth NOT reintroduced. No security check removed. No Supabase data migration. No secret value printed in this document.**

### 9. Production hotfix — "Session token missing" (executed 2026-09-05)

**Reported:** after email/password login on production, the app shows `error: "Session token missing"`. Login succeeds (session is created), but the Vercel API rejects the follow-up data requests.

**Root cause (verified against the installed Neon Auth SDK, `@neondatabase/neon-js` 0.7.0-beta / `@neondatabase/auth` 0.5.0-beta):** Neon Auth's session cookie is scoped to the **Neon Auth host** (`ep-wispy-pond-…neonauth.c-4…neon.tech/neondb/auth`), not to the app origin. The client (`ProtectedRoute`/`UserMenu`) works because the SDK's `$fetch` sends `credentials: "include"` to the Auth host. But `src/lib/store.ts` fetches `/api/*` **on the app origin** with no cookie and no `Authorization` header, so `api/_lib/auth.ts` `extractSessionToken()` finds nothing and `verifySession()` throws `AuthError("Session token missing")` (401). The SDK's vanilla client already exposes the current session JWT as `session.token` (the Auth server injects a fresh token on every `/get-session` call via the `set-auth-jwt` response header — confirmed in the SDK's `customFetchImpl`/`onSuccess` wiring), and `api/_lib/auth.ts` already supported `Authorization: Bearer` extraction.

**Fix (no architecture change):**
- `src/lib/neon-auth.ts` — added `getSessionToken()`: returns the current session JWT from `authClient.getSession().data.session.token`, cached until shortly before its `exp` (30 s lead), with in-flight dedupe; plus `invalidateSessionToken()`. No fallback to any client-provided `user_id`; if no token exists it returns `null`.
- `src/lib/store.ts` — `apiRequest()` now obtains that token and sends `Authorization: Bearer <token>` on every `/api/*` call (replacing the never-effective same-origin-cookie assumption). `credentials: "same-origin"` retained; bodies/status mapping unchanged.
- `src/components/UserMenu.tsx` — calls `invalidateSessionToken()` after `signOut()` so no stale cached JWT survives logout.
- **Security untouched:** the server still resolves the user id only from the verified session on the Auth host; the browser cannot inject a `user_id`.

**Verification (executed):** `npm test` → 6 files / **80 passed** (3 new store tests cover Bearer-header attach and header omission with no token); `npx tsc -b` → exit 0; `npm run build` → PASS (PWA, 15 precache entries). Unauthenticated production API requests still return 401 (re-verified earlier).

**Production verification (PENDING, user-run):** push/redeploy the updated bundle (Vercel auto-builds from the connected repo), log in with email/password, and confirm the dashboard loads (borrowers + transactions) without the "Session token missing" error; then re-run logout and confirm it returns to `/login` and protected API calls then 401. Automation cannot execute a browser login, so nothing is claimed until run.

---

## Final Notes (no further sprints)

The migration is complete. Sprint 9-10 sections remain as the historical record; the Final Status block and this Sprint 11 section are authoritative. When the user finishes the §6 rotation and the live checks, the remaining PENDING items resolve; until then they are explicitly PENDING (not passed).
