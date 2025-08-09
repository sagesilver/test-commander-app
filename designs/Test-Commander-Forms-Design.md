## Test Commander – Forms Design Standard (Test Case + Organization)

### Dark Theme Base
- Form background: `#000000` (token: `surface`)
- Panel background: `#0a0a0a` (token: `card`/`surface-muted`)
- Text colours:
  - Labels/headings: white (`text-foreground`)
  - Read‑only/input text in view screens: `#b3bbc9`

### Inputs (New, Edit, View)
- Class: `input-field`
- Styles: border `subtle`, radius `rounded-lg`, padding `px-4 py-3`, focus ring accent, dark backgrounds per screen:
  - New/Edit: token background (`card`)
  - View: `#141617` for contrast; disabled fields only

### Headings & Icons
- Each major section uses a blue icon before the title (tokens: `--tc-icon`):
  - Basic Information: `Info`
  - Status & Results: `BarChart3`
  - Description/Objective: `ClipboardList`
  - Pre‑Requisites: `ListChecks`
  - Test Steps: `ListChecks`
  - Icon size: 20px; spacing: `.flex .items-center .gap-2`

### Priority and Status Pills
- Priority pill colours: High (red), Medium (orange), Low (green)
- In View screen, Priority pill is rendered inside the read‑only input, right aligned; input has extra right padding.
- Overall Result is a pill only (e.g., Passed/Failed).

### Test Steps (View)
- Each step as a card with `#141617` background and `border-subtle`.
- Fields rendered as disabled textareas using `input-field` for consistent style (Description, Test Data, Expected, Actual, Notes).

### Accessibility
- Labels are explicitly associated; disabled fields maintain sufficient contrast.

### Scope
- Applied to Test Case: New, Edit, View modals.
- Organization forms already follow the same system.


