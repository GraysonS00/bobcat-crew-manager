# Job Submissions Feature — Implementation Spec

## Overview

A new workflow within the Bobcat Crew Manager app that replaces the current mix of texts, emails, Google Forms, PDFs, and word of mouth for getting job info into FileMaker. Supervisors submit job info through the app, admins review/approve, and approved jobs are exported as a FileMaker-ready CSV.

**Flow:** Supervisor submits → Admin reviews & approves (job # auto-assigned) → Admin exports CSV → Admin imports CSV into FileMaker Pro

---

## 1. New Supabase Tables

### job_submissions

```sql
CREATE TABLE public.job_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',  -- 'submitted', 'approved', 'exported'

  -- Job Type
  job_type TEXT NOT NULL,  -- 'regular_leak', 'grade_1', 'copper_service', 'per_foot', 'bid'

  -- Core Fields
  address TEXT NOT NULL,
  fcc TEXT,
  leak_number TEXT,
  project_number TEXT,

  -- Assigned at approval by admin
  job_number TEXT,

  -- Tracking
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### job_number_sequences

Tracks the auto-incrementing counter for each D0X sequence.

```sql
CREATE TABLE public.job_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT NOT NULL UNIQUE,        -- e.g., '01-D01', '01-D02', '01-D03', '01-D04'
  current_count INTEGER NOT NULL DEFAULT 0,  -- last used number (e.g., 487 means last job was 01-D01-00487)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial sequences (admin will set the starting counts)
INSERT INTO public.job_number_sequences (prefix, current_count) VALUES
  ('01-D01', 0),
  ('01-D02', 0),
  ('01-D03', 0),
  ('01-D04', 0);
```

### supervisor_sequence_assignments

Maps supervisors to their D0X sequence. Multiple supervisors can share a sequence.

```sql
CREATE TABLE public.supervisor_sequence_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID REFERENCES public.profiles(id) NOT NULL,
  sequence_id UUID REFERENCES public.job_number_sequences(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supervisor_id)  -- each supervisor belongs to exactly one sequence
);
```

### RLS Policies

```sql
-- job_submissions: admins see all, supervisors see their own
CREATE POLICY "Admins can view all job submissions" ON public.job_submissions
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Supervisors can view own submissions" ON public.job_submissions
  FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Supervisors can insert submissions" ON public.job_submissions
  FOR INSERT WITH CHECK (get_user_role() = 'supervisor' AND submitted_by = auth.uid());

CREATE POLICY "Admins can update submissions" ON public.job_submissions
  FOR UPDATE USING (get_user_role() = 'admin');

-- job_number_sequences: admin only
CREATE POLICY "Admins manage sequences" ON public.job_number_sequences
  FOR ALL USING (get_user_role() = 'admin');

-- supervisor_sequence_assignments: admin only for management, supervisors can read their own
CREATE POLICY "Admins manage sequence assignments" ON public.supervisor_sequence_assignments
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Supervisors can read own assignment" ON public.supervisor_sequence_assignments
  FOR SELECT USING (supervisor_id = auth.uid());
```

---

## 2. Job Type Prefixes

When exporting to CSV, the address is prefixed based on job type:

| Job Type (app value) | Display Label | Address Prefix |
|---|---|---|
| `regular_leak` | Regular Leak | *(none — just the address)* |
| `grade_1` | Grade 1 | `CO - Grade 1 - ` |
| `copper_service` | Copper Service | `CSVP - ` |
| `per_foot` | Per Foot | `Per Foot - ` |
| `bid` | BID | `BID - ` |

**Example:** Supervisor selects "Grade 1" and enters "1234 Main St, Dallas, TX"
→ CSV exports as: `CO - Grade 1 - 1234 Main St, Dallas, TX`

---

## 3. FileMaker CSV Export Mapping

The CSV columns must be in this exact order (left to right) with these exact headers to match FileMaker's import:

| Column Order | FileMaker Field Name | Source |
|---|---|---|
| 1 | `_fkCustomersID` | Static: `ATMOS Distribution` |
| 2 | `customers::CustName` | Static: `Atmos Distribution` |
| 3 | `jobdesc` | Address with job type prefix applied |
| 4 | `__pkJobsID` | Auto-assigned job number (e.g., `01-D02-00488`) |
| 5 | `Job Status` | Static: `Open` |
| 6 | `Contract` | Project # (can be blank) |
| 7 | `Contact` | FCC (can be blank) |
| 8 | `AFE` | Leak # (can be blank) |

---

## 4. Job Number Auto-Assignment

Job numbers follow the pattern: `01-D0X-XXXXX` (zero-padded to 5 digits)

**Logic (happens when admin clicks "Approve"):**

1. Look up which sequence the submitting supervisor is assigned to (via `supervisor_sequence_assignments`)
2. Get that sequence's `current_count` from `job_number_sequences`
3. Increment by 1
4. Format as `{prefix}-{count padded to 5 digits}` (e.g., `01-D02-00488`)
5. Save the job number to `job_submissions.job_number`
6. Update `job_number_sequences.current_count`

**Important:** This should be done in a transaction or use an atomic update to prevent race conditions if two approvals happen simultaneously.

---

## 5. UI Components

### A. Supervisor View — "Submit Job" Form

**Location:** New section/tab visible to supervisors (and admins)

**Form fields:**
- **Job Type** — Dropdown: Regular Leak, Grade 1, Copper Service, Per Foot, BID (required)
- **Address** — Text input (required)
- **FCC** — Text input (optional)
- **Leak #** — Text input (optional)
- **Project #** — Text input (optional)

**Below the form:** List of that supervisor's past submissions with status badges (Submitted / Approved / Exported)

### B. Admin View — "Job Submissions" Queue

**Location:** New section/tab visible to admins

**Tabs:**
- **Pending** — Status = 'submitted' (default view)
- **Approved** — Status = 'approved'
- **Exported** — Status = 'exported'
- **All** — All submissions

**Each job card shows:**
- Job type badge
- Full address (with prefix applied for display)
- FCC, Leak #, Project # (if provided)
- Submitted by (supervisor name)
- Submitted date
- Job # (if assigned)

**Actions on Pending jobs:**
- **Edit** — Admin can modify any field before approving
- **Approve** — Assigns job number, moves to approved status

**Export button (on Approved tab):**
- "Export to FileMaker CSV" — Downloads a CSV of all approved jobs
- After download, prompts: "Mark these jobs as exported?" → updates status to 'exported'

### C. Admin Settings — Sequence Management

**Location:** Within admin settings or a dedicated config area

**Two sections:**

**1. Job Number Sequences**
- Table showing each sequence prefix and its current count
- Admin can edit the current count for any sequence (for initial setup or corrections)
- Admin can add new sequences (e.g., D05, D06)

**2. Supervisor Assignments**
- List of all supervisors
- Dropdown next to each to assign their D0X sequence
- Multiple supervisors can be assigned to the same sequence

---

## 6. Status Flow

```
submitted  →  approved  →  exported
   (supervisor)   (admin approves,    (admin exports CSV,
                   job # assigned)     marks as exported)
```

---

## 7. Implementation Order (for Claude Code)

Break this into steps — do NOT try to implement everything at once.

### Step 1: Database Setup
- Create the three new tables in Supabase (`job_submissions`, `job_number_sequences`, `supervisor_sequence_assignments`)
- Set up RLS policies
- Seed initial sequences (D01–D04 with count 0)

### Step 2: Sequence Management UI (Admin Settings)
- Add admin UI to manage sequences (view/edit counts, add new prefixes)
- Add supervisor-to-sequence assignment UI

### Step 3: Supervisor Submission Form
- Build the job submission form
- Job type dropdown + address + FCC + leak # + project #
- Save to `job_submissions` table
- Show submission history for that supervisor

### Step 4: Admin Review Queue
- Build the pending/approved/exported tabs
- Edit and approve functionality
- Job number auto-assignment on approval

### Step 5: CSV Export
- Export approved jobs as CSV with FileMaker column headers
- Correct column order and static values
- Prefix applied to address
- Mark as exported after download

---

## 8. Notes

- All code lives in `src/App.jsx` (single-file architecture — follow existing patterns)
- Use existing Supabase client from `src/supabaseClient.js`
- Follow existing UI patterns (Tailwind styling, modal patterns, etc.) already in the app
- Empty strings should be converted to null before database inserts (existing pattern in the codebase)
- The supervisor submission form should be simple and fast — these guys are in the field
