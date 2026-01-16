-- =============================================
-- BOBCAT CREW MANAGER - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'foreman')),
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table (all workers including foremen)
CREATE TABLE public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('Foreman', 'Skilled Labor', 'General Labor', 'Operator')),
    phone TEXT,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crews table
CREATE TABLE public.crews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    foreman_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    foreman_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew members junction table
CREATE TABLE public.crew_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crew_id UUID REFERENCES public.crews(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crew_id, employee_id)
);

-- Equipment table
CREATE TABLE public.equipment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('Truck', 'Trailer', 'Excavator', 'Tool', 'Other')),
    description TEXT NOT NULL,
    equipment_number TEXT NOT NULL,
    serial_number TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'In Service' CHECK (status IN ('In Service', 'Out of Service')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job reports table
CREATE TABLE public.job_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL NOT NULL,
    job_number TEXT NOT NULL,
    job_date DATE NOT NULL,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job report employees (who was on site)
CREATE TABLE public.job_report_employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.job_reports(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    hours_worked DECIMAL(4,2),
    UNIQUE(report_id, employee_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_report_employees ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get current user's crew_id (for foremen)
CREATE OR REPLACE FUNCTION public.get_user_crew_id()
RETURNS UUID AS $$
  SELECT id FROM public.crews WHERE foreman_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can manage profiles" ON public.profiles
    FOR ALL USING (get_user_role() = 'admin');

-- EMPLOYEES policies
CREATE POLICY "Anyone authenticated can view employees" ON public.employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage employees" ON public.employees
    FOR ALL USING (get_user_role() = 'admin');

-- CREWS policies
CREATE POLICY "Anyone authenticated can view crews" ON public.crews
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all crews" ON public.crews
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Foremen can update own crew" ON public.crews
    FOR UPDATE USING (foreman_user_id = auth.uid());

-- CREW_MEMBERS policies
CREATE POLICY "Anyone authenticated can view crew members" ON public.crew_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage crew members" ON public.crew_members
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Foremen can manage own crew members" ON public.crew_members
    FOR ALL USING (
        crew_id IN (SELECT id FROM public.crews WHERE foreman_user_id = auth.uid())
    );

-- EQUIPMENT policies
CREATE POLICY "Anyone authenticated can view equipment" ON public.equipment
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all equipment" ON public.equipment
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Foremen can manage own crew equipment" ON public.equipment
    FOR ALL USING (
        crew_id IN (SELECT id FROM public.crews WHERE foreman_user_id = auth.uid())
    );

-- JOB_REPORTS policies
CREATE POLICY "Anyone authenticated can view job reports" ON public.job_reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all job reports" ON public.job_reports
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Foremen can manage own crew job reports" ON public.job_reports
    FOR ALL USING (
        crew_id IN (SELECT id FROM public.crews WHERE foreman_user_id = auth.uid())
    );

-- JOB_REPORT_EMPLOYEES policies
CREATE POLICY "Anyone authenticated can view job report employees" ON public.job_report_employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage job report employees" ON public.job_report_employees
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Foremen can manage own report employees" ON public.job_report_employees
    FOR ALL USING (
        report_id IN (
            SELECT id FROM public.job_reports 
            WHERE crew_id IN (SELECT id FROM public.crews WHERE foreman_user_id = auth.uid())
        )
    );

-- =============================================
-- STORAGE BUCKET FOR EQUIPMENT PHOTOS
-- =============================================

-- Create storage bucket for equipment photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('equipment-photos', 'equipment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload equipment photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'equipment-photos' 
    AND auth.role() = 'authenticated'
);

-- Allow anyone to view equipment photos (they're public)
CREATE POLICY "Anyone can view equipment photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-photos');

-- Allow users to update/delete their uploads
CREATE POLICY "Users can manage own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_crews_updated_at
    BEFORE UPDATE ON public.crews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- FUNCTION TO CREATE PROFILE ON USER SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'foreman')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
