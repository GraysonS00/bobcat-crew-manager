-- =============================================
-- JOB SUBMISSIONS FEATURE - DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- =============================================
-- TABLES
-- =============================================

-- Job number sequences (D01, D02, D03, D04, etc.)
CREATE TABLE public.job_number_sequences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prefix TEXT NOT NULL UNIQUE,  -- e.g., '01-D01', '01-D02', '01-D03', '01-D04'
    current_count INTEGER NOT NULL DEFAULT 0,  -- last used number
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supervisor to sequence assignments
CREATE TABLE public.supervisor_sequence_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sequence_id UUID REFERENCES public.job_number_sequences(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supervisor_id)  -- each supervisor belongs to exactly one sequence
);

-- Job submissions
CREATE TABLE public.job_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Who submitted
    submitted_by UUID REFERENCES public.profiles(id) NOT NULL,

    -- Status: pending_supervisor, pending_admin, approved, exported
    status TEXT NOT NULL DEFAULT 'pending_admin'
        CHECK (status IN ('pending_supervisor', 'pending_admin', 'approved', 'exported')),

    -- Job Type
    job_type TEXT NOT NULL
        CHECK (job_type IN ('regular_leak', 'grade_1', 'copper_service', 'per_foot', 'bid')),

    -- Core Fields
    address TEXT NOT NULL,
    fcc TEXT,
    leak_number TEXT,
    project_number TEXT,

    -- Sequence (for admin submissions - they pick directly)
    -- For supervisor/foreman submissions, this is derived from supervisor's assignment
    sequence_id UUID REFERENCES public.job_number_sequences(id),

    -- Assigned at approval by admin
    job_number TEXT,

    -- Tracking - supervisor review (for foreman submissions)
    supervisor_reviewed_by UUID REFERENCES public.profiles(id),
    supervisor_reviewed_at TIMESTAMPTZ,

    -- Tracking - admin approval
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,

    -- Tracking - export
    exported_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.job_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_sequence_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_submissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - job_number_sequences
-- =============================================

-- Admins can do everything with sequences
CREATE POLICY "Admins can manage sequences" ON public.job_number_sequences
    FOR ALL USING (get_user_role() = 'admin');

-- Everyone authenticated can view sequences (needed for form visibility checks)
CREATE POLICY "Authenticated users can view sequences" ON public.job_number_sequences
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- RLS POLICIES - supervisor_sequence_assignments
-- =============================================

-- Admins can manage all assignments
CREATE POLICY "Admins can manage sequence assignments" ON public.supervisor_sequence_assignments
    FOR ALL USING (get_user_role() = 'admin');

-- Anyone authenticated can view assignments (needed for form visibility checks)
CREATE POLICY "Authenticated users can view sequence assignments" ON public.supervisor_sequence_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- RLS POLICIES - job_submissions
-- =============================================

-- Admins can do everything
CREATE POLICY "Admins can manage all job submissions" ON public.job_submissions
    FOR ALL USING (get_user_role() = 'admin');

-- Supervisors can view their own submissions
CREATE POLICY "Supervisors can view own submissions" ON public.job_submissions
    FOR SELECT USING (
        get_user_role() = 'supervisor'
        AND submitted_by = auth.uid()
    );

-- Supervisors can view submissions from their foremen (pending_supervisor status)
CREATE POLICY "Supervisors can view foreman submissions" ON public.job_submissions
    FOR SELECT USING (
        get_user_role() = 'supervisor'
        AND status = 'pending_supervisor'
        AND submitted_by IN (
            SELECT c.foreman_user_id
            FROM public.crews c
            WHERE c.supervisor_id = auth.uid()
            AND c.foreman_user_id IS NOT NULL
        )
    );

-- Supervisors can insert submissions
CREATE POLICY "Supervisors can insert submissions" ON public.job_submissions
    FOR INSERT WITH CHECK (
        get_user_role() = 'supervisor'
        AND submitted_by = auth.uid()
    );

-- Supervisors can update foreman submissions (to approve/edit before forwarding)
CREATE POLICY "Supervisors can update foreman submissions" ON public.job_submissions
    FOR UPDATE
    USING (
        get_user_role() = 'supervisor'
        AND status = 'pending_supervisor'
        AND submitted_by IN (
            SELECT c.foreman_user_id
            FROM public.crews c
            WHERE c.supervisor_id = auth.uid()
            AND c.foreman_user_id IS NOT NULL
        )
    )
    WITH CHECK (
        get_user_role() = 'supervisor'
        AND status IN ('pending_supervisor', 'pending_admin')
        AND submitted_by IN (
            SELECT c.foreman_user_id
            FROM public.crews c
            WHERE c.supervisor_id = auth.uid()
            AND c.foreman_user_id IS NOT NULL
        )
    );

-- Foremen can view their own submissions
CREATE POLICY "Foremen can view own submissions" ON public.job_submissions
    FOR SELECT USING (
        get_user_role() = 'foreman'
        AND submitted_by = auth.uid()
    );

-- Foremen can insert submissions
CREATE POLICY "Foremen can insert submissions" ON public.job_submissions
    FOR INSERT WITH CHECK (
        get_user_role() = 'foreman'
        AND submitted_by = auth.uid()
    );

-- =============================================
-- FUNCTION: Atomic job number assignment
-- =============================================

CREATE OR REPLACE FUNCTION public.assign_job_number(
    p_submission_id UUID,
    p_sequence_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_new_count INTEGER;
    v_job_number TEXT;
BEGIN
    -- Lock the sequence row and get current count
    SELECT prefix, current_count + 1
    INTO v_prefix, v_new_count
    FROM public.job_number_sequences
    WHERE id = p_sequence_id
    FOR UPDATE;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Sequence not found: %', p_sequence_id;
    END IF;

    -- Format job number (prefix + 5-digit zero-padded count)
    v_job_number := v_prefix || '-' || LPAD(v_new_count::TEXT, 5, '0');

    -- Update the sequence count
    UPDATE public.job_number_sequences
    SET current_count = v_new_count,
        updated_at = NOW()
    WHERE id = p_sequence_id;

    -- Update the submission with the job number
    UPDATE public.job_submissions
    SET job_number = v_job_number,
        status = 'approved',
        approved_at = NOW(),
        approved_by = auth.uid(),
        sequence_id = p_sequence_id,
        updated_at = NOW()
    WHERE id = p_submission_id;

    RETURN v_job_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Bulk approve job submissions
-- =============================================

CREATE OR REPLACE FUNCTION public.bulk_approve_job_submissions(
    p_submission_ids UUID[],
    p_sequence_ids UUID[]  -- parallel array: sequence for each submission
)
RETURNS TABLE(submission_id UUID, job_number TEXT) AS $$
DECLARE
    i INTEGER;
    v_job_number TEXT;
BEGIN
    -- Validate arrays have same length
    IF array_length(p_submission_ids, 1) != array_length(p_sequence_ids, 1) THEN
        RAISE EXCEPTION 'submission_ids and sequence_ids must have the same length';
    END IF;

    -- Process each submission
    FOR i IN 1..array_length(p_submission_ids, 1) LOOP
        v_job_number := public.assign_job_number(p_submission_ids[i], p_sequence_ids[i]);
        submission_id := p_submission_ids[i];
        job_number := v_job_number;
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_job_number_sequences_updated_at
    BEFORE UPDATE ON public.job_number_sequences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_job_submissions_updated_at
    BEFORE UPDATE ON public.job_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DATA - Initial sequences
-- =============================================

INSERT INTO public.job_number_sequences (prefix, current_count) VALUES
    ('01-D01', 0),
    ('01-D02', 0),
    ('01-D03', 0),
    ('01-D04', 0);

-- =============================================
-- HELPER FUNCTION: Get supervisor's sequence
-- =============================================

CREATE OR REPLACE FUNCTION public.get_supervisor_sequence_id(p_supervisor_id UUID)
RETURNS UUID AS $$
    SELECT sequence_id
    FROM public.supervisor_sequence_assignments
    WHERE supervisor_id = p_supervisor_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- HELPER FUNCTION: Get foreman's supervisor's sequence
-- (for checking if foreman can see the submission form)
-- =============================================

CREATE OR REPLACE FUNCTION public.get_foreman_sequence_id(p_foreman_user_id UUID)
RETURNS UUID AS $$
    SELECT ssa.sequence_id
    FROM public.crews c
    JOIN public.supervisor_sequence_assignments ssa ON ssa.supervisor_id = c.supervisor_id
    WHERE c.foreman_user_id = p_foreman_user_id
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- FUNCTION: Supervisor approve job (bypasses RLS)
-- =============================================

CREATE OR REPLACE FUNCTION public.supervisor_approve_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_job RECORD;
    v_is_valid BOOLEAN := FALSE;
BEGIN
    -- Get the job
    SELECT * INTO v_job FROM public.job_submissions WHERE id = p_job_id;

    IF v_job IS NULL THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    -- Check if current user is a supervisor
    IF get_user_role() != 'supervisor' THEN
        RAISE EXCEPTION 'Only supervisors can use this function';
    END IF;

    -- Check if job is pending supervisor review
    IF v_job.status != 'pending_supervisor' THEN
        RAISE EXCEPTION 'Job is not pending supervisor review';
    END IF;

    -- Check if the submitter is a foreman on one of this supervisor's crews
    SELECT EXISTS (
        SELECT 1 FROM public.crews c
        WHERE c.supervisor_id = auth.uid()
        AND c.foreman_user_id = v_job.submitted_by
    ) INTO v_is_valid;

    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'You can only approve jobs from your foremen';
    END IF;

    -- Do the update
    UPDATE public.job_submissions
    SET status = 'pending_admin',
        supervisor_reviewed_by = auth.uid(),
        supervisor_reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_job_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
