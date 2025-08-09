# Test Commander — Themes Design (Light/Dark)

## 1) Goals

- Provide switchable light/dark themes for authenticated users.
- Persist per-user preference; fall back to system preference.
- Minimise refactor via CSS variable tokens + Tailwind support.

## 2) Approach

- Tailwind `darkMode: "class"`.
- Define CSS variables for color tokens in `:root` (light) and `.dark` (dark).
- Expose `ThemeProvider` with `theme`, `toggleTheme`, `setTheme`.
- Apply early by toggling `document.documentElement.classList`.
- Persist to `localStorage` and Firestore `users/{id}.preferences.theme`.

## 3) Tokens

- Backgrounds: `surface`, `surface-muted`, `card`.
- Text: `foreground`, `muted`.
- Border: `border-subtle` (as `subtle`).
- Brand: `primary` (existing), `accent` (existing).

Light (current):

- surface: #f7f9fa, surface-muted: #eaf2fb, card: #ffffff,
- border-subtle: #e3e7ed, foreground: #101315, muted: #606a78,
- primary: #3762c4, accent: #36b1ae.

Dark (reference screenshot, sleek/high-contrast):

- surface: #0b0f19, surface-muted: #121829, card: #161e32,
- border-subtle: #2a334e, foreground: #e2e8f0, muted: #94a3b8,
- primary: #508cff, accent: #38bdf8.

## 4) UX

- Toggle in `Navigation` (desktop header and sidebar footer). Tooltip: “Switch to Light/Dark”.
- First visit: system preference; toggle overrides.
- Optional “Reset to system” future enhancement.

## 5) Data

User document addition:

```json
"preferences": { "theme": "light" | "dark", "updatedAt": <timestamp> }
```

## 6) Implementation Notes

- Enable dark mode in Tailwind and add color aliases backed by CSS vars so opacity utilities work.
- Replace hardcoded classes with tokens incrementally:
  - `bg-white` → `bg-card`
  - `bg-slate-light` → `bg-surface`
  - `text-charcoal` → `text-foreground`
  - `text-slate` → `text-muted`
  - `border-grey-light` → `border-subtle`

## 7) Testing

- Verify preference persists across reloads and sessions (local + Firestore).
- Contrast checks WCAG AA; check charts/gradients legibility.

## 8) Rollout Plan

1) Ship provider + toggle + global tokens.
2) Convert high-traffic components (`Navigation`, layout, cards, inputs).
3) Convert remaining pages as touched.
