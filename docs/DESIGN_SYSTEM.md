# Wealth Management CRM - Design System

## Color Palette & Usage Guidelines

### Overview

This design system uses a professional color palette specifically tailored for financial services, emphasizing trust, stability, and clarity. All colors meet WCAG 2.1 AA accessibility standards with appropriate contrast ratios.

---

## Color System

### Primary Colors

#### Primary Blue
- **Variable:** `--primary` / Tailwind: `bg-primary`, `text-primary`
- **Value:** `hsl(217 91% 35%)` (Light Mode) / `hsl(217 91% 55%)` (Dark Mode)
- **Use Cases:**
  - Primary call-to-action buttons
  - Active navigation items
  - Important links
  - Focus states
  - Brand elements
- **Example:** "Invest Now", "Approve Transaction", "Submit Request"

#### Primary Foreground
- **Variable:** `--primary-foreground` / Tailwind: `text-primary-foreground`
- **Use:** Text/icons on primary-colored backgrounds

---

### Semantic Colors

#### Success Green
- **Variable:** `--success` / Tailwind: `bg-success`, `text-success`
- **Value:** `hsl(142 71% 35%)` (Light Mode) / `hsl(142 71% 45%)` (Dark Mode)
- **Use Cases:**
  - Positive portfolio returns
  - Successful transactions
  - Approved requests
  - Growth indicators
  - Account gains
- **Example:** "+5.2% return", "Transaction Approved", "Investment Successful"

#### Warning Amber
- **Variable:** `--warning` / Tailwind: `bg-warning`, `text-warning`
- **Value:** `hsl(38 92% 50%)` (Light Mode) / `hsl(38 92% 60%)` (Dark Mode)
- **Use Cases:**
  - Pending reviews
  - Caution messages
  - Account limits approaching
  - KYC verification needed
  - Notifications requiring attention
- **Example:** "Pending RM Review", "Approaching Client Limit", "Action Required"

#### Info Blue
- **Variable:** `--info` / Tailwind: `bg-info`, `text-info`
- **Value:** `hsl(199 89% 48%)` (Light Mode) / `hsl(199 89% 58%)` (Dark Mode)
- **Use Cases:**
  - Informational messages
  - Helpful tooltips
  - System announcements
  - Educational content
  - Status updates
- **Example:** "New feature available", "Portfolio insights", "Market updates"

#### Destructive Red
- **Variable:** `--destructive` / Tailwind: `bg-destructive`, `text-destructive`
- **Value:** `hsl(0 84% 45%)` (Light Mode) / `hsl(0 84% 55%)` (Dark Mode)
- **Use Cases:**
  - Portfolio losses
  - Failed transactions
  - Rejected requests
  - Error messages
  - Critical warnings
  - Delete/cancel actions
- **Example:** "-2.3% loss", "Transaction Failed", "Request Denied"

---

### Neutral Colors

#### Background
- **Variable:** `--background` / Tailwind: `bg-background`
- **Value:** `hsl(0 0% 100%)` (Light Mode) / `hsl(222 47% 7%)` (Dark Mode)
- **Use:** Page backgrounds, main application canvas

#### Foreground
- **Variable:** `--foreground` / Tailwind: `text-foreground`
- **Value:** `hsl(222 47% 11%)` (Light Mode) / `hsl(210 40% 98%)` (Dark Mode)
- **Use:** Primary text content

#### Card
- **Variable:** `--card` / Tailwind: `bg-card`
- **Use:** Elevated surfaces, content cards, panels
- **Example:** Client cards, portfolio summaries, transaction lists

#### Muted
- **Variable:** `--muted` / Tailwind: `bg-muted`, `text-muted-foreground`
- **Use:** Secondary backgrounds, disabled states, helper text
- **Example:** Placeholder text, disabled buttons, secondary information

#### Secondary
- **Variable:** `--secondary` / Tailwind: `bg-secondary`
- **Use:** Secondary buttons, alternative actions, less prominent UI elements
- **Example:** "Cancel" buttons, "Learn More" links, secondary navigation

#### Accent
- **Variable:** `--accent` / Tailwind: `bg-accent`
- **Use:** Hover states, highlighted items, selection backgrounds

---

## Accessibility Guidelines

### Contrast Ratios

All color combinations in this design system meet **WCAG 2.1 AA standards**:

- **Normal text (< 18pt):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18pt or 14pt bold):** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 contrast ratio

### Tested Combinations

✅ **Accessible:**
- `text-foreground` on `bg-background`
- `text-primary-foreground` on `bg-primary`
- `text-success-foreground` on `bg-success`
- `text-warning-foreground` on `bg-warning`
- `text-destructive-foreground` on `bg-destructive`
- `text-card-foreground` on `bg-card`

❌ **Avoid:**
- Light colors on light backgrounds
- Colored text on colored backgrounds without testing
- Using color as the only way to convey information

---

## Usage Patterns

### Buttons

```tsx
// Primary action
<button className="bg-primary text-primary-foreground">
  Submit Investment
</button>

// Secondary action
<button className="bg-secondary text-secondary-foreground">
  Cancel
</button>

// Destructive action
<button className="bg-destructive text-destructive-foreground">
  Delete Account
</button>

// Success confirmation
<button className="bg-success text-success-foreground">
  Approve Request
</button>
```

### Alerts & Notifications

```tsx
// Success message
<div className="rounded-md bg-success p-4">
  <p className="text-sm text-success-foreground">
    Transaction completed successfully
  </p>
</div>

// Warning message
<div className="rounded-md bg-warning p-4">
  <p className="text-sm text-warning-foreground">
    Pending RM review required
  </p>
</div>

// Error message
<div className="rounded-md bg-destructive p-4">
  <p className="text-sm text-destructive-foreground">
    Transaction failed - insufficient funds
  </p>
</div>

// Info message
<div className="rounded-md bg-info p-4">
  <p className="text-sm text-info-foreground">
    New market insights available
  </p>
</div>
```

### Status Badges

```tsx
// Approved status
<span className="inline-flex items-center rounded-full bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
  Approved
</span>

// Pending status
<span className="inline-flex items-center rounded-full bg-warning px-2 py-1 text-xs font-semibold text-warning-foreground">
  Pending
</span>

// Rejected status
<span className="inline-flex items-center rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
  Rejected
</span>
```

### Portfolio Returns

```tsx
// Positive return
<span className="text-sm font-medium text-success">
  +5.24% ↑
</span>

// Negative return
<span className="text-sm font-medium text-destructive">
  -2.13% ↓
</span>
```

---

## Dark Mode Support

All colors have carefully selected dark mode variants that maintain:
- Equivalent contrast ratios
- Consistent visual hierarchy
- Reduced eye strain in low-light environments
- Professional appearance

To enable dark mode, add the `dark` class to your HTML element:

```html
<html class="dark">
  <!-- Content automatically uses dark mode colors -->
</html>
```

---

## Responsive Breakpoints

```typescript
// Tailwind breakpoints
{
  sm: '640px',   // Tablet
  md: '768px',   // Desktop small
  lg: '1024px',  // Desktop medium
  xl: '1280px',  // Desktop large
  '2xl': '1536px' // Desktop extra large
}
```

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// Mobile: full width, Desktop: half width
<div className="w-full lg:w-1/2">
  Content
</div>

// Mobile: stacked, Desktop: grid
<div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

---

## Border Radius

```typescript
{
  sm: 'calc(0.5rem - 4px)', // 4px
  md: 'calc(0.5rem - 2px)', // 6px
  lg: '0.5rem',             // 8px (default)
}
```

Use consistent border radius for cohesive UI:

```tsx
// Cards and containers
<div className="rounded-lg">...</div>

// Buttons
<button className="rounded-md">...</button>

// Badges and pills
<span className="rounded-full">...</span>
```

---

## Typography Scale

Use consistent typography for hierarchy:

```tsx
// Page title
<h1 className="text-3xl font-bold text-foreground">
  Client Portfolio
</h1>

// Section heading
<h2 className="text-2xl font-semibold text-foreground">
  Investment Holdings
</h2>

// Subsection heading
<h3 className="text-lg font-medium text-foreground">
  Recent Transactions
</h3>

// Body text
<p className="text-sm text-foreground">
  Portfolio details...
</p>

// Helper text
<span className="text-xs text-muted-foreground">
  Last updated 5 minutes ago
</span>
```

---

## Best Practices

### Do's ✅

1. **Use semantic colors appropriately:**
   - Success for positive outcomes
   - Warning for caution
   - Destructive for errors/losses
   - Info for neutral information

2. **Maintain consistent spacing:**
   - Use Tailwind spacing scale (4, 8, 12, 16, 24, 32px)
   - Keep padding and margins consistent

3. **Follow mobile-first design:**
   - Design for small screens first
   - Enhance for larger breakpoints

4. **Test accessibility:**
   - Verify contrast ratios
   - Test with screen readers
   - Ensure keyboard navigation works

### Don'ts ❌

1. **Don't use colors inconsistently:**
   - Avoid using success colors for errors
   - Don't use destructive colors for positive actions

2. **Don't rely solely on color:**
   - Always include text labels
   - Use icons to reinforce meaning
   - Provide alternative indicators (e.g., icons + color)

3. **Don't override theme colors directly:**
   - Use CSS variables, not hardcoded hex values
   - Maintain dark mode compatibility

4. **Don't create low-contrast combinations:**
   - Always test readability
   - Use foreground variants with colored backgrounds

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
**Status:** Active
