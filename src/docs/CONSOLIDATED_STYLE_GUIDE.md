# Spork Consolidated Style Guide

Complete styling reference for the Spork application combining site-wide patterns and chat-specific styling.

---

## Table of Contents
1. [Design System Tokens](#design-system-tokens)
2. [Page Layout](#page-layout)
3. [UI Components](#ui-components)
4. [Chat Interface](#chat-interface)
5. [Typography](#typography)
6. [Icons & Branding](#icons--branding)

---

## Design System Tokens

### Color Variables (HSL-based)
Always use semantic tokens, never raw colors.

```css
/* Core */
--background        /* Page backgrounds */
--foreground        /* Primary text */
--heading           /* H1/H2 headings: #464646 */

/* UI Elements */
--card              /* Card backgrounds */
--card-foreground   /* Card text */
--border            /* All borders */
--muted             /* Muted backgrounds */
--muted-foreground  /* Secondary text */

/* Interactive */
--primary           /* Brand/action color */
--primary-foreground
--secondary
--secondary-foreground
--accent            /* Hover states, active states */
--accent-foreground

/* Status */
--destructive       /* Errors, delete actions */
--destructive-foreground
```

### Tailwind Usage
```tsx
// ✅ CORRECT - Semantic tokens
className="bg-background text-foreground border-border"
className="text-muted-foreground"
className="bg-primary text-primary-foreground"

// ❌ WRONG - Raw colors
className="bg-white text-black"
className="text-gray-500"
className="bg-blue-600 text-white"
```

---

## Page Layout

### Standard Container
```tsx
<div className="container mx-auto max-w-7xl px-6 py-6">
  {/* Page content */}
</div>
```

### Header Bar with Controls
```tsx
<div className="flex items-center justify-between gap-4 mb-6 border-b border-border pb-4">
  <h1 className="text-2xl font-roboto-slab">Page Title</h1>
  <div className="flex items-center gap-2">
    {/* Filter, search, view toggles */}
  </div>
</div>
```

### Content Grids
```tsx
// Standard responsive grid
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {/* Grid items */}
</div>
```

### Full-Height Table Layout
```tsx
<div className="h-full flex flex-col">
  <div className="flex-shrink-0">{/* Header */}</div>
  <div className="flex-1 overflow-auto">{/* Scrollable content */}</div>
  <div className="flex-shrink-0">{/* Pagination */}</div>
</div>
```

---

## UI Components

### Tab Buttons (Pill Style)
```tsx
<button className={cn(
  "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
  isActive 
    ? "bg-primary text-primary-foreground border-primary" 
    : "bg-background text-foreground border-border hover:bg-accent"
)}>
  Tab Name
</button>
```

### Filter Dropdown (Select)
```tsx
<Select>
  <SelectTrigger className="w-auto min-w-[140px] rounded-full border-border">
    <SelectValue placeholder="Filter" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Items</SelectItem>
  </SelectContent>
</Select>
```

### Grid/List View Toggle
```tsx
<div className="flex items-center rounded-full border border-border overflow-hidden">
  <Button 
    variant="ghost" 
    size="sm" 
    className={cn("rounded-none", viewMode === 'grid' && "bg-accent")}
  >
    <LayoutGrid className="h-4 w-4" />
  </Button>
  <Button 
    variant="ghost" 
    size="sm" 
    className={cn("rounded-none", viewMode === 'list' && "bg-accent")}
  >
    <List className="h-4 w-4" />
  </Button>
</div>
```

### Search Input
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input 
    placeholder="Search..." 
    className="pl-9 w-64 rounded-full border-border"
  />
</div>
```

### Cards
```tsx
<div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
  <div className="p-4">
    {/* Card content */}
  </div>
</div>

// Card with header
<div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
  <div className="flex items-center justify-between border-b border-border p-4">
    <h3 className="font-medium">Card Title</h3>
    <Button variant="ghost" size="sm">Action</Button>
  </div>
  <div className="p-4">
    {/* Content */}
  </div>
</div>
```

### Activity Row Items
```tsx
<div className="flex items-start gap-3 p-4 hover:bg-muted/50 border-b border-border last:border-0">
  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
    <Icon className="h-4 w-4 text-muted-foreground" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">Activity Title</p>
    <p className="text-xs text-muted-foreground">Description</p>
  </div>
  <span className="text-xs text-muted-foreground whitespace-nowrap">2h ago</span>
</div>
```

### Empty States
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium mb-2">No items yet</h3>
  <p className="text-sm text-muted-foreground max-w-sm">
    Description of what to do next.
  </p>
</div>
```

### Loading States
```tsx
// Spinner
<div className="flex items-center justify-center p-8">
  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
</div>

// Skeleton grid
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {Array.from({ length: 10 }).map((_, i) => (
    <Skeleton key={i} className="h-32 rounded-xl" />
  ))}
</div>
```

---

## Chat Interface

### Container Width
```tsx
// Optimal reading width for chat
<div className="max-w-[920px] mx-auto">
  {/* Messages */}
</div>
```

### Message Layout
```tsx
// User message
<div className="flex justify-end">
  <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%]">
    <p className="text-sm">{content}</p>
  </div>
</div>

// Assistant message
<div className="flex justify-start">
  <div className="border border-border rounded-2xl px-4 py-3 max-w-[85%]">
    <div className="prose-chat">{content}</div>
  </div>
</div>
```

### Prose Chat Typography (index.css)
```css
.prose-chat {
  font-size: 15px;
  line-height: 1.7;
  color: hsl(var(--foreground));
}

/* Bold text - bold only, never blue */
.prose-chat strong {
  font-weight: 700;
  color: inherit;
}

/* Headers */
.prose-chat h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
.prose-chat h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
.prose-chat h3 { font-size: 1.1rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.prose-chat h4 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }

/* Paragraphs */
.prose-chat p {
  margin: 0.75rem 0;
}

/* Lists */
.prose-chat ul, .prose-chat ol {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}
.prose-chat li {
  margin: 0.625rem 0; /* gap-2.5 equivalent */
}

/* Code */
.prose-chat code {
  background: hsl(var(--muted));
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
}
.prose-chat pre {
  background: hsl(var(--muted));
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}
.prose-chat pre code {
  background: none;
  padding: 0;
}

/* Blockquotes */
.prose-chat blockquote {
  border-left: 3px solid hsl(var(--border));
  padding-left: 1rem;
  margin: 1rem 0;
  color: hsl(var(--muted-foreground));
  font-style: italic;
}

/* Callout boxes (recommendations/summaries) */
.prose-chat .callout,
.prose-chat > div[class*="bg-"] {
  background: hsl(var(--muted) / 0.5);
  border-left: 3px solid hsl(var(--border));
  padding: 0.75rem 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  margin: 1rem 0;
}

/* Links */
.prose-chat a {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Horizontal rules */
.prose-chat hr {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin: 1.5rem 0;
}

/* Tables */
.prose-chat table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}
.prose-chat th, .prose-chat td {
  border: 1px solid hsl(var(--border));
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.prose-chat th {
  background: hsl(var(--muted));
  font-weight: 600;
}
```

### Thinking Indicator
```tsx
<div className="border border-border rounded-xl bg-muted/30 px-4 py-3">
  <div className="flex items-center gap-2 text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span className="text-sm">Thinking...</span>
  </div>
</div>
```

### Message Actions
```tsx
// Clean row without dividers
<div className="flex items-center gap-1 mt-2">
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <Copy className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <Save className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <ThumbsUp className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <ThumbsDown className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <RefreshCw className="h-4 w-4" />
  </Button>
</div>
```

### Cosmo Attribution
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
  <CosmoLogo className="h-4 w-4" />
  <span>Cosmo Ai selected <strong>{modelName}</strong> for {category}</span>
</div>
```

---

## Typography

### Section Titles
```tsx
<h2 className="text-2xl font-roboto-slab font-medium">Section Title</h2>
```

### Heading Colors
```tsx
// Default headings (automatic via CSS)
<h1>Uses --heading color (#464646)</h1>
<h2>Uses --heading color (#464646)</h2>

// Exception: white text on dark backgrounds
<h1 className="heading-light">White heading</h1>

// Force default when needed
<h1 className="heading-default">Force default color</h1>
```

---

## Icons & Branding

### Icon Sizing Standards
| Context | Size | Tailwind |
|---------|------|----------|
| Inline text | 16px | `h-4 w-4` |
| Buttons | 16px | `h-4 w-4` |
| Cards/Rows | 20px | `h-5 w-5` |
| Activity icons | 16px | `h-4 w-4` |
| Empty states | 48px | `h-12 w-12` |
| Featured icons | 24px | `h-6 w-6` |

### Activity Icon Colors
```tsx
// By action type
created → text-green-500
updated → text-blue-500
deleted → text-red-500
sent → text-purple-500
generated → text-orange-500
```

### Branding Rules
- **Brand name**: "Ai" with lowercase "i" (never "AI")
- **Icons**: Lucide icons only, NO emojis ever
- **Featured items**: `text-yellow-500` star indicator
- **Font**: Roboto Slab for section titles

---

## View Mode Persistence

```tsx
const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
  return localStorage.getItem('pageName-view') as 'grid' | 'list' || 'grid';
});

useEffect(() => {
  localStorage.setItem('pageName-view', viewMode);
}, [viewMode]);
```

---

## Quick Reference

### Common Patterns
```tsx
// Rounded pill buttons
"rounded-full"

// Standard border
"border border-border"

// Muted backgrounds
"bg-muted" or "bg-muted/50"

// Card shadows
"shadow-sm"

// Hover states
"hover:bg-accent" or "hover:bg-muted/50"

// Transitions
"transition-colors"

// Truncate text
"truncate" or "line-clamp-2"
```

### Spacing Scale
- `gap-1` / `p-1` = 4px
- `gap-2` / `p-2` = 8px
- `gap-3` / `p-3` = 12px
- `gap-4` / `p-4` = 16px
- `gap-6` / `p-6` = 24px
- `gap-8` / `p-8` = 32px
