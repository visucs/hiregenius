# Design.md — HireGenius AI

## 1. Design Direction
A premium, enterprise-grade SaaS recruitment platform. Aesthetic inspired by Linear / Vercel / 21st.dev — dark theme as the baseline, generous whitespace, glassmorphism accents, gradient highlights used sparingly on key CTAs and AI-highlighted phrases. Framer Motion is used throughout for scroll reveals, hover states, and micro-interactions.

---

## 2. Color Tokens (CANONICAL — Olive Green & Warm Off-White)

### Dark Theme (baseline — default applied)
| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0D110A` | Deepest background layer (dark olive charcoal) |
| `--bg-surface` | `#121608` | Cards, panels at rest |
| `--bg-elevated` | `#1A1F10` | Elevated/hover card layer |
| `--primary` | `#3D5016` | Deep olive green (CTAs, active nav, focus rings) |
| `--primary-hover` | `#4A6320` | Button hover state |
| `--secondary` | `#6B8A3A` | Medium olive green (AI badges, highlights, accents) |
| `--accent-lime` | `#a3c55a` | Light olive/lime tint (shimmer text, gradient high stop) |
| `--gradient-start` | `#3D5016` | Gradient CTA / text highlight start |
| `--gradient-end` | `#6B8A3A` | Gradient CTA / text highlight end |
| `--success` | `#4A7C3F` | Highly Recommended, success states |
| `--warning` | `#F59E0B` | Consider recommendation, alerts |
| `--danger` | `#EF4444` | Not a Fit, errors, delete actions |
| `--text-primary` | `#F0EDE4` | Warm off-white headings & primary text |
| `--text-secondary` | `#A8A090` | Muted / help text |
| `--text-muted` | `#6E6658` | Timestamps, captions |
| `--border` | `rgba(107, 138, 58, 0.15)` | Card/divider borders |
| `--border-hover` | `rgba(107, 138, 58, 0.30)` | Hover border emphasis |
| `--glass-bg` | `rgba(18, 22, 8, 0.65)` | Glassmorphism card background |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | Glassmorphism card border |

### Light Theme (toggled via theme switch)
| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#F2EFE8` | Warm cream page background |
| `--bg-surface` | `#FAF9F5` | Soft off-white surface cards |
| `--bg-elevated` | `#FFFFFF` | Elevated cards & floating panels |
| `--primary` | `#3D5016` | Deep olive green primary buttons |
| `--primary-hover` | `#2E3D0F` | Button hover |
| `--secondary` | `#6B8A3A` | Medium olive accents |
| `--text-primary` | `#1A1F0E` | Deep olive black headings |
| `--text-secondary` | `#4A5239` | Muted olive brown text |
| `--text-muted` | `#7A8468` | Sage olive captions |
| `--border` | `rgba(61, 80, 22, 0.12)` | Borders |
| `--border-hover` | `rgba(61, 80, 22, 0.22)` | Hover borders |

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
| Navbar glass (Landing) | 999px (floating pill) / 16px (mobile) |
| Navbar glass (Product pages) | 0 (full-width flush) |

---

## 6. Elevation System
| State | Style |
|---|---|
| Rest | `1px solid var(--border)` + `box-shadow: 0 4px 24px rgba(0,0,0,0.3)` |
| Hover | `translateY(-6px)` + `1px solid var(--border-hover)` + `box-shadow: 0 12px 40px rgba(61,80,22,0.20)` + optional border glow |
| Focus | `outline: 2px solid var(--primary)` + `outline-offset: 2px` |

---

## 7. Gradient System
- **Primary gradient:** `linear-gradient(135deg, #3D5016, #6B8A3A)`
- **Shimmer accent gradient:** `linear-gradient(135deg, #6B8A3A 0%, #a3c55a 50%, #6B8A3A 100%)`
- Used ONLY on: key CTA buttons, gradient text on "AI agents" phrase, active state indicators
- NEVER as a full-section background fill
- **Glow blob (hero bg):** `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(107,138,58,0.20), transparent 70%)`

---

## 8. Components Style

### GradientButton
- Background: `linear-gradient(135deg, #3D5016, #6B8A3A)`
- Border radius: 12px
- Hover: `scale(1.02)` + glow shadow
- Tap: `scale(0.98)`
- Text: white, 15px, 600 weight

### GlassCard
- Background: `rgba(18, 22, 8, 0.65)` (dark) / `rgba(250, 249, 245, 0.65)` (light) with `backdrop-filter: blur(24px)`
- Border: `1px solid rgba(255,255,255,0.08)` (dark) / `1px solid rgba(61,80,22,0.10)` (light)
- Top highlight: `inset 0 1px 0 0 rgba(255,255,255,0.06)` (dark) / `inset 0 1px 0 0 rgba(255,255,255,0.8)` (light)
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
- **Card hover:** `whileHover={{ y: -6, scale: 1.02 }}`, `transition={{ duration: 0.2 }}`
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
- Test at: 320px / 375px / 768px / 1280px / 1920px

---

## 12. Landing Page Glassmorphism & Ambient Olive Glow System

Applied **exclusively to the Landing page** (`/`) to preserve overall application stability and brand consistency:

### A. Ambient Background Glows (Layer 0, Non-Interactive)
- Built with large, blurred radial mesh gradients using the olive-green family:
  - Deep Olive (`#3D5016`) + Medium Olive (`#6B8A3A`) + Light Olive Accent (`#a3c55a`).
  - Blur radius: `blur(120px–140px)`.
  - Dark Mode opacity: `18%–24%` against `#0D110A`.
  - Light Mode opacity: `7%–10%` against `#F2EFE8`.
  - *Strict Rule*: Glow tokens are background-only (`pointer-events: none`, `z-index: 0`). Never used on interactive buttons, links, or text.

### B. Deep Glassmorphism Surfaces
- Applied to all landing page cards (Bento cards, feature modules, step cards, benefits, FAQ, and CTA band):
  - Filter: `backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);`
  - Dark Mode Surface: `rgba(255, 255, 255, 0.02)` / `rgba(18, 22, 8, 0.65)`, border `1px solid rgba(255, 255, 255, 0.08)`, specular highlight `inset 0 1px 0 0 rgba(255, 255, 255, 0.06)`.
  - Light Mode Surface: `rgba(250, 249, 245, 0.65)`, border `1px solid rgba(61, 80, 22, 0.10)`, specular highlight `inset 0 1px 0 0 rgba(255, 255, 255, 0.80)`.

### C. Floating Navbar Pill
- Landing page navbar detaches from the viewport edges:
  - Position: `fixed top-3.5 left-0 right-0 z-50`, container `max-width: 1240px`, `border-radius: 999px` (16px on mobile).
  - Floating soft shadow: `0 16px 40px rgba(0, 0, 0, 0.45)` (dark) / `0 12px 32px rgba(61, 80, 22, 0.08)` (light).
  - All product pages (`/products/*`) maintain their standard edge-to-edge flush navbar.