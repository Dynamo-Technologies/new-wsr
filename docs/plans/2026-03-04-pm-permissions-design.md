# PM-Based Permission System Design

## Problem
Engineers submitting WSRs should only see their own dashboard. PMs should see a manager view scoped to the contracts they oversee. Admins should see everything.

## Approach: Dynamic PM Detection via `pm_email`

PM status is derived at runtime by matching the logged-in user's email against the `pm_email` column on the `projects` table. No manual role assignment needed for PMs.

### Access Levels

| User Type | How Detected | Dashboard | Manager Tab | Admin Tab | BD Tab |
|-----------|-------------|-----------|-------------|-----------|--------|
| Employee  | Default (no match) | Own WSRs only | Hidden | Hidden | Hidden |
| PM        | Email matches `projects.pm_email` | Own WSRs | Visible (scoped to their projects) | Hidden | Visible |
| Admin     | `profiles.role = 'admin'` | Own WSRs | Visible (all projects) | Visible | Visible |

### Data Flow

1. **Layout server load** (`+layout.server.ts`):
   - Fetch user profile from `profiles`
   - Query `projects` where `pm_email = user.email` → `managedProjects[]`
   - Return `{ session, appUser, managedProjects }`

2. **Sidebar** (`Sidebar.svelte`):
   - `managedProjects.length > 0` → show Manager Dashboard + BD tabs
   - `role === 'admin'` → show all tabs including Admin Panel
   - Otherwise → employee nav only (Dashboard + Submit WSR)

3. **Manager dashboard** (`/manager/+page.server.ts`):
   - Query managed project IDs for the current user
   - Fetch WSRs where `project_id IN (managedProjectIds)`
   - Admins bypass filter and see all WSRs

4. **Server-side guards**:
   - `/manager` — allow if user has managed projects OR is admin
   - `/admin` — allow only if `role === 'admin'`
   - `/bd` — allow if user has managed projects OR is admin

### Files to Modify

- `src/routes/(app)/+layout.server.ts` — add `managedProjects` query
- `src/lib/components/layout/Sidebar.svelte` — update nav logic
- `src/routes/(app)/manager/+page.server.ts` — scope WSRs to managed projects
- `src/routes/(app)/bd/+page.server.ts` — add PM/admin guard
- `src/lib/stores/auth.ts` — add `managedProjects` store + derived `isPM`
- `src/lib/types.ts` — update types if needed

### Benefits
- PM access auto-updates when project assignments change
- No manual role management for PMs
- Simple: uses existing `pm_email` column, no new tables
