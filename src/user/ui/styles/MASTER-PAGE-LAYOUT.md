# Master Page Layout Standard
**Based on: Spaces page (/workspace)**
**Status: LOCKED - No deviations without explicit approval**

---

## Page Container
```css
container mx-auto pt-[54px] px-6 pb-6 max-w-7xl
```
| Property | Value | Notes |
|----------|-------|-------|
| Top padding | 54px | Accounts for 48px TopBar + 6px spacing |
| Side padding | 24px | px-6 |
| Bottom padding | 24px | pb-6 |
| Max width | 1280px | max-w-7xl |
| Centering | mx-auto | Centers container |

---

## Tab List Section

### Tab Wrapper
```css
flex items-center justify-between mb-0
```
- Flex container with space-between alignment
- No bottom margin (border handles spacing)

### Tab Component
- Variant: `variant="underline"`
- Individual tabs handle their own styling

### Tab Divider Border
```css
border-b border-[#ACACAC] mb-[34px]
```
| Property | Value | Notes |
|----------|-------|-------|
| Border bottom | 1px solid #ACACAC | Subtle gray divider |
| Bottom margin | 34px | Space before content |

---

## Content Start
- Content begins 34px below tab underline border
- TabsContent: `mt-0` (margin handled by divider)

---

## TopBar Dynamic Actions (Search + Create Button)

### Position
- Right side of TopBar
- Only visible on pages with search/create functionality

### Container
```css
flex items-center gap-3
```

### Search Bar
- Width: `w-[170px]`
- Uses TopBarSearchBar component

### Create Button
- Variant: `variant="topbar"`
- Icon + text pattern

---

## CSS Class Reference

| Class | Purpose |
|-------|---------|
| `.ui-page-container` | Main page wrapper |
| `.ui-tab-wrapper` | Tab list container |
| `.ui-tab-divider` | Border + spacing below tabs |
| `.ui-topbar-actions` | Search + button container |

---

## Usage Example

```tsx
<div className="ui-page-container">
  <Tabs>
    <div className="ui-tab-wrapper ui-tab-divider">
      <TabsList variant="underline">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
    </div>
    <TabsContent value="tab1" className="mt-0">
      {/* Content */}
    </TabsContent>
  </Tabs>
</div>
```
