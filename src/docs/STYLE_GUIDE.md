# Spork UI Style Guide

> Comprehensive styling documentation derived from the current Spork application codebase. Follow these patterns to maintain consistency across all pages and components.

---

## Table of Contents

1. [Page Container & Layout](#page-container--layout)
2. [Header Bar Layout](#header-bar-layout)
3. [Tab Buttons (Pill Style)](#tab-buttons-pill-style)
4. [Filter Dropdown (Select)](#filter-dropdown-select)
5. [Grid/List View Toggle](#gridlist-view-toggle)
6. [Search Input](#search-input)
7. [Content Grids](#content-grids)
8. [Table Styling](#table-styling)
9. [Cards & Containers](#cards--containers)
10. [Activity Row Items](#activity-row-items)
11. [Section Titles](#section-titles)
12. [Empty States](#empty-states)
13. [Icon Sizing Standards](#icon-sizing-standards)
14. [Color Tokens](#color-tokens)
15. [View Mode Persistence](#view-mode-persistence)
16. [Loading States](#loading-states)

---

## Page Container & Layout

All pages use a consistent container structure:

```tsx
<div className="container mx-auto max-w-7xl px-6 py-6">
  {/* Page content */}
</div>
```

**Alternative (when using `p-6`):**
```tsx
<div className="container mx-auto max-w-7xl p-6">
  {/* Page content */}
</div>
```

---

## Header Bar Layout

Headers with filter controls use this structure:

```tsx
<div className="flex items-center justify-between mb-6 border-b border-border">
  {/* Left side: Tabs or Filter dropdown */}
  <div className="flex items-center gap-2 pb-2">
    {/* Tabs or primary filter */}
  </div>

  {/* Right side: View toggle + Search */}
  <div className="flex items-center gap-3 pb-2">
    {/* Grid/List toggle */}
    {/* Search input */}
  </div>
</div>
```

**Key points:**
- `pb-2` is applied to inner left/right containers, NOT the outer header
- Border is on the outer container without padding-bottom
- `mb-6` provides spacing below the header

---

## Tab Buttons (Pill Style)

Standard pill-style tab buttons:

```tsx
<TabsList className="bg-transparent p-0 h-auto gap-2">
  <TabsTrigger 
    value="tab-value"
    className="rounded-full border border-border bg-transparent hover:bg-accent px-4 py-2 text-sm text-[#181818] data-[state=active]:bg-accent data-[state=active]:text-[#181818] data-[state=active]:shadow-none flex items-center gap-2"
  >
    <Icon className="w-4 h-4" />
    Tab Label
  </TabsTrigger>
</TabsList>
```

**Complete class list:**
```
rounded-full 
border border-border 
bg-transparent 
hover:bg-accent 
px-4 py-2 
text-sm 
text-[#181818] 
data-[state=active]:bg-accent 
data-[state=active]:text-[#181818] 
data-[state=active]:shadow-none 
flex items-center gap-2
```

---

## Filter Dropdown (Select)

Pill-style select dropdowns:

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-auto rounded-full border border-border bg-transparent hover:bg-accent px-4 gap-2">
    <Star className="w-4 h-4" />
    <SelectValue placeholder="Filter" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="featured">Featured</SelectItem>
    <SelectItem value="popular">Popular</SelectItem>
    
    {/* Divider between sections */}
    <div className="h-px bg-border my-1" />
    
    <SelectItem value="category-1">Category 1</SelectItem>
    <SelectItem value="category-2">Category 2</SelectItem>
  </SelectContent>
</Select>
```

**Key points:**
- `w-auto` for natural width
- `rounded-full` for pill shape
- Use `<div className="h-px bg-border my-1" />` for dividers between sections

---

## Grid/List View Toggle

Oval-style toggle container:

```tsx
<div className="flex items-center border border-border rounded-full overflow-hidden">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setViewMode('grid')}
    className={`rounded-none px-3 h-9 ${viewMode === 'grid' ? 'bg-accent' : ''}`}
  >
    <LayoutGrid className="h-4 w-4" />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setViewMode('list')}
    className={`rounded-none px-3 h-9 ${viewMode === 'list' ? 'bg-accent' : ''}`}
  >
    <List className="h-4 w-4" />
  </Button>
</div>
```

**Key points:**
- Container has `rounded-full overflow-hidden`
- Buttons have `rounded-none` to fill container shape
- Active state uses `bg-accent`

---

## Search Input

Rounded search input with icon:

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10 w-64 rounded-full"
  />
</div>
```

**Key points:**
- `pl-10` for icon spacing
- `w-64` standard width
- `rounded-full` for pill shape

---

## Content Grids

Standard responsive grid:

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {items.map(item => (
    <Card key={item.id} />
  ))}
</div>
```

**Breakpoints:**
- Mobile: 2 columns
- Medium: 3 columns
- Large: 5 columns
- Gap: `gap-4` (1rem)

---

## Table Styling

Standard table structure:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Description</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {item.name}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground max-w-md truncate">
          {item.description}
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{item.category}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Cards & Containers

Activity/data cards:

```tsx
<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  {/* Card content */}
</div>
```

**Alternative with header:**
```tsx
<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
    <h3 className="font-medium">Section Title</h3>
    <Button variant="link">View all</Button>
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

---

## Activity Row Items

Standard activity row styling:

```tsx
<div className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0">
  {/* Icon container */}
  <div className="p-2 rounded-lg bg-blue-100">
    <Icon className="w-4 h-4 text-blue-600" />
  </div>
  
  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="font-medium truncate">{title}</p>
    <p className="text-sm text-muted-foreground truncate">{description}</p>
  </div>
  
  {/* Timestamp */}
  <span className="text-sm text-muted-foreground whitespace-nowrap">
    {timestamp}
  </span>
</div>
```

---

## Section Titles

Standard section title with "View all" link:

```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-2xl font-roboto-slab font-normal">Section Title</h2>
  <Button variant="link" className="text-primary">
    View all
  </Button>
</div>
```

**Key points:**
- `font-roboto-slab` for headings
- `font-normal` weight
- `text-2xl` size
- H2 color is applied globally via CSS (no need for color class)

---

## Heading Colors

All headings use CSS variables for consistent, maintainable colors.

**Default (auto-applied via CSS base layer):**
- H1 and H2 elements automatically use `--heading` color (#464646)
- No color class needed for standard headings

**Exception utility classes:**
| Class | Use Case |
|-------|----------|
| `heading-light` | White text on dark/gradient backgrounds |
| `heading-default` | Force default color when needed |

**CSS Variables (in index.css):**
```css
:root {
  --heading: 0 0% 27%;  /* #464646 */
  --heading-light: 0 0% 100%;  /* White */
}
```

**Examples:**
```tsx
// Standard heading (no color class needed - inherits from CSS)
<h1 className="text-2xl font-roboto-slab font-semibold">Page Title</h1>

// Heading on dark/gradient background
<h1 className="text-2xl font-roboto-slab font-semibold heading-light">Title on Dark BG</h1>

// Force default color when overriding is needed
<h2 className="text-lg font-semibold heading-default">Explicit Default</h2>
```

## Empty States

Centered empty state:

```tsx
<div className="flex flex-col items-center justify-center py-16">
  <Boxes className="h-20 w-20 text-muted-foreground/50 mb-6" />
  <h3 className="text-xl font-medium mb-2">No items found</h3>
  <p className="text-muted-foreground text-center max-w-md">
    Description text explaining why there are no items and what action to take.
  </p>
</div>
```

**Key points:**
- Icon: `h-20 w-20` with `text-muted-foreground/50`
- `mb-6` between icon and title
- `max-w-md` for description width

---

## Icon Sizing Standards

| Context | Size | Class |
|---------|------|-------|
| Inline with text | 16px | `w-4 h-4` |
| Button icons | 16px | `h-4 w-4` |
| Tab icons | 16px | `w-4 h-4` |
| Activity row icons | 16px | `w-4 h-4` |
| Card decorative icons | 20px | `w-5 h-5` |
| Empty state icons | 80px | `h-20 w-20` |
| Large featured icons | 32px | `w-8 h-8` |

---

## Color Tokens

Use semantic color tokens, never raw colors:

| Element | Token | Class |
|---------|-------|-------|
| Primary text | foreground | `text-foreground` |
| Secondary text | muted-foreground | `text-muted-foreground` |
| Borders | border | `border-border` |
| Hover backgrounds | accent | `bg-accent` / `hover:bg-accent` |
| Primary actions | primary | `bg-primary` / `text-primary` |
| Backgrounds | background | `bg-background` |
| Card backgrounds | card | `bg-card` |
| Muted backgrounds | muted | `bg-muted` |

**Activity icon colors by type:**
- Chat: `bg-blue-100 text-blue-600`
- Files: `bg-green-100 text-green-600`
- Tasks: `bg-purple-100 text-purple-600`
- Members: `bg-orange-100 text-orange-600`
- Settings: `bg-gray-100 text-gray-600`

---

## View Mode Persistence

Store view preferences in localStorage:

```tsx
const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
  return (localStorage.getItem('page-name-view-mode') as 'grid' | 'list') || 'grid';
});

useEffect(() => {
  localStorage.setItem('page-name-view-mode', viewMode);
}, [viewMode]);
```

**Naming convention:** `{page-name}-view-mode`
- `app-store-view-mode`
- `spaces-view-mode`
- `files-view-mode`

---

## Loading States

**Spinner:**
```tsx
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
</div>
```

**Skeleton grid:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {[...Array(10)].map((_, i) => (
    <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
  ))}
</div>
```

---

## Branding Notes

- **"Ai" spelling:** Use lowercase "i" in "Ai" for brand consistency
- **Icons:** Use outline icons only, no filled/solid icons
- **Font families:**
  - Headings: `font-roboto-slab`
  - Body: Default sans (Roboto)
  - Code: `font-mono` (JetBrains Mono)

---

*Last updated: December 2024*
