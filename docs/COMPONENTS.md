# Component Library Documentation

## Overview

This document provides comprehensive documentation for all UI components in the Wealth Management CRM platform. Components are built using **shadcn/ui** on top of **Radix UI primitives**, ensuring accessibility, flexibility, and consistency.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Layout Components](#layout-components)
3. [UI Components](#ui-components)
4. [Usage Guidelines](#usage-guidelines)
5. [File Organization](#file-organization)

---

## Design Tokens

### Spacing Scale

```typescript
// Tailwind spacing utilities (based on 4px = 1 unit)
{
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
}
```

**Usage:**
```tsx
<div className="p-4">       // 16px padding
<div className="mb-6">      // 24px margin-bottom
<div className="space-y-4"> // 16px vertical spacing between children
```

---

### Typography Scale

```tsx
// Text sizes
text-xs    // 12px (0.75rem)
text-sm    // 14px (0.875rem)
text-base  // 16px (1rem) - default
text-lg    // 18px (1.125rem)
text-xl    // 20px (1.25rem)
text-2xl   // 24px (1.5rem)
text-3xl   // 30px (1.875rem)

// Font weights
font-normal    // 400
font-medium    // 500
font-semibold  // 600
font-bold      // 700
```

**Usage:**
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Heading</h2>
<p className="text-sm text-muted-foreground">Helper text</p>
```

---

### Breakpoints

```typescript
// Mobile-first responsive breakpoints
{
  sm: '640px',   // Tablet portrait
  md: '768px',   // Tablet landscape
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large desktop
}
```

**Usage:**
```tsx
// Mobile: full width, Desktop: half width
<div className="w-full lg:w-1/2">

// Mobile: stacked, Desktop: grid
<div className="flex flex-col lg:grid lg:grid-cols-2">
```

---

## Layout Components

### Header

**Location:** `src/components/layout/Header.tsx`

**Description:** Top navigation bar with logo, navigation menu, and user profile.

**Props:**
```typescript
interface HeaderProps {
  onMenuClick?: () => void; // Callback for mobile menu toggle
}
```

**Features:**
- WealthCRM logo with link to home
- Role-based navigation menu (Admin, RM, Client)
- Mobile hamburger menu button
- User profile dropdown with avatar
- Sign out functionality
- Sticky positioning

**Usage:**
```tsx
import { Header } from '@/components/layout';

<Header onMenuClick={() => setSidebarOpen(true)} />
```

---

### Sidebar

**Location:** `src/components/layout/Sidebar.tsx`

**Description:** Collapsible side navigation with role-based menu items.

**Props:**
```typescript
interface SidebarProps {
  isOpen?: boolean;  // Control sidebar visibility (mobile)
  onClose?: () => void; // Callback when sidebar closes
}
```

**Features:**
- Role-based navigation items (ADMIN, RM, CLIENT)
- Active route highlighting
- Icons for each menu item
- Responsive: Hidden on mobile, visible on desktop (lg:)
- Mobile overlay with click-to-close
- Smooth transitions

**Navigation Items:**
- **Admin:** Dashboard, User Management, Client Assignments, Instruments, Audit Logs
- **RM:** Dashboard, My Clients, Requests
- **Client:** Dashboard, My Portfolio, Browse Instruments, Transactions

**Usage:**
```tsx
import { Sidebar } from '@/components/layout';

<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
```

---

### Footer

**Location:** `src/components/layout/Footer.tsx`

**Description:** Bottom footer with company info and links.

**Features:**
- Company information
- Quick links (About, Help, Contact)
- Legal links (Privacy, Terms, Security)
- Dynamic copyright year
- Responsive grid layout (3 columns on desktop)

**Usage:**
```tsx
import { Footer } from '@/components/layout';

<Footer />
```

---

### PageContainer

**Location:** `src/components/layout/PageContainer.tsx`

**Description:** Consistent page wrapper with responsive padding and max-width.

**Props:**
```typescript
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}
```

**Max-Width Options:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px
- `7xl`: 80rem (1280px) - **default**
- `full`: 100%

**Usage:**
```tsx
import { PageContainer } from '@/components/layout';

<PageContainer maxWidth="7xl">
  <h1>Page content</h1>
</PageContainer>
```

---

### DashboardLayout

**Location:** `src/components/layout/DashboardLayout.tsx`

**Description:** Complete dashboard layout combining Header, Sidebar, and Footer.

**Features:**
- Integrates Header, Sidebar, Footer
- Skip link for accessibility
- Sidebar state management
- Responsive layout with proper spacing
- Main content area with `id="main-content"` for skip link

**Usage:**
```tsx
import { DashboardLayout } from '@/components/layout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <h1>Dashboard Content</h1>
      </PageContainer>
    </DashboardLayout>
  );
}
```

---

### SkipLink

**Location:** `src/components/layout/SkipLink.tsx`

**Description:** Accessibility feature allowing keyboard users to skip navigation.

**Features:**
- Hidden by default (`sr-only`)
- Visible when focused via keyboard
- High contrast styling
- Jumps to `#main-content`

**Usage:**
```tsx
// Automatically included in DashboardLayout
// No manual usage required
```

---

## UI Components

### Button

**Location:** `src/components/ui/button.tsx`

**Variants:**
- `default` - Primary blue background
- `destructive` - Red background for dangerous actions
- `outline` - Border with transparent background
- `secondary` - Gray background
- `ghost` - Transparent background, hover effect
- `link` - Styled as a link

**Sizes:**
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square for icon-only buttons

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

// Primary action
<Button>Submit</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Link style
<Button variant="link">Learn More</Button>

// Icon button
<Button variant="ghost" size="icon">
  <TrashIcon className="h-4 w-4" />
</Button>
```

---

### Input

**Location:** `src/components/ui/input.tsx`

**Usage:**
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

---

### Card

**Location:** `src/components/ui/card.tsx`

**Sub-components:**
- `Card` - Container
- `CardHeader` - Top section
- `CardTitle` - Title in header
- `CardDescription` - Subtitle in header
- `CardContent` - Main content area
- `CardFooter` - Bottom section

**Usage:**
```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### Dialog (Modal)

**Location:** `src/components/ui/dialog.tsx`

**Sub-components:**
- `Dialog` - Container
- `DialogTrigger` - Button to open dialog
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Modal title
- `DialogDescription` - Modal description
- `DialogFooter` - Footer with actions

**Usage:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Table

**Location:** `src/components/ui/table.tsx`

**Sub-components:**
- `Table` - Table container
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableFooter` - Footer section
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Body cell
- `TableCaption` - Table caption

**Usage:**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Client</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Badge

**Location:** `src/components/ui/badge.tsx`

**Variants:**
- `default` - Primary background
- `secondary` - Gray background
- `destructive` - Red background
- `outline` - Border only

**Usage:**
```tsx
import { Badge } from '@/components/ui/badge';

// Status badges
<Badge>Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="outline">Draft</Badge>

// Custom colors (use custom classes)
<Badge className="bg-success text-success-foreground">Approved</Badge>
<Badge className="bg-warning text-warning-foreground">Pending Review</Badge>
```

---

### Alert

**Location:** `src/components/ui/alert.tsx`

**Variants:**
- `default` - Standard alert
- `destructive` - Error alert

**Sub-components:**
- `Alert` - Container
- `AlertTitle` - Title
- `AlertDescription` - Description

**Usage:**
```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Success alert (custom)
<Alert className="border-success bg-success/10">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>

// Error alert
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong. Please try again.</AlertDescription>
</Alert>
```

---

### Select

**Location:** `src/components/ui/select.tsx`

**Sub-components:**
- `Select` - Container
- `SelectTrigger` - Button to open select
- `SelectValue` - Selected value display
- `SelectContent` - Dropdown content
- `SelectItem` - Option item
- `SelectGroup` - Group of items
- `SelectLabel` - Group label

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrator</SelectItem>
    <SelectItem value="rm">Relationship Manager</SelectItem>
    <SelectItem value="client">Client</SelectItem>
  </SelectContent>
</Select>
```

---

### Dropdown Menu

**Location:** `src/components/ui/dropdown-menu.tsx`

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Checkbox

**Location:** `src/components/ui/checkbox.tsx`

**Usage:**
```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

---

### Textarea

**Location:** `src/components/ui/textarea.tsx`

**Usage:**
```tsx
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="message">Message</Label>
  <Textarea id="message" placeholder="Type your message here" />
</div>
```

---

### Avatar

**Location:** `src/components/ui/avatar.tsx`

**Sub-components:**
- `Avatar` - Container
- `AvatarImage` - Image element
- `AvatarFallback` - Fallback when image fails or not provided

**Usage:**
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// With image
<Avatar>
  <AvatarImage src="https://example.com/avatar.jpg" alt="User name" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Fallback only (initials)
<Avatar>
  <AvatarFallback className="bg-primary text-primary-foreground">
    JD
  </AvatarFallback>
</Avatar>
```

---

### Tooltip

**Location:** `src/components/ui/tooltip.tsx`

**Sub-components:**
- `TooltipProvider` - Context provider
- `Tooltip` - Container
- `TooltipTrigger` - Trigger element
- `TooltipContent` - Tooltip content

**Usage:**
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### Separator

**Location:** `src/components/ui/separator.tsx`

**Usage:**
```tsx
import { Separator } from '@/components/ui/separator';

// Horizontal separator
<Separator />

// Vertical separator
<Separator orientation="vertical" className="h-6" />
```

---

## Usage Guidelines

### Responsive Design Patterns

#### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// ✅ Good: Mobile-first
<div className="flex flex-col lg:flex-row">
  <div className="w-full lg:w-1/2">Left</div>
  <div className="w-full lg:w-1/2">Right</div>
</div>

// ❌ Bad: Desktop-first
<div className="flex-row flex-col-sm">
```

#### Common Responsive Patterns

```tsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// Full width on mobile, constrained on desktop
<div className="w-full lg:max-w-2xl">

// Hidden on mobile, visible on desktop
<div className="hidden lg:block">

// Visible on mobile, hidden on desktop
<div className="block lg:hidden">

// Different spacing on mobile vs desktop
<div className="p-4 lg:p-8">
```

---

### Form Best Practices

```tsx
// Always associate labels with inputs
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Group related fields
<div className="space-y-4">
  <div>
    <Label htmlFor="firstName">First Name</Label>
    <Input id="firstName" />
  </div>
  <div>
    <Label htmlFor="lastName">Last Name</Label>
    <Input id="lastName" />
  </div>
</div>

// Show validation errors
{error && (
  <p className="text-sm text-destructive">{error}</p>
)}
```

---

### Color Usage

```tsx
// Status colors for feedback
<Badge className="bg-success text-success-foreground">Approved</Badge>
<Badge className="bg-warning text-warning-foreground">Pending</Badge>
<Badge className="bg-destructive text-destructive-foreground">Rejected</Badge>

// Semantic button colors
<Button>Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete</Button>

// Text colors
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Helper text</p>
<p className="text-success">Positive change +5.2%</p>
<p className="text-destructive">Negative change -2.1%</p>
```

---

## File Organization

### Component Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── PageContainer.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── SkipLink.tsx
│   │   └── index.ts
│   ├── shared/          # Shared business components
│   ├── forms/           # Form-specific components
│   ├── dashboard/       # Dashboard-specific components
│   └── ...
```

---

### Naming Conventions

#### Components

- Use PascalCase: `Button`, `UserProfile`, `TransactionList`
- Descriptive names: `ClientAssignmentForm` not `Form3`
- Suffix with component type if ambiguous: `UserCard`, `UserList`, `UserForm`

#### Files

- Match component name: `Button.tsx`, `UserProfile.tsx`
- Index files for barrel exports: `index.ts`

#### Props Interfaces

```typescript
// Name after component with Props suffix
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
```

#### CSS Classes

```tsx
// Use Tailwind utilities, group by category
<div className="
  // Layout
  flex items-center justify-between
  // Spacing
  p-4 mb-6
  // Appearance
  rounded-md bg-card
  // Typography
  text-sm font-medium text-foreground
  // Responsive
  lg:p-8
">
```

---

### Import Organization

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Next.js imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 3. Third-party libraries
import { useSession } from 'next-auth/react';

// 4. UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 5. Layout components
import { DashboardLayout, PageContainer } from '@/components/layout';

// 6. Custom components
import { UserProfile } from '@/components/shared/UserProfile';

// 7. Utils and lib
import { cn } from '@/lib/utils';

// 8. Types
import type { User } from '@/types';
```

---

## Best Practices

### Do's ✅

1. **Use semantic components:**
   ```tsx
   <Button>Submit</Button>  // Not <div onClick={...}>
   ```

2. **Leverage Tailwind utilities:**
   ```tsx
   <div className="flex items-center gap-4"> // Not custom CSS
   ```

3. **Maintain consistent spacing:**
   ```tsx
   <div className="space-y-4"> // Consistent vertical rhythm
   ```

4. **Use layout components:**
   ```tsx
   <DashboardLayout>
     <PageContainer>
       {/* Content */}
     </PageContainer>
   </DashboardLayout>
   ```

### Don'ts ❌

1. **Don't use inline styles:**
   ```tsx
   <div style={{ color: 'red' }}> // ❌
   <div className="text-destructive"> // ✅
   ```

2. **Don't hardcode colors:**
   ```tsx
   <div className="bg-[#ff0000]"> // ❌
   <div className="bg-destructive"> // ✅
   ```

3. **Don't skip accessibility:**
   ```tsx
   <img src="..." /> // ❌
   <img src="..." alt="Description" /> // ✅
   ```

4. **Don't create deeply nested components:**
   ```tsx
   // Extract into separate components when nesting gets deep
   ```

---

## Resources

- **shadcn/ui Docs:** https://ui.shadcn.com
- **Radix UI Docs:** https://www.radix-ui.com
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Design System:** `/docs/DESIGN_SYSTEM.md`
- **Accessibility Guide:** `/docs/ACCESSIBILITY.md`

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
**Status:** Production Ready
