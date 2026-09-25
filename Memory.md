# Memory.md â€” HireGenius AI Build Log

Purpose: keep the AI coding assistant updated on real progress so it doesn't re-scan the whole codebase or re-guess decisions when a new chat/session starts. Update this file at the end of every work session or phase â€” keep entries short and factual.

---

## How to update this file
1. Add a new dated entry under "Session Log" summarizing what was actually built/changed.
2. Update "Current Status" to reflect the current phase (from `Phases.md`).
3. Update "Key Decisions" only when a real architectural/library decision is made (not in `Rules.md` already).
4. Update "Known Issues / TODO" â€” remove items once fixed.
5. Keep this file under ~200 lines â€” summarize old sessions instead of letting the log grow forever.

---

## Current Status
- **Active Phase:** Phase 2 complete âœ“ | Recruiter Dashboard âœ“ | Admin Dashboard âœ“ | Candidate Dashboard color-matched âœ“
- **Last Updated:** 2026-09-07

## Repo / Service Locations
- Frontend: `hiregenius-frontend/` â† active
- Backend: `hiregenius-backend/` â† not started yet
- AI Service: `hiregenius-ai-service/` â† not started yet
- ML Service: `hiregenius-ml-service/` â† not started yet

## Key Decisions
- **State management:** Redux Toolkit (chosen over Context API â€” more scalable for SaaS with auth, jobs, candidates, interviews in later phases).
- **JWT storage:** `localStorage` (keys: `hg_token`, `hg_user`) + Redux state. Both cleared on logout.
- **Tailwind version:** v4 with `@tailwindcss/vite` plugin (Vite-native, no separate `tailwind.config.js` needed â€” design tokens set via CSS variables in `index.css`).
- **Sidebar navigation items for Phase 2+ routes:** rendered but `pointer-events-none + opacity-40` until their phases are built. Avoids broken links.
- **AppShell location:** `src/layouts/AppShell.jsx` â€” Architecture.md doesn't define a `layouts/` folder; added it to keep the shell separate from components. Minor deviation, logged below.
- **Theme system (corrected 2026-09-07):** `:root` = off-white/olive green (light, default); `.dark` class on `<html>` = dark olive (same palette, dark variant). `useTheme.js` hook in `hooks/useTheme.js` toggles `.dark` on `<html>`. The Navbar `Moon/Sun` button calls `toggleTheme()`. The old `.app-shell` CSS class that forced a dark indigo/cyan palette (overriding `:root`) has been **removed** â€” authenticated pages now share the same olive/off-white design system as the landing page and correctly respond to the dark/light toggle. ALL colors in dashboard components use `var(--)` CSS tokens, not hardcoded hex.

## Known Issues / TODO
- Chunk size advisory (559KB unminified) â€” add dynamic imports / code-splitting in Phase 11 polish pass.
- `useTheme` hook currently reads from `localStorage` directly; if theme toggles in Navbar don't cause a re-render, a full Redux theme slice should replace it in Phase 11.
- Backend not started â€” all auth API calls will fail until Spring Boot is running. Auth pages handle errors gracefully (toast + error banner).
- Auth pages (Login, Register, ForgotPassword) still use hardcoded dark styles â€” they need a CSS-vars pass in a future session.
- Recruiter and Admin shells (`RecruiterShell.jsx`, `AdminShell.jsx`) may still have some hardcoded indigo/dark hex colors â€” audit in next pass.

### 2026-09-07 â€” Dashboard Color System Fix + Dark/Light Mode Toggle

**Problem:** The `.app-shell` CSS class in `index.css` was overriding all CSS variables with a hardcoded indigo/dark palette (`#0A0E1A`, `#6366F1`, `#22D3EE`) that had nothing to do with the off-white/olive landing page design. This broke the dark/light toggle â€” the toggle was switching `.dark` on `<html>` but `.app-shell` always won with its hardcoded values.

**Fixed:**
1. `src/index.css` â€” Removed the entire `.app-shell { --bg-base: #0A0E1A; ... }` override block. Replaced with a minimal `.app-shell { background-color: var(--bg-base); color: var(--text-primary); }` that inherits from `:root` (light) or `.dark` on `<html>`.
2. `src/pages/Dashboard/CandidateDashboard.jsx` â€” Full rewrite: all ~40 hardcoded dark hex colors (`#0F1420`, `#6366F1`, `#22D3EE`, `#F8FAFC`, `#94A3B8`, `#64748B`) replaced with CSS variable references (`var(--bg-elevated)`, `var(--primary)`, `var(--secondary)`, `var(--text-primary)`, etc.). The `card` base style object now uses `var(--bg-elevated)` and `var(--border)`. All icon backgrounds, badge chips, button states, drag-drop zone, and textarea use CSS vars.
3. `src/components/Sidebar/Sidebar.jsx` â€” Replaced `navItemStyle` hardcoded indigo (`rgba(99,102,241,0.12)`, `#6366F1`) with `var(--step-active-bg)` and `var(--primary)`. Fixed CTA button `boxShadow` from indigo to olive-green rgba.

**Result:** Candidate dashboard now shows **off-white (#F2EFE8 / #FAF9F5) backgrounds and dark olive green (#3D5016 / #6B8A3A) accents** in light mode, and a **dark olive (#0D110A / #1A1F10) palette** in dark mode â€” matching the landing page design system exactly. The Moon/Sun toggle in the Navbar fully switches both the landing page and dashboard.



### 2026-09-07 â€” Full Candidate Portal Destinations & Scan History Page

**Built & Enabled Pages (under `/candidate/*` â†’ AppShell):**
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

### 2026-09-07 â€” Additive FeatureGate & Post-Login Redirection

**Built (Additive only â€” no existing page structure changed):**
- `src/components/FeatureGate/FeatureGate.jsx` â€” Reusable component gating interactive widgets by role (`requiredRole="CANDIDATE"`):
  - Unauthenticated (Guest): Renders a sleek locked card with Lock icon, "Sign in to try it" heading, descriptive subtext, and a button linking to `/login?redirect=...` preserving the current product page path.
  - Authenticated as `CANDIDATE`: Renders children (interactive demo widget) verbatim without any alteration.
  - Authenticated as `RECRUITER` or `ADMIN`: Renders a neutral notice ("This tool is for candidates â€” recruiters can review results from their dashboard") with a direct link to their dashboard instead of a sign-in prompt.
- `src/pages/products/ResumeScreening/sections/RSDemo.jsx` â€” Wrapped only the interactive upload/result widget (`demo-grid`) in `<FeatureGate requiredRole="CANDIDATE">`. All surrounding sections, headings, and styling remain untouched.
- `src/pages/products/AIInterview/sections/AIDemo.jsx` â€” Wrapped only the interactive chat/evaluation widget (`ai-demo-grid`) in `<FeatureGate requiredRole="CANDIDATE">`. All surrounding sections, headings, and styling remain untouched.
- `src/routes/RoleRedirect.jsx` â€” Updated to inspect `redirect` query parameter and location state so authenticated users visiting `/login?redirect=...` are redirected back to the requested product page instead of a generic role dashboard.
- `src/pages/Login/LoginPage.jsx` â€” Updated `useEffect`, `devLogin`, and `onSubmit` to read and navigate to `redirect` parameter; added "Candidate" button to DEV quick login.

### 2026-09-02 â€” Full Recruiter & Admin Dashboards

**Built:**
- `src/layouts/RecruiterShell.jsx` â€” Forest-green collapsible sidebar (256px â†’ 64px) + topbar (search, notifications, user avatar menu). Fully distinct from AppShell.
- `src/layouts/AdminShell.jsx` â€” Navy-indigo sidebar + topbar with Shield icon. Completely separate from RecruiterShell.
- `src/mock/recruiter/` â€” 7 mock data files (dashboard, jobs, candidates, screening, interview, ranking, scheduler). Every shape matches the real Spring Boot DTO structure; each has `TODO: replace with GET /api/...` markers.
- `src/mock/admin/adminMock.js` â€” Platform-wide stats (MOCK_ADMIN_SUMMARY), user list (MOCK_USERS), analytics (MOCK_PLATFORM_ANALYTICS).

**Recruiter Pages (all under `/recruiter/*` â†’ RecruiterShell):**
- `RecruiterDashboardHome.jsx` â€” Animated stat cards (AnimatedCounter), activity feed, quick-action links
- `RecruiterJobsPage.jsx` â€” Job card grid + RHF/Zod post-job modal + SkillTagInput
- `RecruiterCandidatesPage.jsx` â€” Searchable/filterable table + slide-in detail panel with score breakdown bars
- `RecruiterResumeScreeningPage.jsx` â€” Recommendation badges, matched/missing skill chips, job + rec filters
- `RecruiterAIInterviewPage.jsx` â€” Generate interview flow with result panel (animated score bars)
- `RecruiterCandidateRankingPage.jsx` â€” Job dropdown, medal emojis, AI reasoning per candidate
- `RecruiterSchedulerPage.jsx` â€” Date-grouped interview list + schedule modal
- `RecruiterProfilePage.jsx` â€” Account details + change-password (RHF/Zod)
- `RecruiterSettingsPage.jsx` â€” Theme toggle + animated notification preference switches

**Admin Pages (all under `/admin/*` â†’ AdminShell):**
- `AdminDashboardHome.jsx` â€” Platform-wide stat cards (indigo/cyan palette), quick-action grid
- `AdminUserManagementPage.jsx` â€” Searchable role-filtered table, enable/disable toggle per user
- `AdminPlatformAnalyticsPage.jsx` â€” Recharts area+bar charts, date range filter (7d/30d/90d)
- `AdminApiKeysPage.jsx` â€” LLM provider selector (OpenAI/Gemini/Anthropic/Cohere), masked API key input, model + token config
- `AdminSystemSettingsPage.jsx` â€” Platform name/email, limits, feature flags (AI Screening, AI Interview, Registration, Maintenance Mode)
- `AdminProfilePage.jsx` â€” Admin account details + change-password

**App.jsx:** Fully rewired â€” RecruiterShell + AdminShell used for respective roles. Candidate still uses AppShell.

**Key decisions:**
- `RoleRedirect.jsx` already had correct ROLE_HOME map; no changes needed.
- Admin and Recruiter shells are entirely separate files (not a prop-switched AppShell) to allow independent styling evolution.
- Every mock data file export name matches the import in the page (`MOCK_JOBS`, `MOCK_CANDIDATES`, etc.) for zero-friction backend swap.

### 2026-09-02 â€” Analytics Dashboard (`/recruiter/analytics` + `/admin/analytics`)


- **Built / Changed:**
  - `src/services/analyticsService.js` â€” Axios API client for 7 analytics endpoints on Spring Boot. JWT attached via interceptor. RECRUITER = own data, ADMIN = platform-wide (server-scoped).
  - `src/hooks/useMockAnalytics.js` â€” Mock data hook returning realistic data in exact API shape. Clearly labelled per Rules.md Â§8. Replace calls with real analyticsService when backend ships.
  - `src/pages/Analytics/AnalyticsPage.jsx` â€” Root page: date-range filter (7d/30d/90d), re-fetches all data on range change, global error banner with retry, refresh button, export button stub.
  - `src/pages/Analytics/AnalyticsStatCards.jsx` â€” 5 KPI cards: Total Resumes Screened, Avg Resume Score, Total Interviews, Interview Success Rate, Active Job Postings. Animated count-up, trend indicators (green/red), staggered Framer Motion entrance, shimmer skeleton.
  - `src/pages/Analytics/AnalyticsCharts.jsx` â€” 6 Recharts charts: HiringTrend (AreaChart), ScoreDistribution (BarChart), InterviewOutcomes (Donut PieChart), SkillDistribution (Horizontal BarChart), CandidatesPerJob (BarChart), MonthlyHires (LineChart). All use Design.md primary/secondary gradient palette. Each: skeleton, empty state, error+retry.
  - `src/pages/Analytics/AnalyticsInsights.jsx` â€” Auto-generated insight callout (pure computation from page data, no extra API/AI call). Derives 2-3 insight strings from summary trends, top skill, interview rate.
  - `src/pages/Analytics/AnalyticsActivityTable.jsx` â€” Recent activity table: 6 columns (Candidate, Job, Type, Score bar, Recommendation badge, Date), live search filter, paginated (8 per page), horizontally scrollable on mobile, row skeleton, empty/error states.
  - `App.jsx` â€” Added `<Route path="/recruiter/analytics" element={<AnalyticsPage />} />` and `<Route path="/admin/analytics" element={<AnalyticsPage />} />` as real (uncommented) protected routes.
  - `Sidebar.jsx` â€” Removed `disabled: true` from Analytics nav item for both RECRUITER and ADMIN.

- **Key decisions:**
  - Mock data hook pattern: same shape as real API response so swapping to real service = 1-line change per hook call.
  - `useMockAnalytics` is range-aware: different multipliers/data shapes per 7d/30d/90d.
  - Chart colors: all use JS constants matching Design.md tokens (PRIMARY = #6366F1, SECONDARY = #22D3EE) â€” no default Recharts colors.
  - Recharts was already in package.json (installed previously).
  - Insights: pure JS derivation from existing state â€” no LLM call (Rules.md Â§8 compliance).

- **Next sessions:**
  - Phase 3: Spring Boot backend (REST APIs, JWT, JPA entities)
  - Phase 3: Wire analyticsService.js to real endpoints once backend is live
  - Remaining marketing pages: `/products/candidate-ranking`, `/products/analytics`

### 2026-09-02 â€” AI Interview Product Page (`/products/ai-interview`)

- **Built / Changed:**
  - New page: `src/pages/products/AIInterview/AIInterviewPage.jsx` â€” root component, assembles 9 section sub-components.
  - **9 section sub-components** under `sections/`:
    1. `AIHero.jsx` â€” breadcrumb, gradient H1, animated interview card (question bubble + Communication/Confidence/Technical bars + floating badge)
    2. `AIDemo.jsx` â€” chat-style interview panel (AI question â†” candidate answer bubbles) + result panel with animated score bars, recommendation tag, AI note
    3. `AIHowItWorks.jsx` â€” 4-step cards with connecting gradient line (Select â†’ Generate â†’ Answer â†’ Evaluate)
    4. `AIEvaluated.jsx` â€” 6-card grid: Communication, Confidence, Technical Performance, Final Recommendation, Per-Question Notes, Question Tailoring
    5. `AIBenefits.jsx` â€” 3-column: Structured First Rounds / Consistent Evaluation Criteria / Faster Time-to-Shortlist
    6. `AIShowcase.jsx` â€” full polished product screenshot mockup (browser chrome + 5-question list + score breakdown + AI summary + action buttons) in gradient border frame
    7. `AIFAQ.jsx` â€” 6-item accordion: question generation, audio/video scope (MVP out-of-scope), scoring mechanics, customisation, data privacy, result latency
    8. `AICrossLinks.jsx` â€” 3 cross-product cards (Resume Screening = Available now / Candidate Ranking + Analytics = Coming soon)
    9. `AIFinalCTA.jsx` â€” gradient-bordered CTA band with dual Register + Sign In buttons
  - `App.jsx` â€” added `<Route path="/products/ai-interview" element={<AIInterviewPage />} />`
  - `RSCrossLinks.jsx` â€” AI Interview badge updated from Coming soon â†’ Available now (green)

- **Navigation (no changes needed â€” already wired from previous session):**
  - `LandingNavbar.jsx` â€” PRODUCTS array already had `href: '/products/ai-interview'`
  - `LandingPage.jsx` â€” FEATURE_CATS already had `href:'/products/ai-interview'` on AI Interview card

- **Pattern note â€” next product pages:**
  - `/products/candidate-ranking` â†’ `src/pages/products/CandidateRanking/` (add route in App.jsx)
  - `/products/analytics` â†’ `src/pages/products/Analytics/` (add route in App.jsx)
  - Phase 3: Spring Boot backend scaffold

### 2026-09-02 â€” AI Resume Screening Product Page (`/products/resume-screening`)

- **Built / Changed:**
  - New page: `src/pages/products/ResumeScreening/ResumeScreeningPage.jsx` â€” root component, assembles 9 section sub-components.
  - **9 section sub-components** (each in its own file under `sections/`):
    1. `RSHero.jsx` â€” breadcrumb pill, gradient H1, hero card with animated score ring + skills bars + chips, CTAs, micro-stats
    2. `RSDemo.jsx` â€” drag-drop upload zone + animated score ring/bars counting up on scroll via Framer Motion + `useInView`
    3. `RSHowItWorks.jsx` â€” 4-step cards with connecting gradient line
    4. `RSAnalyzed.jsx` â€” 8-card grid covering every ML pipeline output dimension
    5. `RSBenefits.jsx` â€” 3-column benefits with gradient icon circles
    6. `RSShowcase.jsx` â€” full polished product screenshot mockup (browser chrome, full breakdown, AI rationale) inside gradient border glow frame
    7. `RSFAQ.jsx` â€” 6-item accordion with AnimatePresence, original Q&A copy (file formats, scoring, accuracy, privacy, customisation, speed)
    8. `RSCrossLinks.jsx` â€” 3 cross-product cards (AI Interview, Candidate Ranking, Analytics) with Coming Soon badges
    9. `RSFinalCTA.jsx` â€” gradient-bordered full-width CTA band with dual buttons
  - `App.jsx` â€” added public `<Route path="/products/resume-screening" element={<ResumeScreeningPage />} />`
  - `LandingNavbar.jsx` â€” Navbar dropdown now uses React Router `<Link to>` for internal routes instead of `<a href>`. Resume Screening â†’ `/products/resume-screening`.
  - `LandingPage.jsx` â€” `FEATURE_CATS` array now has `href` per item. Each feature card renders a "Learn more â†’" link using React Router `<Link to={href}>`.

- **Design adherence:** Uses all existing CSS tokens, GradientButton, GlassCard, SectionHeading components. Framer Motion: staggered hero entrance, whileInView scroll reveals (once: true), animated score counter with `useInView + animate()`, hover-lift on all cards per Design.md spec.

- **Pattern note for next sessions:** The same folder/component pattern should be reused for:
  - `/products/ai-interview` â†’ `src/pages/products/AIInterview/`
  - `/products/candidate-ranking` â†’ `src/pages/products/CandidateRanking/`
  - `/products/analytics` â†’ `src/pages/products/Analytics/`
  Each needs its own route in `App.jsx` and Navbar linking (already pre-wired in `PRODUCTS` array).

- **Next session:**
  - Build AI Interview product page (same pattern)
  - Start Phase 3: Spring Boot backend scaffold

### 2026-09-02 â€” Phase 2: Complete Color & Hero UI Overhaul (Beige/Olive Theme)

- **Built / Changed:**
  - `index.css` â€” **full token overhaul**: `:root` now defaults to warm beige/olive green theme matching reference design image:
    - `--bg-base: #F2EFE8`, `--bg-surface: #FAF9F5`, `--bg-elevated: #FFFFFF`
    - `--primary: #3D5016`, `--secondary: #6B8A3A` (forest olive greens)
    - `--text-primary: #1A1F0E`, `--text-secondary: #4A5239`
    - `.dark` class swapped to be the dark indigo/cyan opt-in (preserves Dashboard dark theme support)
    - Added `.hero-dot-bg` utility class for warm olive dot-grid pattern
    - All glass, border, glow, chart-bar colors updated to olive tones
  - `LandingPage.jsx` â€” **hero section overhaul**:
    - Background: warm beige `--bg-base` + olive dot-grid + soft olive radial glow (replaces indigo/cyan blobs)
    - Pill badge: olive border/background instead of indigo
    - Sub-feature icon circles: olive background instead of indigo
    - All 3 floating dashboard cards: white (`#FFFFFF`) background with olive-toned borders/shadows
    - AI Resume Score ring: dark olive â†’ lighter olive gradient (was blue â†’ indigo)
    - Top Candidates candidate rows: olive-tinted row backgrounds
    - AI Interview Completed badge: dark olive gradient (was blue â†’ purple)
    - Hiring Pipeline step icons: olive active/inactive states
    - Recent Activity icon backgrounds: green tones matching olive theme
    - All section cards/tags/icon-circles throughout full page: replaced `rgba(99,102,241,...)` indigo with `rgba(61,80,22,...)` olive
  - `LandingNavbar.jsx` â€” **navbar color updates**:
    - Scrolled background: `rgba(242,239,232,0.92)` warm cream (was dark `rgba(10,14,26,0.88)`)
    - Mobile drawer: cream background (was dark)
    - Logo shadow, dropdown shadow, featured-card gradient: all updated to olive
    - Pro card dark background: dark olive `#1f2d0a` (was dark purple `#1a1040`)
  - `GradientButton.jsx` â€” button box-shadows updated from indigo (`rgba(99,102,241,...)`) to olive (`rgba(61,80,22,...)`)

- **Theme Architecture:**
  - Landing page is light/beige by default (`:root` tokens)
  - Dashboard/app shell uses `.dark` class for its dark mode
  - `useTheme.js` toggles `.dark` on `<html>` â€” Navbar theme toggle now switches between cream and dark

- **Next session:**
  - Apply consistent light theme to Login/Register/ForgotPassword pages
  - Start Phase 3: Spring Boot backend scaffold + `/health` endpoint


### 2026-08-09 â€” Full Landing Page & Navbar Rebuild (GoodSpace-pattern layout)

- **Built / Changed:**
  - `LandingNavbar.jsx` â€” **full rebuild**: Products dropdown (Resume Screening, AI Interview, Candidate Ranking, Analytics with icons + descriptions), sticky blur-on-scroll glass effect, stat pill badge above "Get Started" button ("50,000+ Resumes Screened"), theme toggle, mobile drawer with grouped product + nav links.
  - `LandingPage.jsx` â€” **full rebuild** with 11 sections following GoodSpace.ai layout pattern (all copy/data is original HireGenius AI content):
    1. **Hero** â€” pill badge, gradient H1, subtext, "Start Screening Free" CTA, full mock dashboard screenshot with floating "AI Resume Score: 92%" overlay card (Framer Motion entrance).
    2. **Demo Cards Row** â€” 3 sample role cards (Frontend Eng, ML Eng, PM) with company header, tags, score meta, "Start Demo" link.
    3. **How It Works** â€” 4 numbered horizontal steps (Post Job â†’ AI Screens â†’ AI Interviews â†’ Ranked Shortlist) with gradient icon circles.
    4. **Feature Category Cards** â€” 4-card grid (Resume Screening / AI Interview / Candidate Ranking / Analytics) each with icon, title, desc, 4 chip tags.
    5. **Social Proof Band** â€” stat headline + infinite-scrolling logo strip with placeholder tech names (no real company logos).
    6. **Stats** â€” AnimatedCounter band (10x faster, 98% satisfaction, 60% less time-to-hire, 500+ teams).
    7. **Benefits (3-col)** â€” Screen Faster / Reduce Bias / Actionable Insights with icon, heading, paragraph, 2 tag pills.
    8. **Cross-Sell Row** â€” 3 cards for Analytics Dashboard, Interview Scheduler, AI Interview Suite.
    9. **SEO Content** â€” 3 original paragraphs on AI-assisted recruitment, contextual scoring, and AI interview scaling.
    10. **FAQ Accordion** â€” 8 Q&As with AnimatePresence expand/collapse.
    11. **Footer** â€” multi-column (Product / Company / Legal), social icons (Twitter, LinkedIn, GitHub, Email), logo + tagline + copyright.
  - All sections use Design.md tokens, Framer Motion scroll reveals, stagger entrances, hover lifts. No external copy or real company logos used.

- **Next session (Phase 3):**
  - Build Spring Boot backend scaffold + `/health` endpoint
  - Wire Dashboard shell with real stat widgets

### 2026-08-08 â€” Premium UI/UX Rebuild (Landing + Auth + Design System)

- **Built / Changed:**
  - `Design.md` â€” completely replaced color/spacing/typography/elevation tokens with premium dark SaaS system (indigoâ†’cyan gradient, layered dark backgrounds `#0A0E1A / #0F1420 / #151B2C`, `rgba(255,255,255,0.08)` borders, Inter font, 96â€“120px section padding, 8/16/24/32/48/64/96/128 spacing scale, 20px card radius, 12px button radius).
  - `index.css` â€” full rewrite: dark `:root` as baseline, optional `.light` class override, `.gradient-text`, `.hero-glow`, `.section-padding`, `.glass-card`, `.skeleton` shimmer animation, scroll-bar, focus ring.
  - `useTheme.js` â€” changed default to `'dark'`, switched to `.light` class for light mode (`:root` = dark baseline).
  - `src/components/GradientButton/GradientButton.jsx` â€” new reusable component, indigoâ†’cyan gradient, supports Link + button, Framer Motion hover/tap, size variants.
  - `src/components/GlassCard/GlassCard.jsx` â€” new reusable component, `backdrop-blur(20px)`, scroll-reveal via `whileInView`, hover lift `-6px`.
  - `src/components/SectionHeading/SectionHeading.jsx` â€” new reusable component, eyebrow + gradient word + subtitle, scroll-reveal.
  - `src/components/AnimatedCounter/AnimatedCounter.jsx` â€” new reusable component, Framer Motion `animate()` count-up on scroll enter, gradient text.
  - `src/components/Navbar/LandingNavbar.jsx` â€” new, transparentâ†’glass on scroll, mobile drawer, sticky fixed, theme toggle.
  - `pages/Landing/LandingPage.jsx` â€” **full rebuild** with 8 sections: Hero (full-viewport, staggered entrance, glow blobs, badge, gradient H1, trust pills), Features (2Ã—3 glass card grid), How It Works (4-step flow with gradient icon circles), Stats band (AnimatedCounter), Testimonials (glass card grid), Final CTA (gradient-bordered card), Footer (multi-column with social icons).
  - `pages/Login/LoginPage.jsx` â€” rebuilt with glass card, animated glow background, focus border transitions, GradientButton.
  - `pages/Register/RegisterPage.jsx` â€” rebuilt with same glass-card aesthetic, back link, GradientButton.
  - `App.jsx` â€” Toaster updated to dark glass style with colored left-border per type.

- **Routing preserved:** `/` â†’ LandingPage, `/login` â†’ LoginPage (with RoleRedirect), `/register` â†’ RegisterPage (with RoleRedirect), `/recruiter/*`, `/admin/*`, `/candidate/*` protected routes all untouched.

- **New reusable components summary:**
  | Component | Location | Description |
  |---|---|---|
  | `GradientButton` | `components/GradientButton/` | Primary CTA â€” indigoâ†’cyan gradient, hover/tap animation |
  | `GlassCard` | `components/GlassCard/` | Glass card with scroll-reveal + hover lift |
  | `SectionHeading` | `components/SectionHeading/` | Section title block with gradient word + eyebrow |
  | `AnimatedCounter` | `components/AnimatedCounter/` | Scroll-triggered count-up with gradient text |
  | `LandingNavbar` | `components/Navbar/` | Landing-only sticky nav with scroll glass effect |

- **Next session (Phase 3):**
  - Build Spring Boot backend scaffold + `/health` endpoint
  - Wire up Dashboard shell with stat widgets (jobs count, candidates, pending interviews) using GlassCard
  - Apply GlassCard / SectionHeading to all dashboard pages


### 2026-08-07 â€” Phase 0 + Phase 1: Scaffold + Auth UI

- **Built:**
  - Vite + React scaffold inside `hiregenius-frontend/`
  - Installed: `@reduxjs/toolkit`, `react-redux`, `react-router-dom`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `recharts`, `react-hot-toast`, `framer-motion`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`
  - `index.css` â€” Tailwind import + all Design.md color tokens as CSS custom properties for light and dark themes
  - `src/store/store.js` â€” Redux store
  - `src/features/auth/authSlice.js` â€” JWT + user state, localStorage persistence, selectors
  - `src/services/api.js` â€” Axios instance, Bearer token interceptor, 401 auto-logout
  - `src/services/authService.js` â€” login / register / forgotPassword API wrappers
  - `src/hooks/useApiCall.js` â€” loading/error/success wrapper hook (Rules.md Â§4)
  - `src/hooks/useTheme.js` â€” dark/light toggle with localStorage
  - `src/utils/validationSchemas.js` â€” Zod schemas for loginSchema, registerSchema, forgotPasswordSchema
  - `src/utils/helpers.js` â€” formatError, formatDate, truncate
  - `src/routes/ProtectedRoute.jsx` â€” redirects to /login if unauthenticated
  - `src/components/Navbar/Navbar.jsx` â€” sticky top bar, theme toggle, logout
  - `src/components/Sidebar/Sidebar.jsx` â€” collapsible (desktop) + drawer (mobile), future nav items disabled
  - `src/components/Footer/Footer.jsx` â€” minimal footer
  - `src/components/Loader/Loader.jsx` â€” Framer Motion spinner
  - `src/pages/Login/LoginPage.jsx` â€” RHF + Zod, Redux auth, eye toggle, error/loading/success
  - `src/pages/Register/RegisterPage.jsx` â€” name/email/role/password/confirm, same pattern
  - `src/pages/ForgotPassword/ForgotPasswordPage.jsx` â€” email form + success state
  - `src/pages/Dashboard/DashboardPage.jsx` â€” Phase 1 placeholder showing build progress
  - `src/pages/NotFound/NotFoundPage.jsx` â€” 404 catch-all
  - `src/layouts/AppShell.jsx` â€” authenticated layout (Navbar + Sidebar + Footer + Outlet)
  - `src/App.jsx` â€” BrowserRouter with public + protected + 404 routes
  - `src/main.jsx` â€” entry point with Redux Provider
  - `.env`, `.env.example`, `.gitignore` â€” no secrets hardcoded
  - `vite.config.js` â€” Tailwind v4 plugin wired in
  - `index.html` â€” SEO title + meta description
  - `npm run build` passes âœ“ (2295 modules, no errors)

- **Changed (deviations from Architecture.md / Rules.md):**
  - Added `src/layouts/` folder â€” Architecture.md Â§4 doesn't list it. Decision: keeps AppShell out of `components/` (it's a layout, not a component). Low impact, easily reversible.
  - Tailwind v4 used (`@tailwindcss/vite`) instead of the classic v3 `tailwind.config.js` approach â€” same result (all tokens via CSS vars), but no separate config file needed.

- **Next session (Phase 2):**
  - Build full Landing page (public, pre-auth)
  - Build full Dashboard shell: sidebar active nav, dashboard summary cards (jobs count, candidates count, pending interviews)
  - Wire up backend "dashboard summary" endpoint once Spring Boot is running
  - Start Spring Boot project scaffold + `/health` endpoint

### Template for new entries
```
### YYYY-MM-DD â€” Phase X: <short title>
- Built: <what was implemented>
- Changed: <any deviation from Architecture.md / Rules.md, and why>
- Next: <what should happen next session>
```


### 2026-09-07 â€” Candidate Dashboard Redesign + Register Role Security Fix

**Dashboard Redesign (`CandidateDashboard.jsx` + `AppShell.jsx` + `Sidebar.jsx` + `index.css`)**
- Root cause of light/beige theme in dashboard: `:root` CSS uses olive/beige palette (for landing page); AppShell never applied the dark theme override.
- Fix: Added `.app-shell` CSS class to `index.css` that sets all Design.md canonical dark tokens (`--bg-base: #0A0E1A`, `--primary: #6366F1`, `--secondary: #22D3EE`, etc.) scoped to authenticated shell only. Applied via `className="app-shell"` on AppShell root div. Landing page `:root` is unchanged.
- Sidebar active indicator: replaced solid `var(--primary)` block with gradient left-bar (`3px solid #6366F1`) + indigo-tinted `rgba(99,102,241,0.12)` background. Matches Design.md Â§7 gradient system.
- CandidateDashboard fully rewritten with:
  - Gradient welcome header (indigoâ†’cyan gradient text)
  - 3-card highlight row: Latest Resume Score (SVG progress ring with count-up), Quick Resume Check CTA (links to `/products/resume-screening#rs-demo`), Application Tracker (2Ã—2 stat grid)
  - 4 stat cards with `AnimatedCounterInline` (count-up from 0), per-card colored icon containers, empty-state messages (no "Phase 3+ will add..." banner)
  - Two-column resume upload panel: drag-and-drop zone + JD paste textarea + gradient Analyze button (disabled until file chosen)
  - Recent activity list with mock data; empty state variant coded; `// TODO: replace with GET /api/candidate/activity` comment
  - Framer Motion: staggered entrance (`staggerChildren: 0.08`), `whileHover={{ y: -6 }}` on highlight cards, count-up on numbers, per Design.md Â§9
  - `MOCK_MODE = true` flag at top of file to toggle between empty and populated states for verification
  - Upload panel not extracted from RSDemo (too tightly coupled to product page context) â€” `// TODO: refactor into shared <ResumeUploadZone>` comment left

**Register Role Security Fix (`RegisterPage.jsx` + `validationSchemas.js`)**
- Removed `ADMIN` from the public register form entirely â€” two changes to guarantee this:
  1. **Zod schema** (`validationSchemas.js`): `role: z.enum(['CANDIDATE', 'RECRUITER'])` â€” `ADMIN` is not in the allowed enum. Any API call with `role=ADMIN` is rejected at validation before `authService.register()` is called, even if devtools are used to manipulate form state.
  2. **UI** (`RegisterPage.jsx`): `<select>` dropdown replaced with two card-style `<motion.button>` role pickers â€” "I'm looking for a job" (CANDIDATE) and "I'm hiring" (RECRUITER). The hidden `<input {...register('role')} />` keeps react-hook-form wiring. No `<option value="ADMIN">` anywhere in the component tree.
- Default role changed from `RECRUITER` to `CANDIDATE` (job seekers are the primary registrant flow).
- No admin-specific conditional fields existed â€” nothing else to remove.
- Admin account creation remains a **backend-only concern**: when Phase 1 (Auth Service) is built, admins will be seeded or created via a protected internal endpoint. The shared Login page remains untouched â€” existing admin accounts can still sign in normally.
- Subtitle updated to "Join thousands using AI to hire smarter and land better jobs." (inclusive of both roles).

### 2026-09-07 (session 2) â€” Shared File Validation Hook + Candidate Sidebar Redesign

**Shared `useResumeFileValidation` hook (`src/hooks/useResumeFileValidation.js`) [NEW]**
- Created per reviewer comment: centralises all resume upload validation rules in one place so both upload UIs stay in sync automatically.
- Canonical rules: allowed MIME types (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword) + allowed extensions (.pdf, .docx, .doc) as fallback, max size 5 MB (`MAX_FILE_SIZE_BYTES`).
- Exports: default hook `useResumeFileValidation()` â†’ `{ validateFile, fileError, clearFileError }`; named `getFileValidationError(file)` pure function; `FILE_ERRORS` message constants; `MAX_FILE_SIZE_BYTES` and `MAX_FILE_SIZE_LABEL`.
- Both `RSDemo.jsx` and `CandidateDashboard.jsx` import and use this hook â€” changing the rules in one file affects both upload UIs.
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
- All colors use `.app-shell` scoped CSS variables (`var(--surface)`, `var(--border)`, `var(--text-primary)`, `var(--gradient-start/end)`, etc.) â€” no hardcoded hex values.
- Desktop collapse (64px icon-only) and mobile drawer overlay behavior fully preserved from AppShell.
- `id` attributes on CTA (`sidebar-new-resume-check`), nav items (`sidebar-nav-*`), help link (`sidebar-help-link`) for testability.

### 2026-09-12 — CI/CD, Docker and 4-Piece Architecture Update
- Built: Scaffolded missing backend services (auth-service, core-api, ai-ml-service), created Dockerfiles for all 4 services, root docker-compose.yml, .env.example, and 4 separate GitHub Actions workflows for CI/CD.
- Changed: Architecture updated from 2-service backend to 4-piece (frontend, auth-service, core-api, ai-ml-service). Replaced old DevOps references.
- Next: Deploy backend services to staging and wire frontend Axios calls to auth-service and core-api.


### 2026-09-12 — Frontend CI/CD Verification & Vercel Deployment Setup

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

### 2026-09-12 — GitHub Pages Deployment Target Added (Purely Additive)

**Purely Additive Changes:**
- **hiregenius-frontend/vite.config.js**: Added ase: process.env.VITE_BASE_PATH || '/'. Defaults to '/' for local dev, Docker builds, and Vercel builds. Only sets '/hiregenius/' when VITE_BASE_PATH env var is explicitly provided.
- **.github/workflows/frontend-ci.yml**: Appended deploy-github-pages job. All existing jobs (uild-and-test, deploy-preview, deploy-production, uild-and-push-image) remain 100% byte-for-byte unchanged.
- **Client-Side Routing Fix**: Job executes cp dist/index.html dist/404.html so direct route access and page refreshes on GitHub Pages serve index.html without 404 errors.
- **Deployment Action**: Uses official ctions/upload-pages-artifact@v3 and ctions/deploy-pages@v4.
- **Target URL**: https://visucs.github.io/hiregenius/
- **Documentation**: Updated DevOps.md with GitHub Pages settings instructions.

### 2026-09-13 — Comprehensive Platform-Wide Responsiveness Hardening

**Scope & Rules Followed:**
- Strictly RESPONSIVENESS-ONLY: No new features, pages, components, copy, animations, or functional alterations.
- Strict adherence to Design.md spacing scale (4 / 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 px) and typography scale via CSS clamp().
- Verified and optimized across all 11 breakpoints: 320px, 375px, 390px, 428px, 600px, 768px, 1024px, 1280px, 1440px, 1920px, 2560px.
- Minimum touch tap target size >= 44x44px with >= 8px gap for all interactive elements across mobile and tablet viewports.
- Zero horizontal viewport overflow (overflow-x: hidden / zero horizontal scrollbars).

**Completed Responsive Hardening:**
1. **Global Styles (src/index.css)**:
   - Clamped padding on .dash-page (clamp(16px, 3vw, 32px) clamp(16px, 4vw, 36px)).
   - Container max-width constraints (1280px) for 4K displays.
   - Touch targets >= 44px on primary buttons, action rows, and inputs.
2. **Navigation & Shells (AppShell.jsx, RecruiterShell.jsx, AdminShell.jsx, LandingNavbar.jsx)**:
   - Mobile navigation overlays and responsive drawers with tap-friendly links.
   - Fluid topbars with wrapped controls and mobile search toggles.
3. **Public & Auth Pages**:
   - LandingPage.jsx, AIHero.jsx, RSHero.jsx, APHero.jsx: Responsive heroes and typography.
   - LoginPage.jsx, RegisterPage.jsx, ForgotPasswordPage.jsx: Responsive centered auth cards with 44px input and button touch targets.
4. **Candidate Portal (CandidateDashboard.jsx, ApplicationsPage.jsx, InterviewsPage.jsx, ResumeScorePage.jsx, ScanHistoryPage.jsx, CandidateSettingsPage.jsx)**:
   - Clamped heroes and responsive metric cards.
   - Modals constrained to maxWidth: min(Npx, 100%) and maxHeight: 90vh.
5. **Recruiter Portal (RecruiterDashboardHome.jsx, RecruiterCandidatesPage.jsx, RecruiterJobsPage.jsx, RecruiterResumeScreeningPage.jsx, RecruiterAIInterviewPage.jsx, RecruiterCandidateRankingPage.jsx, RecruiterSchedulerPage.jsx, RecruiterProfilePage.jsx, RecruiterSettingsPage.jsx)**:
   - Tables collapse cleanly to stacked cards below 768px (.rec-candidate-table vs .rec-candidate-cards).
   - Drawers constrained to min(440px, 100vw).
   - Form controls, date/time pickers, and modals optimized with auto-fit grids.
6. **Analytics Portal (AnalyticsPage.jsx, AnalyticsActivityTable.jsx)**:
   - Range tabs wrap gracefully; search input and action buttons touch-hardened.
   - Activity table collapses cleanly to stacked cards on mobile screens (.activity-cards-mobile).
7. **Admin Portal (AdminDashboardHome.jsx, AdminUserManagementPage.jsx, AdminPlatformAnalyticsPage.jsx, AdminApiKeysPage.jsx, AdminSystemSettingsPage.jsx, AdminProfilePage.jsx)**:
   - Responsive stats grids (4-col desktop, 2-col tablet, 1-col mobile).
   - Admin user table collapses to cards below 768px (.admin-user-table vs .admin-user-cards).
   - Charts reflow to single column on tablet/mobile screens.
   - 44px toggle buttons, password show/hide buttons, and wrapped action rows.

### 2026-09-13 — Production 1-Click Demo Portals & Graceful Offline Login

**Changes Implemented:**
- **LoginPage.jsx**:
  - Removed import.meta.env.DEV restriction so Demo 1-Click logins are available in production deployments (Vercel, GitHub Pages).
  - Configured realistic demo personas:
    - **Candidate**: Alex Morgan (candidate@hiregenius.ai) -> /candidate/dashboard
    - **Recruiter**: Sarah Chen (ecruiter@hiregenius.ai) -> /recruiter/dashboard
    - **Admin**: Marcus Vance (dmin@hiregenius.ai) -> /admin/dashboard
  - Added responsive $\ge 44 touch-target 1-click login cards with role-specific accent colors and persona badges.
  - Implemented graceful offline fallback in onSubmit: If backend API is unreachable/offline and a user enters any demo email, they are seamlessly authenticated to the corresponding demo dashboard.

### 2026-09-14 - Responsive Sidebar & Topbar Complete Overhaul

**Changes Implemented:**
- **Candidate Portal (AppShell.jsx)**: Decoupled mobile drawer from desktop sidebar collapsed state using renderSidebarContent(collapsed, isMobile). Drawer always expands full labels and brand header on mobile. Added dedicated 44px close button. Added mobile search toggle and drawer. Added fixed viewport positioning for notifs and user dropdowns on <= 480px.
- **Recruiter Portal (RecruiterShell.jsx)**: Decoupled mobile drawer from desktop collapsed state with renderContent(collapsed, isMobile). Added 44px close button. Added mobile search toggle and drawer. Fixed dropdown viewport overflow on <= 480px.
- **Admin Portal (AdminShell.jsx)**: Decoupled mobile drawer from desktop collapsed state with renderSidebarContent(collapsed, isMobile). Hid 'Admin Console' badge text on small screens (< 420px) to prevent horizontal width crunch. Added mobile search toggle and drawer. Fixed dropdown overflow on <= 480px.
- **Landing Navbar (LandingNavbar.jsx)**: Replaced fixed 4-col products grid with auto-fit minmax(min(100%, 145px), 1fr). Ensured mobile menu links and auth CTA buttons satisfy >= 44px touch targets.
- **Generic Sidebar (Sidebar.jsx)**: Decoupled desktop sidebar and mobile drawer; drawer always receives isCollapsed=false on mobile.
- **Build & Verification**: npm run build passed with 0 errors (2,935 modules in 910ms). npm run lint passed with 0 errors.


### 2026-09-14 - Landing Page Glassmorphism Redesign & Canonical Olive Tokens

**Context & Token Corrections:**
- Verified canonical brand tokens: Primary Olive (`#3D5016`), Secondary Olive (`#6B8A3A`), Olive Tint (`#a3c55a`), Off-White Canvas (`#F2EFE8`), Off-White Surface (`#FAF9F5`), Dark Warm Off-White (`#F0EDE4`).
- Updated `Design.md` to remove outdated indigo (`#6366F1`) and cyan (`#22D3EE`), replacing Section 2 with canonical tokens and adding Section 12 for the Landing Glassmorphism & Ambient Olive Glow specifications.
- Strictly prohibited cyan, purple, and indigo from background mesh or any elements.

**Landing Navbar Scoping (`LandingNavbar.jsx`):**
- Scoped floating pill navbar (`top: clamp(10px, 2vw, 16px)`, `max-width: 1240px`, `border-radius: clamp(16px, 3vw, 999px)`, deep glass background, specular top highlight) to `location.pathname === '/'` only.
- Ensured product pages (`/products/*`) and auth pages retain standard edge-to-edge navbar untouched.
- Replaced basic dropdown mobile menu with full-screen animated glass mobile drawer (`AnimatePresence`, `motion.div`, backdrop blur 24px, logo header, 44px close button).

**Landing Page Deep Glassmorphism (`LandingPage.jsx`):**
- Added fixed ambient olive glow mesh (3 blurred blobs: top-hero `#3D5016`/`#6B8A3A`, mid-page `#a3c55a`, bottom `#3D5016` with `blur(130pxâ€“140px)`, opacity 18â€“24% dark / 7â€“10% light, `pointer-events: none; z-index: 0; overflow: hidden`).
- Applied deep glass styling (`backdrop-filter: blur(24px) saturate(180%)`) with specular top highlight (`inset 0 1px 0 0 rgba(255,255,255,...)`) across Hero Bento cards, Stats Band, How It Works cards, Platform Features bento, Why HireGenius benefit cards, CTA band, FAQ accordion, and Footer.
- Added hardware-accelerated micro-interactions (`whileHover={{ y: -6, scale: 1.02 }}`) on interactive cards.
- Verified WCAG AA contrast in both light and dark modes with warm off-white and deep olive green.
- Verified zero horizontal overflow at 320px width.

### 2026-09-14 - Resume Screening & AI Interview Landing Pages Glassmorphism Redesign

**Scope & Execution:**
- **LandingNavbar.jsx**: Extended `isLanding` to include `/products/resume-screening` and `/products/ai-interview` so the floating glass pill navbar (top: clamp(10px, 2vw, 16px), border-radius 999px, specular top highlight, backdrop blur 24px) and full-screen mobile glass drawer are activated on both product landing pages.
- **index.css**: Calibrated `--card-float-bg`, `--card-float-border`, and `--card-float-shadow` tokens in `:root` and `.dark` to deep glassmorphism (`rgba(250, 249, 245, 0.72)` light / `rgba(18, 24, 10, 0.68)` dark) with specular highlight (`inset 0 1px 0 0 rgba(255, 255, 255, ...)`) and hardware-accelerated `backdrop-filter: blur(24px) saturate(180%)`.
- **ResumeScreeningPage.jsx**: Added fixed ambient olive glow mesh (3 blurred orbs with `blur(130pxâ€“140px)`, pointer-events none, z-index 0, overflow hidden to prevent horizontal overflow at 320px width). Upgraded all section cards (RSHero, RSDemo, RSHowItWorks, RSAnalyzed, RSBenefits, RSShowcase, RSFAQ, RSCrossLinks, RSFinalCTA) to deep glassmorphism with scale and lift micro-interactions.
- **AIInterviewPage.jsx**: Added fixed ambient olive glow mesh (3 blurred orbs with `blur(130pxâ€“140px)`, pointer-events none, z-index 0, overflow hidden). Upgraded all section cards (AIHero, AIDemo, AIHowItWorks, AIEvaluated, AIBenefits, AIShowcase, AIFAQ, AICrossLinks, AIFinalCTA) to deep glassmorphism with specular highlights and micro-interactions.
- **Verification**: `npm run build` passed with 0 errors in 887ms.

### 2026-09-15 - Google Sign-In with Firebase Web SDK (Frontend Integration)

**Scope & Execution:**
- **Firebase Web SDK Setup (`src/lib/firebase.js`)**: Initialized Firebase app using environment variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.), exported `auth` instance and configured `googleProvider` with `select_account` prompt. Re-exported from `src/firebase.js`.
- **Environment Configuration**: Documented all Firebase Web SDK environment variables in `hiregenius-frontend/.env.example`.
- **Backend Contract Mock (`src/services/authService.js`)**: Implemented `mockGoogleLoginApiCall(payload)` that logs `{ idToken, role }` to console and returns fake AuthResponse `{ token, role }`. Ready for one-line swap to `POST /api/auth/google-login` once Auth Service is live.
- **Role Selection Gate on Register (`RegisterPage.jsx`)**: Positioned role selection ('I am...' Candidate/Recruiter) FIRST on the page. Kept 'Continue with Google' disabled with clear helper text until a role is selected, ensuring the role is strictly established before triggering the Google OAuth popup.
- **Login Page Flow (`LoginPage.jsx`)**: Added 'Continue with Google' without a role selector (role resolved server-side for existing users), separated from password login with a visual 'or' divider.
- **Google Button Component (`src/components/GoogleSignInButton/GoogleSignInButton.jsx`)**: Created secondary button matching `Design.md` (radius 12px, 44px min-height, official multi-color 'G' inline SVG, loading spinner, hover/tap micro-interactions).
- **Error Handling & Routing**: Handled popup cancellation (`auth/popup-closed-by-user`, `auth/popup-blocked`) with user-facing toasts. Dispatched credentials to Redux auth slice (`setCredentials`) and redirected users to their role dashboard via `ROLE_HOME`.
- **Status**: Google Sign-In UI is built and functional against Firebase, the backend call is currently mocked with the exact real contract documented, and it needs to be swapped to the real endpoint once the Auth Service's `/api/auth/google-login` is live.
- **Build & Verification**: `npm run build` passed with 0 errors.

### 2026-09-15 - Phase 1: Spring Boot Auth Service Implementation & Verification

**Architecture & Implementation Summary:**
- Built standalone Spring Boot 3 (3.2.3), Java 21 authentication service (`com.hiregenius.authservice`) in `hiregenius-auth-service`.
- **Database & Persistence:**
  - Configured JPA/Hibernate with Flyway database migrations (`V1__init_auth_schema.sql`).
  - Table `users`: `id`, `name`, `email` (unique indexed), `password` (nullable for Google-only users), `role` (`RECRUITER`, `CANDIDATE`, `ADMIN`), `auth_provider` (`LOCAL`, `GOOGLE`), `is_active`, `created_at`, `updated_at`.
  - Added `DataInitializer` to automatically seed system administrator (`admin@hiregenius.ai` / `AdminPassword123!`) on startup.
- **Security & JWT:**
  - Configured Spring Security 6 with stateless session management (`SessionCreationPolicy.STATELESS`), BCrypt password hashing (strength 12), and custom CORS policy.
  - Custom `AuthenticationEntryPoint` returning standard 401 `ApiError` JSON (`{ status: 401, message: "Full authentication is required...", timestamp, path }`).
  - JWT generation and validation (`io.jsonwebtoken` JJWT 0.12.5) using HS256 HMAC-SHA key derived from `JWT_SIGNING_KEY` (shared with Node.js Core API). Claims include `userId`, `sub` (email), `role`, `iat`, `exp` (24 hours).
- **Google OAuth & Firebase Admin:**
  - Integrated `FirebaseConfig` and `GoogleAuthService` using Firebase Admin SDK (9.2.0) to verify client ID tokens.
  - Implemented seamless account linking policy: if a Google OAuth user signs in with an email already registered locally, the account is linked (`authProvider` updated to `GOOGLE`), preserving their existing role.
  - Disallowed `ADMIN` role signup via public register or Google endpoints (returns 400).
  - Explicitly blocked password login for Google-only accounts (`password == null` or `authProvider == GOOGLE`) with friendly 400 error: `"This account uses Google Sign-In â€” please use the Google button"`.
  - Added mock token fallback (`mock-google-token:email:name`) for isolated offline/development integration testing.
- **Endpoints Implemented (`com.hiregenius.authservice.auth.controller.AuthController`):**
  - `POST /api/auth/register`: Public registration for `RECRUITER` and `CANDIDATE` roles; rejects `ADMIN` with 400; returns 201 + `AuthResponse`.
  - `POST /api/auth/login`: Email/password verification; returns 200 + `AuthResponse` or 401/400.
  - `POST /api/auth/google-login`: Firebase ID token exchange; creates user if new or authenticates existing; returns 200 + `AuthResponse`.
  - `POST /api/auth/forgot-password`: Password reset initiation; returns generic 200 message without revealing account existence.
  - `GET /api/auth/validate`: Validates Bearer token via `JwtAuthFilter`; returns 200 + `UserResponse` with role and user details; rejects unauthenticated/tampered tokens with 401.
  - `GET /health`: Returns 200 `{"service":"auth-service","status":"UP"}`.
  - `GET /v3/api-docs` & `/swagger-ui/index.html`: SpringDoc OpenAPI 3 documentation.
- **Verification & Test Results:**
  - Automated unit test suite (`mvn test`): 14 tests run, 0 failures, 0 errors across `AuthControllerTest` and `JwtServiceTest`.
  - Live API verification test suite (`scratch/verify_auth_endpoints.mjs`): 16 tests run against live service on port 8080 with 100% pass rate:
    1. `GET /health` -> 200 UP
    2. `POST /api/auth/register` (RECRUITER) -> 201 with token
    3. `POST /api/auth/register` (CANDIDATE) -> 201 with token
    4. `POST /api/auth/register` (ADMIN) -> 400 Bad Request
    5. `POST /api/auth/register` (duplicate email) -> 409 Conflict
    6. `POST /api/auth/login` (valid credentials) -> 200 with JWT
    7. `POST /api/auth/login` (wrong password) -> 401 Unauthorized
    8. `POST /api/auth/login` (seeded system admin) -> 200 with ADMIN role
    9. `POST /api/auth/google-login` (new email, CANDIDATE) -> 201/200 with token
    10. `POST /api/auth/google-login` (existing email) -> 200 with token
    11. `POST /api/auth/google-login` (signup with ADMIN role) -> 400 Bad Request
    12. `POST /api/auth/login` on Google-only account -> 400 ("This account uses Google Sign-In â€” please use the Google button")
    13. `GET /api/auth/validate` (no token) -> 401
    14. `GET /api/auth/validate` (valid token) -> 200 with role
    15. `GET /api/auth/validate` (tampered token) -> 401
    16. `POST /api/auth/forgot-password` -> 200 generic success
- **Node.js Core API Compatibility Contract:**
  - Shared secret: `JWT_SIGNING_KEY` environment variable in `.env` (min 256 bits).
  - Alg: HS256.
  - Claims payload: `{ sub: "<email>", userId: <number>, role: "<RECRUITER|CANDIDATE|ADMIN>", exp: <timestamp>, iat: <timestamp> }`.

### 2026-09-15 â€” Frontend Google Sign-In & Auth Service Deployment Setup
- **Part 1 (Frontend Google Sign-In)**:
  - Branch: eature/google-signin pushed to GitHub tracking origin/feature/google-signin.
  - Validated frontend: 
pm run lint (0 errors) and 
pm run build (0 errors in 1.22s).
  - Confirmed .env is gitignored and no Firebase credentials/keys exist in committed code.
  - Preserved standard email/password login and demo buttons alongside new Google button.
- **Part 2 (Auth Service Deployment Preparation)**:
  - Production multi-stage Dockerfile configured with non-root user, dynamic $PORT fallback, and /health healthcheck.
  - Created hiregenius-auth-service/.env.example documenting all database, JWT, Firebase, and CORS environment variables.
  - Confirmed unit tests pass with zero errors (14 tests run, 0 failures, 0 errors).
  - Updated CI workflow (.github/workflows/auth-service-ci.yml) with fallback JWT secret and MySQL service container.
  - Documented complete Render deployment instructions and dashboard environment variables in DevOps.md.
  - Branch: eature/auth-service-deploy prepared and pushed to GitHub.

### 2026-09-16 â€” Fix Auth Service Test Datasource (H2 in MySQL-compatibility mode)
- **Problem**: In GitHub Actions CI, an environment variable SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/testdb in the runner caused Spring's test bootstrap to pair org.h2.Driver with the MySQL JDBC URL, failing all 11 tests in AuthControllerTest.java with Driver org.h2.Driver claims to not accept jdbcUrl, jdbc:mysql://localhost:3306/testdb.
- **Root Cause & Fix**:
  1. Configured pplication-test.yml and pplication-test.properties with:
     - spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1
     - spring.datasource.driver-class-name=org.h2.Driver
     - spring.jpa.hibernate.ddl-auto=create-drop
     - spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
  2. Annotated AuthControllerTest.java with @SpringBootTest(properties = { spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1, spring.datasource.driver-class-name=org.h2.Driver }) and @ActiveProfiles(test) so test execution is immutable against external OS environment overrides.
  3. Ensured com.h2database:h2 in pom.xml has <scope>test</scope>.
- **Verification**: Ran mvn clean test under simulated CI environment with SPRING_DATASOURCE_URL set. All 14 tests run with 0 failures, 0 errors, 0 skipped (including all 11 in AuthControllerTest).

### 2026-09-16 â€” Fix User Entity uth_provider Type Mismatch with Flyway Schema
- **Issue**: Render deployment failed during Hibernate startup schema-validation:
  Schema-validation: wrong column type encountered in column [auth_provider] in table [users]; found [varchar (Types#VARCHAR)], but expecting [enum ('local','google') (Types#ENUM)]
- **Root Cause**: In Hibernate 6.x on MySQLDialect, @Enumerated(EnumType.STRING) defaults to MySQL's native ENUM type (SqlTypes.ENUM) rather than standard VARCHAR. Meanwhile, Flyway migration V1__init_auth_schema.sql defined uth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL'. During ddl-auto: validate, Hibernate flagged the type mismatch between database Types#VARCHAR and entity expected Types#ENUM.
- **Fix**: In User.java, added @JdbcTypeCode(SqlTypes.VARCHAR) and @Column(name = auth_provider, nullable = false, length = 20) alongside @Enumerated(EnumType.STRING) to instruct Hibernate 6 to validate and bind uth_provider as Types#VARCHAR.
- **Note for other services**: hiregenius-core-api (or any other service sharing the users schema) should ensure enum fields mapped to VARCHAR columns explicitly use string/VARCHAR JDBC typing to avoid similar schema validation failures.
- **Verification**: mvn clean verify passed with 0 errors, 14/14 tests passing.

### 2026-09-16 â€” Align All User Entity Enum Fields (ole, uth_provider) with VARCHAR Schema
- **Issue**: Render deployment failed during Hibernate schema validation for the ole column:
  Schema-validation: wrong column type encountered in column [role] in table [users]; found [varchar (Types#VARCHAR)], but expecting [enum ('recruiter','candidate','admin') (Types#ENUM)]
- **Root Cause**: Hibernate 6 on MySQLDialect defaults all @Enumerated fields to MySQL native ENUM unless explicitly instructed otherwise. Flyway migration V1__init_auth_schema.sql created both ole VARCHAR(50) and uth_provider VARCHAR(50).
- **Fields Updated in User.java**:
  1. ole:
     `java
     @Enumerated(EnumType.STRING)
     @JdbcTypeCode(SqlTypes.VARCHAR)
     @Column(name = role, nullable = false, length = 20)
     private Role role;
     `
  2. uth_provider:
     `java
     @Enumerated(EnumType.STRING)
     @JdbcTypeCode(SqlTypes.VARCHAR)
     @Column(name = auth_provider, nullable = false, length = 20)
     private AuthProvider authProvider = AuthProvider.LOCAL;
     `
- **Entity Scan Complete**: Audited User.java (only entity class in hiregenius-auth-service). No other enum or columnDefinition overrides remain. All fields strictly align with Flyway's users table schema.
- **Verification**: mvn clean verify passed with 0 errors (14/14 tests passing).

### 2026-09-16 â€” Wire Real Google Auth & Remove Demo Portals from Production
- **Feature**: Connected hiregenius-frontend to the live POST /api/auth/google-login backend endpoint and removed demo/mock UI from production.
- **Frontend Changes**:
  1. hiregenius-frontend/src/services/authService.js:
     - Updated googleLogin(payload) to send a real HTTP POST request to /auth/google-login via Axios with { ...data, data } normalized return.
     - Preserved mockGoogleLoginApiCall(payload) in the file as an unreferenced fallback for offline development.
     - Verified login, egister, and orgotPassword were already wired to real backend endpoints.
  2. hiregenius-frontend/src/pages/Login/LoginPage.jsx:
     - Removed demo info banner and the "Demo Portals (1-Click)" section containing Candidate, Recruiter, and Admin bypass buttons.
     - Removed DEMO_ACCOUNTS map and devLogin handler.
     - Cleaned up onSubmit to strictly rely on real backend authentication without demo fallbacks.
     - Preserved essential auth links: "Forgot password?", "Continue with Google", and "Create one" (register).
- **Verification**:
  - 
pm run lint exited 0 (no errors).
  - 
pm run build completed successfully with 0 errors.

### 2026-09-16 - Full End-to-End Automated Testing: Frontend â†” Auth Service Integration

**Branch Verification & Sync:**
- Branch: `dev` (updated with `git pull origin dev` â€” PRs #18, #20, #22 merged).
- Google Login Wiring Status: Confirmed that `authService.googleLogin` in `hiregenius-frontend/src/services/authService.js` was already swapped in PR #22 (`6521d96`) to call the real Spring Boot backend (`api.post('/auth/google-login', payload)`). `mockGoogleLoginApiCall` remains only as an unused export.

**Fixes Applied During Integration Run:**
1. **Axios 401 Interceptor Hard-Reload Bug (`src/services/api.js`)**: Fixed `api.interceptors.response` which was blindly running `window.location.href = '/login'` on any 401, including failed login attempts on `/auth/login`. This wiped out React state and prevented "Invalid email or password" error toasts from displaying. Scoped the redirect to non-login endpoints.
2. **Session Token Validation on Mount (`src/App.jsx` & `src/services/authService.js`)**: Added `validate: () => api.get('/auth/validate')` to `authService.js` and wired a `useEffect` in `App.jsx` to validate stored tokens on page reload against Spring Boot `GET /api/auth/validate`.
3. **Cross-Role Redirect Guard (`src/routes/RoleRedirect.jsx` & `src/pages/Login/LoginPage.jsx`)**: Added `resolveRoleRedirect(target, role)` to prevent candidates from being redirected to recruiter dashboard paths (and vice-versa) when following `from.pathname` parameters.
4. **CORS Configuration (`hiregenius-auth-service/src/main/resources/application.yml` & `application-local.yml`)**: Added Vite fallback port `http://localhost:5174` and loopback IPs (`127.0.0.1`) to `cors.allowed-origins`.

**Automated Test Results:**

#### Part 1 â€” Backend API Re-Verification (Port 8080)
| Test # | Description | Result | Notes |
| :--- | :--- | :--- | :--- |
| B1 | `GET /health` | PASS | Returns 200 `{"service":"auth-service","status":"UP"}` |
| B2 | `POST /api/auth/register` (RECRUITER) | PASS | 201 Created with JWT and user payload |
| B3 | `POST /api/auth/register` (CANDIDATE) | PASS | 201 Created with JWT and user payload |
| B4 | `POST /api/auth/register` (`role=ADMIN`) | PASS | 400 Bad Request (Admin self-registration blocked) |
| B5 | `POST /api/auth/register` (Duplicate email) | PASS | 409 Conflict |
| B6 | `POST /api/auth/login` (Correct credentials) | PASS | 200 OK with valid HS256 JWT |
| B7 | `POST /api/auth/login` (Wrong password) | PASS | 401 Unauthorized (`Invalid email or password`) |
| B8 | `POST /api/auth/login` (Seeded system admin) | PASS | 200 OK with `role=ADMIN` |
| B9 | `POST /api/auth/google-login` (New email, CANDIDATE) | PASS | 201/200 OK with newly registered user |
| B10 | `POST /api/auth/google-login` (Existing email) | PASS | 200 OK with authenticated session |
| B11 | `POST /api/auth/google-login` (`role=ADMIN`) | PASS | 400 Bad Request |
| B12 | `POST /api/auth/login` on Google account | PASS | 400 Bad Request (`This account uses Google Sign-In â€” please use the Google button`) |
| B13 | `GET /api/auth/validate` (No token) | PASS | 401 Unauthorized |
| B14 | `GET /api/auth/validate` (Valid token) | PASS | 200 OK with user details and role |
| B15 | `GET /api/auth/validate` (Tampered token) | PASS | 401 Unauthorized |
| B16 | `POST /api/auth/forgot-password` | PASS | 200 OK generic success message |

#### Part 2 & 3 â€” Real UI Browser Automation (Headless Chrome + Vite Dev Server Port 5173 + Auth Service Port 8080)
| Test # | Description | Result | Notes |
| :--- | :--- | :--- | :--- |
| 2.a | Register as RECRUITER via email/password form | PASS | Redirected to `/recruiter/dashboard`, token stored, welcome toast displayed |
| 2.b | Register as CANDIDATE via email/password form | PASS | Redirected to `/candidate/dashboard`, token stored, candidate shell rendered |
| 2.c | Register with existing email shows clear 409 error | PASS | Toast rendered: "An account with this email address already exists", form stays open |
| 2.d | Login with correct credentials (both roles) | PASS | Recruiter redirected to `/recruiter/dashboard`; Candidate redirected to `/candidate/dashboard` |
| 2.e | Login with wrong password shows clear error message | PASS | Toast rendered: "Invalid email or password", no page refresh or crash |
| 2.f | Continue with Google on Register (Real backend integration) | PASS | Button disabled initially; selecting role enables it; real POST to `/api/auth/google-login` succeeded; redirected to `/candidate/dashboard` |
| 2.g | Continue with Google on Login for existing account | PASS | Real POST to `/api/auth/google-login` succeeded; redirected to `/candidate/dashboard` |
| 2.h | Password login on Google account rejected with clear message | PASS | Surfaced: "This account uses Google Sign-In â€” please use the Google button" |
| 2.i | Reload page maintains session and calls `/api/auth/validate` | PASS | Verified HTTP 200 on `/api/auth/validate` during reload; user remains on `/recruiter/dashboard` |
| 2.j | Logout clears token and reload does NOT restore session | PASS | `localStorage.getItem('hg_token')` is `null`; reload keeps user logged out on `/login` |
| 2.k | Protected routes redirect to `/login` when logged out | PASS | Direct URL visits to `/recruiter/dashboard` and `/candidate/dashboard` redirected to `/login` |
| 3 | Console & Network Sanity (CORS, 500s, unhandled rejections) | PASS | 0 CORS errors, 0 500s, 0 unhandled promise rejections |

### 2026-09-16 - Add spring-dotenv for Automatic Local Environment Variable Loading
- **Feature**: Added `me.paulschwarz:spring-dotenv` (version 4.0.0) dependency to `hiregenius-auth-service/pom.xml`.
- **Purpose**: Enables local runs via `./mvnw spring-boot:run` to automatically load environment configuration from the local `.env` file (such as `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SIGNING_KEY`, `FIREBASE_CREDENTIALS_PATH`, `FIREBASE_CREDENTIALS_JSON`, etc.) into Spring's `PropertySource` without requiring developers to manually export `$env:` variables in PowerShell / bash beforehand.
- **Production / Container Safety**: Docker and cloud environments (Render) inject actual system environment variables, which take precedence over `.env` per Twelve-Factor App and Spring precedence rules. In environments without a `.env` file, the library safely defaults to ignoring the missing file.
- **Verification**:
  - `mvn clean verify` passed with 0 errors (all 14 unit and integration tests passing).
  - Executed `./mvnw spring-boot:run` in a fresh session with no manual `$env:` variables set. The service successfully loaded configuration from `.env`, connected to Clever Cloud MySQL (`bypmcpyebenomi3pdtis`), executed Flyway schema validation, initialized Firebase Admin SDK from `FIREBASE_CREDENTIALS_JSON`, bound to port 8080, and responded HTTP 200 on `/health`.

### 2026-09-16 - Add OpenAPI/Swagger Documentation for Auth Service & Manual UI Testing
- **Documentation**: Added OpenAPI 3 (SpringDoc) annotations across all endpoints in `AuthController.java` and `HealthController.java`.
- **Endpoints Documented**:
  1. `POST /api/auth/register`: Operation summary/description, request body examples for both RECRUITER and CANDIDATE roles, and responses (201 Created with JWT & UserResponse, 400 Bad Request with validation and role=ADMIN rejection examples, 409 Conflict with duplicate email example).
  2. `POST /api/auth/login`: Operation summary/description, request body examples (Recruiter/Candidate and System Admin), and responses (200 OK with JWT & UserResponse, 400 Bad Request with separate Google-only account rejection example and validation error example, 401 Unauthorized with invalid credentials example).
  3. `POST /api/auth/google-login`: Operation summary/description, request body examples showing expected payload shapes (`idToken` and `role` for new candidate/recruiter signups, and `idToken`-only for existing users), and responses (200 OK for existing user, 201 Created for new user signup, 400 Bad Request covering role=ADMIN rejection, missing role on first login, and invalid/tampered Google tokens).
  4. `GET /api/auth/validate`: Operation summary/description, `@SecurityRequirement(name = "bearerAuth")` and header parameter documentation, and responses (200 OK with user metadata, 401 Unauthorized for missing, invalid, or expired tokens).
  5. `POST /api/auth/forgot-password`: Operation summary/description documenting uniform response behavior without leaking account existence, request body example, and responses (200 OK generic success message, 400 Bad Request validation error).
  6. `GET /health`: Operation summary/description, public status check with no authentication requirement, tagged under both `Authentication` and `Health`, returning 200 OK `{"service":"auth-service","status":"UP"}`.
- **Swagger UI**: Accessible at `http://localhost:8080/swagger-ui/index.html` (and OpenAPI schema at `/v3/api-docs`).
- **Verification**: `mvn clean verify` passed with 0 failures across all 14 unit and integration tests. Live verification confirmed Swagger UI index and Swagger config endpoints return 200 OK and live endpoints function correctly.

### 2026-09-16 - Email Validation Fix (Part 1) & Real Password Reset Flow via Email (Part 2)
- **Branch**: `feature/email-validation-password-reset`
- **Part 1 (Email Validation Fix)**:
  - **RFC 5322 Email Regex**: Strengthened format validation across `RegisterRequest`, `LoginRequest`, and `ForgotPasswordRequest` using `ValidationPatterns.EMAIL_REGEX` (rejecting typos like missing domain, consecutive dots, invalid TLDs, and illegal characters).
  - **Server-Side DNS MX Record Validation**: Created `DnsValidationService` and `DnsValidationServiceImpl` using Java JNDI (`com.sun.jndi.dns.DnsContextFactory`) to query MX records for recipient domains before creating accounts. Falls back to A record check per RFC 5321. Configured via `app.email-validation.mx-check-enabled`.
  - Registration rejects non-existent/invalid email domains with HTTP 400 (`"This email domain does not appear to be valid."`).
- **Part 2 (Password Reset Flow & Email Service)**:
  - **Database Migration**: Added Flyway migration `V2__add_password_reset_tokens.sql` creating table `password_reset_tokens` (`id`, `user_id` FK -> `users(id)` ON DELETE CASCADE, `token`, `expires_at`, `used`, `created_at`).
  - **Entity & Repository**: Created `PasswordResetToken` JPA entity and `PasswordResetTokenRepository`.
  - **Email Service**: Added `spring-boot-starter-mail` dependency and created `EmailService` / `EmailServiceImpl` using `JavaMailSender` configured via `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, and `FRONTEND_BASE_URL`. Sends responsive HTML emails with HireGenius AI branding, 30-minute expiry warning, and direct reset button link.
  - **Environment Configuration**: Added mail and frontend URL variables to `application.yml`, `.env`, and documented in `.env.example` with setup instructions for Gmail App Passwords.
  - **POST /api/auth/forgot-password**: Generates a secure 30-minute random UUID token, persists to `password_reset_tokens`, and sends the reset link email asynchronously via `EmailService`. Retains uniform HTTP 200 generic response without leaking account presence.
  - **POST /api/auth/reset-password**: New public endpoint accepting `{ "token": "...", "newPassword": "..." }`. Validates token presence, expiry, and used status. Verifies user is not a Google-only account (rejects with 400 `"This account uses Google Sign-In and has no password to reset"`). Encrypts password with BCrypt, marks token as used, and returns HTTP 200. Added to `SecurityConfig` `requestMatchers(...).permitAll()`.
  - **OpenAPI Documentation**: Added full SpringDoc Swagger annotations and request/response examples for `POST /api/auth/reset-password`.
- **Frontend Follow-Up Note**:
  - The backend email reset link directs users to `{FRONTEND_BASE_URL}/reset-password?token={token}`. A dedicated `ResetPasswordPage` component in `hiregenius-frontend` to read this token and submit new passwords to `POST /api/auth/reset-password` is identified as the pending frontend follow-up.
- **Verification & Test Coverage**:
  - 26 tests executed and passed (0 failures) via `./mvnw test` including:
    - DNS MX validation unit tests (`DnsValidationServiceTest`).
    - Email sender and HTML generation tests (`EmailServiceTest`).
    - AuthController full integration tests (`resetPasswordSuccess`, `resetPasswordExpiredTokenRejected`, `resetPasswordAlreadyUsedTokenRejected`, `resetPasswordInvalidTokenRejected`, `resetPasswordGoogleOnlyAccountRejected`, `registerNonExistentDomainRejected`, `registerMalformedEmailRejected`, plus all 11 existing auth tests).

### 2026-09-16 - Frontend Reset Password Page (`/reset-password`) & End-to-End Flow Completion
- **Branch**: `feature/reset-password-frontend`
- **Page Component**: Created [`ResetPasswordPage.jsx`](file:///C:/Users/visuc/OneDrive/Desktop/Hirelens/hiregenius-frontend/src/pages/ResetPassword/ResetPasswordPage.jsx) matching the HireGenius design system (glassmorphic surface, radial gradient glows, Framer Motion transitions, Lucide icons).
- **Public Route**: Added `<Route path="/reset-password" element={<ResetPasswordPage />} />` in `App.jsx`.
- **Token Handling**:
  - Reads `token` query parameter using `useSearchParams()`.
  - If token is missing, displays an alert state: `"Invalid or missing reset link. Please request a new password reset."` with a CTA button to `/forgot-password`.
- **Form & Validation**:
  - Form fields: "New Password" and "Confirm New Password" with show/hide password visibility toggles (`Eye`/`EyeOff`).
  - Validation schema (`resetPasswordSchema` in `validationSchemas.js`): Enforces minimum 8 characters and at least 1 number (matching backend's `ValidationPatterns.PASSWORD_REGEX` exactly) plus password confirmation matching via Zod.
- **Service Integration**: Added `authService.resetPassword({ token, newPassword })` in `authService.js` calling `POST /api/auth/reset-password`.
- **Response & Error Handling**:
  - **HTTP 200**: Displays green checkmark success card and toast `"Password reset successful! You can now log in with your new password."`, then redirects to `/login` after 2 seconds.
  - **HTTP 400 (Token expired / invalid / used)**: Displays error banner `"This reset link has expired or is invalid. Please request a new one."` with CTA to `/forgot-password`.
  - **HTTP 400 (Google-only account)**: Displays backend message `"This account uses Google Sign-In and has no password to reset"`.
- **Verification**:
  - `oxlint`: 0 errors, 0 warnings on `ResetPasswordPage.jsx`.
  - `npm run build`: Production build succeeded in 956ms with 0 errors.
  - End-to-End Flow: `POST /api/auth/forgot-password` -> HTML email with `{FRONTEND_BASE_URL}/reset-password?token={token}` -> `/reset-password` UI -> `POST /api/auth/reset-password` -> `/login` is fully implemented.

### 2026-09-17 — Render Cold-Start Optimization & Frontend Timeout Resilience

- **Root Cause Analysis**:
  - **Render Free-Tier Spin-Down**: Free-tier web services on Render spin down after 15 minutes of inactivity. When cold-started, container provisioning on heavily throttled CPU (0.1 vCPU) takes ~200 seconds for complete OS boot, JVM classloading, Hibernate schema validation, and Flyway migration execution against remote MySQL.
  - **Lazy DispatcherServlet Initialization**: In Spring Boot / Spring MVC, `DispatcherServlet` defaults to lazy initialization (`loadOnStartup = -1`), postponing servlet context initialization, handler mapping resolution, and Jackson converter registration to the very first incoming HTTP request.
  - **Unprimed Connection Pool & SDKs**: The HikariCP connection pool and Firebase Admin SDK were not primed until the first request arrived, compounding latency.
  - **Frontend Timeout Premature Abortion**: The frontend Axios instance had a strict 15,000ms timeout (`timeout: 15000`), terminating requests before Render finished waking up and leaving users with "timeout of 15000ms exceeded" and a blank spinner.

- **Backend Changes (`hiregenius-auth-service`)**:
  1. **Eager DispatcherServlet Initialization (`application.yml`)**:
     - Added `spring.mvc.servlet.load-on-startup: 1` under `spring.mvc.servlet` so the DispatcherServlet initializes eagerly during application boot rather than on the first user request.
  2. **HikariCP Connection Pool Tuning (`application.yml`)**:
     - Added `spring.datasource.hikari`:
       - `max-lifetime: 240000` (4 minutes, safely retiring connections before cloud NAT/firewall idle disconnects)
       - `connection-timeout: 20000` (20 seconds)
       - `validation-timeout: 5000` (5 seconds)
  3. **ApplicationReadyEvent Warm-up Listener (`ApplicationWarmupListener.java`)**:
     - Created `@Component` listening on `ApplicationReadyEvent`. Proactively executes `SELECT 1` via `DataSource` to prime the HikariCP pool and touches `FirebaseAuth.getInstance()` to warm up Firebase Admin SDK before live traffic hits. Safely catches and logs errors without failing startup.
  4. **Startup Timing Review (Firebase & Flyway)**:
     - Confirmed `FirebaseConfig` `@PostConstruct` only performs local JSON credential stream parsing (~few ms).
     - Confirmed Flyway migrations are synchronous and mandatory prior to Hibernate `ddl-auto: validate` and cannot/should not be deferred without causing `SchemaManagementException`.

- **Frontend Changes (`hiregenius-frontend`)**:
  1. **Axios Timeout Extension (`src/services/api.js`)**:
     - Increased default Axios timeout from 15000ms to 30000ms (30 seconds).
     - Request interceptor guarantees all auth endpoints (`/auth/login`, `/auth/register`, `/auth/google-login`, `/auth/forgot-password`, `/auth/reset-password`) have at least 30,000ms timeout.
     - Confirmed local development requests complete immediately with zero delay.
  2. **User-Facing Server Wake-Up Notice (`ServerWakeupNotice.jsx`)**:
     - Created reusable animated component using Framer Motion and Lucide `Server` icon.
     - If an auth request takes longer than 2.5 seconds, displays:
       *"Waking up the server, this may take up to 30 seconds on first use..."*
     - Replaces ambiguous blank spinners on `LoginPage.jsx`, `RegisterPage.jsx`, `ForgotPasswordPage.jsx`, and `ResetPasswordPage.jsx`. Disappears immediately once the request completes or if local dev responds in < 2.5s.

- **Permanent Resolution Recommendation**:
  - Upgrading the Render auth service to a paid instance ($7/month starter tier) eliminates idle spin-downs completely, ensuring 24/7 warm availability without cold-start delays.

- **Verification**:
  - `mvn clean verify` in `hiregenius-auth-service`: 29 tests run, 0 failures, 0 errors. Application warm-up logged `SELECT 1` execution on startup.
  - `npm run lint` in `hiregenius-frontend`: 0 errors.
  - `npm run build` in `hiregenius-frontend`: Production bundle built successfully in 1.48s with 0 errors.

### 2026-09-17 — Async Password Reset Email Dispatch & SMTP Socket Timeout Fix

- **Root Cause Analysis (Forgot-Password Timeout)**:
  - Even after extending Axios timeout to 30s, `POST /api/auth/forgot-password` was still timing out on production.
  - Investigation revealed `@EnableAsync` was completely missing from Spring Boot configuration and `EmailServiceImpl.sendPasswordResetEmail()` lacked `@Async`.
  - Consequently, connecting to Gmail SMTP (`smtp.gmail.com:587`), TLS handshake, message transfer, and server confirmation executed **synchronously on Tomcat's HTTP worker thread**, blocking the HTTP response until SMTP finished (taking 10–30+ seconds or hanging on cloud networks).
  - Additionally, `spring.mail.properties.mail.smtp` lacked socket connection, read, and write timeouts, allowing slow or stalled connections to hang indefinitely.

- **Backend Fixes (`hiregenius-auth-service`)**:
  1. **Asynchronous Processing (`AsyncConfig.java`)**:
     - Added `@Configuration` class with `@EnableAsync`.
     - Defined dedicated `mailTaskExecutor` bean using `ThreadPoolTaskExecutor` (`corePoolSize=2`, `maxPoolSize=5`, `queueCapacity=50`, `threadNamePrefix="mail-async-"`).
  2. **Asynchronous Email Service (`EmailServiceImpl.java`)**:
     - Annotated `sendPasswordResetEmail()` with `@Async("mailTaskExecutor")`.
     - Added high-resolution timing logs tracking background email dispatch:
       - `[ASYNC-EMAIL] Starting background email dispatch to <email> on thread [mail-async-X]`
       - `[ASYNC-EMAIL] Password reset email successfully sent to <email> in <ms>ms on thread [mail-async-X]`
  3. **Non-Blocking Controller / Service Flow (`AuthServiceImpl.java`)**:
     - Updated `forgotPassword()` to immediately return HTTP 200 after persisting the token to the database and dispatching the async email task in the background.
     - Added high-resolution stopwatch logs:
       - `[FORGOT-PASSWORD] Request started for email: <email>`
       - `[FORGOT-PASSWORD] Token generated and saved to DB in <ms>ms for user id=<id>`
       - `[FORGOT-PASSWORD] Async email dispatch invoked in <ms>ms for user id=<id>`
       - `[FORGOT-PASSWORD] Returning HTTP response in <ms>ms (total endpoint duration)`
  4. **SMTP Socket Timeouts (`application.yml`)**:
     - Added explicit socket timeouts under `spring.mail.properties.mail.smtp`:
       - `connectiontimeout: 10000` (10s connection timeout)
       - `timeout: 10000` (10s read timeout)
       - `writetimeout: 10000` (10s write timeout)
     - Confirmed `port: 587` and `starttls.enable: true` remain configured.

- **Verification**:
  - `mvn clean verify` passed with 0 errors across all 29 tests.
  - Test logs verified the HTTP endpoint response returned in **9ms**, while email sending occurred asynchronously in the background.

### 2026-09-19 — Production AWS EC2 Migration & Infrastructure Automation Setup

- **Built / Infrastructure Added (`hiregenius-auth-service`)**:
  1. **Production-Ready Docker Setup (`Dockerfile`, `.dockerignore`)**:
     - Updated Dockerfile to support `ENV PORT=8080`, multi-stage build (`maven:3.9.6-eclipse-temurin-21-alpine` -> `eclipse-temurin:21.0.2_13-jre-alpine`), non-root `appuser:appgroup` security, and dynamic healthcheck for `/actuator/health` and `/health`.
     - Created `.dockerignore` excluding build artifacts (`target/`, `*.jar`), local secrets (`.env`, `serviceAccountKey.json`), IDE configs, and git metadata.
  2. **Deployment Automation Script (`deploy.sh`)**:
     - Created idempotent bash deployment script in project root and service root.
     - Automates git pull from `main`, Docker image building (`hiregenius-auth-service:latest`), graceful container stopping/removal, container execution with `--restart always` and `--env-file .env`, docker image cleanup, and audit logging to `deploy-log.txt`.
  3. **Systemd Process Supervision (`hiregenius-auth.service`)**:
     - Created OS-level systemd service file providing automatic container launch on server boot and auto-restart on unexpected crashes.
  4. **Nginx Reverse Proxy & SSL Setup (`nginx.conf`)**:
     - Created production Nginx configuration template reverse-proxying ports 80/443 to internal Spring Boot port 8080. Includes rate-limiting (`10r/s`), WebSocket headers, security headers, ACME webroot challenge location block, and certbot HTTPS integration.
  5. **GitHub Actions CI/CD (`.github/workflows/deploy-aws.yml`)**:
     - Created automated GitHub Actions workflow executing remote SSH deployment on push to `main` via `appleboy/ssh-action` using GitHub Secrets (`EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`).
  6. **Deployment Guide (`DEPLOYMENT.md`)**:
     - Created comprehensive `DEPLOYMENT.md` covering AWS EC2 instance sizing (`t3.small`/`t3.micro`), Security Groups, manual deployment steps, environment variable specifications, SSL auto-renewal with Certbot, rollback procedures, and CloudWatch / uptime monitoring recommendations.

- **Non-Breaking Deployment Note**:
  - Purely additive infrastructure tooling. Business rules, application logic, and existing Render/Vercel configurations remain completely intact as a fallback.

### 2026-09-24 — Phase 2 Backend: Core API Setup, JWT Verification Middleware & Jobs CRUD

- **Strict Boundary Confirmation**:
  - Zero modifications made to `hiregenius-frontend/` or `hiregenius-auth-service/`. All work strictly confined to the `hiregenius-core-api/` service and branch `feature/core-api-phase2`.

- **Built / Added (`hiregenius-core-api/`)**:
  1. **Layered Industry-Standard Architecture**:
     - Followed `routes -> controller -> service -> repository` pattern across the entire service:
       - `src/config/`: `env.js` (centralized environment loading & validation), `db.js` (Knex MySQL connection pool).
       - `src/middleware/`:
         - `verifyJwt.js`: High-performance local JWT verification (HS256) using shared `JWT_SIGNING_KEY`. Attaches `req.user = { userId, email, role }`. Returns uniform 401 on missing, expired, or tampered tokens without 500 errors or external network calls.
         - `requireRole.js`: Role-based access guard factory (e.g., `requireRole('RECRUITER')`) enforcing 403 Forbidden on role mismatch.
         - `errorHandler.js`: Centralized error handling middleware delivering uniform response shape `{ status, message, timestamp, path }`. Handles Zod validation errors, JWT verification failures, malformed JSON, and operational API errors.
       - `src/utils/`: `ApiError.js` (custom operational errors with HTTP status factory methods) and `ApiResponse.js` (standardized success/created envelopes).
       - `src/modules/jobs/`:
         - `jobs.validation.js`: Zod schemas for job creation, updates, status toggling, pagination/filtering query params, and ID params.
         - `jobs.repository.js`: Knex database access layer supporting pagination, search filters (title, company, location), JSON skills handling, and soft-delete queries.
         - `jobs.service.js`: Domain business logic enforcing strict recruiter ownership on update/delete/status toggle and guaranteeing `recruiter_id` is assigned solely from JWT `req.user.userId`.
         - `jobs.controller.js`: Request/response controllers using `ApiResponse` and routing errors to `next()`.
         - `jobs.routes.js`: Express routes with `verifyJwt`, `requireRole`, and Zod validators wired up (ensuring `/api/jobs/mine` is registered before `/:id`).
       - `src/app.js`: Express application wiring with CORS, body parsers, `/health` endpoint, jobs router, and centralized error handler.
       - `src/server.js`: Server startup verifying database connectivity, running pending Knex migrations automatically, and listening on `PORT` (4000) with graceful shutdown handling.
  2. **Database Migrations (`migrations/20260924_create_jobs_table.js`)**:
     - Created `jobs` table using Knex migration tool:
       - `id`: unsigned integer, primary key, auto-increment.
       - `recruiter_id`: bigint, not null, indexed.
       - `title`: varchar(255), not null.
       - `company`: varchar(255), not null.
       - `skills`: json, not null (JSON array).
       - `salary`: varchar(100), nullable.
       - `experience`: varchar(100), nullable.
       - `location`: varchar(255), nullable.
       - `description`: text, not null.
       - `status`: enum('OPEN', 'CLOSED'), default 'OPEN', indexed.
       - `is_deleted`: boolean, default false, indexed.
       - `created_at` & `updated_at`: timestamps with automatic current timestamp generation.
  3. **Production Dockerfile (`Dockerfile`)**:
     - Multi-stage build (`node:20.11.1-alpine`), dependency pruning (`npm ci --omit=dev`), non-root `node` user security, healthcheck against `/health`, and configurable `PORT=4000`.

- **Key Architectural Decisions**:
  1. **Skills Storage as JSON Array**:
     - Stored `skills` as a native MySQL `JSON` column rather than a normalized relational junction table.
     - **Rationale**: In HireGenius AI, job postings require their full skills list during job rendering, search matching, and transmission to downstream AI/ML agents for resume scoring. Storing skills as a JSON array avoids unnecessary multi-table relational joins during high-throughput CRUD while retaining MySQL's native JSON query functions (`JSON_CONTAINS`) for advanced searches if needed in later phases.
  2. **Soft-Delete (`is_deleted` flag)**:
     - Implemented soft-delete via an indexed boolean column `is_deleted`.
     - **Rationale**: In recruitment platforms, jobs are linked to candidate applications, AI resume screening records, scheduled interviews, and audit logs. A hard `DELETE` cascades or breaks referential integrity and historical reporting. Soft-delete ensures historical data remains immutable for analytics and auditability while filtering deleted jobs from public listings and recruiter views.

- **Cross-Service Trust & Real JWT Verification**:
  - Confirmed the Core API uses the exact shared `JWT_SIGNING_KEY` as configured in the Auth Service (`YxLwDO5k9msT158PxUDcIX+pOJXEkcsD2I8V3Hp/gSU=`, HS256).
  - Verified cross-service compatibility by testing HS256 tokens directly against the AWS-deployed Auth Service (`http://13.203.243.162/api/auth/validate`), validating token parsing and signature verification.

- **Verification Results**:
  1. **Linting**: `npm run lint` passed with 0 errors and 0 warnings across all source and test files.
  2. **Automated Unit & Integration Tests**: 26 of 26 tests passed in Jest:
     - `verifyJwt`: Valid HS256 token decoding & `req.user` attachment; 401 on missing Authorization header; 401 on non-Bearer scheme; 401 on expired tokens (no 500); 401 on tampered tokens; 401 on wrong signature key; 401 on missing userId.
     - `requireRole`: Correct role allowed; wrong role rejected with 403 Forbidden; unauthenticated requests rejected with 401; multi-role checks supported.
     - `jobs.test.js`: Unauthenticated POST rejected (401); Candidate role POST rejected (403); Recruiter POST creates job with `recruiter_id` strictly from JWT (201); Public GET returns only OPEN non-deleted jobs with pagination & filters; Recruiter GET `/mine` isolates jobs to the caller; Public GET `/:id` returns full detail (404 for missing/deleted); PUT updates succeed for owner and return 403 for non-owners; PATCH status toggles OPEN/CLOSED with ownership enforcement; DELETE soft-deletes with ownership enforcement.
  3. **Manual Verification Suite (17 Live Endpoints & Scenarios)**:
     - Ran full automated HTTP execution script against the active Core API server and local MySQL 8.0 instance:
       - Test 0: Cross-Service Trust against AWS Auth Service (`GET /api/auth/validate`) -> confirmed.
       - Test 1: `GET /health` -> 200 `{"status":"UP","service":"hiregenius-core-api"}`.
       - Test 2: `POST /api/jobs` without token -> 401 Unauthorized.
       - Test 3: `POST /api/jobs` with expired token -> 401 Unauthorized.
       - Test 4: `POST /api/jobs` with tampered token -> 401 Unauthorized.
       - Test 5: `POST /api/jobs` with CANDIDATE role -> 403 Forbidden.
       - Test 6: `POST /api/jobs` with RECRUITER token and spoofed `recruiter_id: 999999` -> 201 Created with DB `recruiter_id: 101` (spoof rejected).
       - Test 7: Public `GET /api/jobs` -> 200 OK with open jobs array.
       - Test 8: Recruiter 1 `GET /api/jobs/mine` -> 200 OK listing caller's jobs.
       - Test 9: Recruiter 2 `GET /api/jobs/mine` -> 200 OK with 0 jobs (tenant isolation confirmed).
       - Test 10: Recruiter 2 `PUT /api/jobs/:id` (attempted update of Recruiter 1's job) -> 403 Forbidden.
       - Test 11: Recruiter 1 `PUT /api/jobs/:id` -> 200 OK with updated fields.
       - Test 12: Recruiter 2 `PATCH /api/jobs/:id/status` (attempted status change of Recruiter 1's job) -> 403 Forbidden.
       - Test 13: Recruiter 1 `PATCH /api/jobs/:id/status` -> 200 OK with `status: CLOSED`.
       - Test 14: Public `GET /api/jobs` -> confirmed closed job is excluded from public search.
       - Test 15: Recruiter 2 `DELETE /api/jobs/:id` (attempted deletion of Recruiter 1's job) -> 403 Forbidden.
       - Test 16: Recruiter 1 `DELETE /api/jobs/:id` -> 200 OK with soft-delete confirmed.
       - Test 17: Public `GET /api/jobs/:id` on soft-deleted job -> 404 Not Found.
  4. **Security & Secrets**: Confirmed `.env` is gitignored and excluded from version control. Zero hardcoded secrets in source files.




### 2026-09-25 — Recruiter Dashboard Real Core API Integration & Mock Data Removal

- **Real Integration (Jobs)**:
  - Created `src/services/jobsService.js` calling real Core API Phase 2 endpoints:
    - `GET /api/jobs/mine` — Recruiter's personal listings across all statuses (`OPEN`, `CLOSED`).
    - `POST /api/jobs` — Creates job with `title`, `company`, `location`, `salary`, `experience`, `skills`, and `description`.
    - `PUT /api/jobs/:id` — Updates existing job with strict ownership verification.
    - `PATCH /api/jobs/:id/status` — Toggles job status (`OPEN` / `CLOSED`) with ownership check.
    - `DELETE /api/jobs/:id` — Soft-deletes job from listings with ownership check.
    - `GET /api/jobs/:id` — Fetches full details for the job detail modal/drawer.
  - Centralized Axios instance (`src/services/api.js`):
    - Automatically routes `/jobs` endpoints to `VITE_CORE_API_URL` (default `http://localhost:4000/api`) and `/auth` endpoints to `VITE_API_BASE_URL` (`http://13.203.243.162/api`).
    - Automatically attaches `Authorization: Bearer <token>` from Redux state on every call.
    - Handles 401 token expiry/tampering centrally by dispatching `logout()` and redirecting to `/login`.
  - Recruiter Jobs Page (`src/pages/recruiter/RecruiterJobsPage.jsx`):
    - Completely replaced all mock jobs with real Core API queries.
    - Real loading spinner, real retry-able error state, real empty state.
    - Edit Job and Delete Job actions are strictly guarded by recruiter ownership (`recruiter_id === loggedInUser.id`).
    - Real toast notifications on create, update, status toggle, and delete.
  - Recruiter Dashboard Home (`src/pages/recruiter/RecruiterDashboardHome.jsx`):
    - `Total Jobs` stat card and `Your Active Jobs` list compute directly from real `GET /api/jobs/mine` data.

- **Explicit Placeholder States for Unbuilt Backend Features (No Fake API Calls)**:
  - Created reusable, Design.md-compliant `ModulePendingState` component (`src/components/ModulePending/ModulePendingState.jsx`).
  - The following Recruiter Dashboard pages were updated to display clear, honest "Backend Pending • Phase 3" empty states with planned capability roadmaps and quick links back to My Jobs:
    1. **Candidates Page** (`src/pages/recruiter/RecruiterCandidatesPage.jsx`) — Pending Candidates & Applications microservice.
    2. **Resume Screening Page** (`src/pages/recruiter/RecruiterResumeScreeningPage.jsx`) — Pending AI-ML resume parsing & scoring service.
    3. **AI Interview Page** (`src/pages/recruiter/RecruiterAIInterviewPage.jsx`) — Pending AI Interview Agent microservice.
    4. **Candidate Ranking Page** (`src/pages/recruiter/RecruiterCandidateRankingPage.jsx`) — Pending ML Ranking microservice.
    5. **Interview Scheduler Page** (`src/pages/recruiter/RecruiterSchedulerPage.jsx`) — Pending Calendar & Interview Coordination backend.
    6. **Analytics Page** (`src/pages/Analytics/AnalyticsPage.jsx`) — Pending Analytics aggregation backend.
    7. **Dashboard Home Stat Cards & Sections** (`src/pages/recruiter/RecruiterDashboardHome.jsx`):
       - `Total Candidates`, `Pending Interviews`, and `Avg Resume Score` cards show "—" with "Pending Backend" status badge.
       - "Hiring Pipeline" and "Recent Activity" sections show clear Phase 3 connectivity status notes instead of fake graphs/counts.

- **Mock Data Cleanup**:
  - Removed all mock arrays from `src/mock/recruiter/` (`jobsMock.js`, `dashboardMock.js`, `candidatesMock.js`, `screeningMock.js`, `interviewMock.js`, `rankingMock.js`, `schedulerMock.js`).
  - Removed unimported `src/hooks/useMockAnalytics.js`.
  - Zero mock data remains in the recruiter dashboard.

### 2026-09-25 — Phase 3: Candidates & Applications (Core API Backend)

- **What Was Built**:
  1. **Database Schema & Migrations (`migrations/20260925_create_candidates_and_applications_tables.js`)**:
     - `candidates` table: `id` (PK), `user_id` (bigint, unique, indexed — 1:1 candidate profile per user), `resume_path` (varchar 500, nullable), `resume_original_name` (varchar 255, nullable), `created_at`, `updated_at`.
     - `applications` table: `id` (PK), `job_id` (FK to `jobs`), `candidate_id` (FK to `candidates`), `status` (enum: `APPLIED`, `SCREENING`, `INTERVIEW`, `SHORTLISTED`, `REJECTED`, `HIRED`, default `APPLIED`), `applied_at`, `updated_at`.
     - **Database-Level Unique Constraint**: Added composite unique constraint `UNIQUE KEY (job_id, candidate_id)` at the database engine level to strictly prevent duplicate applications across concurrent race conditions.
  2. **Candidates Module (`src/modules/candidates/`)**:
     - `candidates.validation.js`: Multer multipart file upload filter (PDF/DOCX only, 5MB size limit per Rules.md), Zod param schemas.
     - `candidates.repository.js`: Knex database access methods for profile lookup, resume reference persistence, recruiter application link verification, and read-only cross-reference with Auth Service `users` table.
     - `candidates.service.js`: Domain logic handling single-profile-per-user upsert, profile retrieval, and recruiter ownership-adjacent access checks.
     - `candidates.controller.js`: Clean Express controllers delivering consistent `ApiResponse` shapes.
     - `candidates.routes.js`: Routes with `verifyJwt`, `requireRole('CANDIDATE')`, `requireRole('RECRUITER')` guards (with `/me` declared before `/:id`).
     - `candidates.openapi.js`: Complete OpenAPI 3.0 specs registered in Swagger UI.
  3. **Applications Module (`src/modules/applications/`)**:
     - `applications.validation.js`: Zod schema validation for application creation, enum status updates, and integer ID params.
     - `applications.repository.js`: Knex queries for job application submission, candidate's application history, recruiter job applications joined with candidate and user metadata, and status updates.
     - `applications.service.js`: Application workflow logic with validation (job existence, OPEN status check, resume presence check, duplicate prevention, DB race condition handling) and ownership guards.
     - `applications.controller.js`: Standardized request/response controllers.
     - `applications.routes.js`: Main applications routes (`POST /api/applications`, `GET /api/applications/mine`, `PATCH /api/applications/:id/status`, `GET /api/applications/:id`) and job-scoped router (`GET /api/jobs/:jobId/applications`).
     - `applications.openapi.js`: OpenAPI 3.0 specs registered in Swagger UI.
  4. **App Wiring & Error Handling**:
     - Wired routers in `src/app.js` under `/api/candidates`, `/api/applications`, and `/api/jobs` without altering existing `src/modules/jobs/` code.
     - Updated `src/middleware/errorHandler.js` to catch Multer `LIMIT_FILE_SIZE` errors as 400 Bad Request and database duplicate entry errors (`ER_DUP_ENTRY` / `SQLITE_CONSTRAINT`) as 409 Conflict.

- **Architectural & Design Decisions**:
  1. **Resume Storage Approach for Phase 3**:
     - File storage stores the file reference (`resume_path` and `resume_original_name`) on local disk storage under `uploads/resumes/`.
     - In alignment with system architecture, actual file parsing, text extraction, skills matching, and scoring are deferred to the FastAPI AI Service in subsequent phases.
     - Candidates maintain exactly one current resume profile (`POST /api/candidates/me/resume` creates if new, updates in-place if existing).
  2. **Candidate Profile Missing Resume Behavior (`GET /api/candidates/me`)**:
     - Returns HTTP 404 with message `"Candidate profile not found. Please upload your resume first."` when a candidate has not yet uploaded a resume. This provides clear, unambiguous REST semantics indicating the resource does not exist yet.
  3. **Application Status Transitions (Open vs Restricted)**:
     - Implemented fully open transitions between any valid enum status (`APPLIED`, `SCREENING`, `INTERVIEW`, `SHORTLISTED`, `REJECTED`, `HIRED`).
     - **Rationale**: Real-world recruiting workflows often require flexible recruiter interventions (e.g. moving a candidate directly from APPLIED to SHORTLISTED, or reopening consideration). Complex state machine validation can be introduced in a future phase if explicit workflow constraints are required.

- **Verification Results**:
  1. **Linting**: `npm run lint` passed with 0 errors and 0 warnings.
  2. **Automated Unit & Integration Tests**: 62 of 62 tests passed across 6 test suites:
     - `candidates.test.js`: Unauthenticated upload rejected (401); Recruiter role rejected (403); Missing file rejected (400); Wrong file type rejected (400); Oversized file (>5MB) rejected (400); Valid PDF creates profile (201); Valid DOCX updates profile (200); `GET /me` returns 404 when resume missing; `GET /me` returns 200 with resume details; Recruiter `GET /:id` returns 403 when no application link exists; Recruiter `GET /:id` returns 200 when candidate applied to recruiter's job; 404 on non-existent candidate.
     - `applications.test.js`: Unauthenticated apply rejected (401); Recruiter role rejected (403); Applying without resume rejected (400); Applying to non-existent job rejected (404); Applying to CLOSED job rejected (400); Valid application succeeds (201); Second apply rejected with 409 Conflict; DB-level unique constraint verified on `(job_id, candidate_id)`; `GET /mine` returns applications ordered newest first; `GET /api/jobs/:jobId/applications` succeeds for owner (200) and returns 403 for non-owner recruiter; `PATCH status` succeeds for owner (200), returns 403 for non-owner, and rejects invalid status (400); `GET /api/applications/:id` enforces dual-role ownership (own candidate 200, foreign candidate 403, owning recruiter 200, foreign recruiter 403).
     - `jobs.test.js`: All 15 tests pass.
     - `swagger.test.js`: All 4 tests pass.
     - `verifyJwt.test.js`: All 7 tests pass.
     - `requireRole.test.js`: All 4 tests pass.
  3. **Database Constraint Verification**:
     - Verified `SHOW INDEX FROM applications` confirms `applications_job_id_candidate_id_unique` composite unique key exists with `Non_unique: 0`.
  4. **Manual Verification Suite with REAL Tokens from Deployed AWS Auth Service (`http://13.203.243.162`)**:
     - Registered & authenticated 4 real accounts on the live AWS Auth Service:
       - Recruiter A (`recruiter_a_*@hiregenius.ai`, ID: 21, role: RECRUITER)
       - Recruiter B (`recruiter_b_*@hiregenius.ai`, ID: 22, role: RECRUITER)
       - Candidate 1 (`candidate_c_*@hiregenius.ai`, ID: 23, role: CANDIDATE)
       - Candidate 2 (`candidate_d_*@hiregenius.ai`, ID: 24, role: CANDIDATE, resume-less)
     - Executed and validated all 9 required scenarios:
       - Scenario (a): Candidate 1 uploads resume (multipart PDF) -> 201 Created (`id: 51`).
       - Scenario (b): Candidate 1 applies to open job -> 201 Created (`id: 29`, status: `APPLIED`).
       - Scenario (c): Candidate 1 applies to same job again -> 409 Conflict (`"You have already applied for this job"`).
       - Scenario (d): Candidate 2 (no resume) applies to job -> 400 Bad Request (`"Upload your resume before applying"`).
       - Scenario (e): Recruiter A views applications for own job -> 200 OK (sees Application 29).
       - Scenario (f): Recruiter B tries to view Recruiter A's job applications -> 403 Forbidden (`"Forbidden: You do not have permission to view applications for this job"`).
       - Scenario (g): Recruiter A updates application status to `SHORTLISTED` -> 200 OK.
       - Scenario (h): Recruiter B tries to update Recruiter A's application status -> 403 Forbidden (`"Forbidden: You do not have permission to modify this application"`).
       - Scenario (i): Candidate 1 views own applications list via `GET /api/applications/mine` -> 200 OK (sees `status: "SHORTLISTED"`).
       - Extra Scenario: Recruiter A views candidate details via `GET /api/candidates/51` -> 200 OK (has application link); Recruiter B views `GET /api/candidates/51` -> 403 Forbidden (no application link).
  5. **Environment & Security**:
     - Confirmed `.env` files remain strictly unchanged and gitignored (`hiregenius-core-api/uploads/` also gitignored). Zero secrets introduced to version control.

### 2026-09-26 — Phase 3 Frontend: Real Core API Integration & Complete Mock Data Removal

- **Scope & Objectives Achieved**:
  - Replaced all mock data with real HTTP backend integration for **BOTH Candidate and Recruiter sides** of the application, connecting directly to live Core API Phase 2 (Jobs) and Phase 3 (Candidates & Applications) endpoints.
  - Zero mock data arrays remain in `hiregenius-frontend/src/` (`src/mock/candidate/` and `src/mock/recruiter/` mock files removed).
  - Unbuilt future modules (Interviews, Analytics, Ranking, Resume Screening scoring) display clear, honest `ModulePendingState` placeholders with planned roadmaps and no fake data.

- **Service Layer Implementation**:
  1. **Centralized Axios Routing (`src/services/api.js`)**:
     - Extended request interceptor to route `/jobs`, `/candidates`, and `/applications` to `VITE_CORE_API_URL` (`http://localhost:4000/api`).
     - Preserved Auth Service routing for `/auth/*` and automatic `Authorization: Bearer <token>` injection.
  2. **Candidates Service (`src/services/candidatesService.js`)**:
     - `uploadResume(formData)`: `POST /api/candidates/me/resume` (multipart/form-data, PDF/DOCX, max 5MB).
     - `getMyProfile()`: `GET /api/candidates/me` (returns 404 cleanly when no resume uploaded yet).
     - `getCandidateById(id)`: `GET /api/candidates/:id` (recruiter inspection with ownership guard).
  3. **Applications Service (`src/services/applicationsService.js`)**:
     - `applyToJob(jobId)`: `POST /api/applications` (`{ jobId }`, handles 201, 400 no-resume, 409 duplicate).
     - `getMyApplications()`: `GET /api/applications/mine` (candidate application history).
     - `getJobApplications(jobId)`: `GET /api/jobs/:jobId/applications` (recruiter applicants list for job).
     - `updateStatus(id, status)`: `PATCH /api/applications/:id/status` (`APPLIED`, `SCREENING`, `INTERVIEW`, `SHORTLISTED`, `HIRED`, `REJECTED`).
     - `getApplicationById(id)`: `GET /api/applications/:id`.

- **Candidate Side Integration**:
  1. **Candidate Dashboard (`src/pages/Dashboard/CandidateDashboard.jsx`)**:
     - Real open jobs list queried via `jobsService.getPublicJobs({ status: 'OPEN', limit: 6 })`.
     - Direct "Apply Now" button per job calling `applicationsService.applyToJob(job.id)`:
       - Displays "Applied" badge for already applied jobs.
       - Cleanly prompts and scrolls to resume upload zone if candidate has not uploaded a resume (HTTP 400).
       - Prevents duplicate applications with toast feedback (HTTP 409).
     - Real resume profile status queried via `candidatesService.getMyProfile()`:
       - Displays verified filename, file format, and upload date.
       - Interactive drag-and-drop resume upload zone wired to `candidatesService.uploadResume()`.
     - Real application pipeline tracker counting `Applied`, `Screening`, `Interview`, `Shortlisted` from `applicationsService.getMyApplications()`.
     - Real activity feed displaying recent application submissions with relative timestamps.
  2. **Candidate Applications Page (`src/pages/candidate/ApplicationsPage.jsx`)**:
     - Replaced all mock applications with real query `applicationsService.getMyApplications()`.
     - Real stage timeline and metadata overview for every submitted application.
     - Status filtering tabs (`All`, `Applied`, `Screening`, `Interview`, `Shortlisted`, `Hired`, `Rejected`) and search box.
     - Real loading shimmer, retryable error state, and empty state linking back to open jobs.
  3. **Candidate Settings Page (`src/pages/candidate/CandidateSettingsPage.jsx`)**:
     - Replaced mock profile with real authenticated user data from Redux `selectUser`.
     - Added "Resume Document" section displaying active resume details and "Replace Resume" uploader.
  4. **Unbuilt Modules (`InterviewsPage.jsx`, `ResumeScorePage.jsx`, `ScanHistoryPage.jsx`)**:
     - Replaced mock arrays with reusable `ModulePendingState` pointing candidates back to active applications and dashboard.

- **Recruiter Side Integration**:
  1. **Recruiter Candidates Page (`src/pages/recruiter/RecruiterCandidatesPage.jsx`)**:
     - Connected to real recruiter jobs via `jobsService.getMyJobs()` with job selection dropdown and `?jobId=` URL param support.
     - Fetches applicants for selected job via `applicationsService.getJobApplications(jobId)`.
     - Interactive application status dropdown calling `applicationsService.updateStatus(id, newStatus)` with live state update and toast confirmation.
     - Candidate detail drawer querying `candidatesService.getCandidateById(candidateId)` with 403 error boundary.
     - Status filter tabs, search by candidate name/email, and applicant count badges.
  2. **Recruiter Jobs Page (`src/pages/recruiter/RecruiterJobsPage.jsx`)**:
     - Added "Applicants" action button to each job card linking to `/recruiter/candidates?jobId=${job.id}`.
     - Added "View Applicants" button inside the Job Detail modal.
  3. **Recruiter Dashboard Home (`src/pages/recruiter/RecruiterDashboardHome.jsx`)**:
     - Updated "View Candidates" quick action badge from "Pending" to "Active".
     - Updated Card 2 to link directly to the live Candidate Pipeline.

- **Verification Results**:
  1. **Automated End-to-End Flow (`scratch/verify-frontend-phase3-flows.mjs`)**:
     - All 14 integration scenarios passed 100% against live Node Core API (port 4000) and deployed AWS Auth Service (`http://13.203.243.162`):
       1. Recruiter registration on Auth Service -> 201 Created with JWT.
       2. Candidate registration on Auth Service -> 201 Created with JWT.
       3. Recruiter creates job via `POST /api/jobs` -> 201 Created.
       4. Candidate checks profile before resume upload -> 404 cleanly returned.
       5. Candidate attempts apply without resume -> 400 rejected with "Upload your resume before applying".
       6. Candidate uploads resume via `POST /api/candidates/me/resume` -> 201 Created.
       7. Candidate retrieves profile via `GET /api/candidates/me` -> 200 OK.
       8. Candidate applies to job via `POST /api/applications` -> 201 Created.
       9. Candidate attempts duplicate apply -> 409 Conflict rejected with "You have already applied for this job".
       10. Candidate views application history via `GET /api/applications/mine` -> 200 OK.
       11. Recruiter views applicants via `GET /api/jobs/:jobId/applications` -> 200 OK.
       12. Recruiter updates status via `PATCH /api/applications/:id/status` -> 200 OK (`SHORTLISTED`).
       13. Candidate re-queries `GET /api/applications/mine` -> verifies status updated to `SHORTLISTED` in real time.
       14. Recruiter retrieves candidate detail via `GET /api/candidates/:id` -> 200 OK.
  2. **Linter & Production Build**:
     - `npm run lint`: 0 errors across 102 source files.
     - `npm run build`: 2,943 modules built successfully in 1.42s with 0 errors.

### 2026-09-26 — Data-Integrity Fixes: Recruiter/Candidate Identity Joins & ID Mutation Prevention

- **Problem & Root Causes Identified**:
  1. **Bug 1 (Missing Names & Emails)**:
     - **Database Disconnect**: Frontend `.env` pointed to remote AWS EC2 Auth Service while Core API connected to local MySQL on `localhost:3307`. Users registered via AWS auth lacked rows in local `users` table, causing `leftJoin('users')` to return `null` for `candidate_name` and `candidate_email`.
     - **Missing Recruiter Joins**: Core API queries lacked joins on `jobs.recruiter_id = users.id`. Candidates viewing applications (`GET /api/applications/mine` and `GET /api/applications/:id`) and users viewing jobs (`GET /api/jobs/:id`, `GET /api/jobs`) had no recruiter name or email.
     - **Inconsistent Keys**: `candidates.repository.js` (`findDetailWithUser` and `findByUserId`) omitted keys if user record was absent.
  2. **Bug 2 (ID Mutation & Inconsistent Displays)**:
     - In `RecruiterCandidatesPage.jsx` (`handleViewCandidate`): When inspecting an applicant, merging `res.data` (candidate profile with `id: candidate_id`) over `app` (application with `id: application_id`) caused `selectedCandidate.id` to mutate from application ID (e.g. #58) to candidate ID (e.g. #102) once the profile loaded.
     - In `ApplicationsPage.jsx`: Job reference rendered `Job #{app.job_id}` instead of consistent `#{app.job_id}`.
     - In `RecruiterProfilePage.jsx`: Hardcoded company `'TechCorp India'` was displayed instead of dynamic `user?.company`.

- **Fixes Applied**:
  1. **Core API Repository Layer (`hiregenius-core-api`)**:
     - `applications.repository.js`:
       - `findById(id)`: Updated to perform dual left-joins (`users as candidate_user` and `users as recruiter_user`), returning `candidate_name`, `candidate_email`, `recruiter_name`, and `recruiter_email`.
       - `findByCandidate(candidateId)`: Added left-join on `users as recruiter_user` on `jobs.recruiter_id = recruiter_user.id`, returning `recruiter_name` and `recruiter_email` to candidate application lists.
     - `jobs.repository.js`:
       - `findById(id)` and `findPublicJobs()`: Added left-join on `users` on `jobs.recruiter_id = users.id` to return `recruiter_name` and `recruiter_email`.
     - `candidates.repository.js`:
       - `findByUserId(userId)` and `findDetailWithUser(candidateId)`: Standardized to always include `candidate_name` and `candidate_email` keys.
     - `knexfile.js` & `jest.config.js`:
       - Set `USE_SQLITE=true` for isolated in-memory test execution so `npm test` never wipes or alters developer/production MySQL database records.
  2. **Frontend UI Fixes (`hiregenius-frontend`)**:
     - `RecruiterCandidatesPage.jsx`:
       - Fixed `handleViewCandidate`: Preserves `application_id: app.id` and `candidate_id: app.candidate_id` explicitly.
       - Modal displays `Candidate ID: #{selectedCandidate.candidate_id}`, `Application ID: #{selectedCandidate.application_id}`, and `Job ID: #{selectedCandidate.job_id}`. Real names and emails are displayed without `'N/A'` or placeholder text.
     - `ApplicationsPage.jsx`:
       - Normalized Job Reference display to `#{app.job_id}`.
       - Added recruiter info display (`{app.recruiter_name} ({app.recruiter_email})`) when available.
     - `RecruiterJobsPage.jsx`:
       - Job modal now renders `Recruiter: {viewingJob.recruiter_name} (#{viewingJob.recruiter_id})`.
     - `RecruiterProfilePage.jsx`:
       - Removed `'TechCorp India'` fallback string; dynamically renders `user?.company`.
     - `.env`:
       - Configured `VITE_API_BASE_URL=http://localhost:8080/api` aligning local dev environment with local Auth Service and shared MySQL DB.

- **Verification Results**:
  1. `hiregenius-core-api`:
     - Test suite: 6/6 test suites passed, 62/62 tests passed in SQLite in-memory mode.
     - Real HTTP tests against live server (`http://localhost:4000`):
       - `GET /api/jobs/329/applications`: Returns real candidate names ("Alex Tech", "Vishal Kumar") and emails.
       - `GET /api/candidates/102`: Returns real candidate name ("Vishal Kumar") and email ("vishalkumar.work0@gmail.com").
       - `GET /api/applications/mine`: Returns real recruiter name ("Sarah Recruiter") and email ("sarah.recruiter@hiregenius.ai").
       - `GET /api/applications/58`: Returns dual identities ("Vishal Kumar" & "Sarah Recruiter").
       - `GET /api/jobs/329`: Returns real recruiter name and email.
  2. `hiregenius-frontend`:
     - `npm run build`: Passed cleanly with 0 errors.

### 2026-09-26 — Core API CI Workflow Environment Fix

- **Problem & Root Cause**:
  - In GitHub Actions CI (`.github/workflows/core-api-ci.yml`), `npm test` failed with `"FATAL: JWT_SIGNING_KEY environment variable is missing"`.
  - `.env` is correctly gitignored. The test step previously used `JWT_SIGNING_KEY: ${{ secrets.JWT_SIGNING_KEY }}`, which resolved to empty string when repository secrets were not configured.
  - `src/config/env.js` strictly validates the presence of `JWT_SIGNING_KEY`, throwing a fatal error.
- **Fix Applied**:
  - In `.github/workflows/core-api-ci.yml`, updated the `Run tests` step with a complete `env:` block containing safe, non-production dummy placeholder values for every variable defined in `src/config/env.js`:
    - `NODE_ENV: test`
    - `PORT: 4000`
    - `JWT_SIGNING_KEY: ${{ secrets.JWT_SIGNING_KEY || 'test-only-signing-key-not-for-production-use-min-32-chars' }}`
    - `DB_HOST: localhost`
    - `DB_PORT: 3306`
    - `DB_USER: root`
    - `DB_PASSWORD: root`
    - `DB_NAME: testdb`
    - `DB_SSL: 'false'`
    - `DB_POOL_MIN: 1`
    - `DB_POOL_MAX: 10`
    - `ENABLE_SWAGGER: 'true'`
    - `USE_SQLITE: 'true'`
  - Updated workflow triggers to include `'feature/**'` and `.github/workflows/core-api-ci.yml` in path filters.
  - Documented CI environment variables in `DevOps.md`.
- **Scope & Independence**:
  - Zero impact on local development or cloud deployments (AWS/Render), which continue to read real environment variables from their respective `.env` files and production secrets.
  - Zero production secrets added to the workflow file.



