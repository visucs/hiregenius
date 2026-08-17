# Memory.md — HireGenius AI Build Log

Purpose: keep the AI coding assistant updated on real progress so it doesn't re-scan the whole codebase or re-guess decisions when a new chat/session starts. Update this file at the end of every work session or phase — keep entries short and factual.

---

## How to update this file
1. Add a new dated entry under "Session Log" summarizing what was actually built/changed.
2. Update "Current Status" to reflect the current phase (from `Phases.md`).
3. Update "Key Decisions" only when a real architectural/library decision is made (not in `Rules.md` already).
4. Update "Known Issues / TODO" — remove items once fixed.
5. Keep this file under ~200 lines — summarize old sessions instead of letting the log grow forever.

---

## Current Status
- **Active Phase:** Phase 2 — Landing page rebuild + design system refresh ✓ COMPLETE
- **Last Updated:** 2026-08-08

## Repo / Service Locations
- Frontend: `hiregenius-frontend/` ← active
- Backend: `hiregenius-backend/` ← not started yet
- AI Service: `hiregenius-ai-service/` ← not started yet
- ML Service: `hiregenius-ml-service/` ← not started yet

## Key Decisions
- **State management:** Redux Toolkit (chosen over Context API — more scalable for SaaS with auth, jobs, candidates, interviews in later phases).
- **JWT storage:** `localStorage` (keys: `hg_token`, `hg_user`) + Redux state. Both cleared on logout.
- **Tailwind version:** v4 with `@tailwindcss/vite` plugin (Vite-native, no separate `tailwind.config.js` needed — design tokens set via CSS variables in `index.css`).
- **Sidebar navigation items for Phase 2+ routes:** rendered but `pointer-events-none + opacity-40` until their phases are built. Avoids broken links.
- **AppShell location:** `src/layouts/AppShell.jsx` — Architecture.md doesn't define a `layouts/` folder; added it to keep the shell separate from components. Minor deviation, logged below.

## Known Issues / TODO
- Chunk size advisory (559KB unminified) — add dynamic imports / code-splitting in Phase 11 polish pass.
- `useTheme` hook currently reads from `localStorage` directly; if theme toggles in Navbar don't cause a re-render, a full Redux theme slice should replace it in Phase 11.
- Backend not started — all auth API calls will fail until Spring Boot is running. Auth pages handle errors gracefully (toast + error banner).

## Session Log
_(newest on top)_

### 2026-08-09 — Full Landing Page & Navbar Rebuild (GoodSpace-pattern layout)

- **Built / Changed:**
  - `LandingNavbar.jsx` — **full rebuild**: Products dropdown (Resume Screening, AI Interview, Candidate Ranking, Analytics with icons + descriptions), sticky blur-on-scroll glass effect, stat pill badge above "Get Started" button ("50,000+ Resumes Screened"), theme toggle, mobile drawer with grouped product + nav links.
  - `LandingPage.jsx` — **full rebuild** with 11 sections following GoodSpace.ai layout pattern (all copy/data is original HireGenius AI content):
    1. **Hero** — pill badge, gradient H1, subtext, "Start Screening Free" CTA, full mock dashboard screenshot with floating "AI Resume Score: 92%" overlay card (Framer Motion entrance).
    2. **Demo Cards Row** — 3 sample role cards (Frontend Eng, ML Eng, PM) with company header, tags, score meta, "Start Demo" link.
    3. **How It Works** — 4 numbered horizontal steps (Post Job → AI Screens → AI Interviews → Ranked Shortlist) with gradient icon circles.
    4. **Feature Category Cards** — 4-card grid (Resume Screening / AI Interview / Candidate Ranking / Analytics) each with icon, title, desc, 4 chip tags.
    5. **Social Proof Band** — stat headline + infinite-scrolling logo strip with placeholder tech names (no real company logos).
    6. **Stats** — AnimatedCounter band (10x faster, 98% satisfaction, 60% less time-to-hire, 500+ teams).
    7. **Benefits (3-col)** — Screen Faster / Reduce Bias / Actionable Insights with icon, heading, paragraph, 2 tag pills.
    8. **Cross-Sell Row** — 3 cards for Analytics Dashboard, Interview Scheduler, AI Interview Suite.
    9. **SEO Content** — 3 original paragraphs on AI-assisted recruitment, contextual scoring, and AI interview scaling.
    10. **FAQ Accordion** — 8 Q&As with AnimatePresence expand/collapse.
    11. **Footer** — multi-column (Product / Company / Legal), social icons (Twitter, LinkedIn, GitHub, Email), logo + tagline + copyright.
  - All sections use Design.md tokens, Framer Motion scroll reveals, stagger entrances, hover lifts. No external copy or real company logos used.

- **Next session (Phase 3):**
  - Build Spring Boot backend scaffold + `/health` endpoint
  - Wire Dashboard shell with real stat widgets

### 2026-08-08 — Premium UI/UX Rebuild (Landing + Auth + Design System)

- **Built / Changed:**
  - `Design.md` — completely replaced color/spacing/typography/elevation tokens with premium dark SaaS system (indigo→cyan gradient, layered dark backgrounds `#0A0E1A / #0F1420 / #151B2C`, `rgba(255,255,255,0.08)` borders, Inter font, 96–120px section padding, 8/16/24/32/48/64/96/128 spacing scale, 20px card radius, 12px button radius).
  - `index.css` — full rewrite: dark `:root` as baseline, optional `.light` class override, `.gradient-text`, `.hero-glow`, `.section-padding`, `.glass-card`, `.skeleton` shimmer animation, scroll-bar, focus ring.
  - `useTheme.js` — changed default to `'dark'`, switched to `.light` class for light mode (`:root` = dark baseline).
  - `src/components/GradientButton/GradientButton.jsx` — new reusable component, indigo→cyan gradient, supports Link + button, Framer Motion hover/tap, size variants.
  - `src/components/GlassCard/GlassCard.jsx` — new reusable component, `backdrop-blur(20px)`, scroll-reveal via `whileInView`, hover lift `-6px`.
  - `src/components/SectionHeading/SectionHeading.jsx` — new reusable component, eyebrow + gradient word + subtitle, scroll-reveal.
  - `src/components/AnimatedCounter/AnimatedCounter.jsx` — new reusable component, Framer Motion `animate()` count-up on scroll enter, gradient text.
  - `src/components/Navbar/LandingNavbar.jsx` — new, transparent→glass on scroll, mobile drawer, sticky fixed, theme toggle.
  - `pages/Landing/LandingPage.jsx` — **full rebuild** with 8 sections: Hero (full-viewport, staggered entrance, glow blobs, badge, gradient H1, trust pills), Features (2×3 glass card grid), How It Works (4-step flow with gradient icon circles), Stats band (AnimatedCounter), Testimonials (glass card grid), Final CTA (gradient-bordered card), Footer (multi-column with social icons).
  - `pages/Login/LoginPage.jsx` — rebuilt with glass card, animated glow background, focus border transitions, GradientButton.
  - `pages/Register/RegisterPage.jsx` — rebuilt with same glass-card aesthetic, back link, GradientButton.
  - `App.jsx` — Toaster updated to dark glass style with colored left-border per type.

- **Routing preserved:** `/` → LandingPage, `/login` → LoginPage (with RoleRedirect), `/register` → RegisterPage (with RoleRedirect), `/recruiter/*`, `/admin/*`, `/candidate/*` protected routes all untouched.

- **New reusable components summary:**
  | Component | Location | Description |
  |---|---|---|
  | `GradientButton` | `components/GradientButton/` | Primary CTA — indigo→cyan gradient, hover/tap animation |
  | `GlassCard` | `components/GlassCard/` | Glass card with scroll-reveal + hover lift |
  | `SectionHeading` | `components/SectionHeading/` | Section title block with gradient word + eyebrow |
  | `AnimatedCounter` | `components/AnimatedCounter/` | Scroll-triggered count-up with gradient text |
  | `LandingNavbar` | `components/Navbar/` | Landing-only sticky nav with scroll glass effect |

- **Next session (Phase 3):**
  - Build Spring Boot backend scaffold + `/health` endpoint
  - Wire up Dashboard shell with stat widgets (jobs count, candidates, pending interviews) using GlassCard
  - Apply GlassCard / SectionHeading to all dashboard pages


### 2026-08-07 — Phase 0 + Phase 1: Scaffold + Auth UI

- **Built:**
  - Vite + React scaffold inside `hiregenius-frontend/`
  - Installed: `@reduxjs/toolkit`, `react-redux`, `react-router-dom`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `recharts`, `react-hot-toast`, `framer-motion`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`
  - `index.css` — Tailwind import + all Design.md color tokens as CSS custom properties for light and dark themes
  - `src/store/store.js` — Redux store
  - `src/features/auth/authSlice.js` — JWT + user state, localStorage persistence, selectors
  - `src/services/api.js` — Axios instance, Bearer token interceptor, 401 auto-logout
  - `src/services/authService.js` — login / register / forgotPassword API wrappers
  - `src/hooks/useApiCall.js` — loading/error/success wrapper hook (Rules.md §4)
  - `src/hooks/useTheme.js` — dark/light toggle with localStorage
  - `src/utils/validationSchemas.js` — Zod schemas for loginSchema, registerSchema, forgotPasswordSchema
  - `src/utils/helpers.js` — formatError, formatDate, truncate
  - `src/routes/ProtectedRoute.jsx` — redirects to /login if unauthenticated
  - `src/components/Navbar/Navbar.jsx` — sticky top bar, theme toggle, logout
  - `src/components/Sidebar/Sidebar.jsx` — collapsible (desktop) + drawer (mobile), future nav items disabled
  - `src/components/Footer/Footer.jsx` — minimal footer
  - `src/components/Loader/Loader.jsx` — Framer Motion spinner
  - `src/pages/Login/LoginPage.jsx` — RHF + Zod, Redux auth, eye toggle, error/loading/success
  - `src/pages/Register/RegisterPage.jsx` — name/email/role/password/confirm, same pattern
  - `src/pages/ForgotPassword/ForgotPasswordPage.jsx` — email form + success state
  - `src/pages/Dashboard/DashboardPage.jsx` — Phase 1 placeholder showing build progress
  - `src/pages/NotFound/NotFoundPage.jsx` — 404 catch-all
  - `src/layouts/AppShell.jsx` — authenticated layout (Navbar + Sidebar + Footer + Outlet)
  - `src/App.jsx` — BrowserRouter with public + protected + 404 routes
  - `src/main.jsx` — entry point with Redux Provider
  - `.env`, `.env.example`, `.gitignore` — no secrets hardcoded
  - `vite.config.js` — Tailwind v4 plugin wired in
  - `index.html` — SEO title + meta description
  - `npm run build` passes ✓ (2295 modules, no errors)

- **Changed (deviations from Architecture.md / Rules.md):**
  - Added `src/layouts/` folder — Architecture.md §4 doesn't list it. Decision: keeps AppShell out of `components/` (it's a layout, not a component). Low impact, easily reversible.
  - Tailwind v4 used (`@tailwindcss/vite`) instead of the classic v3 `tailwind.config.js` approach — same result (all tokens via CSS vars), but no separate config file needed.

- **Next session (Phase 2):**
  - Build full Landing page (public, pre-auth)
  - Build full Dashboard shell: sidebar active nav, dashboard summary cards (jobs count, candidates count, pending interviews)
  - Wire up backend "dashboard summary" endpoint once Spring Boot is running
  - Start Spring Boot project scaffold + `/health` endpoint

### Template for new entries
```
### YYYY-MM-DD — Phase X: <short title>
- Built: <what was implemented>
- Changed: <any deviation from Architecture.md / Rules.md, and why>
- Next: <what should happen next session>
```

-