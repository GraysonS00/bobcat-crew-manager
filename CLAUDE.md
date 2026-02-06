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

The entire application lives in **App.jsx** (~3,500 lines) as a single React component with clearly marked sections:

1. **AuthContext & Hooks** (top) - Session/profile context
2. **UpdateToast** - PWA update prompt component
3. **UI Component Library** - Reusable components: Badge, Button, Card, Input, Select, Textarea, Toggle, LoadingScreen
4. **Icons** - Inline SVG icon objects
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
- **leak_reports** / **job_report_employees** - Leak reports with attendance
- **activity_logs** - Audit trail of all user actions (admin-viewable only)

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

### Crew Member Management
Admins, Supervisors, and Foremen can all edit crew compositions with role-appropriate access:

**Access levels:**
- **Foremen** - Can edit their own crew only (dedicated view with Edit Crew button)
- **Supervisors** - Can edit any crew they supervise (Edit button on crew cards + in view modal)
- **Admins** - Can edit any crew (same UI as supervisors)

**Editing UI features:**
- **Search bar** with fuzzy matching - searches by employee name and classification
- **Fuzzy search** prioritizes: exact start match > word start match > contains > classification match > partial character match
- **Pinned selected employees** - "Current Crew Members" section always visible at top showing who's already on the crew
- **Scrollable available list** - unselected employees appear below in a scrollable area
- Click any employee to toggle selection (add/remove from crew)

**Implementation notes:**
- `CrewsView` component handles all crew management
- `searchQuery` state controls the search input
- `getFilteredEmployees(query)` returns employees sorted by match quality score
- `selectedMembers` array tracks currently selected employee IDs
- `startEditing(crew)` initializes editing mode and clears search

### Activity Logs (Admin Dashboard)
The Admin Dashboard displays an Activity feed instead of Recent Leak Reports, showing all user actions across the system.

**Database table:** `activity_logs`
```sql
- id (UUID, primary key)
- created_at (timestamp)
- user_id (UUID, references auth.users)
- user_name (text)
- action (text) - e.g., "added", "updated", "deleted", "reviewed"
- entity_type (text) - e.g., "employee", "crew", "equipment", "leak_report", "user"
- entity_id (UUID)
- entity_name (text)
- details (JSONB, optional)
```

**Logged actions:**
- **Employees**: added, updated, deleted
- **Crews**: created, deleted, crew members updated
- **Equipment**: added, updated, deleted
- **Users**: created, role changed, supervisor/foreman assigned to crew
- **Leak Reports**: submitted (foreman), reviewed (supervisor), edited (admin)

**UI features:**
- Search bar filters by user name, action, entity type, or entity name
- Color-coded actions: emerald (added/created), amber (updated), red (deleted), sky (reviewed)
- Icons by entity type (Users, Truck, Document)
- Time ago display (just now, Xm ago, Xh ago, Xd ago, or date)
- Shows last 100 entries, scrollable

**Implementation:**
- `activityLogs` state in main App component
- `logActivity(action, entityType, entityId, entityName, details)` function passed to all views
- Fetched in `fetchAllData()` with limit of 100, ordered by created_at descending
- Dashboard component has `activitySearch` state and `filteredActivityLogs` computed value

**RLS Policies Required:**
```sql
-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Anyone authenticated can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Supervisors can view activity from their foremen
CREATE POLICY "Supervisors can view foreman activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND activity_logs.user_id IN (
        SELECT c.foreman_user_id
        FROM crews c
        WHERE c.supervisor_id = auth.uid()
        AND c.foreman_user_id IS NOT NULL
      )
    )
  );
```

### Foreman Activity (Supervisor Dashboard)
The Supervisor Dashboard displays a "Foreman Activity" feed showing actions taken by foremen assigned to the supervisor's crews.

**How it filters:**
- Gets `foreman_user_id` from all crews where `supervisor_id === profile.id`
- Filters `activityLogs` to only show entries where `user_id` matches one of those foreman IDs

**UI features:**
- Same as admin activity (search bar, color-coded actions, icons, time ago)
- Shows activity for: crew member changes, equipment updates, leak report submissions/edits
- `foremanActivitySearch` state for filtering
- `foremanActivityLogs` computed from `activityLogs` filtered by foreman user IDs

### PDF Export Functionality
Uses **pdf-lib** library to generate PDFs from scratch (no template file needed).

**How it works:**
1. `generateLeakReportPDF(report, crew, supervisorProfile, foremanEmployee)` creates a new PDF document and draws all content using pdf-lib's drawing APIs
2. `exportReportsAsZip()` generates PDFs for filtered reports and bundles them into a downloadable ZIP file

**PDF generation details:**
- Letter size (612x792), 30pt margins, Helvetica + Helvetica-Bold standard fonts
- Layout: Title → header rows (date, project #, leak #, foreman, supervisor, address) → Job Type section → two-column layout (left: Leak Details, Replacements, Additional Details; right: Downtime, Adders, Welder, Bore) → full-width Crew Times & Completion, FCC (`report.fcc_name`), word-wrapped Notes
- Helper closures: `drawSectionHeader`, `drawLabelValue`, `drawYesNo`, `drawCheckItem`, `drawLine`, `wrapText`, `truncText`
- Section headers: light gray background band with bold text
- Checkboxes: filled dark square (checked) / outlined empty square (unchecked) via `drawRectangle`
- Two-column section uses `yLeft`/`yRight` cursors with vertical divider line, resumes at `Math.min(yLeft, yRight)`
- All 50+ report fields are rendered (same fields as the old template approach)

**Export options:**
- "Export Current View" button exports reports matching current supervisor/week filters
- Export modal allows filtering by date range, supervisors, and classification type

**Legacy files (no longer used, can be deleted):**
- `createPdfTemplate.js` - Was used to generate the old fillable template
- `public/LeakReportTemplate.pdf` - Old fillable template
- `LeakReportTemplate.pdf` - Copy in root
- `Leak Report Form.pdf` - Original source PDF

### Equipment View (Role-Based Navigation)

The Equipment view provides different navigation experiences based on user role:

**Foreman View:**
- Simple list of their crew's equipment
- Can add/edit/delete equipment assigned to their crew

**Supervisor View (2x2 Grid Navigation):**
- First screen shows pressable square cards in a 2-column grid:
  - "My Equipment" square (unassigned equipment)
  - One square per crew they supervise, labeled "{Foreman Name}'s Crew"
- Each square shows equipment count
- Clicking a square navigates to that crew's equipment list
- Back button (chevron left) returns to grid view
- Search bar available for finding equipment

**Admin View (3-Level Hierarchy):**
1. **Supervisor Grid** - Shows all supervisors as squares with crew count and equipment count
2. **Crew Grid** - After selecting supervisor, shows their crews as squares
3. **Equipment List** - After selecting crew, shows that crew's equipment

**Search Functionality (Admin & Supervisor):**
- Search bar at top of grid views
- Searches equipment by: description, equipment number, serial number, type, notes
- Searches crews by: foreman name, crew name
- Searches supervisors by: name (admin only)
- Results organized into sections: Supervisors, Crews, Equipment
- Clicking a result navigates directly to that item

**Implementation:**
- `selectedSupervisorId` state tracks which supervisor is selected (admin only)
- `selectedCrewId` state tracks which crew's equipment to show
- `searchQuery` state for search input
- `getSearchScore()` function provides fuzzy matching with scoring
- `handleBack()` navigates up one level and clears search

### Admin Crews View (Drag-and-Drop)

The Admin Crews view groups crews by supervisor with drag-and-drop reassignment:

**Layout:**
- Each supervisor has a block/section showing their name and assigned crews
- Crews appear as cards within their supervisor's block
- "Unassigned Crews" block at bottom for crews without a supervisor
- Each crew card has a grip handle icon indicating it's draggable

**Drag-and-Drop:**
- Drag a crew card from one supervisor block to another
- Drop zone highlights with amber border when dragging over
- Dropping a crew updates its `supervisor_id` in the database
- Activity is logged when crews are reassigned
- Drop on "Unassigned" to remove supervisor assignment

**Search Functionality:**
- Search bar at top searches employees, crews, and supervisors
- Employee results show: name, classification, crew assignment, foreman/supervisor
- Indicates if employee is a foreman with badge
- Shows "No crew assigned" for unassigned employees
- Crew results show: name, foreman, supervisor, member count
- Supervisor results show: name and crew count
- Click View button to open crew details modal

**Implementation:**
- `draggedCrew` state tracks currently dragged crew
- `dragOverSupervisor` state tracks which drop zone is active
- `adminSearchQuery` state for search input
- `adminSearchResults` computed array with scored results
- `handleDragStart/End/Over/Leave/Drop` event handlers
- `crewsBySupervisor` groups crews by supervisor ID
- `unassignedCrews` filters crews without supervisor

### Admin Employees Search

The Admin Employees view includes a search bar for quickly finding employees:

**Search Fields:**
- Employee name
- Employee number
- Classification (Foreman, Operator, Welder, etc.)
- Phone number

**UI Features:**
- Search bar above the employee table
- Shows result count when searching (e.g., "3 results for 'john'")
- Clear button to reset search
- "No employees match" message when no results
- Table updates instantly as you type

**Implementation:**
- `searchQuery` state in EmployeesView component
- `filteredEmployees` computed array filters by search query
- Case-insensitive partial matching on all searchable fields

### Job Submissions Feature

A workflow for submitting jobs that need to be exported to FileMaker. Replaces texts/emails/forms with an in-app submission system.

**Workflow:**
```
Foreman submits    → Supervisor reviews/edits → Admin approves (job # assigned) → Export CSV
Supervisor submits → Admin approves (job # assigned) → Export CSV
Admin submits      → Admin approves (job # assigned) → Export CSV
```

**Database Tables (job-submissions-migration.sql):**
- `job_submissions` - Main submissions table with status, job type, address, FCC, leak #, project #
- `job_number_sequences` - Tracks D01, D02, D03, D04 prefixes and their current counts
- `supervisor_sequence_assignments` - Maps supervisors to their job number sequence

**Statuses:**
- `pending_supervisor` - Foreman submitted, waiting for supervisor review
- `pending_admin` - Ready for admin approval
- `approved` - Admin approved, job number assigned
- `exported` - Included in CSV export

**Job Number Format:** `01-D0X-XXXXX` (e.g., `01-D02-00488`)
- Each supervisor is assigned a sequence (D01, D02, etc.)
- On approval, the sequence counter increments atomically
- Uses PostgreSQL function `assign_job_number()` with row locking

**Job Types and CSV Prefixes:**
| Job Type | Display Label | Address Prefix for CSV |
|----------|---------------|------------------------|
| `regular_leak` | Regular Leak | (none) |
| `grade_1` | Grade 1 | `CO - Grade 1 - ` |
| `copper_service` | Copper Service | `CSVP - ` |
| `per_foot` | Per Foot | `Per Foot - ` |
| `bid` | BID | `BID - ` |

**CSV Export Columns (FileMaker compatible):**
1. `_fkCustomersID` - Static: "ATMOS Distribution"
2. `customers::CustName` - Static: "Atmos Distribution"
3. `jobdesc` - Address with job type prefix applied
4. `__pkJobsID` - Auto-assigned job number
5. `Job Status` - Static: "Open"
6. `Contract` - Project # (or blank)
7. `Contact` - FCC (or blank)
8. `AFE` - Leak # with "Leak #" prefix (e.g., "Leak #12345") or blank

**CSV Export Process:**
- Admin clicks "Export CSV" button on Approved tab
- Downloads to browser's default download folder
- Filename: `job_submissions_YYYY-MM-DD.csv`
- After download, prompt asks "Mark these jobs as exported?"
- If yes, jobs move to `exported` status

**Views:**
- `SubmitJobView` - Foremen/Supervisors/Admins submit new jobs
- `SupervisorJobReviewView` - Supervisors review foreman submissions
- `AdminJobSubmissionsView` - Admins approve jobs, bulk approve, export CSV
- `JobSettingsView` - Admins manage sequences and supervisor assignments

**Form Visibility:**
- Foremen only see the form if their crew's supervisor has a sequence assigned
- Supervisors only see the form if they have a sequence assigned
- Admins always see the form (they pick sequence from dropdown)

**Dashboard Notifications:**
- Supervisors see pending foreman job count
- Admins see pending admin approval count

**Supervisor Approval (RPC Function):**
Supervisor approval uses an RPC function to bypass RLS complexity:
```sql
-- Function: supervisor_approve_job(p_job_id UUID)
-- Validates supervisor can approve, then updates status to pending_admin
-- Called via: supabase.rpc('supervisor_approve_job', { p_job_id: job.id })
```

**RLS Policies for job_submissions:**
- Admins: full access (FOR ALL)
- Supervisors: can view own submissions, view/update foreman submissions (pending_supervisor only)
- Foremen: can view/insert own submissions

**Key RLS Note:** The supervisor update policy uses `WITH CHECK (true)` because the status changes from `pending_supervisor` to `pending_admin`, and a restrictive WITH CHECK would block the update.

**Database Functions:**
- `assign_job_number(p_submission_id, p_sequence_id)` - Atomic job number assignment with row locking
- `bulk_approve_job_submissions(p_submission_ids[], p_sequence_ids[])` - Bulk approval
- `supervisor_approve_job(p_job_id)` - SECURITY DEFINER function for supervisor approval
- `get_supervisor_sequence_id(p_supervisor_id)` - Helper to get supervisor's sequence
- `get_foreman_sequence_id(p_foreman_user_id)` - Helper to check if foreman can submit

### PWA Service Worker & Auto-Update

Uses **vite-plugin-pwa** to generate a Workbox service worker that precaches all static assets and detects new deployments.

**How updates work:**
1. Each Vercel deploy produces a new service worker with updated asset hashes
2. When an open session detects the new service worker, it fires a `pwa-update-available` DOM event
3. The `UpdateToast` component in `App.jsx` listens for this event and shows a bottom-of-screen banner
4. User taps "Update" to reload with the new version
5. Toast renders on all screens (loading, login, and main app) via `<UpdateToast />`

**Configuration:**
- `vite.config.js` — `VitePWA({ registerType: 'prompt' })` with Workbox precaching and manifest config
- `src/main.jsx` — Calls `registerSW()` from `virtual:pwa-register`, stores the update callback on `window.__pwaUpdateSW`
- `App.jsx` — `UpdateToast` component uses `useState`/`useEffect` to listen for the event and show/hide the prompt
- `manifest.json` (root) — Legacy file, no longer used; manifest is now generated by the plugin
- `index.html` — Manual `<link rel="manifest">` removed; plugin auto-injects it during build

**Key detail:** `registerType: 'prompt'` means the new service worker waits until the user clicks Update. Calling `window.__pwaUpdateSW(true)` triggers `skipWaiting()` + page reload.
