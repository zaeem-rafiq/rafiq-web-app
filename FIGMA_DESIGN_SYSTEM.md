# Figma Design System Rules — Rafiq Web App

This document defines the design system structure for integrating Figma designs into the Rafiq codebase using the Model Context Protocol (MCP).

---

## 1. Token Definitions

### Location
Design tokens are defined in two places:
- **CSS Variables:** `src/index.css` (`:root` block)
- **Tailwind Extensions:** `tailwind.config.ts`

### Token Format (HSL)
All color tokens use HSL format without the `hsl()` wrapper:
```css
--primary: 157 48% 20%;  /* Forest green */
--gold: 42 35% 59%;      /* Brand gold */
```

Referenced in Tailwind via `hsl(var(--token-name))`.

### Core Color Tokens

| Token | HSL Value | Hex Approx | Usage |
|-------|-----------|------------|-------|
| `--primary` | `157 48% 20%` | `#1B4D3E` | Primary actions, CTA buttons |
| `--secondary` | `157 30% 26%` | `#2D5A3D` | Secondary buttons |
| `--forest` | `157 48% 20%` | `#1B4D3E` | Brand primary green |
| `--forest-light` | `157 30% 26%` | `#2D5A3D` | Lighter forest variant |
| `--forest-dark` | `157 50% 14%` | `#123829` | Dark forest variant |
| `--gold` | `42 35% 59%` | `#C9A962` | Accent, premium elements |
| `--cream` | `30 33% 97%` | `#FAF8F5` | Background |
| `--cream-dark` | `30 15% 93%` | `#EDEBE8` | Muted backgrounds |
| `--sage` | `160 33% 26%` | `#2C5547` | Secondary green |

### Semantic Color Tokens

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `30 33% 97%` | Page background (cream) |
| `--foreground` | `0 0% 17%` | Primary text (charcoal) |
| `--card` | `0 0% 100%` | Card backgrounds (white) |
| `--muted` | `30 15% 93%` | Muted backgrounds |
| `--muted-foreground` | `0 0% 45%` | Secondary text |
| `--border` | `30 10% 89%` | Borders, dividers |
| `--destructive` | `0 72% 51%` | Errors, delete actions |
| `--halal` | `157 50% 40%` | Compliant stocks (green) |
| `--haram` | `0 72% 51%` | Non-compliant stocks (red) |
| `--questionable` | `42 60% 50%` | Questionable stocks (amber) |

### Spacing Scale (Tailwind Default)
```
4   = 1rem (16px)
6   = 1.5rem (24px)
8   = 2rem (32px)
12  = 3rem (48px)
16  = 4rem (64px)
```

### Border Radius
```css
--radius: 0.75rem;  /* 12px — base radius */
```
Tailwind classes: `rounded-lg` (12px), `rounded-md` (10px), `rounded-sm` (8px)

---

## 2. Typography

### Font Families

| Purpose | Font | Tailwind Class | CSS Variable |
|---------|------|----------------|--------------|
| Body | Inter | `font-sans` | `font-family: 'Inter', system-ui, sans-serif` |
| Headings | Plus Jakarta Sans | `font-heading` | `font-family: 'Plus Jakarta Sans', system-ui, sans-serif` |
| UI/Labels | Plus Jakarta Sans | `font-ui` | Same as headings |

### Font Import
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
```

### Text Styles

| Style | Classes | Usage |
|-------|---------|-------|
| H1 | `text-4xl md:text-5xl font-heading font-bold` | Page titles |
| H2 | `text-3xl md:text-4xl font-heading font-bold` | Section headers |
| H3 | `text-2xl font-heading font-semibold` | Card titles |
| Body | `text-base font-sans` | Paragraphs |
| Small | `text-sm text-muted-foreground` | Captions, labels |
| UI Label | `font-ui text-sm font-medium` | Navigation, buttons |

---

## 3. Component Library

### Location
`src/components/ui/` — 50 shadcn/ui components built on Radix UI primitives.

### Architecture
- **Pattern:** Compound components with `forwardRef`
- **Styling:** `class-variance-authority` (CVA) for variants + `cn()` utility
- **Primitives:** Radix UI for accessibility

### Key Components

#### Button (`src/components/ui/button.tsx`)
```tsx
import { Button } from "@/components/ui/button";

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default (h-10), sm (h-9), lg (h-11), icon (h-10 w-10)
<Button variant="default" size="lg">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
```

#### Card (`src/components/ui/card.tsx`)
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="shadow-premium">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Input (`src/components/ui/input.tsx`)
```tsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter value..." />
```

#### Dialog, Sheet, Dropdown, Select, Tabs, etc.
All available in `src/components/ui/` — follow same pattern.

### Component Documentation
No Storybook. Refer to [shadcn/ui docs](https://ui.shadcn.com) for API reference.

---

## 4. Frameworks & Build

| Layer | Technology | Config File |
|-------|------------|-------------|
| Framework | React 18 + TypeScript | `tsconfig.json` |
| Build | Vite 5 (SWC) | `vite.config.ts` |
| Styling | Tailwind CSS v3 | `tailwind.config.ts` |
| UI Library | shadcn/ui | `components.json` |
| Animation | Framer Motion | — |
| Icons | Lucide React | — |

### Path Aliases
```json
"@/*": ["./src/*"]
```
Use: `import { Button } from "@/components/ui/button"`

---

## 5. Asset Management

### Image Locations
| Location | Purpose |
|----------|---------|
| `public/images/` | App screenshots, marketing images |
| `public/` | Logo, favicon, static files |
| `src/assets/` | SVG patterns, logo (imported via bundler) |

### Image Usage
```tsx
// Public folder (no import needed)
<img src="/images/screen-dashboard.webp" alt="..." />
<img src="/rafiq-logo.png" alt="Rafiq" />

// Bundled assets (import required)
import logo from "@/assets/rafiq-logo.png";
<img src={logo} alt="Rafiq" />
```

### Image Formats
- `.webp` for screenshots/photos (optimized)
- `.png` for logos with transparency
- `.svg` for icons and patterns (inline or component)

---

## 6. Icon System

### Library
**Lucide React** — MIT-licensed, tree-shakeable icons.

### Import Pattern
```tsx
import { Menu, X, ChevronDown, Settings, LogOut } from "lucide-react";

<Menu size={22} />
<ChevronDown size={14} />
```

### Size Convention
| Context | Size |
|---------|------|
| Navigation icons | `22` |
| Button icons (with text) | `16` |
| Inline icons | `14` |
| Large decorative | `24-48` |

### Custom Islamic Patterns
Located in `src/assets/islamic-patterns.tsx`:
- `CornerDecoration` — Arabesque corner curves
- `CrescentMoon` — Moon icon
- `DiamondAccent` — Diamond shape from logo
- `IslamicDivider` — Decorative section divider

---

## 7. Styling Approach

### Methodology
**Utility-first Tailwind CSS** with CSS variables for theming.

### Class Utility
```tsx
import { cn } from "@/lib/utils";

// Merges classes, handles conflicts
<div className={cn("base-classes", conditional && "conditional-class", className)} />
```

### Global Styles (`src/index.css`)

#### Premium Utilities
```css
.glass             /* Glassmorphism effect */
.glass-dark        /* Dark glassmorphism */
.shadow-premium    /* Multi-layer shadow */
.shadow-glow-primary /* Green glow */
.shadow-glow-gold  /* Gold glow */
.text-gradient-gold /* Gold gradient text */
.hover-glow        /* Hover lift + glow */
.pattern-islamic   /* Islamic SVG pattern background */
```

#### Animation Classes
```css
.animate-fade-in-up    /* Entry animation */
.animate-float         /* Gentle float */
.animate-shimmer       /* Loading shimmer */
.animate-pulse-dot     /* Typing indicator */
.animate-glow-pulse    /* Pulsing glow */
.animate-bounce-gentle /* Soft bounce */
```

### Responsive Design
Mobile-first with Tailwind breakpoints:
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1400px (container max)
```

Pattern: `<mobile-styles> md:<desktop-styles>`
```tsx
<h1 className="text-3xl md:text-5xl">Responsive Heading</h1>
```

---

## 8. Project Structure

```
src/
├── pages/                    # Route pages
│   ├── Index.tsx             # Landing page
│   ├── Screener.tsx          # Stock screener
│   ├── Zakat.tsx             # Zakat calculator
│   └── AskRafiq.tsx          # AI chat
├── components/
│   ├── ui/                   # shadcn/ui primitives (50)
│   ├── landing/              # Landing page sections
│   ├── calculators/          # Calculator tab components
│   └── Navbar.tsx            # Top navigation
├── lib/
│   ├── utils.ts              # cn() and utilities
│   └── firebase.ts           # Firebase init
├── hooks/
│   └── use-toast.ts          # Toast notifications
├── assets/
│   └── islamic-patterns.tsx  # Custom SVG components
└── contexts/
    └── AuthContext.tsx       # Auth state
```

---

## 9. Design-to-Code Mapping

### When Converting Figma Designs:

1. **Colors:** Map hex colors to CSS variable names
   - `#1B4D3E` → `bg-primary` or `bg-forest`
   - `#C9A962` → `bg-gold` or `text-gold`
   - `#FAF8F5` → `bg-background` or `bg-cream`

2. **Typography:** Match to font system
   - Headings → `font-heading font-bold`
   - Body → `font-sans` (default)
   - UI text → `font-ui text-sm font-medium`

3. **Components:** Use existing shadcn/ui
   - Buttons → `<Button variant="..." size="...">`
   - Cards → `<Card>` compound component
   - Forms → `<Input>`, `<Select>`, `<Checkbox>`
   - Modals → `<Dialog>` or `<Sheet>`

4. **Spacing:** Convert pixels to Tailwind
   - 8px → `p-2`, 16px → `p-4`, 24px → `p-6`, 32px → `p-8`

5. **Effects:**
   - Shadows → `shadow-sm`, `shadow-md`, `shadow-premium`
   - Glassmorphism → `glass` or `glass-dark` class
   - Rounded corners → `rounded-lg` (12px default)

6. **Animations:**
   - Use Framer Motion for complex animations
   - Use Tailwind/CSS classes for simple ones

---

## 10. Code Patterns

### Component Template
```tsx
import { cn } from "@/lib/utils";

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export function Component({ className, children }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}
```

### Page Layout Template
```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* pt-24 accounts for fixed navbar */}
        <h1 className="text-3xl font-heading font-bold mb-6">Page Title</h1>
        {/* Content */}
      </main>
    </div>
  );
}
```

### Card with Premium Styling
```tsx
<Card className="shadow-premium hover-glow transition-all duration-300">
  <CardHeader>
    <CardTitle className="font-heading">Feature</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

---

## 11. Brand Guidelines

### Visual Identity
- **Primary Color:** Forest green (`#1B4D3E`) — Trust, Islamic association
- **Accent:** Gold (`#C9A962`) — Premium, prosperity
- **Background:** Cream (`#FAF8F5`) — Warmth, approachability

### Islamic Aesthetic
- Use `pattern-islamic` or `pattern-islamic-gold` for subtle backgrounds
- Corner decorations via `<CornerDecoration />` component
- `<IslamicDivider />` for section breaks

### Status Colors
- **Halal/Success:** `text-halal` or `bg-halal` (green)
- **Haram/Error:** `text-haram` or `bg-haram` (red)
- **Questionable/Warning:** `text-questionable` or `bg-questionable` (amber)

---

## Quick Reference

### Import Paths
```tsx
// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Utilities
import { cn } from "@/lib/utils";

// Icons
import { Menu, ChevronDown } from "lucide-react";

// Custom patterns
import { IslamicDivider, CornerDecoration } from "@/assets/islamic-patterns";
```

### Tailwind Class Cheatsheet
```
// Colors
bg-primary text-primary-foreground
bg-forest bg-gold bg-cream
text-muted-foreground

// Spacing
p-4 p-6 p-8 px-4 py-2
space-y-4 gap-4

// Layout
container mx-auto
flex items-center justify-between
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Effects
shadow-premium shadow-glow-primary
glass hover-glow
rounded-lg rounded-full

// Typography
font-heading font-ui font-sans
text-sm text-base text-lg text-xl
font-medium font-semibold font-bold
```
