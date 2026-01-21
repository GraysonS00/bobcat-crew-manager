# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build locally
```

No test framework is configured. No linting is configured.

## Architecture Overview

This is a **Progressive Web App (PWA)** for managing construction crews, equipment, and job reports. It uses React + Vite + Tailwind CSS with Supabase as the backend (PostgreSQL + Auth + Storage), deployed to Vercel.

### Monolithic Single-File Architecture

The entire application lives in **App.jsx** (~2,400 lines) as a single React component with clearly marked sections:

1. **AuthContext & Hooks** (top) - Session/profile context
2. **UI Component Library** - Reusable components: Badge, Button, Card, Input, Select, Textarea, Toggle, LoadingScreen
3. **Icons** - Inline SVG icon objects
4. **LoginScreen** - Supabase email/password auth
5. **Navigation** - Role-based menu items
6. **Views** - Role-specific screens (see below)
7. **Main App** - State management, data fetching, view routing

### Role-Based Access (3-tier)

| Role | Access |
|------|--------|
| **Admin** | Full access: Users, Employees, Crews, Equipment, all Reports |
| **Supervisor** | Dashboard, assigned crews, review/approve reports |
| **Foreman** | Own crew management, equipment, submit reports |

Views are filtered by `profile.role`. Foremen see only their crew via `crews.find(c => c.foreman_user_id === profile.id)`.

### Database Schema (supabase-schema.sql)

Core tables with Row Level Security (RLS):
- **profiles** - User profiles (id, name, role, phone) - auto-created on signup
- **employees** - Worker roster (name, classification, phone, active)
- **crews** - Teams with foreman_id (employee) and foreman_user_id (profile)
- **crew_members** - Junction table (crew_id, employee_id)
- **equipment** - Assets with type, status, photo_url, crew assignment
- **job_reports** / **job_report_employees** - Leak reports with attendance

Helper functions: `get_user_role()`, `get_user_crew_id()` for RLS policies.

Storage: `equipment-photos` bucket (public read, authenticated upload).

### Data Flow Pattern

- Supabase client initialized in `supabaseClient.js`
- `fetchAllData()` loads all 5 tables via `Promise.all`
- Mutations trigger full `fetchAllData()` refresh (no optimistic updates)
- `onRefresh` callbacks passed to child views

### Styling Conventions

- **Dark theme**: zinc-950 background, zinc-100 text
- **Accent**: amber-500 for primary actions
- **Status colors**: emerald (success), red (danger), sky (info)
- **Cards**: `bg-zinc-900/80 border border-zinc-800`

## Environment Variables

Required for deployment (set in Vercel):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key
