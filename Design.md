# Design.md — HireGenius AI

## 1. Design Direction
A premium, enterprise-grade SaaS recruitment platform. Aesthetic inspired by Linear / Vercel / 21st.dev — dark theme as the baseline, generous whitespace, glassmorphism accents, gradient highlights used sparingly on key CTAs and AI-highlighted phrases. Framer Motion is used throughout for scroll reveals, hover states, and micro-interactions.

---

## 2. Color Tokens (CANONICAL — replaces all prior tokens)

### Dark Theme (baseline — always applied)
| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0A0E1A` | Deepest background layer |
| `--bg-surface` | `#0F1420` | Cards, panels at rest |
| `--bg-elevated` | `#151B2C` | Elevated/hover card layer |
| `--primary` | `#6366F1` | Indigo accent (CTAs, active nav, focus rings) |
| `--primary-hover` | `#4F46E5` | Button hover |
| `--secondary` | `#22D3EE` | Cyan AI accent (AI badges, highlights) |
| `--gradient-start` | `#6366F1` | Gradient CTA / text highlight start |
| `--gradient-end` | `#22D3EE` | Gradient CTA / text highlight end |
| `--success` | `#22C55E` | Highly Recommended, success states |
| `--warning` | `#F59E0B` | Consider recommendation, alerts |
| `--danger` | `#EF4444` | Not a Fit, errors, delete actions |
| `--text-primary` | `#F8FAFC` | Headings, body — primary text |
| `--text-secondary` | `#94A3B8` | Muted / help text |
| `--text-muted` | `#64748B` | Timestamps, captions |
| `--border` | `rgba(255,255,255,0.08)` | Card/divider borders |
| `--border-hover` | `rgba(255,255,255,0.15)` | Hover border emphasis |
| `--glass-bg` | `rgba(15,20,32,0.7)` | Glassmorphism card background |
| `--glass-border` | `rgba(255,255,255,0.08)` | Glassmorphism card border |

### Light Theme (optional, toggled by `.light` class)
| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#F8FAFC` | Page background |
| `--bg-surface` | `#FFFFFF` | Cards |
| `--bg-elevated` | `#F1F5F9` | Elevated cards |
| `--primary` | `#4F46E5` | Primary buttons |
| `--secondary` | `#06B6D4` | AI accents |
| `--text-primary` | `#0F172A` | Headings |
| `--text-secondary` | `#64748B` | Muted text |
| `--text-muted` | `#94A3B8` | Captions |
| `--border` | `#E2E8F0` | Borders |
| `--border-hover` | `#CBD5E1` | Hover borders |

---

## 3. Typography
- **Font:** `Inter` (Google Fonts) — single font, all weights
- **Hero H1:** 56–72px / 800 weight / tight tracking (`letter-spacing: -0.03em`) / multi-line with clear rhythm
- **Section H2:** 36–48px / 700 weight
- **Card H3:** 20px / 600 weight
- **Body:** 15–16px / 400 weight / `line-height: 1.7`
- **Caption/Meta:** 12px / 400

---

## 4. Spacing Scale (CANONICAL — use consistently, never deviate)
`4 / 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128` (px)

- Section vertical padding: **minimum 96px top + bottom** (120px preferred)
- Card internal padding: **32px**
- Between heading and sub-text: **16px**
- Between sub-text and content grid: **48–64px**
- Between grid items: **24px**
- Max content width: **1280px** (centered, auto margins)

---

## 5. Radius
| Element | Radius |
|---|---|
| Cards / modals | 20px |
| Buttons / inputs | 12px |
| Icon containers | 14px |
| Tags / chips / badges | 999px (pill) |
| Navbar glass | 0 (full-width) |

---

## 6. Elevation System
| State | Style |
|---|---|
| Rest | `1px solid var(--border)` + `box-shadow: 0 4px 24px rgba(0,0,0,0.3)` |
| Hover | `translateY(-6px)` + `1px solid var(--border-hover)` + `box-shadow: 0 12px 40px rgba(99,102,241,0.15)` + optional border glow |
| Focus | `outline: 2px solid var(--primary)` + `outline-offset: 2px` |

---

## 7. Gradient System
- **Primary gradient:** `linear-gradient(135deg, #6366F1, #22D3EE)`
- Used ONLY on: key CTA buttons, gradient text on "AI agents" phrase, active state indicators
- NEVER as a full-section background fill
- **Glow blob (hero bg):** `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15), transparent 70%)`

---

## 8. Components Style

### GradientButton
- Background: `linear-gradient(135deg, #6366F1, #22D3EE)`
- Border radius: 12px
- Hover: `scale(1.02)` + glow shadow
- Tap: `scale(0.98)`
- Text: white, 15px, 600 weight

### GlassCard
- Background: `rgba(15,20,32,0.7)` with `backdrop-filter: blur(20px)`
- Border: `1px solid rgba(255,255,255,0.08)`
- Border radius: 20px
- Hover: lift + border glow (Framer Motion `whileHover`)

### SectionHeading
- Centered, `H2` tag, gradient text on key phrase (optional)
- Followed by subtext in `--text-secondary`, max-width 640px centered
- `margin-bottom: 64px` before content starts

### AnimatedCounter
- Counts up from 0 to target value on scroll enter (`whileInView`)
- Used in Stats section

### Skeleton loaders
- Animated shimmer via CSS `@keyframes` — never plain spinners for list/card loading
- Match the shape of the content being loaded

### Toasts
- Top-right, auto-dismiss 4s
- Dark glass background with colored left border (success/error/info)

---

## 9. Framer Motion Conventions
- **Entrance:** `initial={{ opacity: 0, y: 24 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}`
- **Stagger children:** `staggerChildren: 0.1` on parent `motion.div` with `delayChildren: 0.1`
- **Scroll reveal:** `whileInView={{ opacity: 1, y: 0 }}`, `initial={{ opacity: 0, y: 32 }}`, `viewport={{ once: true, margin: "-80px" }}`
- **Card hover:** `whileHover={{ y: -6 }}`, `transition={{ duration: 0.2 }}`
- **Button hover/tap:** `whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.98 }}`
- Keep durations between 150–300ms. No bouncy springs on content animations.

---

## 10. AI-Specific UI Patterns
- AI-generated content: subtle left border accent (`--secondary`) or small "AI" badge
- Loading state for AI calls: descriptive text ("Analyzing resume...", "Generating questions...")
- Always show confidence/score visually (ring or bar), not just a number
- Icon set: `lucide-react` throughout

---

## 11. Responsive Breakpoints
- Mobile `< 640px`: sidebar → bottom nav/drawer, single column
- Tablet `640–1024px`: sidebar icons-only, 2-col grids where appropriate
- Desktop `> 1024px`: full sidebar 260px, multi-column dashboard
- Test at: 375px / 768px / 1280px / 1920px

-