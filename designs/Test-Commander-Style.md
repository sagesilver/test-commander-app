# Test Commander: Style & Colour Scheme Specification

## 1. Design Principles

- **Modern, Clean, Uncluttered:** Prioritise simplicity and whitespace.
- **Subtlety:** Avoid harsh, bold, or saturated colours.
- **Accessibility:** Ensure strong contrast and legibility (WCAG 2.1 AA minimum).
- **Professionalism:** Instil trust with muted tones and understated UI accents.
- **Consistency:** Harmonised components, icons, and spacing throughout.
- **Dark Mode Supported:** Provide both light and dark variants with gentle transitions.

---

## 2. Colour Palette

### **Primary Colours**

- **Primary Blue**  
  - Light: `#eaf2fb`  
  - Main: `#3762c4`  
  - Dark: `#22386b`
  - Used for primary buttons, highlights, and key links.

- **Slate Grey**  
  - Light: `#f7f9fa`  
  - Main: `#606a78`  
  - Dark: `#23272f`
  - Used for navigation bars, backgrounds, panels.

### **Secondary & Accent Colours**

- **Teal Accent**  
  - Light: `#e5f5f6`  
  - Main: `#36b1ae`
  - Used sparingly for success states, focus rings, links, and minor highlights.

- **Amber/Gold Accent**  
  - Light: `#fdf6e4`  
  - Main: `#f7c873`
  - Used for warnings, info, or gentle attention without being harsh.

### **Supporting Neutrals**

- **White:** `#ffffff` (primary background, cards)
- **Soft Black:** `#101315` (for text in dark mode)
- **Charcoal:** `#2d3340` (body text, headings)
- **Light Grey:** `#e3e7ed` (dividers, disabled states, secondary backgrounds)
- **Mid Grey:** `#b3bbc9` (muted text, icons, placeholder)

---

## 3. Typography

- **Font Family:**  
  - `Inter`, `Segoe UI`, `Roboto`, `system-ui`, `sans-serif`
- **Font Weights:**  
  - Regular: 400
  - Medium: 500
  - SemiBold: 600
- **Hierarchy:**  
  - Use larger sizes for headings, clear spacing, and consistent line-height.
- **Body Text Colour:**  
  - Light mode: `#23272f`
  - Dark mode: `#e3e7ed`

---

## 4. Component & UI Styles

- **Buttons:**  
  - Rounded corners (`1.5rem`), soft shadows.
  - Subtle hover/active states (darken/lighten background).
  - Minimal outlines, focus ring in teal accent.
- **Cards/Panels:**  
  - Soft, elevated shadows (`box-shadow: 0 2px 8px rgba(44, 56, 100, 0.08)`).
  - Generous padding, large border-radius (`1.25rem`).
  - No hard borders—use light greys for separation.
- **Navigation:**  
  - Horizontal nav for desktop, collapsible drawer for mobile.
  - Highlight active tab with a subtle underline or colour shift.
- **Forms:**  
  - Clear, simple inputs; no strong outlines.
  - Placeholder text in mid-grey.
  - Error/success hints with gentle background colour and small icons.

---

## 5. Iconography

- **Icon Style:**  
  - Use outline/duotone icons (e.g., Lucide, Heroicons).
  - Size: `20–24px` for most applications.
  - Colour: Inherit text colour, or mid-grey for inactive/secondary.

---

## 6. Shadows & Depth

- Use very soft shadows for elevation—never harsh.
- Avoid strong 3D or “neumorphic” effects.
- Elevate primary modals and tooltips above cards.

---

## 7. Example Light & Dark Mode Usage

### **Light Mode**

- Background: `#f7f9fa`
- Card/Panel: `#ffffff`
- Text: `#23272f`
- Primary Action: `#3762c4` on `#eaf2fb`
- Accent: `#36b1ae`
- Divider: `#e3e7ed`

### **Dark Mode**

- Background: `#23272f`
- Card/Panel: `#2d3340`
- Text: `#e3e7ed`
- Primary Action: `#3762c4` on `#22386b`
- Accent: `#36b1ae`
- Divider: `#606a78`

---

## 8. Accessibility

- All colour pairings must meet at least AA contrast.
- Keyboard focus styles must be visible but subtle.
- Never use colour alone to convey state (always include icon/text).

---

## 9. Sample Tailwind Config Snippet

```js
// tailwind.config.js (excerpt)
theme: {
  colors: {
    primary: {
      light: '#eaf2fb',
      DEFAULT: '#3762c4',
      dark: '#22386b',
    },
    slate: {
      light: '#f7f9fa',
      DEFAULT: '#606a78',
      dark: '#23272f',
    },
    accent: {
      light: '#e5f5f6',
      DEFAULT: '#36b1ae',
      amber: '#f7c873',
    },
    white: '#ffffff',
    black: '#101315',
    charcoal: '#2d3340',
    grey: {
      light: '#e3e7ed',
      mid: '#b3bbc9',
    },
    // ...other colours
  },
  fontFamily: {
    sans: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
  },
  borderRadius: {
    DEFAULT: '1.25rem',
    xl: '1.5rem',
  },
  boxShadow: {
    card: '0 2px 8px rgba(44, 56, 100, 0.08)',
  },
  // ...other config
}
