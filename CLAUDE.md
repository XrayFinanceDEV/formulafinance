# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Turbo for faster builds)
- **Production build**: `npm run build` (also uses Turbo)
- **Start production**: `npm start`
- **Linting**: `npm run lint` (ESLint configured)

## Architecture Overview

This is a **Next.js 15 App Router** application with the following structure:

- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **UI Components**: Built with Radix UI primitives and shadcn/ui system
- **Icons**: Lucide React and Tabler Icons
- **Data Visualization**: Recharts for charts and interactive visualizations

### Key Directories

- `app/` - Next.js App Router pages and layouts
  - `app/dashboard/` - Main dashboard page with financial data visualization
- `components/` - Reusable UI components
  - `components/ui/` - shadcn/ui base components
  - `components/app-sidebar.tsx`, `components/site-header.tsx` etc. - App-specific components
- `lib/` - Utilities (currently contains `utils.ts` with `cn()` function for className merging)
- `hooks/` - Custom React hooks (directory exists but empty currently)

### Component Architecture

The dashboard follows a sidebar + main content layout pattern:
- `SidebarProvider` wraps the entire dashboard
- `AppSidebar` provides navigation (variant="inset")
- `SidebarInset` contains the main content area
- Main content includes: `SiteHeader`, `SectionCards`, `ChartAreaInteractive`, `DataTable`

### Technology Stack

**Core Dependencies:**
- Next.js 15 with Turbo
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui component system

**UI & Interaction:**
- @radix-ui/* primitives for accessible components
- @dnd-kit/* for drag and drop functionality
- @tanstack/react-table for data tables
- next-themes for theme management
- Recharts for data visualization
- Sonner for toast notifications

**Development:**
- ESLint with Next.js config
- Path mapping: `@/*` points to project root

### shadcn/ui Configuration

Components are configured in `components.json`:
- Style: "new-york" variant
- Base color: "neutral"
- CSS variables enabled
- Icons: Lucide React
- Aliases set for `@/components`, `@/lib`, `@/hooks` etc.

Use `npx shadcn add [component-name]` to add new shadcn/ui components.