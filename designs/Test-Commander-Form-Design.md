# Test Commander: Form Design Specification (Unified)

## 1. Overview

This document defines the consistent design system for all forms within the Test Commander application. All forms must follow these specifications to maintain a professional, modern, and cohesive user experience.

---

## 2. Design Principles

### 2.0 Data Access Principles (RBAC & Performance)
- **Least-privilege reads**: Forms must only read the minimum data necessary to render. Never load entire collections and filter client-side when a subset can be fetched directly.
- **Role-scoped queries**: For `ORG_ADMIN` users, fetch only their `organisationId` resources (e.g., load a single organization document) instead of querying all organizations.
- **Security-rule alignment**: All form data access patterns must comply with Firestore rules to avoid permission errors and reduce over-fetching.
- **Cost & latency**: Prefer targeted document reads and indexed queries; avoid N-scan or fan-out reads that grow with tenant count.

### 2.1 Visual Hierarchy
- **Clear section grouping** with descriptive headers and icons
- **Logical field ordering** from most important to least important
- **Consistent spacing** and alignment throughout
- **Progressive disclosure** for complex forms

### 2.2 User Experience
- **Real-time validation** with clear error messages
- **Intuitive field types** with appropriate input controls
- **Responsive design** that works on all screen sizes
- **Accessible design** following WCAG guidelines

### 2.3 Professional Appearance
- **Modern styling** using Tailwind CSS
- **Consistent color scheme** and typography
- **Icon integration** for visual enhancement
- **Smooth transitions** and hover effects

---

## 3. Form Structure

### 3.1 Modal Container
```html
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
    <!-- Form content -->
  </div>
</div>
```

### 3.2 Header Section
```html
<div className="flex items-center justify-between p-6 border-b border-subtle">
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-white/10 rounded-lg">
      <Icon className="h-6 w-6 text-[rgb(var(--tc-icon))]" />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-foreground">
        Form Title
      </h2>
      <p className="text-sm text-muted">
        Form description or instructions
      </p>
    </div>
  </div>
  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
    <XCircleIcon className="h-6 w-6 text-menu" />
  </button>
</div>
```

### 3.3 Form Content
```html
<form onSubmit={handleSubmit} className="p-6 space-y-8">
  <!-- Form sections -->
</form>
```

---

## 4. Section Design

### 4.1 Section Header
```html
<div className="space-y-6">
  <div className="flex items-center gap-2">
    <Icon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
    <h3 className="text-lg font-medium text-foreground">Section Title</h3>
  </div>
  <!-- Section content -->
</div>
```

### 4.2 Field Layout
```html
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Field groups -->
</div>
```

---

## 5. Input Field Specifications (Dark mode)

- Test Case forms (New/Edit/View) use a consistent, high-contrast input style:
  - Background: `#141617`
  - Text: `#b3bbc9`
  - Radius: `rounded-lg`
  - Applied via wrapper classes:
    - New: `.tc-testcase-new .input-field`
    - Edit: `.tc-testcase-edit .input-field`
    - View (read-only): `.tc-testcase-view .input-field` (disabled)


### 5.1 Text Input
```html
<div>
  <label className="block text-sm font-medium text-foreground mb-2">
    Field Label *
  </label>
  <input
    type="text"
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    className={`input-field ${error ? 'border-red-400' : ''}`}
    placeholder="Placeholder text"
  />
  {error && (
    <p className="mt-1 text-sm text-red-600 flex items-center">
      <XCircleIcon className="h-4 w-4 mr-1" />
      {error}
    </p>
  )}
</div>
```

### 5.2 Icon-Enhanced Input
```html
<div>
  <label className="block text-sm font-medium text-foreground mb-2">
    Field Label
  </label>
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
    className="input-field pl-10 pr-4"
      placeholder="Placeholder text"
    />
  </div>
</div>
```

### 5.3 Textarea
```html
<div>
  <label className="block text-sm font-medium text-foreground mb-2">
    Description *
  </label>
  <textarea
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    rows={3}
    className={`input-field ${error ? 'border-red-400' : ''}`}
    placeholder="Describe your content"
  />
  {error && (
    <p className="mt-1 text-sm text-red-600 flex items-center">
      <XCircleIcon className="h-4 w-4 mr-1" />
      {error}
    </p>
  )}
</div>
```

### 5.4 Select Dropdown
```html
<div>
  <label className="block text-sm font-medium text-foreground mb-2">
    Selection Field
  </label>
  <select
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    className="input-field"
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
</div>
```

### 5.5 Toggle Switch
```html
<div className="flex items-center justify-between p-4 bg-surface-muted rounded-lg border border-subtle">
  <div className="flex items-center space-x-3">
    <CogIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
    <div>
      <h4 className="font-medium text-foreground">Toggle Label</h4>
      <p className="text-sm text-menu">
        Toggle description
      </p>
    </div>
  </div>
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => handleChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  </label>
</div>
```

### 5.6 Card Selection
```html
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {options.map(option => (
    <div
      key={option.value}
      className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
        selectedValue === option.value
          ? 'border-[rgb(var(--tc-icon))] bg-white/5'
          : 'border-subtle hover:bg-white/5'
      }`}
      onClick={() => handleChange(option.value)}
    >
      {selectedValue === option.value && (
        <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
      )}
      <div className="text-center">
        <h4 className="font-semibold text-foreground">{option.label}</h4>
        <ul className="mt-2 text-xs text-menu space-y-1">
          {option.features.map((feature, index) => (
            <li key={index} className="flex items-center justify-center">
              <CheckCircleIcon className="h-3 w-3 text-green-400 mr-1" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ))}
</div>
```

---

## 6. Color Scheme (Tokens)

### 6.1 Primary Colors
- **Primary Blue**: `#3762c4` (blue-600)
- **Primary Blue Hover**: `#2563eb` (blue-700)
- **Primary Blue Light**: `#dbeafe` (blue-100)

### 6.2 Status Colors
- **Success**: `#10b981` (emerald-500)
- **Error**: `#ef4444` (red-500)
- **Warning**: `#f59e0b` (amber-500)
- **Info**: `#3b82f6` (blue-500)

### 6.3 Neutral Colors
- **Text Primary**: `text-foreground`
- **Text Secondary**: `text-menu`
- **Border Subtle**: `border-subtle`
- **Background (dark)**: tokens `surface`, `card`, `surface-muted`

---

## 7. Typography

### 7.1 Font Sizes
- **Form Title**: `text-xl font-semibold`
- **Section Headers**: `text-lg font-medium`
- **Field Labels**: `text-sm font-medium`
- **Body Text**: `text-sm`
- **Error Messages**: `text-sm`

### 7.2 Font Weights
- **Semibold**: `font-semibold` (600)
- **Medium**: `font-medium` (500)
- **Normal**: `font-normal` (400)

---

## 8. Spacing System

### 8.1 Container Spacing
- **Modal Padding**: `p-6`
- **Section Spacing**: `space-y-8`
- **Field Group Spacing**: `space-y-6`
- **Field Spacing**: `gap-6`

### 8.2 Field Spacing
- **Label to Input**: `mb-2`
- **Input Padding**: `px-4 py-3`
- **Error Message**: `mt-1`

---

## 9. Validation & Error Handling

### 9.1 Error Display
```html
{error && (
  <p className="mt-1 text-sm text-red-600 flex items-center">
    <XCircleIcon className="h-4 w-4 mr-1" />
    {error}
  </p>
)}
```

### 9.2 Error States
- **Input Border**: `border-red-300`
- **Error Text**: `text-red-600`
- **Error Icon**: `XCircleIcon`

### 9.3 Success States
- **Success Text**: `text-green-600`
- **Success Icon**: `CheckCircleIcon`

---

## 10. Loading States

### 10.1 Button Loading
```html
<button
  type="submit"
  disabled={loading}
  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
>
  {loading ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      <span>Loading...</span>
    </>
  ) : (
    <span>Submit</span>
  )}
</button>
```

### 10.2 Form Loading
```html
{loading && (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-2xl">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)}
```

---

## 11. Action Buttons

### 11.1 Primary Action
```html
<button
  type="submit"
  disabled={loading}
  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Saving...' : 'Save'}
</button>
```

### 11.2 Secondary Action
```html
<button
  type="button"
  onClick={onCancel}
  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
>
  Cancel
</button>
```

### 11.3 Button Group
```html
<div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
  <button type="button" onClick={onCancel} className="secondary-button">
    Cancel
  </button>
  <button type="submit" disabled={loading} className="primary-button">
    {loading ? 'Saving...' : 'Save'}
  </button>
</div>
```

---

## 12. Responsive Design

### 12.1 Grid Layouts
- **Mobile**: `grid-cols-1`
- **Tablet**: `md:grid-cols-2`
- **Desktop**: `lg:grid-cols-2` or `lg:grid-cols-3`

### 12.2 Modal Sizing
- **Mobile**: `w-full max-w-sm`
- **Tablet**: `w-full max-w-2xl`
- **Desktop**: `w-full max-w-4xl`

---

## 13. Accessibility

### 13.1 Required Fields
- **Visual Indicator**: `*` after label
- **Aria Required**: `aria-required="true"`

### 13.2 Error Announcements
- **Aria Invalid**: `aria-invalid="true"`
- **Aria Described By**: `aria-describedby="error-id"`

### 13.3 Focus Management
- **Focus Ring**: `focus:ring-2 focus:ring-blue-500`
- **Tab Order**: Logical tab sequence
- **Skip Links**: For keyboard navigation

---

## 14. Icon Usage

### 14.1 Icon Sizes
- **Section Icons**: `h-5 w-5`
- **Field Icons**: `h-5 w-5`
- **Button Icons**: `h-4 w-4`
- **Error Icons**: `h-4 w-4`

### 14.2 Icon Colors
- **Primary**: `text-blue-600`
- **Secondary**: `text-gray-400`
- **Error**: `text-red-600`
- **Success**: `text-green-500`

### 14.3 Icon Positioning
- **Left Aligned**: `absolute left-3 top-1/2 transform -translate-y-1/2`
- **Right Aligned**: `absolute right-3 top-1/2 transform -translate-y-1/2`

---

## 15. Form Types

### 15.1 Simple Form (1-3 fields)
- Single column layout
- Minimal sectioning
- Inline validation

### 15.2 Standard Form (4-8 fields)
- Two-column layout
- Logical sectioning
- Real-time validation

### 15.3 Complex Form (9+ fields)
- Multi-section layout
- Progressive disclosure
- Step-by-step validation

---

## 16. Implementation Checklist

### 16.1 Required Elements
- [ ] Modal container with backdrop
- [ ] Header with title and close button
- [ ] Form sections with icons
- [ ] Proper field validation
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design
- [ ] Accessibility features

### 16.2 Optional Enhancements
- [ ] Auto-save functionality
- [ ] Form state persistence
- [ ] Keyboard shortcuts
- [ ] Drag and drop
- [ ] File upload preview
- [ ] Rich text editor
- [ ] Date/time picker
- [ ] Color picker

---

## 17. Example Implementation

See `src/components/organizations/OrganizationForm.js` and test case modals in `src/pages/TestCases.js`.

---

This design system ensures consistency across all forms in the Test Commander application while maintaining a professional, modern, and user-friendly interface.
