// ============================================================
// Database Types
// ============================================================

export type UserRole = 'employee' | 'manager' | 'director' | 'vp' | 'admin';

export type ReportType = 'technical' | 'pm' | 'admin';

export type WorkTypeCategory = 'technical' | 'administrative' | 'specialized';

export type MSRStatus = 'draft' | 'finalized';

export type ReviewStatus = 'draft' | 'completed';

export type LatticeStatus = 'success' | 'failed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  azure_id: string | null;
  role: UserRole;
  default_manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  manager?: User;
}

export interface Project {
  id: string;
  name: string;
  contract_number: string | null;
  client_agency: string | null;
  project_type: string | null;
  start_date: string | null;
  end_date: string | null;
  program_manager_id: string | null;
  is_active: boolean;
  created_at: string;
  // joined
  program_manager?: User;
}

export interface WorkTypeTag {
  id: string;
  name: string;
  category: WorkTypeCategory;
  description: string | null;
}

export interface WeeklyStatusReport {
  id: string;
  user_id: string;
  project_id: string;
  week_ending: string;
  report_type: ReportType;
  accomplishments: string | null;
  blockers: string | null;
  this_week: string | null;
  next_week: string | null;
  hours_narrative: string | null;
  work_type_tags: string[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  user?: User;
  project?: Project;
}

export interface ManagerOverride {
  id: string;
  user_id: string;
  project_id: string;
  override_manager_id: string;
  reason: string | null;
  created_by: string;
  created_at: string;
  // joined
  user?: User;
  project?: Project;
  override_manager?: User;
}

export interface MonthlyStatusReport {
  id: string;
  project_id: string;
  month: string;
  generated_by: string;
  ai_summary: string | null;
  human_edited_summary: string | null;
  wsr_ids: string[];
  status: MSRStatus;
  created_at: string;
  updated_at: string;
  // joined
  project?: Project;
  generator?: User;
}

export interface QuarterlyReview {
  id: string;
  user_id: string;
  manager_id: string;
  quarter: string;
  start_date: string;
  end_date: string;
  ai_summary: string | null;
  manager_notes: string | null;
  wsr_ids: string[];
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  // joined
  user?: User;
  manager?: User;
}

export interface LatticeSyncLog {
  id: string;
  sync_date: string;
  records_synced: number;
  status: LatticeStatus;
  error_message: string | null;
}

// ============================================================
// UI / App Types
// ============================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  badge?: number;
}

export interface PastPerformanceFilters {
  client_agency?: string;
  work_type_tags?: string[];
  date_from?: string;
  date_to?: string;
  keyword?: string;
  project_id?: string;
}

export interface WSRFormData {
  project_id: string;
  week_ending: string;
  report_type: ReportType;
  accomplishments: string;
  blockers: string;
  this_week: string;
  next_week: string;
  hours_narrative: string;
  work_type_tags: string[];
}

// ============================================================
// API Response Types
// ============================================================

export interface GenerateMSRRequest {
  project_id: string;
  start_date: string;
  end_date: string;
}

export interface GenerateQuarterlyRequest {
  user_id: string;
  start_date: string;
  end_date: string;
  quarter: string;
}

export interface GeneratePastPerfRequest {
  filters: PastPerformanceFilters;
}

export interface EdgeFunctionResponse<T = unknown> {
  data: T | null;
  error: string | null;
}
