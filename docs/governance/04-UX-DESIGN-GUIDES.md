# UX & Design Guides

## Scope

**Advisory only.** May not influence COSMO, DB, or edge architecture.

---

## Branding

- No emojis
- Lucide icons only
- Brand name is "Ai" with lowercase "i" (never "AI")

## Layout Standards

- Page container: `container mx-auto max-w-7xl px-6`
- Full-height flex tables
- Consistent spacing tokens

## Chat UX

- Top-start scroll behavior is canonical
- Floating input is viewport-fixed sibling
- New messages appear at top of page

## Color System

- Use semantic tokens from `index.css` and `tailwind.config.ts`
- All colors must be HSL
- Never use direct colors in components

## Components

- Create focused, reusable components
- Use cva for variants
- Follow shadcn patterns
