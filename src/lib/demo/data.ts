/**
 * Demo data for local development / stakeholder demos.
 * Activated when the demo_auth cookie is present.
 * All UUIDs are deterministic fake values.
 */

import type { User, Project, WorkTypeTag, WeeklyStatusReport, MonthlyStatusReport, QuarterlyReview } from '$lib/types';

// ─── User IDs ─────────────────────────────────────────────────
export const DEMO_USER_ID = 'aa000001-0000-0000-0000-000000000001';
const SARAH_ID   = 'aa000002-0000-0000-0000-000000000002';
const MARCUS_ID  = 'aa000003-0000-0000-0000-000000000003';
const PRIYA_ID   = 'aa000004-0000-0000-0000-000000000004';
const ALEX_ID    = 'aa000005-0000-0000-0000-000000000005';
const JORDAN_ID  = 'aa000006-0000-0000-0000-000000000006';
const TAYLOR_ID  = 'aa000007-0000-0000-0000-000000000007';
const MIKE_ID    = 'aa000008-0000-0000-0000-000000000008';

// ─── Project IDs ──────────────────────────────────────────────
const CISA_ID     = 'bb000001-0000-0000-0000-000000000001';
const DOD_ZT_ID   = 'bb000002-0000-0000-0000-000000000002';
const FBI_ID      = 'bb000003-0000-0000-0000-000000000003';
const INTERNAL_ID = 'bb000004-0000-0000-0000-000000000004';
const DOS_ID      = 'bb000005-0000-0000-0000-000000000005';

// ─── Demo Users ───────────────────────────────────────────────
export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'admin.one@dynamo.works',
  full_name: 'Admin One',
  azure_id: null,
  role: 'admin',
  default_manager_id: null,
  is_active: true,
  created_at: '2024-01-15T09:00:00Z',
  updated_at: '2025-01-15T09:00:00Z'
};

export const DEMO_USERS: User[] = [
  DEMO_USER,
  {
    id: SARAH_ID, email: 'sarah.chen@dynamo.works', full_name: 'Sarah Chen', azure_id: null,
    role: 'director', default_manager_id: DEMO_USER_ID, is_active: true,
    created_at: '2024-01-15T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: MARCUS_ID, email: 'marcus.johnson@dynamo.works', full_name: 'Marcus Johnson', azure_id: null,
    role: 'manager', default_manager_id: SARAH_ID, is_active: true,
    created_at: '2024-02-01T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: PRIYA_ID, email: 'priya.patel@dynamo.works', full_name: 'Priya Patel', azure_id: null,
    role: 'employee', default_manager_id: DEMO_USER_ID, is_active: true,
    created_at: '2024-03-01T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: ALEX_ID, email: 'alex.rivera@dynamo.works', full_name: 'Alex Rivera', azure_id: null,
    role: 'employee', default_manager_id: DEMO_USER_ID, is_active: true,
    created_at: '2024-03-15T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: JORDAN_ID, email: 'jordan.lee@dynamo.works', full_name: 'Jordan Lee', azure_id: null,
    role: 'employee', default_manager_id: MARCUS_ID, is_active: true,
    created_at: '2024-04-01T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: TAYLOR_ID, email: 'taylor.kim@dynamo.works', full_name: 'Taylor Kim', azure_id: null,
    role: 'employee', default_manager_id: MARCUS_ID, is_active: true,
    created_at: '2024-04-15T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: MIKE_ID, email: 'mike.torres@dynamo.works', full_name: 'Mike Torres', azure_id: null,
    role: 'employee', default_manager_id: DEMO_USER_ID, is_active: true,
    created_at: '2024-05-01T09:00:00Z', updated_at: '2025-01-15T09:00:00Z'
  }
];

// ─── Demo Projects ────────────────────────────────────────────
export const DEMO_PROJECTS: Project[] = [
  {
    id: CISA_ID, name: 'DHS CISA Cyber Defense Task Order 5',
    contract_number: 'HSHQDC-20-D-00007', client_agency: 'DHS',
    project_type: 'Prime', start_date: '2022-10-01', end_date: '2026-09-30',
    program_manager_id: DEMO_USER_ID, is_active: true,
    created_at: '2022-09-15T09:00:00Z',
    program_manager: DEMO_USER
  },
  {
    id: DOD_ZT_ID, name: 'DoD Zero Trust Architecture Implementation',
    contract_number: 'FA8750-23-C-0041', client_agency: 'DoD',
    project_type: 'Prime', start_date: '2023-04-01', end_date: '2025-09-30',
    program_manager_id: SARAH_ID, is_active: true,
    created_at: '2023-03-20T09:00:00Z',
    program_manager: DEMO_USERS.find(u => u.id === SARAH_ID)
  },
  {
    id: FBI_ID, name: 'FBI Cybersecurity Platform Modernization',
    contract_number: 'DJF-22-1400-PR-0067821', client_agency: 'FBI',
    project_type: 'Subcontractor', start_date: '2023-01-15', end_date: '2025-07-14',
    program_manager_id: MARCUS_ID, is_active: true,
    created_at: '2023-01-05T09:00:00Z',
    program_manager: DEMO_USERS.find(u => u.id === MARCUS_ID)
  },
  {
    id: DOS_ID, name: 'DOS Digital Transformation Initiative',
    contract_number: 'SAQMMA-22-D-0233', client_agency: 'DOS',
    project_type: 'Task Order', start_date: '2023-09-01', end_date: '2026-08-31',
    program_manager_id: SARAH_ID, is_active: true,
    created_at: '2023-08-20T09:00:00Z',
    program_manager: DEMO_USERS.find(u => u.id === SARAH_ID)
  },
  {
    id: INTERNAL_ID, name: 'Dynamo AI/ML Research & Innovation',
    contract_number: null, client_agency: 'Internal',
    project_type: 'Internal R&D', start_date: '2024-01-01', end_date: null,
    program_manager_id: DEMO_USER_ID, is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    program_manager: DEMO_USER
  }
];

// ─── Demo Work Type Tags ──────────────────────────────────────
export const DEMO_TAGS: WorkTypeTag[] = [
  { id: 'cc000001', name: 'API Development', category: 'technical', description: null },
  { id: 'cc000002', name: 'Cybersecurity', category: 'technical', description: null },
  { id: 'cc000003', name: 'Cloud Infrastructure', category: 'technical', description: null },
  { id: 'cc000004', name: 'DevSecOps', category: 'technical', description: null },
  { id: 'cc000005', name: 'Zero Trust Architecture', category: 'specialized', description: null },
  { id: 'cc000006', name: 'Data Engineering', category: 'technical', description: null },
  { id: 'cc000007', name: 'Machine Learning', category: 'technical', description: null },
  { id: 'cc000008', name: 'Program Management', category: 'administrative', description: null },
  { id: 'cc000009', name: 'Stakeholder Engagement', category: 'administrative', description: null },
  { id: 'cc000010', name: 'FISMA Compliance', category: 'specialized', description: null },
  { id: 'cc000011', name: 'Systems Integration', category: 'technical', description: null },
  { id: 'cc000012', name: 'Reporting', category: 'administrative', description: null },
  { id: 'cc000013', name: 'FedRAMP', category: 'specialized', description: null },
  { id: 'cc000014', name: 'CISA Mission Support', category: 'specialized', description: null }
];

// ─── Demo WSRs ────────────────────────────────────────────────
export const DEMO_WSRS: (WeeklyStatusReport & { user?: User; project?: Project })[] = [
  // ── Devin Hill WSRs ──
  {
    id: 'dd000001', user_id: DEMO_USER_ID, project_id: CISA_ID,
    week_ending: '2025-02-21', report_type: 'pm',
    accomplishments: 'Completed Q1 program review with CISA CO and COR. Finalized subcontractor invoicing for January (total: $1.2M). Approved Task Order 6 kickoff materials and submitted CDRLs on schedule. Resolved two outstanding action items from the February 7th IPT meeting.',
    blockers: 'Awaiting GFE laptop allocation for two new hires starting March 3rd. Escalated to contracting officer.',
    this_week: 'Facilitated Program Increment (PI) Planning session with all 8 technical workstream leads. Reviewed and approved 3 PWS modifications for expanded cyber scope. Met with CISA ISSO to discuss upcoming security review timeline.',
    next_week: 'Draft TO6 Monthly Status Report for April submission. Host bi-weekly technical sync with CISA mission owner. Complete performance reviews for Q4 2024 for direct reports.',
    hours_narrative: '40 hrs total: 30 hrs CISA TO5 PM activities, 10 hrs proposal support for upcoming recompete',
    work_type_tags: ['Program Management', 'CISA Mission Support', 'Stakeholder Engagement'],
    submitted_at: '2025-02-21T17:22:00Z', created_at: '2025-02-21T17:22:00Z', updated_at: '2025-02-21T17:22:00Z',
    user: DEMO_USER, project: DEMO_PROJECTS[0]
  },
  {
    id: 'dd000002', user_id: DEMO_USER_ID, project_id: CISA_ID,
    week_ending: '2025-02-14', report_type: 'pm',
    accomplishments: 'Led Integrated Product Team (IPT) with 22 attendees. Submitted monthly financial report showing 98.2% on-budget performance. Onboarded 2 new technical resources to the CISA network enclave. Completed deliverable CDR-017 (Transition Plan) ahead of schedule.',
    blockers: 'Network access provisioning for new teammates taking 3+ weeks — working with CISA IT to expedite.',
    this_week: 'Finalized CDR-017 deliverable and obtained COR acceptance. Conducted 1-on-1 check-ins with all 12 direct and indirect reports. Reviewed and submitted monthly burn rate analysis.',
    next_week: 'Prepare for Q1 Quarterly Business Review (QBR) presentation. Initiate scope change request for additional SIEM tuning activities.',
    hours_narrative: '40 hrs: 35 hrs PM/program activities, 5 hrs BD support for DHS SEWP recompete',
    work_type_tags: ['Program Management', 'CISA Mission Support', 'Reporting'],
    submitted_at: '2025-02-14T16:45:00Z', created_at: '2025-02-14T16:45:00Z', updated_at: '2025-02-14T16:45:00Z',
    user: DEMO_USER, project: DEMO_PROJECTS[0]
  },
  {
    id: 'dd000003', user_id: DEMO_USER_ID, project_id: INTERNAL_ID,
    week_ending: '2025-02-07', report_type: 'technical',
    accomplishments: 'Completed proof-of-concept for AI-powered WSR summarization using Claude API — achieved 94% relevance score in internal testing. Presented findings to leadership. Defined MVP feature set for Dynamo WSR Platform v1.0.',
    blockers: 'None.',
    this_week: 'Developed Claude API integration prototype. Tested pgvector similarity search for past performance retrieval. Drafted architecture decision records (ADRs) for tech stack selection.',
    next_week: 'Begin SvelteKit frontend scaffolding. Set up Supabase project and run schema migration. Build WSR submission form MVP.',
    hours_narrative: '15 hrs allocated to IR&D (20% time)',
    work_type_tags: ['API Development', 'Machine Learning', 'Software Development'],
    submitted_at: '2025-02-07T17:58:00Z', created_at: '2025-02-07T17:58:00Z', updated_at: '2025-02-07T17:58:00Z',
    user: DEMO_USER, project: DEMO_PROJECTS[4]
  },

  // ── Priya Patel WSRs ──
  {
    id: 'dd000010', user_id: PRIYA_ID, project_id: CISA_ID,
    week_ending: '2025-02-21', report_type: 'technical',
    accomplishments: 'Deployed 3 new Splunk SIEM detection rules targeting MITRE ATT&CK T1078 (Valid Accounts) and T1566 (Phishing). Reduced false positive rate by 31% through alert tuning. Completed FISMA Annual Assessment questionnaire Section 4 (Incident Response).',
    blockers: 'Splunk ES version upgrade blocked by CISA change freeze until March 15. Documenting workarounds.',
    this_week: 'Developed and tested 3 new SIEM detection content packages. Conducted threat hunt across 45-day endpoint telemetry dataset — identified 2 suspicious lateral movement patterns (no confirmed incidents). Reviewed and commented on the CISA Cyber Defense SOW amendment.',
    next_week: 'Complete remaining FISMA assessment sections 5-7. Begin SIEM dashboard redesign for executive reporting. Coordinate vulnerability scan with CISA ISSO for Q1 POA&M updates.',
    hours_narrative: '40 hrs: 36 hrs CISA TO5 cybersecurity work, 4 hrs FISMA documentation',
    work_type_tags: ['Cybersecurity', 'CISA Mission Support', 'FISMA Compliance'],
    submitted_at: '2025-02-21T16:30:00Z', created_at: '2025-02-21T16:30:00Z', updated_at: '2025-02-21T16:30:00Z',
    user: DEMO_USERS[3], project: DEMO_PROJECTS[0]
  },
  {
    id: 'dd000011', user_id: PRIYA_ID, project_id: CISA_ID,
    week_ending: '2025-02-14', report_type: 'technical',
    accomplishments: 'Architected and delivered 2 new REST API endpoints connecting CISA\'s threat intelligence platform to the Elasticsearch data lake. APIs handle ~12,000 events/minute in load testing. Completed peer code review for 3 colleague PRs.',
    blockers: 'API authentication issue with legacy CISA system requiring coordination with government-side developers.',
    this_week: 'Built and documented /api/v2/threat-feeds and /api/v2/ioc-ingest endpoints. Implemented OAuth 2.0 token refresh logic. Set up integration test suite with 47 test cases.',
    next_week: 'Deploy APIs to staging environment. Begin SIEM detection content development for new threat intel feeds.',
    hours_narrative: '40 hrs: API development and testing',
    work_type_tags: ['API Development', 'Cybersecurity', 'Systems Integration'],
    submitted_at: '2025-02-14T15:20:00Z', created_at: '2025-02-14T15:20:00Z', updated_at: '2025-02-14T15:20:00Z',
    user: DEMO_USERS[3], project: DEMO_PROJECTS[0]
  },
  {
    id: 'dd000012', user_id: PRIYA_ID, project_id: CISA_ID,
    week_ending: '2025-02-07', report_type: 'technical',
    accomplishments: 'Completed ETL pipeline for ingesting STIX/TAXII threat intelligence feeds into the CISA data lake. Pipeline processes 3 external feeds (ISAC, FS-ISAC, DIB-ISAC) with 99.7% uptime over first week of operation. Delivered technical design document.',
    blockers: 'None this week.',
    this_week: 'Built and tested ETL pipeline using Python/Airflow. Implemented data validation and deduplication logic. Set up monitoring alerts in CloudWatch.',
    next_week: 'Add 2 additional ISAC feeds. Begin API development work for threat intel exposure.',
    hours_narrative: '40 hrs: ETL/data engineering focus',
    work_type_tags: ['ETL', 'Data Engineering', 'API Development', 'CISA Mission Support'],
    submitted_at: '2025-02-07T17:10:00Z', created_at: '2025-02-07T17:10:00Z', updated_at: '2025-02-07T17:10:00Z',
    user: DEMO_USERS[3], project: DEMO_PROJECTS[0]
  },

  // ── Alex Rivera WSRs ──
  {
    id: 'dd000020', user_id: ALEX_ID, project_id: DOD_ZT_ID,
    week_ending: '2025-02-21', report_type: 'technical',
    accomplishments: 'Completed Pillar 2 (Device) implementation for 1,847 managed endpoints enrolled in Microsoft Endpoint Manager. Achieved 99.1% compliance posture on DISA STIG benchmarks. Delivered Pillar 2 Technical Design Document v2.1 accepted by government COR.',
    blockers: 'Legacy NIPRNET printers (143 devices) cannot support TPM-based attestation — documenting exception request for CIO review.',
    this_week: 'Finalized MEM device compliance policies and deployed via GPO. Validated Conditional Access policies across 12 pilot user groups. Presented Pillar 2 closeout brief to DISA stakeholders.',
    next_week: 'Begin Pillar 3 (Network Segmentation) planning. Kick off micro-segmentation design sessions with DoD network team. Deploy SD-WAN proof-of-concept for 2 test sites.',
    hours_narrative: '40 hrs: DoD Zero Trust implementation — Device pillar work',
    work_type_tags: ['Zero Trust Architecture', 'Cloud Infrastructure', 'Cybersecurity', 'DevSecOps'],
    submitted_at: '2025-02-21T17:45:00Z', created_at: '2025-02-21T17:45:00Z', updated_at: '2025-02-21T17:45:00Z',
    user: DEMO_USERS[4], project: DEMO_PROJECTS[1]
  },
  {
    id: 'dd000021', user_id: ALEX_ID, project_id: DOD_ZT_ID,
    week_ending: '2025-02-14', report_type: 'technical',
    accomplishments: 'Deployed Azure AD Conditional Access policies across all 3 DoD tenant environments. Configured Privileged Identity Management (PIM) for 89 privileged accounts. Zero production incidents during rollout. Wrote automated deployment runbook used by DoD IT admins.',
    blockers: 'Azure AD Premium P2 license procurement pending DITAP approval — 2 weeks delayed.',
    this_week: 'Implemented and tested 22 Conditional Access policies using What-If analysis. Built Terraform IaC modules for repeatable AAD policy deployment. Conducted lunch-and-learn for 15 DoD IT admins.',
    next_week: 'Finalize device compliance posture assessment. Begin Pillar 2 (Device) design documentation.',
    hours_narrative: '40 hrs: Identity & Access Management (IAM) Zero Trust implementation',
    work_type_tags: ['Zero Trust Architecture', 'Cloud Infrastructure', 'DevSecOps'],
    submitted_at: '2025-02-14T16:20:00Z', created_at: '2025-02-14T16:20:00Z', updated_at: '2025-02-14T16:20:00Z',
    user: DEMO_USERS[4], project: DEMO_PROJECTS[1]
  },

  // ── Jordan Lee WSRs ──
  {
    id: 'dd000030', user_id: JORDAN_ID, project_id: CISA_ID,
    week_ending: '2025-02-21', report_type: 'pm',
    accomplishments: 'Submitted February Monthly Status Report to CISA CO — accepted without revisions. Facilitated 3 workstream status meetings (12 action items captured, 9 closed). Completed risk register update: 2 risks de-escalated, 1 new risk added (personnel attrition).',
    blockers: 'Awaiting CISA approval on CDR-021 (Security Plan Update) — submitted Feb 5, no response after 16 days. Sent follow-up with PM.',
    this_week: 'Drafted and submitted February MSR. Updated integrated master schedule for TO6 planning. Reviewed 4 subcontractor invoices totaling $312K.',
    next_week: 'Prepare QBR slide deck for March 5th government review. Complete CDRL status tracking matrix update. Host closeout meeting for workstream leads.',
    hours_narrative: '40 hrs: Program Management / reporting',
    work_type_tags: ['Program Management', 'Reporting', 'CISA Mission Support', 'Stakeholder Engagement'],
    submitted_at: '2025-02-21T16:55:00Z', created_at: '2025-02-21T16:55:00Z', updated_at: '2025-02-21T16:55:00Z',
    user: DEMO_USERS[5], project: DEMO_PROJECTS[0]
  },
  {
    id: 'dd000031', user_id: JORDAN_ID, project_id: FBI_ID,
    week_ending: '2025-02-14', report_type: 'pm',
    accomplishments: 'Completed FBI Cybersecurity Platform gap analysis — identified 11 process gaps and 3 tooling gaps across 5 capability domains. Presented findings to FBI CISO and received approval to proceed to Phase 2. Documented 47-page gap analysis report.',
    blockers: 'FBI security clearance adjudication for 2 new team members outstanding (submitted 4 months ago). Limiting our ability to staff properly.',
    this_week: 'Conducted 8 stakeholder interviews with FBI mission owners. Analyzed existing platform architecture documentation. Developed gap analysis framework and scoring methodology.',
    next_week: 'Begin Phase 2 capability roadmap development. Present proposed solution architecture to FBI CISO. Draft SOW modifications for expanded scope.',
    hours_narrative: '40 hrs: FBI PM activities — gap analysis and stakeholder engagement',
    work_type_tags: ['Program Management', 'Stakeholder Engagement', 'Reporting'],
    submitted_at: '2025-02-14T17:00:00Z', created_at: '2025-02-14T17:00:00Z', updated_at: '2025-02-14T17:00:00Z',
    user: DEMO_USERS[5], project: DEMO_PROJECTS[2]
  },

  // ── Taylor Kim WSRs ──
  {
    id: 'dd000040', user_id: TAYLOR_ID, project_id: DOS_ID,
    week_ending: '2025-02-21', report_type: 'technical',
    accomplishments: 'Migrated 3 legacy DOS SharePoint sites to Modern Experience — 8,400 documents migrated with 100% fidelity validation. Completed Power Automate workflow replacement for 6 manual approval processes, saving estimated 12 staff hours/week.',
    blockers: 'DOS Outlook data loss prevention policy blocking external sharing needed for vendor coordination — submitted IT exception request.',
    this_week: 'Executed SharePoint Online migration using ShareGate tool. Built and tested 6 Power Automate flows. Conducted user acceptance testing with 28 DOS end users across 4 bureaus.',
    next_week: 'Begin Teams telephony migration planning for 3 remaining DOS field offices. Complete Power BI dashboard for migration status reporting.',
    hours_narrative: '40 hrs: DOS digital transformation / M365 work',
    work_type_tags: ['Cloud Infrastructure', 'Systems Integration', 'Software Development'],
    submitted_at: '2025-02-21T15:40:00Z', created_at: '2025-02-21T15:40:00Z', updated_at: '2025-02-21T15:40:00Z',
    user: DEMO_USERS[6], project: DEMO_PROJECTS[3]
  }
];

// ─── Demo MSRs ────────────────────────────────────────────────
export const DEMO_MSRS: (MonthlyStatusReport & { project?: Project; generator?: User })[] = [
  {
    id: 'ee000001',
    project_id: CISA_ID,
    month: '2025-01-01',
    generated_by: DEMO_USER_ID,
    ai_summary: `# Monthly Status Report — DHS CISA Cyber Defense Task Order 5
**Period:** January 2025

## Executive Summary
Dynamo's CISA Cyber Defense team delivered exceptional performance in January 2025, maintaining 99.7% SLA compliance across all deliverables and advancing the threat intelligence integration program ahead of schedule. The team successfully onboarded two new cybersecurity analysts and completed 4 of 6 planned CDRLs.

## Key Accomplishments
- **Threat Intelligence ETL Pipeline**: Delivered production-ready pipeline ingesting 3 ISAC feeds (FS-ISAC, DIB-ISAC, MS-ISAC) processing 8M+ indicators/day with 99.7% uptime
- **SIEM Detection Content**: Deployed 9 new detection rules aligned to MITRE ATT&CK, reducing mean time to detect (MTTD) by 22%
- **FISMA Compliance**: Completed Sections 1-4 of Annual Assessment (40% complete), on track for March 31 deadline
- **API Development**: Delivered /api/v2/threat-feeds endpoint handling 12K events/minute; accepted by government COR
- **Team Onboarding**: Successfully onboarded 2 new analysts with CISA network access provisioned within SLA

## Ongoing Work
- SIEM detection library expansion (Phase 3 of 4 complete)
- FISMA Annual Assessment Sections 5-7 in progress
- Quarterly vulnerability assessment coordination with CISA ISSO
- TO6 planning and PWS development

## Blockers & Risks
- **RISK (Medium)**: CISA change freeze through March 15 impacting Splunk ES upgrade — mitigation: documenting workarounds, no impact to mission
- **RISK (Low)**: Legacy network printer device exception process underway for ZT compliance; government-managed timeline

## Next Month Outlook
February focus areas include completing the FISMA Annual Assessment, deploying Phase 3 SIEM detection content, beginning CDR-022 (Network Segmentation Design), and preparing for the Q1 Quarterly Business Review.

## Team Contributions
- **Priya Patel**: Led ETL pipeline delivery and API development (primary contributor)
- **Jordan Lee**: Program management, CDRL coordination, risk tracking
- **Mike Torres**: FISMA assessment support, technical documentation`,
    human_edited_summary: null,
    wsr_ids: ['dd000010', 'dd000011', 'dd000012', 'dd000030'],
    status: 'finalized',
    created_at: '2025-02-03T10:15:00Z',
    updated_at: '2025-02-03T10:15:00Z',
    project: DEMO_PROJECTS[0],
    generator: DEMO_USER
  },
  {
    id: 'ee000002',
    project_id: DOD_ZT_ID,
    month: '2025-01-01',
    generated_by: SARAH_ID,
    ai_summary: `# Monthly Status Report — DoD Zero Trust Architecture Implementation
**Period:** January 2025

## Executive Summary
The DoD Zero Trust implementation program completed Pillar 1 (Identity) in January, achieving 100% enrollment of privileged accounts in Microsoft Entra PIM. The team is on track for Phase 2 completion (Pillars 2-3) by Q2 FY2025 per the DISA-approved Zero Trust Roadmap.

## Key Accomplishments
- **Pillar 1 — Identity COMPLETE**: 89 privileged accounts enrolled in PIM; 22 Conditional Access policies deployed; Pillar 1 TDD accepted by COR
- **Infrastructure as Code**: Terraform modules for repeatable AAD policy deployment delivered; adopted by DoD IT admin team
- **Training Delivery**: Conducted 2 lunch-and-learns reaching 28 DoD IT personnel
- **Compliance**: 99.1% DISA STIG benchmark compliance on all managed endpoints in scope

## Ongoing Work
- Pillar 2 (Device) design documentation in progress
- Pillar 3 (Network Micro-segmentation) planning underway
- DITAP license procurement coordination

## Blockers & Risks
- **RISK (Medium)**: Azure AD Premium P2 license procurement pending DITAP approval (2-week delay) — no impact to current sprint, will impact Pillar 2 timeline if unresolved by Feb 21
- **RISK (Low)**: 143 legacy printers non-compliant with ZT device policy — exception request being drafted for CIO review

## Next Month Outlook
February will focus on completing Pillar 2 device compliance rollout to all 1,847 managed endpoints, initiating the network micro-segmentation design, and delivering the Q1 progress brief to DISA leadership.`,
    human_edited_summary: null,
    wsr_ids: ['dd000020', 'dd000021'],
    status: 'draft',
    created_at: '2025-02-05T14:30:00Z',
    updated_at: '2025-02-05T14:30:00Z',
    project: DEMO_PROJECTS[1],
    generator: DEMO_USERS[1]
  }
];

// ─── Demo Quarterly Reviews ───────────────────────────────────
export const DEMO_REVIEWS: (QuarterlyReview & { user?: User; manager?: User })[] = [
  {
    id: 'ff000001',
    user_id: PRIYA_ID,
    manager_id: DEMO_USER_ID,
    quarter: 'Q4 2024',
    start_date: '2024-10-01',
    end_date: '2024-12-31',
    ai_summary: `## Quarterly Performance Summary — Priya Patel | Q4 2024

### Major Accomplishments
- **Threat Intelligence Platform**: Designed and delivered the complete ETL architecture for CISA's threat intel ingestion system, processing 3 external feeds and serving as the backbone for the program's AI/ML analytics layer
- **Zero Downtime Deployment**: Led the migration of production SIEM infrastructure to new hardware with zero service interruption during the critical government fiscal year-end period
- **FISMA Leadership**: Single-handedly completed Sections 1-3 of the Annual Assessment, establishing the documentation framework now used as a template across the program
- **Technical Mentorship**: Mentored 2 junior engineers on API development practices and SIEM detection methodology

### Technical Skills & Expertise Demonstrated
Priya demonstrated advanced proficiency across a broad technical stack this quarter. Her API development work for the CISA threat intelligence platform (Python, FastAPI, OAuth 2.0) was particularly noteworthy — the /api/v2 endpoints she built are now processing production traffic. She also showed strong expertise in SIEM engineering (Splunk Enterprise Security, MITRE ATT&CK framework alignment) and cloud infrastructure (AWS, S3, Lambda, CloudWatch).

### Consistency & Work Quality
Priya submitted 13 of 13 weekly status reports in Q4 — 100% submission rate. The quality of her technical documentation consistently exceeded expectations; her ETL pipeline design document was used as the reference architecture for future program deliverables. All deliverables submitted on or ahead of schedule.

### Collaboration & Communication
Strong cross-functional collaboration with CISA government stakeholders, particularly with the ISSO on FISMA compliance work. Priya effectively navigated the COR review process for 3 CDRLs, demonstrating professional client-facing communication skills. Her willingness to assist colleagues on blockers (documented in weekly reports) reflects positive team culture.

### Blockers Addressed & Problem Solving
Demonstrated excellent problem-solving when the legacy CISA network blocked standard OAuth flows. Priya independently researched, documented, and proposed an alternative authentication approach that was approved by the government ISSO within one sprint cycle.

### Areas for Development
- **Leadership**: Priya is technically strong and ready to take on a formal technical lead role. Recommend beginning to assign her as lead for discrete workstreams to build scope management experience.
- **Proposal Support**: Encourage participation in BD efforts to develop past performance writing skills.

### Overall Summary
Priya Patel delivered standout technical performance in Q4 2024, producing multiple critical deliverables that directly advanced CISA mission objectives. Her combination of depth (cybersecurity, ETL, API) and breadth (documentation, client engagement) makes her a high-value contributor. Strongly recommended for promotion consideration to Senior Engineer in FY2025.`,
    manager_notes: 'Fully agree with the AI summary. Priya is one of our strongest technical contributors — she should be on the Q1 promotion slate. Planning to discuss with Sarah at the next leadership sync.',
    wsr_ids: ['dd000010', 'dd000011', 'dd000012'],
    status: 'completed',
    created_at: '2025-01-15T11:00:00Z',
    updated_at: '2025-01-16T09:30:00Z',
    user: DEMO_USERS[3],
    manager: DEMO_USER
  }
];

// ─── Demo Lattice Sync Log ────────────────────────────────────
export const DEMO_SYNC_LOGS = [
  { id: 'gg000001', sync_date: '2025-02-16T00:00:12Z', records_synced: 347, status: 'success' as const, error_message: null },
  { id: 'gg000002', sync_date: '2025-02-09T00:00:08Z', records_synced: 344, status: 'success' as const, error_message: null },
  { id: 'gg000003', sync_date: '2025-02-02T00:00:31Z', records_synced: 0, status: 'failed' as const, error_message: 'Lattice API rate limit exceeded. Retry after 60s.' },
  { id: 'gg000004', sync_date: '2025-01-26T00:00:09Z', records_synced: 342, status: 'success' as const, error_message: null },
  { id: 'gg000005', sync_date: '2025-01-19T00:00:11Z', records_synced: 339, status: 'success' as const, error_message: null }
];

// ─── Demo Manager Overrides ───────────────────────────────────
export const DEMO_OVERRIDES = [
  {
    id: 'hh000001',
    user_id: ALEX_ID,
    project_id: DOD_ZT_ID,
    override_manager_id: SARAH_ID,
    reason: 'Sarah is program manager for DoD ZT and needs visibility into Alex\'s work',
    created_by: DEMO_USER_ID,
    created_at: '2024-06-01T09:00:00Z',
    user: DEMO_USERS[4],
    project: DEMO_PROJECTS[1],
    override_manager: DEMO_USERS[1]
  }
];

// ─── Derived / Aggregated ─────────────────────────────────────

/** WSRs for the current user (Devin Hill) */
export const MY_WSRS = DEMO_WSRS.filter(w => w.user_id === DEMO_USER_ID);

/** Team WSRs (all except current user's) — for manager view */
export const TEAM_WSRS = DEMO_WSRS.filter(w => w.user_id !== DEMO_USER_ID);

/** All WSRs including current user */
export const ALL_WSRS = DEMO_WSRS;

/** Direct reports of Devin Hill */
export const DIRECT_REPORTS = DEMO_USERS.filter(u => u.default_manager_id === DEMO_USER_ID);

/** All team members managed by Devin (direct reports only for simplicity) */
export const MY_TEAM = DIRECT_REPORTS;

/** Unique agencies */
export const AGENCIES = [...new Set(DEMO_PROJECTS.map(p => p.client_agency).filter(Boolean))] as string[];

/** Stats for employee dashboard */
export const DEMO_STATS = {
  quarterCount: MY_WSRS.length
};
