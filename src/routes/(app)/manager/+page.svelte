<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import { formatDate, getWeekLabel, getRecentMonths } from '$lib/utils/dates';
  import { downloadMarkdown, printAsPDF } from '$lib/utils/export';
  import WSRCard from '$lib/components/wsr/WSRCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import LoadingCard from '$lib/components/ui/LoadingCard.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  let { data } = $props();

  let activeTab: 'team' | 'msr' = $state('team');
  function setTab(id: string) { activeTab = id as typeof activeTab; }

  // Team WSR filters
  let filterUser = $state('');
  let filterWeek = $state('');

  // MSR generation
  let selectedProject = $state('');
  let selectedMonth = $state('');
  let generatingMSR = $state(false);
  let msrModalOpen = $state(false);
  let selectedMSR: (typeof data.msrs)[0] | null = $state(null);
  let editedMSRSummary = $state('');
  let savingMSR = $state(false);

  const recentMonths = getRecentMonths(12);



  function groupByWeek(wsrs: any[]) {
    const groups = new Map<string, any[]>();
    for (const wsr of wsrs) {
      if (!groups.has(wsr.week_ending)) groups.set(wsr.week_ending, []);
      groups.get(wsr.week_ending)!.push(wsr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }

  function openMSR(msr: (typeof data.msrs)[0]) {
    selectedMSR = msr;
    editedMSRSummary = msr.human_edited_summary ?? msr.ai_summary ?? '';
    msrModalOpen = true;
  }

  function exportMSR(msr: typeof selectedMSR) {
    if (!msr) return;
    const content = msr.human_edited_summary ?? msr.ai_summary ?? '';
    const title = `MSR - ${msr.project?.name} - ${formatDate(msr.month, 'MMMM yyyy')}`;
    downloadMarkdown(`# ${title}\n\n${content}`, title.replace(/[^a-z0-9]/gi, '_'));
    toast.success('Exported as Markdown');
  }

  function exportMSRPDF(msr: typeof selectedMSR) {
    if (!msr) return;
    const content = msr.human_edited_summary ?? msr.ai_summary ?? '';
    const title = `MSR - ${msr.project?.name} - ${formatDate(msr.month, 'MMMM yyyy')}`;
    printAsPDF(title, content);
  }

  function handleMSRGenResult({ result }: { result: { type: string; data?: any } }) {
    generatingMSR = false;
    if (result.type === 'success') {
      toast.success('MSR generated successfully! Check the MSRs list.');
    } else {
      const msg = result.data?.error ?? 'Failed to generate MSR. Please try again.';
      toast.error(msg);
    }
  }

  function handleSaveMSRResult({ result }: { result: { type: string } }) {
    savingMSR = false;
    if (result.type === 'success') {
      toast.success('MSR saved successfully');
      msrModalOpen = false;
    } else {
      toast.error('Failed to save MSR');
    }
  }

  let deletingMSRId: string | null = $state(null);

  function handleDeleteMSRResult({ result }: { result: { type: string } }) {
    deletingMSRId = null;
    if (result.type === 'success') {
      toast.success('MSR deleted');
    } else {
      toast.error('Failed to delete MSR');
    }
  }
  let filteredWSRs = $derived(data.teamWSRs.filter((w: any) => {
    if (filterUser && w.user?.id !== filterUser) return false;
    if (filterWeek && w.week_ending !== filterWeek) return false;
    return true;
  }));
  let wsrsByWeek = $derived(groupByWeek(filteredWSRs));
</script>

<!-- Tabs -->
<div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
  {#each [
    { id: 'team', label: 'Team WSRs', count: data.teamWSRs.length },
    { id: 'msr', label: 'Monthly Reports', count: data.msrs.length }
  ] as tab}
    <button
      onclick={() => setTab(tab.id)}
      class="px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px {activeTab === tab.id
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

<!-- ===== TEAM WSRs TAB ===== -->
{#if activeTab === 'team'}
  <div>
    <!-- Filters -->
    <div class="card mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="label" for="filter-user">Team Member</label>
          <select bind:value={filterUser} id="filter-user" class="select">
            <option value="">All Members ({data.teamWSRs.length})</option>
            {#each data.allUsers as u}
              <option value={u.id}>{u.full_name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label" for="filter-week">Week Ending</label>
          <input type="date" bind:value={filterWeek} id="filter-week" class="input" />
        </div>
        <div class="flex items-end">
          <button class="btn-ghost text-sm" onclick={() => { filterUser = ''; filterWeek = ''; }}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Team WSRs list -->
    {#if data.directReports.length === 0 && data.teamIds.size === 0}
      <EmptyState
        title="No team members yet"
        message="Your direct reports will appear here once the org chart is synced from Lattice."
        icon="users"
      />
    {:else if filteredWSRs.length === 0}
      <EmptyState
        title="No WSRs found"
        message="No WSRs match the current filters."
        icon="inbox"
      >
        <button class="btn-secondary text-sm" onclick={() => { filterUser = ''; filterWeek = ''; }}>
          Clear Filters
        </button>
      </EmptyState>
    {:else}
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="section-title mb-0">Team WSRs</h2>
          <span class="text-xs text-gray-400 dark:text-gray-500">{filteredWSRs.length} reports</span>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          {#each wsrsByWeek as [weekEnding, reports]}
            <div class="px-6 py-4">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Week of {getWeekLabel(weekEnding)}
                  <span class="text-gray-400 dark:text-gray-500 font-normal">({reports.length} reports)</span>
                </h3>
              </div>
              <div class="space-y-2 ml-4">
                {#each reports as wsr}
                  <WSRCard {wsr} showUser={true} />
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

<!-- ===== MSR TAB ===== -->
{:else if activeTab === 'msr'}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Generate new MSR -->
    <div class="lg:col-span-1">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title mb-0">Generate MSR</h2>
        </div>
        <div class="card-body">
          <form
            method="POST"
            action="?/generateMSR"
            use:enhance={() => {
              generatingMSR = true;
              return async ({ result, update }) => {
                await update();
                handleMSRGenResult({ result });
              };
            }}
          >
            <div class="space-y-4">
              <div>
                <label class="label" for="msr-project">Project</label>
                <select name="project_id" id="msr-project" class="select" bind:value={selectedProject} required>
                  <option value="">Select project...</option>
                  {#each data.projects as p}
                    <option value={p.id}>{p.name}</option>
                  {/each}
                </select>
              </div>
              <div>
                <label class="label" for="msr-month">Month</label>
                <select name="month" id="msr-month" class="select" bind:value={selectedMonth} required>
                  <option value="">Select month...</option>
                  {#each recentMonths as m}
                    <option value={m.value}>{m.label}</option>
                  {/each}
                </select>
              </div>
              <button type="submit" class="btn-primary w-full" disabled={generatingMSR || !selectedProject || !selectedMonth}>
                {#if generatingMSR}
                  <Spinner size="sm" color="text-white" />
                  Generating with AI...
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  Generate MSR
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MSR list -->
    <div class="lg:col-span-2">
      {#if data.msrs.length === 0}
        <EmptyState
          title="No MSRs generated yet"
          message="Use the form to generate your first Monthly Status Report."
          icon="document"
        />
      {:else}
        <div class="card">
          <div class="card-header">
            <h2 class="section-title mb-0">Monthly Status Reports</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="table-header">Project</th>
                  <th class="table-header">Month</th>
                  <th class="table-header">Status</th>
                  <th class="table-header">Generated</th>
                  <th class="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each data.msrs as msr}
                  <tr class="table-row">
                    <td class="table-cell">
                      <div class="font-medium">{msr.project?.name ?? 'Unknown'}</div>
                      {#if msr.project?.client_agency}
                        <div class="text-xs text-gray-400 dark:text-gray-500">{msr.project.client_agency}</div>
                      {/if}
                    </td>
                    <td class="table-cell">{formatDate(msr.month, 'MMMM yyyy')}</td>
                    <td class="table-cell">
                      <span class="badge {msr.status === 'final' ? 'badge-green' : 'badge-yellow'}">
                        {msr.status}
                      </span>
                    </td>
                    <td class="table-cell text-gray-400 dark:text-gray-500 text-xs">{formatDate(msr.created_at)}</td>
                    <td class="table-cell">
                      <div class="flex items-center gap-2">
                        <button class="text-xs text-primary hover:underline" onclick={() => openMSR(msr)}>
                          View/Edit
                        </button>
                        <form
                          method="POST"
                          action="?/deleteMSR"
                          use:enhance={() => {
                            if (!confirm('Delete this MSR? This cannot be undone.')) return ({ cancel }) => cancel();
                            deletingMSRId = msr.id;
                            return async ({ result, update }) => {
                              await update();
                              handleDeleteMSRResult({ result });
                            };
                          }}
                        >
                          <input type="hidden" name="msr_id" value={msr.id} />
                          <button type="submit" class="text-xs text-primary hover:underline" disabled={deletingMSRId === msr.id}>
                            {deletingMSRId === msr.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </div>

{/if}

<!-- MSR View/Edit Modal -->
<Modal bind:open={msrModalOpen} title="Monthly Status Report" size="xl">
  {#if selectedMSR}
    <div class="mb-4 flex items-center gap-3 flex-wrap">
      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedMSR.project?.name}</span>
      <span class="badge badge-gray">{formatDate(selectedMSR.month, 'MMMM yyyy')}</span>
      <span class="badge {selectedMSR.status === 'final' ? 'badge-green' : 'badge-yellow'}">{selectedMSR.status}</span>
    </div>

    <form
      id="msr-save-form"
      method="POST"
      action="?/saveMSR"
      use:enhance={() => {
        savingMSR = true;
        return async ({ result, update }) => {
          await update();
          handleSaveMSRResult({ result });
        };
      }}
    >
      <input type="hidden" name="msr_id" value={selectedMSR.id} />

      <div class="mb-4">
        <label class="label" for="msr-summary">
          Summary
          {#if selectedMSR.ai_summary && !selectedMSR.human_edited_summary}
            <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">(AI-generated -- edit as needed)</span>
          {:else if selectedMSR.human_edited_summary}
            <span class="text-xs text-green-600 dark:text-green-400 ml-1">(Human-edited)</span>
          {/if}
        </label>
        <textarea
          name="human_edited_summary"
          id="msr-summary"
          class="textarea min-h-[300px]"
          bind:value={editedMSRSummary}
          placeholder="MSR summary will appear here..."
        ></textarea>
      </div>

      <div class="mb-4">
        <label class="label" for="msr-status">Status</label>
        <select name="status" id="msr-status" class="select" value={selectedMSR.status}>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
      </div>
    </form>
  {/if}

  {#snippet footer()}
  
      {#if selectedMSR}
        <button type="button" class="btn-ghost" onclick={() => exportMSR(selectedMSR)}>
          Export Markdown
        </button>
        <button type="button" class="btn-ghost" onclick={() => exportMSRPDF(selectedMSR)}>
          Export PDF
        </button>
      {/if}
      <button type="button" class="btn-secondary" onclick={() => (msrModalOpen = false)}>Close</button>
      <button type="submit" form="msr-save-form" class="btn-primary" disabled={savingMSR}>
        {#if savingMSR}<Spinner size="sm" color="text-white" />{/if}
        Save
      </button>
    
  {/snippet}
</Modal>
