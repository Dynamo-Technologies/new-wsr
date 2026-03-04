<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import { formatDate } from '$lib/utils/dates';
  import Modal from '$lib/components/ui/Modal.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import StatCard from '$lib/components/ui/StatCard.svelte';

  export let data;
  export let form;

  let activeTab: 'projects' | 'users' | 'tags' | 'overrides' = 'projects';
  function setTab(id: string) { activeTab = id as typeof activeTab; }

  // Projects state
  let showProjectModal = false;
  let editingProject: (typeof data.projects)[0] | null = null;
  let savingProject = false;

  // Users state
  let editingUser: (typeof data.users)[0] | null = null;
  let showUserModal = false;
  let savingUser = false;
  let userSearch = '';

  // Tags state
  let showTagModal = false;
  let deletingTagId = '';
  let savingTag = false;

  // Overrides state
  let showOverrideModal = false;
  let savingOverride = false;


  $: filteredUsers = data.users.filter((u) =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  $: managersForSelect = data.users.filter((u) =>
    ['manager', 'director', 'vp', 'admin'].includes(u.role)
  );

  function openEditProject(p: typeof editingProject) {
    editingProject = p;
    showProjectModal = true;
  }

  function openEditUser(u: typeof editingUser) {
    editingUser = u;
    showUserModal = true;
  }

  function handleFormResult(action: string) {
    return ({ result }: { result: { type: string } }) => {
      const loadingMap: Record<string, () => void> = {
        createProject: () => (savingProject = false),
        updateProject: () => (savingProject = false),
        updateUser: () => (savingUser = false),
        createTag: () => (savingTag = false),
        createOverride: () => (savingOverride = false)
      };
      loadingMap[action]?.();

      if (result.type === 'success') {
        showProjectModal = false;
        showUserModal = false;
        showTagModal = false;
        showOverrideModal = false;
        toast.success('Saved successfully');
      } else {
        toast.error('Operation failed. Please try again.');
      }
    };
  }

  const projectTypes = ['Prime', 'Subcontractor', 'Internal R&D', 'GWAC', 'IDIQ', 'Task Order'];
  const agencies = ['DHS', 'DoD', 'FBI', 'DOS', 'HHS', 'VA', 'Treasury', 'DOJ', 'DOE', 'NASA', 'Internal'];
  const roles = ['employee', 'manager', 'director', 'vp', 'admin'];
</script>

<!-- Tabs -->
<div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 flex-wrap">
  {#each [
    { id: 'projects', label: 'Projects', count: data.projects.length },
    { id: 'users', label: 'Users', count: data.users.length },
    { id: 'tags', label: 'Work Type Tags', count: data.tags.length },
    { id: 'overrides', label: 'Manager Overrides', count: data.overrides.length }
  ] as tab}
    <button
      on:click={() => setTab(tab.id)}
      class="px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px whitespace-nowrap {activeTab === tab.id
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
    >
      {tab.label}
      {#if tab.count > 0}
        <span class="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-dark-50 text-gray-600 dark:text-gray-400 text-xs rounded-full">{tab.count}</span>
      {/if}
    </button>
  {/each}
</div>

<!-- ===== PROJECTS TAB ===== -->
{#if activeTab === 'projects'}
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2>Projects</h2>
      <button class="btn-primary" on:click={() => { editingProject = null; showProjectModal = true; }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Project
      </button>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-header">Project</th>
              <th class="table-header">Agency</th>
              <th class="table-header">Type</th>
              <th class="table-header">PM</th>
              <th class="table-header">Status</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.projects as project}
              <tr class="table-row">
                <td class="table-cell">
                  <div class="font-medium">{project.name}</div>
                  {#if project.contract_number}
                    <div class="text-xs text-gray-400 dark:text-gray-500">#{project.contract_number}</div>
                  {/if}
                </td>
                <td class="table-cell">{project.client_agency ?? '—'}</td>
                <td class="table-cell">{project.project_type ?? '—'}</td>
                <td class="table-cell">{project.program_manager?.full_name ?? '—'}</td>
                <td class="table-cell">
                  <span class="badge {project.is_active ? 'badge-green' : 'badge-gray'}">
                    {project.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td class="table-cell">
                  <button class="text-xs text-primary hover:underline" on:click={() => openEditProject(project)}>
                    Edit
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

<!-- ===== USERS TAB ===== -->
{:else if activeTab === 'users'}
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2>Users ({data.users.length})</h2>
      <div class="w-64">
        <input
          type="text"
          class="input"
          placeholder="Search users..."
          bind:value={userSearch}
        />
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-header">Name</th>
              <th class="table-header">Email</th>
              <th class="table-header">Role</th>
              <th class="table-header">Manager</th>
              <th class="table-header">Status</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredUsers as u}
              <tr class="table-row">
                <td class="table-cell font-medium">{u.full_name}</td>
                <td class="table-cell text-gray-500 dark:text-gray-400 text-xs">{u.email}</td>
                <td class="table-cell">
                  <span class="badge {u.role === 'admin' ? 'badge-red' : u.role === 'employee' ? 'badge-gray' : 'badge-blue'} capitalize">
                    {u.role}
                  </span>
                </td>
                <td class="table-cell text-gray-400 dark:text-gray-500 text-xs">
                  {data.users.find((m) => m.id === u.default_manager_id)?.full_name ?? '—'}
                </td>
                <td class="table-cell">
                  <span class="badge {u.is_active ? 'badge-green' : 'badge-gray'}">
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td class="table-cell">
                  <button class="text-xs text-primary hover:underline" on:click={() => openEditUser(u)}>
                    Edit
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

<!-- ===== TAGS TAB ===== -->
{:else if activeTab === 'tags'}
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2>Work Type Tags</h2>
      <button class="btn-primary" on:click={() => (showTagModal = true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Tag
      </button>
    </div>

    {#each ['technical', 'administrative', 'specialized'] as category}
      {@const categoryTags = data.tags.filter((t) => t.category === category)}
      {#if categoryTags.length > 0}
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="capitalize font-semibold text-gray-700 dark:text-gray-300">{category}</h3>
          </div>
          <div class="card-body">
            <div class="flex flex-wrap gap-2">
              {#each categoryTags as tag}
                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-dark-50 rounded-full group">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                  <form method="POST" action="?/deleteTag" use:enhance={() => {
                    return async ({ result, update }) => { await update(); };
                  }}>
                    <input type="hidden" name="id" value={tag.id} />
                    <button type="submit" class="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </form>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>

<!-- ===== OVERRIDES TAB ===== -->
{:else if activeTab === 'overrides'}
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2>Manager Overrides</h2>
      <button class="btn-primary" on:click={() => (showOverrideModal = true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Override
      </button>
    </div>

    {#if data.overrides.length === 0}
      <EmptyState title="No overrides configured" message="Manager overrides allow a different manager to view an employee's WSRs for a specific project." icon="users" />
    {:else}
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-header">Employee</th>
              <th class="table-header">Project</th>
              <th class="table-header">Override Manager</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.overrides as ov}
              <tr class="table-row">
                <td class="table-cell">{ov.user?.full_name ?? '—'}</td>
                <td class="table-cell">{ov.project?.name ?? '—'}</td>
                <td class="table-cell">{ov.override_manager?.full_name ?? '—'}</td>
                <td class="table-cell text-gray-400 dark:text-gray-500 text-xs">{ov.reason ?? '—'}</td>
                <td class="table-cell">
                  <form method="POST" action="?/deleteOverride" use:enhance={() => {
                    return async ({ result, update }) => { await update(); };
                  }}>
                    <input type="hidden" name="id" value={ov.id} />
                    <button type="submit" class="text-xs text-red-500 dark:text-red-400 hover:underline">Remove</button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

{/if}

<!-- ===== MODALS ===== -->

<!-- Project Modal -->
<Modal bind:open={showProjectModal} title={editingProject ? 'Edit Project' : 'Add Project'} size="lg">
  <form
    id="project-form"
    method="POST"
    action={editingProject ? '?/updateProject' : '?/createProject'}
    use:enhance={() => {
      savingProject = true;
      return async ({ result, update }) => {
        await update();
        handleFormResult('createProject')({ result });
      };
    }}
  >
    {#if editingProject}
      <input type="hidden" name="id" value={editingProject.id} />
    {/if}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="sm:col-span-2">
        <label class="label" for="p-name">Project Name *</label>
        <input type="text" name="name" id="p-name" class="input" value={editingProject?.name ?? ''} required />
      </div>
      <div>
        <label class="label" for="p-contract">Contract Number</label>
        <input type="text" name="contract_number" id="p-contract" class="input" value={editingProject?.contract_number ?? ''} />
      </div>
      <div>
        <label class="label" for="p-agency">Client Agency</label>
        <select name="client_agency" id="p-agency" class="select">
          <option value="">Select agency...</option>
          {#each agencies as agency}
            <option value={agency} selected={editingProject?.client_agency === agency}>{agency}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label" for="p-type">Project Type</label>
        <select name="project_type" id="p-type" class="select">
          <option value="">Select type...</option>
          {#each projectTypes as pt}
            <option value={pt} selected={editingProject?.project_type === pt}>{pt}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label" for="p-pm">Program Manager</label>
        <select name="program_manager_id" id="p-pm" class="select">
          <option value="">Select PM...</option>
          {#each managersForSelect as m}
            <option value={m.id} selected={editingProject?.program_manager?.id === m.id}>{m.full_name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label" for="p-start">Start Date</label>
        <input type="date" name="start_date" id="p-start" class="input" value={editingProject?.start_date ?? ''} />
      </div>
      <div>
        <label class="label" for="p-end">End Date</label>
        <input type="date" name="end_date" id="p-end" class="input" value={editingProject?.end_date ?? ''} />
      </div>
      {#if editingProject}
        <div>
          <label class="label" for="p-active">Status</label>
          <select name="is_active" id="p-active" class="select">
            <option value="true" selected={editingProject.is_active}>Active</option>
            <option value="false" selected={!editingProject.is_active}>Inactive</option>
          </select>
        </div>
      {/if}
    </div>
  </form>
  <svelte:fragment slot="footer">
    <button type="button" class="btn-secondary" on:click={() => (showProjectModal = false)}>Cancel</button>
    <button type="submit" form="project-form" class="btn-primary" disabled={savingProject}>
      {#if savingProject}<Spinner size="sm" color="text-white" />{/if}
      {editingProject ? 'Save Changes' : 'Create Project'}
    </button>
  </svelte:fragment>
</Modal>

<!-- User Edit Modal -->
<Modal bind:open={showUserModal} title="Edit User" size="md">
  {#if editingUser}
    <form
      id="user-edit-form"
      method="POST"
      action="?/updateUser"
      use:enhance={() => {
        savingUser = true;
        return async ({ result, update }) => {
          await update();
          handleFormResult('updateUser')({ result });
        };
      }}
    >
      <input type="hidden" name="id" value={editingUser.id} />
      <div class="space-y-4">
        <div>
          <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{editingUser.full_name}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">{editingUser.email}</p>
        </div>
        <div>
          <label class="label" for="u-role">Role</label>
          <select name="role" id="u-role" class="select">
            {#each roles as r}
              <option value={r} selected={editingUser.role === r} class="capitalize">{r}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label" for="u-manager">Default Manager</label>
          <select name="default_manager_id" id="u-manager" class="select">
            <option value="">No manager</option>
            {#each managersForSelect as m}
              <option value={m.id} selected={editingUser.default_manager_id === m.id}>{m.full_name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label" for="u-active">Status</label>
          <select name="is_active" id="u-active" class="select">
            <option value="true" selected={editingUser.is_active}>Active</option>
            <option value="false" selected={!editingUser.is_active}>Inactive</option>
          </select>
        </div>
      </div>
    </form>
  {/if}
  <svelte:fragment slot="footer">
    <button type="button" class="btn-secondary" on:click={() => (showUserModal = false)}>Cancel</button>
    <button type="submit" form="user-edit-form" class="btn-primary" disabled={savingUser}>
      {#if savingUser}<Spinner size="sm" color="text-white" />{/if}
      Save Changes
    </button>
  </svelte:fragment>
</Modal>

<!-- Add Tag Modal -->
<Modal bind:open={showTagModal} title="Add Work Type Tag" size="sm">
  <form
    id="tag-form"
    method="POST"
    action="?/createTag"
    use:enhance={() => {
      savingTag = true;
      return async ({ result, update }) => {
        await update();
        handleFormResult('createTag')({ result });
      };
    }}
  >
    <div class="space-y-4">
      <div>
        <label class="label" for="tag-name">Tag Name *</label>
        <input type="text" name="name" id="tag-name" class="input" placeholder="e.g., API Development" required />
      </div>
      <div>
        <label class="label" for="tag-cat">Category *</label>
        <select name="category" id="tag-cat" class="select" required>
          <option value="technical">Technical</option>
          <option value="administrative">Administrative</option>
          <option value="specialized">Specialized</option>
        </select>
      </div>
      <div>
        <label class="label" for="tag-desc">Description</label>
        <input type="text" name="description" id="tag-desc" class="input" placeholder="Optional description" />
      </div>
    </div>
  </form>
  <svelte:fragment slot="footer">
    <button type="button" class="btn-secondary" on:click={() => (showTagModal = false)}>Cancel</button>
    <button type="submit" form="tag-form" class="btn-primary" disabled={savingTag}>
      {#if savingTag}<Spinner size="sm" color="text-white" />{/if}
      Add Tag
    </button>
  </svelte:fragment>
</Modal>

<!-- Override Modal -->
<Modal bind:open={showOverrideModal} title="Add Manager Override" size="md">
  <form
    id="override-form"
    method="POST"
    action="?/createOverride"
    use:enhance={() => {
      savingOverride = true;
      return async ({ result, update }) => {
        await update();
        handleFormResult('createOverride')({ result });
      };
    }}
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        A manager override allows a specific manager to view an employee's WSRs for a particular project,
        regardless of the default reporting structure.
      </p>
      <div>
        <label class="label" for="ov-user">Employee *</label>
        <select name="user_id" id="ov-user" class="select" required>
          <option value="">Select employee...</option>
          {#each data.users.filter((u) => u.is_active) as u}
            <option value={u.id}>{u.full_name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label" for="ov-project">Project *</label>
        <select name="project_id" id="ov-project" class="select" required>
          <option value="">Select project...</option>
          {#each data.projects.filter((p) => p.is_active) as p}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label" for="ov-manager">Override Manager *</label>
        <select name="override_manager_id" id="ov-manager" class="select" required>
          <option value="">Select manager...</option>
          {#each managersForSelect as m}
            <option value={m.id}>{m.full_name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label" for="ov-reason">Reason</label>
        <input type="text" name="reason" id="ov-reason" class="input" placeholder="e.g., Project lead for this contract" />
      </div>
    </div>
  </form>
  <svelte:fragment slot="footer">
    <button type="button" class="btn-secondary" on:click={() => (showOverrideModal = false)}>Cancel</button>
    <button type="submit" form="override-form" class="btn-primary" disabled={savingOverride}>
      {#if savingOverride}<Spinner size="sm" color="text-white" />{/if}
      Create Override
    </button>
  </svelte:fragment>
</Modal>
