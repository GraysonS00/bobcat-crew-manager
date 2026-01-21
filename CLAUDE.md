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

## Recent Development Notes

### Login Screen Enhancements
- Form wrapped in `<form>` element with `onSubmit` handler for Enter key support
- Show/hide password toggle button using eye icon

### Admin Leak Reports View
- Admins can view full leak report details and edit any submitted report
- Reports organized by **Supervisor tabs** then **Week sub-tabs** (Monday as week start)
- Week grouping uses `getWeekMonday()` helper that adjusts dates so Monday is the first day of the week
- "All" option available for both supervisor and week filters

### Supervisor Review Enhancements
- Supervisors can edit reports that have already been reviewed (not just pending ones)
- Edit button visible regardless of report status

### PDF Export Functionality
Uses **pdf-lib** library to fill a pre-made PDF template with report data.

**Key files:**
- `createPdfTemplate.js` - One-time script to generate fillable PDF template from the original "Leak Report Form.pdf"
- `public/LeakReportTemplate.pdf` - The fillable template served by the web app
- `LeakReportTemplate.pdf` - Copy in root (generated output)

**How it works:**
1. `loadPdfTemplate()` fetches and caches the template PDF
2. `generateLeakReportPDF()` loads the template, fills all form fields (text and checkboxes), flattens the form, and returns PDF bytes
3. `exportReportsAsZip()` generates PDFs for filtered reports and bundles them into a downloadable ZIP file

**Export options:**
- "Export Current View" button exports reports matching current supervisor/week filters
- Export modal allows filtering by date range, supervisors, and classification type

**PDF field naming convention** (in createPdfTemplate.js):
- Text fields: `date`, `foreman`, `supervisor`, `project_number`, `leak_number`, `address`, `*_qty`, `downtime_*_start/end`, `bore_*`, `crew_*_time`, `fcc_name`, `notes`
- Checkboxes: `job_type_*`, `leak_*`, `pipe_type_*`, `*_yes`, `*_no`, `welder_*`, `bore_*`, etc.

To adjust field positions, edit coordinates in `createPdfTemplate.js` and regenerate:
```bash
node createPdfTemplate.js
cp LeakReportTemplate.pdf public/
```
