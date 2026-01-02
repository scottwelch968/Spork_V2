# 09 - Style System Authority

> **Status**: NON-NEGOTIABLE  
> **Effective**: Immediately  
> **Supersedes**: All prior styling instructions, Lovable defaults, generic shadcn defaults

---

## Purpose

This document establishes Spork's custom design system as the **single source of truth** for all styling decisions. No deviation is permitted.

---

## 1. Single Source of Truth

### Token Authority
- All colors MUST be semantic tokens defined in `src/index.css` + `tailwind.config.ts`
- All tokens MUST use HSL format only
- **Never use direct colors in components** (no `#hex`, no `rgb()`, no hardcoded `hsl()`)

### Style Sources (in order of authority)
1. `src/index.css` - CSS variables and token definitions
2. `tailwind.config.ts` - Theme configuration
3. `src/user/ui/styles/globals.css` - Global base styles
4. `src/user/ui/styles/components.css` - Component class definitions
5. `cva` variants in component files - Component-level variants

### What Drives Styling
- Tailwind theme tokens
- CSS variables
- `cva` variants (for components)
- Shared utility classes

---

## 2. No Reversion Rule

### Prohibited Actions
If you (the AI) are about to introduce a style that resembles Lovable defaults or overwrites custom tokens with defaults, **STOP and do not proceed**.

Never reintroduce "Lovable default" styling via:
- New global CSS resets
- Duplicate token definitions
- Component-local hardcoded colors
- Importing old theme files back into active usage
- `!important` overrides to fix conflicts (fix the source instead)

### When in Doubt
If you cannot determine which style is canonical, **stop and ask** rather than guessing.

---

## 3. Safe Default Until Overwrite

The current style guide remains in effect as-is until the user explicitly says:
- "Overwrite the style guide"
- "Commit new style vX"

When the user does this, treat it as a **Style Migration Event**.

---

## 4. Style Migration Event Requirements

When the user requests a style guide overwrite/commit, you MUST complete ALL of the following:

### A) What Changed
Summarize the new tokens (colors, typography, radii, shadows) and which components/variants are affected.

### B) Why
State the reason: "User requested a new style guide; prior styles must be treated as legacy to prevent conflicts."

### C) Files Modified (exact paths)
Update only the canonical style sources:
- `src/index.css`
- `tailwind.config.ts`
- `src/user/ui/styles/globals.css`
- `src/user/ui/styles/components.css`
- `src/components/ui/*` only as needed to map variants to tokens

### D) Deletions / Quarantine (mandatory)
- Identify ALL prior/competing stylesheets/themes
- Move them to `src/styles/legacy/`
- Remove their imports from the application
- Ensure exactly ONE active styling pipeline
- Delete orphaned styles and dead token sets

### E) Apply Globally (no partial rollouts)
Update existing components to use the new tokens/variants:
- Replace any hardcoded classes with semantic equivalents
- Ensure all previous classes map to the new design language
- No scattered overrides

### F) Verification Plan
Provide a checklist:
- [ ] Search for hardcoded colors in components (`#`, `rgb`, `hsl(` outside tokens) and remove them
- [ ] Confirm only one global stylesheet is imported
- [ ] Confirm buttons/inputs/cards/typography match the new style across core pages
- [ ] Confirm no visual regression from legacy CSS collisions

---

## 5. Conflict Prevention Rules

### Absolute Prohibitions
- Do NOT create a second theme system "just in case"
- Do NOT leave both old and new tokens active
- Do NOT mix legacy classnames with new token definitions
- Do NOT use `!important` to fix style conflicts (fix the source)

### Resolution Process
If conflicting sources exist and you cannot determine which is canonical:
1. STOP
2. ASK the user which is authoritative
3. Do NOT guess or create workarounds

---

## 6. Component-Level Rules

### Components Must Only Use
- Semantic Tailwind tokens
- `cva` variants
- Shared utility classes from `src/user/ui/styles/components.css`

### Prohibited Patterns
- No one-off styling in random pages to "make it look right"
- No inline style overrides
- No component-local color definitions
- If something doesn't look right, fix the tokens/variants instead

---

## 7. Acceptance Criteria

Before finishing any styling work, verify:

- [ ] Exactly ONE active design system (tokens + theme + variants)
- [ ] Legacy styling moved to `/legacy/` and NOT imported
- [ ] No direct colors in components
- [ ] Any style guide overwrite includes the A-F change report format
- [ ] All button variants are self-contained (no base style conflicts)
- [ ] All tab variants are self-contained
- [ ] No `!important` hacks anywhere

---

## 8. File Structure

### Active Style Pipeline
```
src/
├── index.css                          # Token definitions + imports
├── user/
│   └── ui/
│       └── styles/
│           ├── globals.css            # Base element styles
│           └── components.css         # Component class definitions
└── components/
    └── ui/
        └── *.tsx                      # cva variants referencing tokens
```

### Quarantine Location
```
src/
└── styles/
    └── legacy/                        # Old/deprecated styles (NOT imported)
```

---

## Cross-References

- [04-UX-DESIGN-GUIDES.md](./04-UX-DESIGN-GUIDES.md) - Design patterns and branding
- [07-LAYER-ARCHITECTURE.md](./07-LAYER-ARCHITECTURE.md) - Presentation layer responsibilities
- [08-TERMINOLOGY-GUIDE.md](./08-TERMINOLOGY-GUIDE.md) - Correct terminology for style elements
