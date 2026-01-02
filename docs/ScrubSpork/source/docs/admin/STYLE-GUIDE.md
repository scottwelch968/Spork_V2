# Admin Design System - Complete Style Guide

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Isolation Level:** 100% independent from user-facing styles

## Overview

The Admin Design System is a completely isolated styling system for the administrative interface. It uses the original professional shadcn styling, providing a clean, professional appearance distinct from the user-facing Perplexity-inspired design.

---

## Design Philosophy

- **Professional & Clean**: Light backgrounds, subtle shadows, clear typography
- **Dense & Efficient**: Compact spacing for data-heavy interfaces
- **Consistent**: Single source of truth for all admin components
- **Isolated**: No style leakage from or to user-facing application

---

## File Structure

```
src/admin/
├── styles/
│   └── admin-theme.css      # CSS variables (design tokens)
├── lib/
│   └── utils.ts             # Admin utility functions (cn, formatters)
└── ui/
    ├── index.ts             # Barrel exports (ONLY import from here)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── select.tsx
    ├── checkbox.tsx
    ├── switch.tsx
    ├── radio-group.tsx
    ├── slider.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── dialog.tsx
    ├── alert-dialog.tsx
    ├── popover.tsx
    ├── tooltip.tsx
    ├── toast.tsx
    ├── toaster.tsx
    ├── badge.tsx
    ├── label.tsx
    ├── separator.tsx
    ├── scroll-area.tsx
    ├── calendar.tsx
    ├── progress.tsx
    └── collapsible.tsx
```

---

## Color System

### Base Colors

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-bg` | `--admin-bg` | `0 0% 100%` (white) | Main background |
| `admin-bg-elevated` | `--admin-bg-elevated` | `0 0% 100%` | Cards, modals |
| `admin-bg-muted` | `--admin-bg-muted` | `210 40% 96.1%` | Muted backgrounds |
| `admin-bg-subtle` | `--admin-bg-subtle` | `210 40% 96.1%` | Subtle sections |

### Text Colors

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-text` | `--admin-text` | `222.2 84% 4.9%` (dark navy) | Primary text |
| `admin-text-muted` | `--admin-text-muted` | `215.4 16.3% 46.9%` | Secondary text |
| `admin-text-subtle` | `--admin-text-subtle` | `215.4 16.3% 46.9%` | Placeholder text |

### Border Colors

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-border` | `--admin-border` | `214.3 31.8% 91.4%` | Default borders |
| `admin-border-muted` | `--admin-border-muted` | `214.3 31.8% 91.4%` | Subtle borders |
| `admin-border-focus` | `--admin-border-focus` | `222.2 84% 4.9%` | Focus rings |

### Accent Colors

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-accent` | `--admin-accent` | `222.2 47.4% 11.2%` (dark navy) | Primary actions |
| `admin-accent-hover` | `--admin-accent-hover` | `222.2 47.4% 15%` | Hover state |
| `admin-accent-muted` | `--admin-accent-muted` | `210 40% 96.1%` | Subtle accent |

### Status Colors

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-success` | `--admin-success` | `142 71% 45%` | Success states |
| `admin-warning` | `--admin-warning` | `38 92% 50%` | Warning states |
| `admin-error` | `--admin-error` | `0 84.2% 60.2%` | Error/destructive |
| `admin-info` | `--admin-info` | `217.2 91.2% 59.8%` | Information |

### Sidebar Colors

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-sidebar-bg` | `--admin-sidebar-bg` | `0 0% 98%` | Sidebar background |
| `admin-sidebar-text` | `--admin-sidebar-text` | `240 5.3% 26.1%` | Sidebar text |
| `admin-sidebar-accent` | `--admin-sidebar-accent` | `240 4.8% 95.9%` | Selected item bg |
| `admin-sidebar-border` | `--admin-sidebar-border` | `220 13% 91%` | Sidebar dividers |
| `admin-sidebar-hover` | `--admin-sidebar-hover` | `240 4.8% 94%` | Hover state |

---

## Typography

### Font Family

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Sizes

| Token | CSS Variable | Size | Usage |
|-------|--------------|------|-------|
| `admin-font-xs` | `--admin-font-xs` | `0.75rem` (12px) | Small labels, badges |
| `admin-font-sm` | `--admin-font-sm` | `0.875rem` (14px) | Body text |
| `admin-font-base` | `--admin-font-base` | `1rem` (16px) | Standard text |
| `admin-font-lg` | `--admin-font-lg` | `1.125rem` (18px) | Subheadings |
| `admin-font-xl` | `--admin-font-xl` | `1.25rem` (20px) | Section titles |
| `admin-font-2xl` | `--admin-font-2xl` | `1.5rem` (24px) | Page titles |

### Component-Specific Typography

- **Buttons**: `text-xs` (12px), `font-medium`
- **Labels**: `text-xs` (12px), `font-medium`
- **Inputs**: `text-xs` (12px)
- **Table Headers**: `text-[11px]`, `font-semibold`, `uppercase`, `tracking-wide`
- **Table Cells**: `text-xs` (12px)
- **Card Titles**: `text-sm` (14px), `font-semibold`
- **Card Descriptions**: `text-xs` (12px)
- **Badges**: `text-[10px]`, `font-semibold`, `uppercase`
- **Dialog Titles**: `text-sm` (14px), `font-semibold`
- **Toast Titles**: `text-xs` (12px), `font-semibold`

---

## Spacing

### Spacing Scale

| Token | CSS Variable | Size | Usage |
|-------|--------------|------|-------|
| `admin-space-xs` | `--admin-space-xs` | `0.25rem` (4px) | Tight spacing |
| `admin-space-sm` | `--admin-space-sm` | `0.5rem` (8px) | Small gaps |
| `admin-space-md` | `--admin-space-md` | `0.75rem` (12px) | Medium gaps |
| `admin-space-lg` | `--admin-space-lg` | `1rem` (16px) | Standard spacing |
| `admin-space-xl` | `--admin-space-xl` | `1.5rem` (24px) | Section spacing |
| `admin-space-2xl` | `--admin-space-2xl` | `2rem` (32px) | Page spacing |

### Component Padding

- **Buttons**: `px-3 py-1` (xs), `px-3` (sm), `px-4 py-1.5` (default)
- **Inputs**: `px-2.5 py-1`
- **Cards**: `p-4` header/content, `p-3` footer
- **Dialogs**: `p-4`
- **Popovers**: `p-3`
- **Table Cells**: `px-3 py-2`
- **Badges**: `px-1.5 py-0.5`

---

## Border Radius

| Token | CSS Variable | Size | Usage |
|-------|--------------|------|-------|
| `admin-radius-sm` | `--admin-radius-sm` | `4px` | Small elements |
| `admin-radius-md` | `--admin-radius-md` | `6px` | Default |
| `admin-radius-lg` | `--admin-radius-lg` | `8px` | Cards, dialogs |

### Component Border Radius

- **Buttons**: `rounded` (4px default), `rounded-sm` for small
- **Inputs**: `rounded` (4px)
- **Cards**: `rounded-md` (6px)
- **Dialogs**: `rounded-md` (6px)
- **Badges**: `rounded` (4px)
- **Switches**: `rounded-full`
- **Progress Bars**: `rounded-full`

---

## Shadows

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `admin-shadow-sm` | `--admin-shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle depth |
| `admin-shadow-md` | `--admin-shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Cards |
| `admin-shadow-lg` | `--admin-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals |

---

## Transitions

| Token | CSS Variable | Duration | Usage |
|-------|--------------|----------|-------|
| `admin-transition-fast` | `--admin-transition-fast` | `150ms ease` | Hover states |
| `admin-transition-normal` | `--admin-transition-normal` | `200ms ease` | Standard transitions |
| `admin-transition-slow` | `--admin-transition-slow` | `300ms ease` | Complex animations |

---

## Component Heights

Consistent heights across interactive elements:

| Component | Height | Tailwind Class |
|-----------|--------|----------------|
| Button (xs) | `24px` | `h-6` |
| Button (sm) | `28px` | `h-7` |
| Button (default) | `32px` | `h-8` |
| Button (lg) | `40px` | `h-10` |
| Input | `32px` | `h-8` |
| Select Trigger | `32px` | `h-8` |
| Checkbox | `16px` | `h-4 w-4` |
| Switch | `16px` | `h-4 w-7` |
| Radio | `16px` | `h-4 w-4` |

---

## Components

### Button

```tsx
import { Button } from '@/admin/ui';

// Variants
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="xs">Tiny</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Loading state
<Button loading>Processing...</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/admin/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Form Fields

```tsx
import { Input, Textarea, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui';

// Input
<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>

// Textarea
<div>
  <Label htmlFor="bio">Bio</Label>
  <Textarea id="bio" placeholder="Enter bio" />
</div>

// Select
<div>
  <Label>Status</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Table

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/admin/ui';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item Name</TableCell>
      <TableCell><Badge>Active</Badge></TableCell>
      <TableCell><Button size="xs">Edit</Button></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badge

```tsx
import { Badge } from '@/admin/ui';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
```

### Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/admin/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description text.</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Alert Dialog

```tsx
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/admin/ui';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Tailwind Usage

### Using Admin Colors

With tailwind.config.ts properly configured, you can use admin colors directly:

```tsx
// Background colors
<div className="bg-admin-bg" />
<div className="bg-admin-bg-elevated" />
<div className="bg-admin-bg-muted" />
<div className="bg-admin-hover" />

// Text colors
<p className="text-admin-text" />
<p className="text-admin-text-muted" />

// Border colors
<div className="border border-admin-border" />
<div className="border border-admin-border-muted" />

// Status colors
<span className="text-admin-success" />
<span className="text-admin-warning" />
<span className="text-admin-error" />
<span className="text-admin-info" />

// Sidebar colors
<aside className="bg-admin-sidebar-bg text-admin-sidebar-text" />

// Chart colors
<div className="bg-admin-chart-1" />
```

### Inline HSL Reference

If you need to reference CSS variables directly (e.g., for complex styling):

```tsx
<div className="bg-[hsl(var(--admin-bg))]" />
<div className="text-[hsl(var(--admin-text))]" />
<div className="border-[hsl(var(--admin-border))]" />
```

---

## Utility Functions

Located in `src/admin/lib/utils.ts`:

```tsx
import { cn, formatAdminDate, formatAdminDateTime, formatAdminNumber, formatAdminCurrency, formatAdminPercent, truncateText, formatBytes, formatDuration, shortId, copyToClipboard } from '@/admin/lib/utils';

// Class name merging
cn("base-class", condition && "conditional-class", className)

// Date formatting
formatAdminDate(new Date())           // "Dec 15, '24"
formatAdminDateTime(new Date())       // "Dec 15, 10:30 AM"
formatAdminRelativeTime(new Date())   // "5m ago"

// Number formatting
formatAdminNumber(1234567)            // "1.2M"
formatAdminCurrency(99.99)            // "$99.99"
formatAdminPercent(75.5)              // "75.5%"

// Text utilities
truncateText("Long text...", 20)      // "Long text..."
shortId("abc123-def456-ghi789")       // "abc123-d"

// Size formatting
formatBytes(1024)                     // "1 KB"
formatDuration(65000)                 // "1m 5s"

// Clipboard
await copyToClipboard("text")         // true/false
```

---

## Import Rules

### ALWAYS Import From Barrel

```tsx
// ✅ CORRECT - Always import from admin/ui
import { Button, Card, Input, Table } from '@/admin/ui';

// ❌ WRONG - Never import from @/components/ui in admin code
import { Button } from '@/components/ui/button';

// ❌ WRONG - Never import individual files
import { Button } from '@/admin/ui/button';
```

### Why This Matters

1. **Style Isolation**: User components have different styling
2. **Consistency**: All admin components share the same design tokens
3. **Maintainability**: Single point of updates for admin styling
4. **Bundle Optimization**: Proper tree-shaking with barrel exports

---

## Chart Colors

For data visualizations:

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `admin-chart-1` | `--admin-chart-1` | Primary data series |
| `admin-chart-2` | `--admin-chart-2` | Secondary data series |
| `admin-chart-3` | `--admin-chart-3` | Tertiary data series |
| `admin-chart-4` | `--admin-chart-4` | Fourth data series |
| `admin-chart-5` | `--admin-chart-5` | Fifth data series |

---

## Best Practices

### 1. Consistent Component Usage

Always use admin UI components, never user-facing ones.

### 2. Spacing Consistency

Use the spacing scale for all margins and padding.

### 3. Typography Hierarchy

Follow the established font size hierarchy for visual consistency.

### 4. Status Color Usage

- **Success**: Positive actions, completed states
- **Warning**: Caution, pending actions
- **Error**: Destructive actions, failed states
- **Info**: Neutral informational content

### 5. Interactive States

All interactive elements should have:
- Hover state (`hover:`)
- Focus state (`focus-visible:`)
- Disabled state (`disabled:`)

### 6. Accessibility

- Maintain 4.5:1 contrast ratio for text
- Use `focus-visible` for keyboard navigation
- Include `sr-only` labels where needed

---

## Migration Notes

If updating from previous admin styling:

1. Update all imports to use `@/admin/ui`
2. Remove any direct imports from `@/components/ui`
3. Replace inline colors with admin design tokens
4. Update any custom components to use admin CSS variables

---

## Version History

- **1.0** (Dec 2024): Initial complete style guide with full component library
