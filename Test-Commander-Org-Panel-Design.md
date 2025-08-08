# Organisation Summary Panel Design Spec

## Purpose

The Organisation Summary Panel provides a concise, visually engaging overview of each organisation within the Test Commander app. Its primary function is to enable users (especially admins and super users) to quickly scan, identify, and select organisations, while surfacing the most important at-a-glance status and usage information. The panel is fully clickable to open detailed organisation information.

---

## Layout & Content

### **Fields Displayed (Summary Only)**
- **Organisation Name** (prominent, bold)
- **Logo/Avatar** (optional: custom logo or generated initials badge)
- **Status Badge** (e.g., "Active", "Inactive", "Suspended"; colour-coded chip)
- **Plan/Subscription Badge** (e.g., "Pro", "Trial", "Enterprise"; subtle pill/badge)
- **Admin Avatar/Name** (optional, with tooltip)
- **Users Count** (e.g., "14 Users"; with icon)
- **Projects Count** (e.g., "5 Projects"; with icon)
- **Alert Badge** (only if action required, e.g., "Subscription Expiring")
- **Details Chevron/Button** (chevron or "Details" button, right-aligned)

---

### **Recommended Panel Layout**

#### **Horizontal Example**
[Logo] Organisation Name | [Status] [Plan]
Admin: [Avatar] | Users: 12 | Projects: 3 | [Alert]
›

markdown
Copy
Edit

#### **Vertical Example**
+-------------------------------+
| [Logo] Organisation Name |
| [Status] [Plan] |
| Admin: Jane D. [Avatar] |
| Users: 12 Projects: 3 |
| [Alert: Plan Expiring] |
| › |
+-------------------------------+

markdown
Copy
Edit

---

### **Design Principles**
- **Minimal & High-Impact:** Show only the most actionable/identifying info.
- **Highly Scannable:** No paragraphs or extraneous text; all metrics/badges.
- **Visual Hierarchy:** Name and status are most prominent, metrics in smaller font.
- **Iconography:** Use icons for users, projects, and alerts for quick recognition.
- **Clickable:** Entire panel is a button (with hover/focus style).
- **Responsive:** Layout adapts for desktop/tablet/mobile views.
- **Accessible:** Colour pairings meet WCAG AA; all icons have accessible labels.

---

### **Component Guidelines**
- **Panel/Card Styling:**
  - Background: White (light mode) or dark charcoal (dark mode)
  - Rounded corners (`border-radius: 1.25rem` or xl in Tailwind)
  - Soft shadow for elevation
  - Padding: Generous (`p-4` min)
  - No hard borders; use light divider if needed

- **Status/Plan Badges:**
  - Small, pill-shaped chips; subtle but visible
  - Colour-coded (e.g., green for Active, amber for Expiring)

- **Admin/Avatar:**
  - Circular avatar (32px) with initials or image
  - Tooltip with admin name/email

- **Metrics (Users/Projects):**
  - Display as: [User Icon] 14   [Project Icon] 5
  - Font size smaller than title; muted text colour

- **Alert Badge:**
  - Only shown if action needed (e.g., subscription issue)
  - High-contrast colour; includes icon (e.g., warning/alert)

- **Chevron/Button:**
  - Right-aligned, subtle grey
  - Indicates panel is selectable/clickable

---

## **Field Reference Table**

| Field         | Type      | Display              | Notes                           |
|---------------|-----------|----------------------|---------------------------------|
| name          | string    | Bold, large          | Organisation name               |
| logo          | image/svg | 40px, circular       | Optional, fallback to initials  |
| status        | enum      | Badge/chip           | Active/Inactive/Suspended       |
| plan          | enum      | Badge/pill           | Pro/Trial/Enterprise etc.       |
| admin         | string    | Avatar + tooltip     | Optional                        |
| userCount     | integer   | Icon + value         | "14 Users"                      |
| projectCount  | integer   | Icon + value         | "5 Projects"                    |
| alert         | enum      | Badge/chip           | Only if action required         |
| chevron       | icon      | Right, subtle        | Indicates clickability          |

---

## **Accessibility**

- All interactive elements must be keyboard accessible.
- Badges and icons have `aria-label`s.
- Colour contrast meets WCAG 2.1 AA.
- Tooltip for admin shows on focus and hover.

---

## **Example Tailwind Classes (Guide Only)**
```jsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-charcoal rounded-xl shadow-card cursor-pointer hover:shadow-lg transition">
  <div className="flex items-center gap-4">
    <img src={logo} alt="Org Logo" className="w-10 h-10 rounded-full" />
    <div>
      <div className="font-semibold text-lg">{orgName}</div>
      <div className="flex gap-2 mt-1">
        <span className="badge-status">{status}</span>
        <span className="badge-plan">{plan}</span>
      </div>
    </div>
  </div>
  <div className="flex items-center gap-4">
    <span className="flex items-center text-sm"><UserIcon />{userCount}</span>
    <span className="flex items-center text-sm"><ProjectIcon />{projectCount}</span>
    {alert && <span className="badge-alert">{alert}</span>}
    <ChevronRightIcon className="text-grey-mid" />
  </div>
</div>
Notes
Panel does not show full contact info, settings, billing, or activity logs—these belong in the detail view.

Only display alert badges when a critical action is needed; otherwise, omit for cleanliness.

Design must remain consistent with Test Commander’s style and colour spec.