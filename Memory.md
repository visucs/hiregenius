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
- **Active Phase:** Phase 2 complete ✓ | Recruiter Dashboard ✓ | Admin Dashboard ✓ | Candidate Dashboard color-matched ✓
- **Last Updated:** 2026-09-07

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
- **Theme system (corrected 2026-09-07):** `:root` = off-white/olive green (light, default); `.dark` class on `<html>` = dark olive (same palette, dark variant). `useTheme.js` hook in `hooks/useTheme.js` toggles `.dark` on `<html>`. The Navbar `Moon/Sun` button calls `toggleTheme()`. The old `.app-shell` CSS class that forced a dark indigo/cyan palette (overriding `:root`) has been **removed** — authenticated pages now share the same olive/off-white design system as the landing page and correctly respond to the dark/light toggle. ALL colors in dashboard components use `var(--)` CSS tokens, not hardcoded hex.

## Known Issues / TODO
- Chunk size advisory (559KB unminified) — add dynamic imports / code-splitting in Phase 11 polish pass.
- `useTheme` hook currently reads from `localStorage` directly; if theme toggles in Navbar don't cause a re-render, a full Redux theme slice should replace it in Phase 11.
- Backend not started — all auth API calls will fail until Spring Boot is running. Auth pages handle errors gracefully (toast + error banner).
- Auth pages (Login, Register, ForgotPassword) still use hardcoded dark styles — they need a CSS-vars pass in a future session.
- Recruiter and Admin shells (`RecruiterShell.jsx`, `AdminShell.jsx`) may still have some hardcoded indigo/dark hex colors — audit in next pass.

### 2026-09-07 — Dashboard Color System Fix + Dark/Light Mode Toggle

**Problem:** The `.app-shell` CSS class in `index.css` was overriding all CSS variables with a hardcoded indigo/dark palette (`#0A0E1A`, `#6366F1`, `#22D3EE`) that had nothing to do with the off-white/olive landing page design. This broke the dark/light toggle — the toggle was switching `.dark` on `<html>` but `.app-shell` always won with its hardcoded values.

**Fixed:**
1. `src/index.css` — Removed the entire `.app-shell { --bg-base: #0A0E1A; ... }` override block. Replaced with a minimal `.app-shell { background-color: var(--bg-base); color: var(--text-primary); }` that inherits from `:root` (light) or `.dark` on `<html>`.
2. `src/pages/Dashboard/CandidateDashboard.jsx` — Full rewrite: all ~40 hardcoded dark hex colors (`#0F1420`, `#6366F1`, `#22D3EE`, `#F8FAFC`, `#94A3B8`, `#64748B`) replaced with CSS variable references (`var(--bg-elevated)`, `var(--primary)`, `var(--secondary)`, `var(--text-primary)`, etc.). The `card` base style object now uses `var(--bg-elevated)` and `var(--border)`. All icon backgrounds, badge chips, button states, drag-drop zone, and textarea use CSS vars.
3. `src/components/Sidebar/Sidebar.jsx` — Replaced `navItemStyle` hardcoded indigo (`rgba(99,102,241,0.12)`, `#6366F1`) with `var(--step-active-bg)` and `var(--primary)`. Fixed CTA button `boxShadow` from indigo to olive-green rgba.

**Result:** Candidate dashboard now shows **off-white (#F2EFE8 / #FAF9F5) backgrounds and dark olive green (#3D5016 / #6B8A3A) accents** in light mode, and a **dark olive (#0D110A / #1A1F10) palette** in dark mode — matching the landing page design system exactly. The Moon/Sun toggle in the Navbar fully switches both the landing page and dashboard.



### 2026-09-07 — Full Candidate Portal Destinations & Scan History Page

**Built & Enabled Pages (under `/candidate/*` → AppShell):**
1. `src/components/Sidebar/Sidebar.jsx`: Added new "Scan History" nav item with `History` icon between "Resume Score" and "Settings". Enabled all Candidate nav items (removed `disabled: true`).
2. `src/mock/candidate/candidateMock.js`: Comprehensive mock data repository matching Spring Boot DTO specs with `// TODO: replace with GET /api/candidate/...` markers:
   - `MOCK_CANDIDATE_APPLICATIONS`: `[{ id, jobTitle, company, location, appliedDate, status, resumeScore, jobDescriptionSnippet, interviewStatus, scoreBreakdown: { skillsMatch, matchedSkills, missingSkills, experienceMatch, educationMatch, projectsMatch }, timeline: [{ stage, date, completed, current }] }]`
   - `MOCK_CANDIDATE_INTERVIEWS`: `{ upcoming: [{ id, jobTitle, company, scheduledDate, scheduledTime, duration, format, status }], completed: [{ id, jobTitle, company, dateTaken, overallRecommendation, overallScore, scores: { communication, confidence, technical }, questions: [{ num, question, candidateAnswer, aiNote, score }], aiFeedback }] }`
   - `MOCK_LATEST_RESUME_SCORE`: `{ id, scanDate, jobTitle, targetCompany, score, recommendation, skillsMatch, matchedSkills, missingSkills, extractedSummary, suggestions: [{ id, category, text, impact }] }`
   - `MOCK_SCAN_HISTORY`: Array of past scan objects with `id`, `scanDate`, `jobTitle`, `company`, `score`, `skillsMatch`, `recommendation`, `matchedSkills`, `missingSkills`, `extractedSummary`, `suggestions`.
   - `MOCK_CANDIDATE_PROFILE`: `{ id, name, email, isEmailVerified, phone, title, avatarUrl, notifications: { statusEmail, interviewInviteEmail, resumeTipsEmail } }`
3. `src/pages/candidate/ApplicationsPage.jsx` (`/candidate/applications`): Status pill tabs (*All*, *Applied*, *Screening*, *Interview*, *Offer*, *Rejected*), job/company search, table rows with expandable detail cards, score breakdowns, application timelines, empty states, and pagination (10/page).
4. `src/pages/candidate/InterviewsPage.jsx` (`/candidate/interviews`): Tabbed/stacked Upcoming & Completed sections, Start Interview modal, scorecard detail modal with question list, animated bars, and AI written recommendations.
5. `src/pages/candidate/ResumeScorePage.jsx` (`/candidate/resume-score` & `/candidate/score`): Hero card with circular score ring, skills breakdown, extracted summary, AI suggestions list, and re-scan CTA.
6. `src/pages/candidate/ScanHistoryPage.jsx` (`/candidate/scan-history`): Top-right "+ New Scan" CTA button and modal, searchable past scan list, score badge, and historical scan detail modal.
7. `src/pages/candidate/CandidateSettingsPage.jsx` (`/candidate/settings`): Vertical sections for Profile (avatar, name, read-only verified email), Password (RHF + Zod validation requiring min 8 chars & 1 number), Notification preference switches, Theme toggle, and Danger Zone with Delete Account confirmation modal requiring typing "DELETE".

### 2026-09-07 — Additive FeatureGate & Post-Login Redirection

**Built (Additive only — no existing page structure changed):**
- `src/components/FeatureGate/FeatureGate.jsx` — Reusable component gating interactive widgets by role (`requiredRole="CANDIDATE"`):
  - Unauthenticated (Guest): Renders a sleek locked card with Lock icon, "Sign in to try it" heading, descriptive subtext, and a button linking to `/login?redirect=...` preserving the current product page path.
  - Authenticated as `CANDIDATE`: Renders children (interactive demo widget) verbatim without any alteration.
  - Authenticated as `RECRUITER` or `ADMIN`: Renders a neutral notice ("This tool is for candidates — recruiters can review results from their dashboard") with a direct link to their dashboard instead of a sign-in prompt.
- `src/pages/products/ResumeScreening/sections/RSDemo.jsx` — Wrapped only the interactive upload/result widget (`demo-grid`) in `<FeatureGate requiredRole="CANDIDATE">`. All surrounding sections, headings, and styling remain untouched.
- `src/pages/products/AIInterview/sections/AIDemo.jsx` — Wrapped only the interactive chat/evaluation widget (`ai-demo-grid`) in `<FeatureGate requiredRole="CANDIDATE">`. All surrounding sections, headings, and styling remain untouched.
- `src/routes/RoleRedirect.jsx` — Updated to inspect `redirect` query parameter and location state so authenticated users visiting `/login?redirect=...` are redirected back to the requested product page instead of a generic role dashboard.
- `src/pages/Login/LoginPage.jsx` — Updated `useEffect`, `devLogin`, and `onSubmit` to read and navigate to `redirect` parameter; added "Candidate" button to DEV quick login.

### 2026-09-02 — Full Recruiter & Admin Dashboards

**Built:**
- `src/layouts/RecruiterShell.jsx` — Forest-green collapsible sidebar (256px → 64px) + topbar (search, notifications, user avatar menu). Fully distinct from AppShell.
- `src/layouts/AdminShell.jsx` — Navy-indigo sidebar + topbar with Shield icon. Completely separate from RecruiterShell.
- `src/mock/recruiter/` — 7 mock data files (dashboard, jobs, candidates, screening, interview, ranking, scheduler). Every shape matches the real Spring Boot DTO structure; each has `TODO: replace with GET /api/...` markers.
- `src/mock/admin/adminMock.js` — Platform-wide stats (MOCK_ADMIN_SUMMARY), user list (MOCK_USERS), analytics (MOCK_PLATFORM_ANALYTICS).

**Recruiter Pages (all under `/recruiter/*` → RecruiterShell):**
- `RecruiterDashboardHome.jsx` — Animated stat cards (AnimatedCounter), activity feed, quick-action links
- `RecruiterJobsPage.jsx` — Job card grid + RHF/Zod post-job modal + SkillTagInput
- `RecruiterCandidatesPage.jsx` — Searchable/filterable table + slide-in detail panel with score breakdown bars
- `RecruiterResumeScreeningPage.jsx` — Recommendation badges, matched/missing skill chips, job + rec filters
- `RecruiterAIInterviewPage.jsx` — Generate interview flow with result panel (animated score bars)
- `RecruiterCandidateRankingPage.jsx` — Job dropdown, medal emojis, AI reasoning per candidate
- `RecruiterSchedulerPage.jsx` — Date-grouped interview list + schedule modal
- `RecruiterProfilePage.jsx` — Account details + change-password (RHF/Zod)
- `RecruiterSettingsPage.jsx` — Theme toggle + animated notification preference switches

**Admin Pages (all under `/admin/*` → AdminShell):**
- `AdminDashboardHome.jsx` — Platform-wide stat cards (indigo/cyan palette), quick-action grid
- `AdminUserManagementPage.jsx` — Searchable role-filtered table, enable/disable toggle per user
- `AdminPlatformAnalyticsPage.jsx` — Recharts area+bar charts, date range filter (7d/30d/90d)
- `AdminApiKeysPage.jsx` — LLM provider selector (OpenAI/Gemini/Anthropic/Cohere), masked API key input, model + token config
- `AdminSystemSettingsPage.jsx` — Platform name/email, limits, feature flags (AI Screening, AI Interview, Registration, Maintenance Mode)
- `AdminProfilePage.jsx` — Admin account details + change-password

**App.jsx:** Fully rewired — RecruiterShell + AdminShell used for respective roles. Candidate still uses AppShell.

**Key decisions:**
- `RoleRedirect.jsx` already had correct ROLE_HOME map; no changes needed.
- Admin and Recruiter shells are entirely separate files (not a prop-switched AppShell) to allow independent styling evolution.
- Every mock data file export name matches the import in the page (`MOCK_JOBS`, `MOCK_CANDIDATES`, etc.) for zero-friction backend swap.

### 2026-09-02 — Analytics Dashboard (`/recruiter/analytics` + `/admin/analytics`)


- **Built / Changed:**
  - `src/services/analyticsService.js` — Axios API client for 7 analytics endpoints on Spring Boot. JWT attached via interceptor. RECRUITER = own data, ADMIN = platform-wide (server-scoped).
  - `src/hooks/useMockAnalytics.js` — Mock data hook returning realistic data in exact API shape. Clearly labelled per Rules.md §8. Replace calls with real analyticsService when backend ships.
  - `src/pages/Analytics/AnalyticsPage.jsx` — Root page: date-range filter (7d/30d/90d), re-fetches all data on range change, global error banner with retry, refresh button, export button stub.
  - `src/pages/Analytics/AnalyticsStatCards.jsx` — 5 KPI cards: Total Resumes Screened, Avg Resume Score, Total Interviews, Interview Success Rate, Active Job Postings. Animated count-up, trend indicators (green/red), staggered Framer Motion entrance, shimmer skeleton.
  - `src/pages/Analytics/AnalyticsCharts.jsx` — 6 Recharts charts: HiringTrend (AreaChart), ScoreDistribution (BarChart), InterviewOutcomes (Donut PieChart), SkillDistribution (Horizontal BarChart), CandidatesPerJob (BarChart), MonthlyHires (LineChart). All use Design.md primary/secondary gradient palette. Each: skeleton, empty state, error+retry.
  - `src/pages/Analytics/AnalyticsInsights.jsx` — Auto-generated insight callout (pure computation from page data, no extra API/AI call). Derives 2-3 insight strings from summary trends, top skill, interview rate.
  - `src/pages/Analytics/AnalyticsActivityTable.jsx` — Recent activity table: 6 columns (Candidate, Job, Type, Score bar, Recommendation badge, Date), live search filter, paginated (8 per page), horizontally scrollable on mobile, row skeleton, empty/error states.
  - `App.jsx` — Added `<Route path="/recruiter/analytics" element={<AnalyticsPage />} />` and `<Route path="/admin/analytics" element={<AnalyticsPage />} />` as real (uncommented) protected routes.
  - `Sidebar.jsx` — Removed `disabled: true` from Analytics nav item for both RECRUITER and ADMIN.

- **Key decisions:**
  - Mock data hook pattern: same shape as real API response so swapping to real service = 1-line change per hook call.
  - `useMockAnalytics` is range-aware: different multipliers/data shapes per 7d/30d/90d.
  - Chart colors: all use JS constants matching Design.md tokens (PRIMARY = #6366F1, SECONDARY = #22D3EE) — no default Recharts colors.
  - Recharts was already in package.json (installed previously).
  - Insights: pure JS derivation from existing state — no LLM call (Rules.md §8 compliance).

- **Next sessions:**
  - Phase 3: Spring Boot backend (REST APIs, JWT, JPA entities)
  - Phase 3: Wire analyticsService.js to real endpoints once backend is live
  - Remaining marketing pages: `/products/candidate-ranking`, `/products/analytics`

### 2026-09-02 — AI Interview Product Page (`/products/ai-interview`)

- **Built / Changed:**
  - New page: `src/pages/products/AIInterview/AIInterviewPage.jsx` — root component, assembles 9 section sub-components.
  - **9 section sub-components** under `sections/`:
    1. `AIHero.jsx` — breadcrumb, gradient H1, animated interview card (question bubble + Communication/Confidence/Technical bars + floating badge)
    2. `AIDemo.jsx` — chat-style interview panel (AI question ↔ candidate answer bubbles) + result panel with animated score bars, recommendation tag, AI note
    3. `AIHowItWorks.jsx` — 4-step cards with connecting gradient line (Select → Generate → Answer → Evaluate)
    4. `AIEvaluated.jsx` — 6-card grid: Communication, Confidence, Technical Performance, Final Recommendation, Per-Question Notes, Question Tailoring
    5. `AIBenefits.jsx` — 3-column: Structured First Rounds / Consistent Evaluation Criteria / Faster Time-to-Shortlist
    6. `AIShowcase.jsx` — full polished product screenshot mockup (browser chrome + 5-question list + score breakdown + AI summary + action buttons) in gradient border frame
    7. `AIFAQ.jsx` — 6-item accordion: question generation, audio/video scope (MVP out-of-scope), scoring mechanics, customisation, data privacy, result latency
    8. `AICrossLinks.jsx` — 3 cross-product cards (Resume Screening = Available now / Candidate Ranking + Analytics = Coming soon)
    9. `AIFinalCTA.jsx` — gradient-bordered CTA band with dual Register + Sign In buttons
  - `App.jsx` — added `<Route path="/products/ai-interview" element={<AIInterviewPage />} />`
  - `RSCrossLinks.jsx` — AI Interview badge updated from Coming soon → Available now (green)

- **Navigation (no changes needed — already wired from previous session):**
  - `LandingNavbar.jsx` — PRODUCTS array already had `href: '/products/ai-interview'`
  - `LandingPage.jsx` — FEATURE_CATS already had `href:'/products/ai-interview'` on AI Interview card

- **Pattern note — next product pages:**
  - `/products/candidate-ranking` → `src/pages/products/CandidateRanking/` (add route in App.jsx)
  - `/products/analytics` → `src/pages/products/Analytics/` (add route in App.jsx)
  - Phase 3: Spring Boot backend scaffold

### 2026-09-02 — AI Resume Screening Product Page (`/products/resume-screening`)

- **Built / Changed:**
  - New page: `src/pages/products/ResumeScreening/ResumeScreeningPage.jsx` — root component, assembles 9 section sub-components.
  - **9 section sub-components** (each in its own file under `sections/`):
    1. `RSHero.jsx` — breadcrumb pill, gradient H1, hero card with animated score ring + skills bars + chips, CTAs, micro-stats
    2. `RSDemo.jsx` — drag-drop upload zone + animated score ring/bars counting up on scroll via Framer Motion + `useInView`
    3. `RSHowItWorks.jsx` — 4-step cards with connecting gradient line
    4. `RSAnalyzed.jsx` — 8-card grid covering every ML pipeline output dimension
    5. `RSBenefits.jsx` — 3-column benefits with gradient icon circles
    6. `RSShowcase.jsx` — full polished product screenshot mockup (browser chrome, full breakdown, AI rationale) inside gradient border glow frame
    7. `RSFAQ.jsx` — 6-item accordion with AnimatePresence, original Q&A copy (file formats, scoring, accuracy, privacy, customisation, speed)
    8. `RSCrossLinks.jsx` — 3 cross-product cards (AI Interview, Candidate Ranking, Analytics) with Coming Soon badges
    9. `RSFinalCTA.jsx` — gradient-bordered full-width CTA band with dual buttons
  - `App.jsx` — added public `<Route path="/products/resume-screening" element={<ResumeScreeningPage />} />`
  - `LandingNavbar.jsx` — Navbar dropdown now uses React Router `<Link to>` for internal routes instead of `<a href>`. Resume Screening → `/products/resume-screening`.
  - `LandingPage.jsx` — `FEATURE_CATS` array now has `href` per item. Each feature card renders a "Learn more →" link using React Router `<Link to={href}>`.

- **Design adherence:** Uses all existing CSS tokens, GradientButton, GlassCard, SectionHeading components. Framer Motion: staggered hero entrance, whileInView scroll reveals (once: true), animated score counter with `useInView + animate()`, hover-lift on all cards per Design.md spec.

- **Pattern note for next sessions:** The same folder/component pattern should be reused for:
  - `/products/ai-interview` → `src/pages/products/AIInterview/`
  - `/products/candidate-ranking` → `src/pages/products/CandidateRanking/`
  - `/products/analytics` → `src/pages/products/Analytics/`
  Each needs its own route in `App.jsx` and Navbar linking (already pre-wired in `PRODUCTS` array).

- **Next session:**
  - Build AI Interview product page (same pattern)
  - Start Phase 3: Spring Boot backend scaffold

### 2026-09-02 — Phase 2: Complete Color & Hero UI Overhaul (Beige/Olive Theme)

- **Built / Changed:**
  - `index.css` — **full token overhaul**: `:root` now defaults to warm beige/olive green theme matching reference design image:
    - `--bg-base: #F2EFE8`, `--bg-surface: #FAF9F5`, `--bg-elevated: #FFFFFF`
    - `--primary: #3D5016`, `--secondary: #6B8A3A` (forest olive greens)
    - `--text-primary: #1A1F0E`, `--text-secondary: #4A5239`
    - `.dark` class swapped to be the dark indigo/cyan opt-in (preserves Dashboard dark theme support)
    - Added `.hero-dot-bg` utility class for warm olive dot-grid pattern
    - All glass, border, glow, chart-bar colors updated to olive tones
  - `LandingPage.jsx` — **hero section overhaul**:
    - Background: warm beige `--bg-base` + olive dot-grid + soft olive radial glow (replaces indigo/cyan blobs)
    - Pill badge: olive border/background instead of indigo
    - Sub-feature icon circles: olive background instead of indigo
    - All 3 floating dashboard cards: white (`#FFFFFF`) background with olive-toned borders/shadows
    - AI Resume Score ring: dark olive → lighter olive gradient (was blue → indigo)
    - Top Candidates candidate rows: olive-tinted row backgrounds
    - AI Interview Completed badge: dark olive gradient (was blue → purple)
    - Hiring Pipeline step icons: olive active/inactive states
    - Recent Activity icon backgrounds: green tones matching olive theme
    - All section cards/tags/icon-circles throughout full page: replaced `rgba(99,102,241,...)` indigo with `rgba(61,80,22,...)` olive
  - `LandingNavbar.jsx` — **navbar color updates**:
    - Scrolled background: `rgba(242,239,232,0.92)` warm cream (was dark `rgba(10,14,26,0.88)`)
    - Mobile drawer: cream background (was dark)
    - Logo shadow, dropdown shadow, featured-card gradient: all updated to olive
    - Pro card dark background: dark olive `#1f2d0a` (was dark purple `#1a1040`)
  - `GradientButton.jsx` — button box-shadows updated from indigo (`rgba(99,102,241,...)`) to olive (`rgba(61,80,22,...)`)

- **Theme Architecture:**
  - Landing page is light/beige by default (`:root` tokens)
  - Dashboard/app shell uses `.dark` class for its dark mode
  - `useTheme.js` toggles `.dark` on `<html>` — Navbar theme toggle now switches between cream and dark

- **Next session:**
  - Apply consistent light theme to Login/Register/ForgotPassword pages
  - Start Phase 3: Spring Boot backend scaffold + `/health` endpoint


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


### 2026-09-07 — Candidate Dashboard Redesign + Register Role Security Fix

**Dashboard Redesign (`CandidateDashboard.jsx` + `AppShell.jsx` + `Sidebar.jsx` + `index.css`)**
- Root cause of light/beige theme in dashboard: `:root` CSS uses olive/beige palette (for landing page); AppShell never applied the dark theme override.
- Fix: Added `.app-shell` CSS class to `index.css` that sets all Design.md canonical dark tokens (`--bg-base: #0A0E1A`, `--primary: #6366F1`, `--secondary: #22D3EE`, etc.) scoped to authenticated shell only. Applied via `className="app-shell"` on AppShell root div. Landing page `:root` is unchanged.
- Sidebar active indicator: replaced solid `var(--primary)` block with gradient left-bar (`3px solid #6366F1`) + indigo-tinted `rgba(99,102,241,0.12)` background. Matches Design.md §7 gradient system.
- CandidateDashboard fully rewritten with:
  - Gradient welcome header (indigo→cyan gradient text)
  - 3-card highlight row: Latest Resume Score (SVG progress ring with count-up), Quick Resume Check CTA (links to `/products/resume-screening#rs-demo`), Application Tracker (2×2 stat grid)
  - 4 stat cards with `AnimatedCounterInline` (count-up from 0), per-card colored icon containers, empty-state messages (no "Phase 3+ will add..." banner)
  - Two-column resume upload panel: drag-and-drop zone + JD paste textarea + gradient Analyze button (disabled until file chosen)
  - Recent activity list with mock data; empty state variant coded; `// TODO: replace with GET /api/candidate/activity` comment
  - Framer Motion: staggered entrance (`staggerChildren: 0.08`), `whileHover={{ y: -6 }}` on highlight cards, count-up on numbers, per Design.md §9
  - `MOCK_MODE = true` flag at top of file to toggle between empty and populated states for verification
  - Upload panel not extracted from RSDemo (too tightly coupled to product page context) — `// TODO: refactor into shared <ResumeUploadZone>` comment left

**Register Role Security Fix (`RegisterPage.jsx` + `validationSchemas.js`)**
- Removed `ADMIN` from the public register form entirely — two changes to guarantee this:
  1. **Zod schema** (`validationSchemas.js`): `role: z.enum(['CANDIDATE', 'RECRUITER'])` — `ADMIN` is not in the allowed enum. Any API call with `role=ADMIN` is rejected at validation before `authService.register()` is called, even if devtools are used to manipulate form state.
  2. **UI** (`RegisterPage.jsx`): `<select>` dropdown replaced with two card-style `<motion.button>` role pickers — "I'm looking for a job" (CANDIDATE) and "I'm hiring" (RECRUITER). The hidden `<input {...register('role')} />` keeps react-hook-form wiring. No `<option value="ADMIN">` anywhere in the component tree.
- Default role changed from `RECRUITER` to `CANDIDATE` (job seekers are the primary registrant flow).
- No admin-specific conditional fields existed — nothing else to remove.
- Admin account creation remains a **backend-only concern**: when Phase 1 (Auth Service) is built, admins will be seeded or created via a protected internal endpoint. The shared Login page remains untouched — existing admin accounts can still sign in normally.
- Subtitle updated to "Join thousands using AI to hire smarter and land better jobs." (inclusive of both roles).

### 2026-09-07 (session 2) — Shared File Validation Hook + Candidate Sidebar Redesign

**Shared `useResumeFileValidation` hook (`src/hooks/useResumeFileValidation.js`) [NEW]**
- Created per reviewer comment: centralises all resume upload validation rules in one place so both upload UIs stay in sync automatically.
- Canonical rules: allowed MIME types (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword) + allowed extensions (.pdf, .docx, .doc) as fallback, max size 5 MB (`MAX_FILE_SIZE_BYTES`).
- Exports: default hook `useResumeFileValidation()` → `{ validateFile, fileError, clearFileError }`; named `getFileValidationError(file)` pure function; `FILE_ERRORS` message constants; `MAX_FILE_SIZE_BYTES` and `MAX_FILE_SIZE_LABEL`.
- Both `RSDemo.jsx` and `CandidateDashboard.jsx` import and use this hook — changing the rules in one file affects both upload UIs.
- `RSDemo.jsx` updated: drag-drop `onDrop` and `onChange` now call `handleFileSelect` (which calls `validateFile`); `fileError` displayed inline in upload zone; `uploadedFile` state added with Remove button.
- `CandidateDashboard.jsx` updated: `handleResumeFileSelect` replaces bare `setResumeFile`; `clearFileError` called on Remove and Browse; `fileError` displayed in upload zone; `id="resume-upload-panel"` added for sidebar scroll-to target.

**Candidate Sidebar Redesign (`Sidebar.jsx` full rewrite)**
- Sidebar now renders `CandidateSidebarBody` when `role === 'CANDIDATE'`, `GenericSidebarBody` for RECRUITER/ADMIN (unchanged logic).
- Shared `NavItem` helper component extracts NavLink rendering; `navItemStyle()` helper produces the gradient left-bar active indicator consistently.
- `CandidateSidebarBody` structure (top to bottom):
  1. **Logo area**: HireGenius AI wordmark + gradient Sparkles icon; mobile X close button; collapses to icon-only.
  2. **Primary CTA**: full-width gradient `+ New Resume Check` button. On click: if on `/candidate/dashboard`, scrolls to `#resume-upload-panel`; otherwise navigates there first (350ms delay) then scrolls. `whileHover={{ scale: 1.02 }}` per Design.md.
  3. **Main nav**: Dashboard / Applications / My Interviews / Resume Score / Settings with gradient left-bar active indicator.
  4. **Divider**: `1px solid var(--border)`, 16px margins.
  5. **Secondary section**: "Coming Soon" uppercase muted label + disabled "Interview Practice" item (opacity 0.4, cursor: not-allowed) with gradient "New" pill badge (border-radius 999px per Design.md).
  6. **Help link**: pinned at bottom above border; `// TODO: wire to help route/modal` comment; inactive-item hover styling.
- All colors use `.app-shell` scoped CSS variables (`var(--surface)`, `var(--border)`, `var(--text-primary)`, `var(--gradient-start/end)`, etc.) — no hardcoded hex values.
- Desktop collapse (64px icon-only) and mobile drawer overlay behavior fully preserved from AppShell.
- `id` attributes on CTA (`sidebar-new-resume-check`), nav items (`sidebar-nav-*`), help link (`sidebar-help-link`) for testability.

### 2026-09-12 � CI/CD, Docker and 4-Piece Architecture Update
- Built: Scaffolded missing backend services (auth-service, core-api, ai-ml-service), created Dockerfiles for all 4 services, root docker-compose.yml, .env.example, and 4 separate GitHub Actions workflows for CI/CD.
- Changed: Architecture updated from 2-service backend to 4-piece (frontend, auth-service, core-api, ai-ml-service). Replaced old DevOps references.
- Next: Deploy backend services to staging and wire frontend Axios calls to auth-service and core-api.


### 2026-09-12 � Frontend CI/CD Verification & Vercel Deployment Setup

**Verified & Fixed Local Frontend CI/CD Setup:**
- Verified 
pm run lint inside hiregenius-frontend/ (Passed with 0 errors).
- Verified 
pm run build inside hiregenius-frontend/ (Passed, 2935 modules transformed).
- Updated hiregenius-frontend/Dockerfile base image from 
ode:20.11.1-alpine to 
ode:20-alpine (Node >= 20.19.0) to support ite v8.2.1 / olldown (util.styleText).
- Tested docker build -t hiregenius-frontend:test . (Passed).
- Tested docker run on exposed port 8080 and verified HTTP GET returned 200 OK.

**Vercel Deployment Pipeline (.github/workflows/frontend-ci.yml + ercel.json):**
- Added hiregenius-frontend/vercel.json specifying Vite framework, 
pm run build build command, and dist output directory for monorepo configuration.
- Extended .github/workflows/frontend-ci.yml with:
  - deploy-preview: Triggers on pull_request targeting dev or main, depends on uild-and-test, deploys preview build via mondnet/vercel-action@v35, and automatically posts preview URL comment to the PR (github-comment: true).
  - deploy-production: Triggers ONLY on push to main, depends on uild-and-test, deploys --prod build via mondnet/vercel-action@v35.
  - Maintained side-by-side execution with uild-and-push-image (ghcr.io image push).
- Updated DevOps.md with complete architecture, workflow diagram details, and secret instructions.

**Secrets Required on GitHub Repository:**
- VERCEL_TOKEN: Generated from Vercel Account -> Tokens.
- VERCEL_ORG_ID: User/Team ID from Vercel Account/Team Settings.
- VERCEL_PROJECT_ID: Project ID from Vercel Project Settings -> General.

**Pushed Branch:**
- Pushed branch eature/frontend-cicd-setup to origin https://github.com/visucs/hiregenius.git.
