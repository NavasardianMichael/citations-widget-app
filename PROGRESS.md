# Մեջբերումներ Աստվածաշնչից — Build Progress

This file tracks implementation progress against the approved build plan, so work can resume seamlessly on another machine (via `git pull`) or in a fresh Claude Code session. Point a fresh session at this file first.

## The approved plan

Full plan (context, architecture, all decisions): see the plan text embedded below — the original was written to a local Claude Code plan file (`C:\Users\michael.navasardyan\.claude\plans\gleaming-jingling-pearl.md`) which does **not** travel with git, so it's reproduced in full here.

Design source: 4 finished HTML/Tailwind mockups at `client/design/{saved,submit,settings,profile}.html`, app branded "Մեջբերումներ Աստվածաշնչից" — a Bible-first (with Fiction/Mixed options) citation-widget app.

<details>
<summary>Full plan text (click to expand)</summary>

### Context

`citations-widget-app` currently has two stubs: a barely-modified `create-expo-app` starter (`client/`, Expo Router SDK 57 + RN 0.86) and a 2-route Express stub (`server/`). Goal: build the complete in-app product (all 4 screens, real backend, tablet-responsive NativeWind design system) end to end. **Native home-screen widget extensions (iOS `expo-widgets`, Android `react-native-android-widget`) are explicitly Phase 2, not this pass** — they need a separate native-rebuild cycle and a stable settings contract to read from, which this phase produces.

Per `client/AGENTS.md`'s standing instruction, versioned Expo SDK 57 docs and current library docs were consulted throughout rather than relying on possibly-stale training data — re-verify anything version-sensitive if picking this up much later.

### Decisions locked in (defaults chosen — override anytime)

| Topic | Decision | Why |
|---|---|---|
| Auth | Lightweight `x-device-id` header pseudo-auth (client generates a UUID once, persists locally; server find-or-creates a `users` row) — **no login/password/OAuth in v1** | Matches v1 needs; isolated behind one middleware file so real auth can replace it later |
| Dark mode | Ship **light-only**; `app.json` `userInterfaceStyle` → `"light"` | Mockups scatter `dark:` classNames but define only one (light) palette |
| Desktop nav | Standardize on `saved.html`'s pattern everywhere: bottom tab bar on mobile, left sidebar at `md:`+ | The 4 mockups disagree with each other on desktop chrome |
| Widget settings | One settings row per user (no multi-widget-instance support) | No mockup shows a widget-switcher UI |
| Moderation | No HTTP moderate route in v1 — use `npm run db:studio` (Drizzle Kit Studio) as the interim admin tool | Zero extra backend code for a workflow with no designed admin UI yet |
| Font picker | Custom 2-option pressable control (reuse pill/radio components), not a new native-picker dependency | Only 2 choices |
| Bible content | Self-seed a public-domain KJV dataset into SQLite; fiction = hand-curated seed file | Avoids runtime dependency on a rate-limited third-party API |

### Backend (`server/`)

**Stack**: SQLite via **Drizzle ORM** + `better-sqlite3` driver.

**Schema** (`server/src/db/schema.ts`) — 4 tables: `users`, `citations` (text/author/sourceRef/sourceType/tags/status/submittedByUserId/shareProfile/moderatorNote/reviewedAt), `saved_citations` (composite PK), `widget_settings` (sourceSelection/refreshRateHours/fontStyle/showAttribution/currentCitationId/currentCitationSetAt).

**API surface** (mounted under `/api`):

| Method + Path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | public | extended to also probe DB |
| `GET /api/citations?sourceType=&limit=&offset=` | public | browse shared **approved** pool |
| `GET /api/citations/:id` | public | single approved citation |
| `POST /api/citations` | device | submit new (`text`,`author?`,`sourceType`,`sourceRef?`,`shareProfile`,`visibility:'private'|'pending'`) |
| `GET /api/citations/mine?status=` | device | Profile's "My Submissions" |
| `PATCH /api/citations/:id` | device, owner | edit own; resets `approved`→`pending` |
| `DELETE /api/citations/:id` | device, owner | delete own |
| `GET /api/saved` | device | union of own `private` + bookmarked |
| `POST /api/saved/:citationId` / `DELETE /api/saved/:citationId` | device | bookmark / unsave |
| `GET /api/widget-settings` / `PUT /api/widget-settings` | device | find-or-create / full replace |
| `GET /api/widget/citation?force=` | device | **stateful** rotation, rerolls only if `refreshRateHours` elapsed |
| `POST /api/widget/preview` | device | picks for a **candidate** (unsaved) settings draft |
| `GET /api/profile` / `PATCH /api/profile` | device | profile read/edit |

Citation-selection (`server/src/services/widget-citation-picker.ts`): SQL-side `ORDER BY RANDOM()`. `mixed` coin-flips `sourceType` first, then picks within it (avoids ~99.8% Bible bias from a naive union-random given ~31k Bible verses vs. a few dozen fiction quotes). Attribution shown only when both viewer's `showAttribution` AND that citation's own `shareProfile` are true.

Folder structure:
```
server/src/
  index.ts / app.ts / config.ts
  db/{client,schema}.ts
  middleware/{resolve-user,error-handler}.ts
  routes/{index,health,citations,saved,widget,profile}.ts
  services/widget-citation-picker.ts
  scripts/seed.ts
server/drizzle/            # generated SQL migrations, committed
server/data/seed/{kjv.json,fiction-quotes.json}
server/data/citations.db   # runtime file, gitignored
```

### Client (`client/`)

**Navigation** — flat files under `client/src/app/` (no `(tabs)` group): `index.tsx`→**Saved** (default), `submit.tsx`, `settings.tsx`, `profile.tsx` new; `explore.tsx` deleted. Native tabs via `NativeTabs` `sf`/`md` icon props (Saved: `bookmark`/`bookmark`; Submit: `square.and.pencil`/`edit_note`; Settings: `gearshape`/`settings`; Profile: `person.crop.circle`/`person`). Web tabs rebuilt on `expo-router/ui` + `@expo/vector-icons` `MaterialIcons`.

**NativeWind v4** (stable; v5 is pre-release, not used): `babel.config.js` (`babel-preset-expo` + `jsxImportSource: 'nativewind'` + `nativewind/babel` — do NOT manually add a reanimated/worklets babel plugin, it auto-detects the installed `react-native-worklets`), `metro.config.js` (`withNativeWind(config, {input: './src/global.css'})`), `tailwind.config.js` (M3 color tokens from new `src/constants/colors.ts`, spacing/radii as RN-safe numbers, precomputed absolute `letterSpacing`), `global.css` rewritten to just `@tailwind` directives, `nativewind-env.d.ts`. **Delete entirely** (no shim): `constants/theme.ts`, `hooks/use-theme.ts`, `components/themed-text.tsx`, `components/themed-view.tsx`, `components/hint-row.tsx`, `components/web-badge.tsx`, `components/ui/collapsible.tsx`. Fix duplicate `Citation` type — single definition in `src/types/citation.ts`.

**Fonts**: `@expo-google-fonts/source-serif-4` + `@expo-google-fonts/hanken-grotesk`, wired via `useFonts()` in `_layout.tsx`, gating render (`if (!fontsLoaded && !fontError) return null;`) before the existing `AnimatedSplashOverlay` — reuses the existing splash-hold mechanism unchanged. Use real italic weight for citation blockquotes, not faked RN italic.

**Tablet responsiveness**: Tailwind default breakpoints (`md:768` primary cutover; Settings keeps its own `lg:1024` as authored). CSS Grid → flexbox (`flex-row flex-wrap` + `gap-gutter` + fractional `w-*`/12 classes; two-column splits → `flex-col md:flex-row` + fractional widths). No generic grid-abstraction component. `app.json`: `orientation`→`"default"`, add `ios.supportsTablet: true`. No Android-equivalent flag needed.

**Shared components** (`src/components/`): `top-app-bar.tsx`, `card.tsx` (try RN's `boxShadow` style prop first), `citation-card.tsx` (variants: decorative/minimalist/featured), `submission-card.tsx`, `status-badge.tsx`, `category-tag.tsx`, `settings-section.tsx`, `radio-option-card.tsx`, `radio-list-row.tsx`, `toggle-pill.tsx`, `toggle-row.tsx` (wraps RN `Switch`), `form-field.tsx`, `button.tsx`.

**Widget-settings seam**: `src/services/widget-settings.ts` mirroring existing `services/api.ts` pattern, backed by `/api/widget-settings` — Phase 2 native widgets become pure readers of this stable contract.

### Explicitly out of scope this pass (Phase 2)

`expo-widgets` (iOS) + `react-native-android-widget` (Android) native home-screen widget extensions. Needs a real `ios.bundleIdentifier` + app-group `groupIdentifier` (neither exists yet). Separate follow-on once Phase 1's settings contract is stable.

### Verification

- **Server**: `npm run dev`, hit each route (health/citations/saved/widget-settings/widget-citation/profile); `npm run db:seed`; `npm run db:studio` to inspect.
- **Client**: `npx expo start` — web first (phone + resized-wide/tablet viewport) for all 4 screens, then physical Android device / `expo run:ios`. Confirm Settings→Save Widget persists and Saved/Profile show real backend data, not mocks.
- Use the `/verify` skill after implementation.

</details>

## Status as of last session (2026-07-11)

### ✅ Phase 1 complete

**Backend (`server/`):**
- Added `server/src/scripts/migrate.ts` + `npm run db:migrate`; `db:seed` now chains migrate automatically.
- Database seeded: **31,100** Bible verses + **30** fiction quotes (31,130 total).
- All API routes smoke-tested (health, citations, saved, widget-settings, widget/citation, widget/preview, profile).

**Client (`client/`) — full Մեջբերումներ Աստվածաշնչից in-app product:**
- NativeWind v4 + Tailwind 3.4 with M3 design tokens from `client/design/` mockups.
- Google Fonts: Source Serif 4 + Hanken Grotesk via `useFonts()` in `_layout.tsx`.
- `app.json`: light-only, tablet support (`orientation: default`, `ios.supportsTablet`).
- Device identity: `expo-secure-store` (native) / `localStorage` (web) → `x-device-id` header.
- Full API client in `src/services/api.ts` + `widget-settings.ts`.
- 4 tabs: Saved (default), Submit, Settings, Profile — bottom bar on mobile, left sidebar on web `md:+`.
- Shared components: cards, citation cards (bento variants), settings controls, widget preview, forms.
- All 4 screens wired to real backend APIs.
- `npx tsc --noEmit` passes. Web static export verified (`npx expo export --platform web`).

### ✅ Phase 2 (native home widgets — scaffolded)

Native home-screen widgets wired to settings:
- iOS: `expo-widgets` → `src/widgets/CitationWidget.tsx` (Small/Medium/Large)
- Android: `react-native-android-widget` → resizable provider (`minWidth` 180dp / `minHeight` 110dp)
- Snapshot sync on settings load/save/refresh via `src/services/home-widget-sync.tsx`
- Requires a **dev-client rebuild** (`npx expo prebuild` / `expo run:android` / `expo run:ios`) after plugin changes.

### Notes / gotchas hit so far (don't rediscover these)

- This machine has an **Intel UHD 630 GPU driver issue** that crash-loops the Android emulator in hardware-accelerated mode (confirmed via Windows Event Log: recurring "Display driver igfx stopped responding" TDR events). Workaround in progress before this build started: switched to testing on a **physical Android device via USB** (`adb devices` / USB debugging) rather than the emulator. If picking this up on a different machine, the emulator may just work fine there — this was a local hardware/driver quirk, not a project issue.
- Drizzle's better-sqlite3 query builder IS thenable (`await db.select()...` works directly, no need for `.all()`), confirmed empirically — but `.get()`/`.run()` (synchronous, no await) are used for single-row/write operations throughout for clarity.
- Express 5 + `@types/express@5.0.6`: route-param string-literal-type narrowing (`req.params.id` → `string` for a `:id` path segment) is inconsistent across HTTP verb methods on `Router` — `.get()` narrows correctly but `.patch()`/`.delete()` fall back to `string | string[]`. Cast explicitly (`req.params.id as string`) rather than relying on it.
- Zod v4 is installed (not v3) — stick to the stable cross-version subset of the API (`z.object`, `.optional()`, `z.enum`, `z.coerce.number()`, `.min()/.max()`) since that's all that's used so far.
