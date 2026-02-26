-- ============================================================
-- Dynamo WSR Platform — Initial Schema
-- ============================================================
-- Run this in your Supabase SQL editor or via supabase db push

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('employee', 'manager', 'director', 'vp', 'admin');
CREATE TYPE report_type AS ENUM ('technical', 'pm', 'admin');
CREATE TYPE work_type_category AS ENUM ('technical', 'administrative', 'specialized');
CREATE TYPE msr_status AS ENUM ('draft', 'finalized');
CREATE TYPE review_status AS ENUM ('draft', 'completed');
CREATE TYPE sync_status AS ENUM ('success', 'failed');

-- ============================================================
-- TABLES
-- ============================================================

-- Users (synced from Supabase Auth + Lattice)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    azure_id TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'employee',
    default_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects / Contracts
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contract_number TEXT,
    client_agency TEXT,
    project_type TEXT,
    start_date DATE,
    end_date DATE,
    program_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Type Tags (taxonomy)
CREATE TABLE public.work_type_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category work_type_category NOT NULL DEFAULT 'technical',
    description TEXT
);

-- Weekly Status Reports (core table)
CREATE TABLE public.weekly_status_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    week_ending DATE NOT NULL,
    report_type report_type NOT NULL DEFAULT 'technical',
    accomplishments TEXT,
    blockers TEXT,
    this_week TEXT,
    next_week TEXT,
    hours_narrative TEXT,
    work_type_tags TEXT[] DEFAULT '{}',
    content_embedding vector(1536),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id, week_ending)
);

-- Manager Overrides (project-specific manager assignments)
CREATE TABLE public.manager_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    override_manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id, override_manager_id)
);

-- Monthly Status Reports (AI-generated summaries)
CREATE TABLE public.monthly_status_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    generated_by UUID NOT NULL REFERENCES public.users(id),
    ai_summary TEXT,
    human_edited_summary TEXT,
    wsr_ids UUID[] DEFAULT '{}',
    status msr_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quarterly Reviews (AI-generated performance summaries)
CREATE TABLE public.quarterly_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.users(id),
    quarter TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    ai_summary TEXT,
    manager_notes TEXT,
    wsr_ids UUID[] DEFAULT '{}',
    status review_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lattice Sync Log
CREATE TABLE public.lattice_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    records_synced INTEGER NOT NULL DEFAULT 0,
    status sync_status NOT NULL,
    error_message TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_manager ON public.users(default_manager_id);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = true;

-- Projects
CREATE INDEX idx_projects_active ON public.projects(is_active) WHERE is_active = true;
CREATE INDEX idx_projects_agency ON public.projects(client_agency);
CREATE INDEX idx_projects_pm ON public.projects(program_manager_id);

-- WSRs
CREATE INDEX idx_wsrs_user ON public.weekly_status_reports(user_id);
CREATE INDEX idx_wsrs_project ON public.weekly_status_reports(project_id);
CREATE INDEX idx_wsrs_week ON public.weekly_status_reports(week_ending DESC);
CREATE INDEX idx_wsrs_user_week ON public.weekly_status_reports(user_id, week_ending DESC);
CREATE INDEX idx_wsrs_project_week ON public.weekly_status_reports(project_id, week_ending DESC);
CREATE INDEX idx_wsrs_tags ON public.weekly_status_reports USING GIN(work_type_tags);

-- Vector index for semantic search (create after data is loaded)
CREATE INDEX idx_wsrs_embedding ON public.weekly_status_reports
    USING ivfflat (content_embedding vector_cosine_ops)
    WITH (lists = 100);

-- Manager Overrides
CREATE INDEX idx_overrides_user ON public.manager_overrides(user_id);
CREATE INDEX idx_overrides_manager ON public.manager_overrides(override_manager_id);

-- MSRs
CREATE INDEX idx_msrs_project ON public.monthly_status_reports(project_id);
CREATE INDEX idx_msrs_month ON public.monthly_status_reports(month DESC);

-- Quarterly Reviews
CREATE INDEX idx_reviews_user ON public.quarterly_reviews(user_id);
CREATE INDEX idx_reviews_manager ON public.quarterly_reviews(manager_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if a user is a manager of another user
CREATE OR REPLACE FUNCTION public.is_manager_of(manager_uid UUID, employee_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = employee_uid
          AND u.default_manager_id = manager_uid
    ) OR EXISTS (
        SELECT 1 FROM public.manager_overrides mo
        WHERE mo.user_id = employee_uid
          AND mo.override_manager_id = manager_uid
    );
$$;

-- Get all direct reports for a manager (includes overrides)
CREATE OR REPLACE FUNCTION public.get_team_ids(manager_uid UUID)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id AS user_id FROM public.users WHERE default_manager_id = manager_uid
    UNION
    SELECT mo.user_id FROM public.manager_overrides mo WHERE mo.override_manager_id = manager_uid;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER wsrs_updated_at BEFORE UPDATE ON public.weekly_status_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER msrs_updated_at BEFORE UPDATE ON public.monthly_status_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.quarterly_reviews
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pgvector similarity search RPC
CREATE OR REPLACE FUNCTION public.search_wsrs_by_embedding(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    similarity float
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        id,
        1 - (content_embedding <=> query_embedding) AS similarity
    FROM public.weekly_status_reports
    WHERE content_embedding IS NOT NULL
      AND 1 - (content_embedding <=> query_embedding) > match_threshold
    ORDER BY content_embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_type_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_status_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_status_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lattice_sync_log ENABLE ROW LEVEL SECURITY;

-- ─── Users policies ──────────────────────────────────────────

-- All authenticated users can read users (for dropdowns, lookups)
CREATE POLICY "Users are viewable by authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Users can update their own basic info (not role/manager)
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admins can insert/update any user
CREATE POLICY "Admins can manage all users"
ON public.users FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ─── Projects policies ───────────────────────────────────────

-- All authenticated users can view active projects
CREATE POLICY "Active projects viewable by all"
ON public.projects FOR SELECT
TO authenticated
USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
));

-- Admins can manage all projects
CREATE POLICY "Admins can manage projects"
ON public.projects FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ─── Work Type Tags policies ─────────────────────────────────

CREATE POLICY "Tags viewable by all authenticated"
ON public.work_type_tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tags"
ON public.work_type_tags FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ─── Weekly Status Reports policies ──────────────────────────

-- Employees see own WSRs
CREATE POLICY "Users can view own WSRs"
ON public.weekly_status_reports FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Managers see their team's WSRs
CREATE POLICY "Managers can view team WSRs"
ON public.weekly_status_reports FOR SELECT
TO authenticated
USING (
    public.is_manager_of(auth.uid(), user_id)
);

-- Admins see everything
CREATE POLICY "Admins can view all WSRs"
ON public.weekly_status_reports FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Only own WSRs can be inserted
CREATE POLICY "Users insert own WSRs"
ON public.weekly_status_reports FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only own WSRs can be updated
CREATE POLICY "Users update own WSRs"
ON public.weekly_status_reports FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Only own WSRs can be deleted (within 7 days)
CREATE POLICY "Users delete own recent WSRs"
ON public.weekly_status_reports FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '7 days'
);

-- ─── Manager Overrides policies ──────────────────────────────

CREATE POLICY "Admins manage overrides"
ON public.manager_overrides FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Managers view their overrides"
ON public.manager_overrides FOR SELECT
TO authenticated
USING (
    override_manager_id = auth.uid()
    OR user_id = auth.uid()
);

-- ─── Monthly Status Reports policies ─────────────────────────

CREATE POLICY "Managers can view MSRs for their projects"
ON public.monthly_status_reports FOR SELECT
TO authenticated
USING (
    generated_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.program_manager_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Managers can manage MSRs"
ON public.monthly_status_reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('manager', 'director', 'vp', 'admin')
    )
);

-- ─── Quarterly Reviews policies ──────────────────────────────

CREATE POLICY "Employees can view own reviews"
ON public.quarterly_reviews FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view and manage reviews for their reports"
ON public.quarterly_reviews FOR ALL
TO authenticated
USING (
    manager_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ─── Lattice Sync Log policies ────────────────────────────────

CREATE POLICY "Admins can view sync logs"
ON public.lattice_sync_log FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- SEED DATA — Work Type Tags
-- ============================================================

INSERT INTO public.work_type_tags (name, category, description) VALUES
    -- Technical
    ('API Development', 'technical', 'REST/GraphQL API design and implementation'),
    ('Cybersecurity', 'technical', 'Security assessments, vulnerability management, SIEM'),
    ('Data Engineering', 'technical', 'Data pipelines, warehouses, and analytics infrastructure'),
    ('ETL', 'technical', 'Extract, transform, load processes and pipelines'),
    ('Cloud Infrastructure', 'technical', 'AWS/Azure/GCP infrastructure provisioning and management'),
    ('DevSecOps', 'technical', 'CI/CD, security integration, deployment automation'),
    ('Machine Learning', 'technical', 'ML model development, training, and deployment'),
    ('Software Development', 'technical', 'Application development and coding'),
    ('Systems Integration', 'technical', 'Integrating disparate systems and APIs'),
    ('Testing/QA', 'technical', 'Unit testing, integration testing, QA processes'),
    ('Documentation', 'technical', 'Technical writing and documentation'),
    ('Code Review', 'technical', 'Peer review and code quality processes'),
    -- Administrative / PM
    ('Program Management', 'administrative', 'Program planning, scheduling, and execution'),
    ('Capture', 'administrative', 'Business development and opportunity capture'),
    ('Business Development', 'administrative', 'BD activities, partnerships, and growth'),
    ('Proposal Writing', 'administrative', 'Technical and management proposal writing'),
    ('Risk Management', 'administrative', 'Risk identification, assessment, and mitigation'),
    ('Stakeholder Engagement', 'administrative', 'Client and stakeholder communications'),
    ('Contract Management', 'administrative', 'Contract administration and compliance'),
    ('Budget Tracking', 'administrative', 'Financial reporting and cost management'),
    ('Reporting', 'administrative', 'Status reporting, dashboards, and metrics'),
    ('Planning', 'administrative', 'Project and program planning activities'),
    ('Status Meetings', 'administrative', 'Running or attending status and coordination meetings'),
    ('Human Resources', 'administrative', 'Recruiting, onboarding, HR administration'),
    ('Administrative Support', 'administrative', 'General administrative tasks'),
    ('Finance', 'administrative', 'Financial management and accounting'),
    ('Procurement', 'administrative', 'Purchasing and vendor management'),
    ('Training', 'administrative', 'Training development and delivery'),
    ('Compliance', 'administrative', 'Regulatory and policy compliance'),
    -- Specialized
    ('FISMA Compliance', 'specialized', 'Federal Information Security Management Act compliance'),
    ('FedRAMP', 'specialized', 'Federal Risk and Authorization Management Program'),
    ('Zero Trust Architecture', 'specialized', 'Zero trust security framework implementation'),
    ('CISA Mission Support', 'specialized', 'CISA-specific mission and operational support'),
    ('Clearance Required Work', 'specialized', 'Work requiring security clearance'),
    ('OSINT', 'specialized', 'Open source intelligence gathering and analysis'),
    ('Digital Forensics', 'specialized', 'Forensic analysis and incident investigation');
