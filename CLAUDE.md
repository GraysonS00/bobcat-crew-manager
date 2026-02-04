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
