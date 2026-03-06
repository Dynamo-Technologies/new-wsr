<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import { formatDate, getWeekLabel } from '$lib/utils/dates';
  import { downloadMarkdown, printAsPDF } from '$lib/utils/export';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import TagInput from '$lib/components/ui/TagInput.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  let { data, form } = $props();

  let searching = $state(false);
  let generating = $state(false);
  let selectedTags: string[] = $state([]);
  let selectedWSRIds: Set<string> = $state(new Set());
  let narrativeModalOpen = $state(false);
  let narrative = $state('');

  const tagNames = $derived(data.tags.map((t: any) => t.name));

  function toggleWSR(id: string) {
    const next = new Set(selectedWSRIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedWSRIds = next;
  }

  function selectAll() {
    selectedWSRIds = new Set(form?.results?.map((w: any) => w.id) ?? []);
  }

  function clearSelection() {
    selectedWSRIds = new Set();
  }


  function groupByProject(wsrs: any[]) {
    const groups = new Map<string, { project: any; wsrs: any[] }>();
    for (const wsr of wsrs) {
      const key = wsr.project?.id ?? 'unknown';
      if (!groups.has(key)) {
        groups.set(key, { project: wsr.project, wsrs: [] });
      }
      groups.get(key)!.wsrs.push(wsr);
    }
    return Array.from(groups.values());
  }

  function handleSearchResult({ result }: { result: { type: string } }) {
    searching = false;
    if (result.type === 'failure') {
      toast.error('Search failed. Please try again.');
    }
  }

  function handleGenerateResult({ result }: { result: { type: string; data?: { narrative?: string } } }) {
    generating = false;
    if (result.type === 'success' && (result as any).data?.narrative) {
      narrative = (result as any).data.narrative;
      narrativeModalOpen = true;
    } else if (result.type === 'success') {
      toast.info('Narrative generated — check the modal.');
    } else {
      toast.error('Failed to generate narrative.');
    }
  }

  function exportNarrative() {
    downloadMarkdown(`# Past Performance Narrative\n\n${narrative}`, 'Past_Performance_Narrative');
    toast.success('Exported as Markdown');
  }

  function exportPDF() {
    printAsPDF('Past Performance Narrative', narrative);
  }
  // Group results by project
  let resultsByProject = $derived(groupByProject(form?.results ?? []));
</script>

<div>
  <!-- Header -->
  <div class="page-header mb-6">
    <div>
      <h1>Past Performance Query</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Search WSRs and generate past performance narratives for BD</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Filter panel -->
    <div class="lg:col-span-1">
      <div class="card sticky top-4">
        <div class="card-header">
          <h2 class="section-title mb-0">Search Filters</h2>
        </div>
        <form
          method="POST"
          action="?/search"
          class="card-body space-y-4"
          use:enhance={() => {
            searching = true;
            selectedWSRIds = new Set();
            return async ({ result, update }) => {
              await update();
              handleSearchResult({ result });
            };
          }}
        >
          <!-- Client Agency -->
          <div>
            <label class="label" for="bd-agency">Client Agency</label>
            <select name="client_agency" id="bd-agency" class="select">
              <option value="">All Agencies</option>
              {#each data.agencies as agency}
                <option value={agency}>{agency}</option>
              {/each}
            </select>
          </div>

          <!-- Project -->
          <div>
            <label class="label" for="bd-project">Project</label>
            <select name="project_id" id="bd-project" class="select">
              <option value="">All Projects</option>
              {#each data.projects as p}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          </div>

          <!-- Date range -->
          <div>
            <label class="label" for="bd-date-from">Date From</label>
            <input type="date" name="date_from" id="bd-date-from" class="input" />
          </div>
          <div>
            <label class="label" for="bd-date-to">Date To</label>
            <input type="date" name="date_to" id="bd-date-to" class="input" />
          </div>

          <!-- Work Type Tags -->
          <div>
            <TagInput options={tagNames} bind:selected={selectedTags} label="Work Type Tags" />
            {#each selectedTags as tag}
              <input type="hidden" name="work_type_tags" value={tag} />
            {/each}
          </div>

          <!-- Keyword search -->
          <div>
            <label class="label" for="bd-keyword">Keyword (semantic search)</label>
            <input
              type="text"
              name="keyword"
              id="bd-keyword"
              class="input"
              placeholder="e.g., API development CISA..."
            />
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Uses AI semantic search</p>
          </div>

          <button type="submit" class="btn-primary w-full" disabled={searching}>
            {#if searching}
              <Spinner size="sm" color="text-white" />
              Searching...
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search WSRs
            {/if}
          </button>
        </form>
      </div>
    </div>

    <!-- Results panel -->
    <div class="lg:col-span-3">
      {#if !form?.results && !searching}
        <div class="card">
          <EmptyState
            title="Run a search to find WSRs"
            message="Use the filters on the left to search for relevant weekly status reports. Then select WSRs to generate a past performance narrative."
            icon="search"
          />
        </div>

      {:else if searching}
        <div class="card p-8 flex items-center justify-center gap-3">
          <Spinner size="md" />
          <span class="text-sm text-gray-500 dark:text-gray-400">Searching...</span>
        </div>

      {:else if form?.results?.length === 0}
        <div class="card">
          <EmptyState
            title="No WSRs found"
            message="Try adjusting your search filters or broadening the date range."
            icon="search"
          />
        </div>

      {:else if form?.results}
        <!-- Actions bar -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              <strong>{form.results.length}</strong> WSRs found
            </span>
            {#if selectedWSRIds.size > 0}
              <span class="text-sm text-primary font-medium">
                {selectedWSRIds.size} selected
              </span>
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-ghost text-sm" onclick={selectAll}>Select All</button>
            {#if selectedWSRIds.size > 0}
              <button class="btn-ghost text-sm" onclick={clearSelection}>Clear</button>
              <form
                method="POST"
                action="?/generatePastPerf"
                use:enhance={() => {
                  generating = true;
                  return async ({ result, update }) => {
                    await update({ reset: false });
                    handleGenerateResult({ result });
                  };
                }}
              >
                {#each [...selectedWSRIds] as id}
                  <input type="hidden" name="wsr_ids" value={id} />
                {/each}
                <button type="submit" class="btn-primary" disabled={generating}>
                  {#if generating}
                    <Spinner size="sm" color="text-white" />
                    Generating...
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Generate Narrative ({selectedWSRIds.size})
                  {/if}
                </button>
              </form>
            {/if}
          </div>
        </div>

        <!-- Results grouped by project -->
        <div class="space-y-4">
          {#each resultsByProject as { project, wsrs }}
            <div class="card">
              <!-- Project header -->
              <div class="card-header flex items-center gap-3">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-gray-100">{project?.name ?? 'Unknown Project'}</h3>
                  {#if project?.client_agency}
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="badge badge-gray">{project.client_agency}</span>
                      {#if project?.contract_number}
                        <span class="text-xs text-gray-400 dark:text-gray-500">#{project.contract_number}</span>
                      {/if}
                    </div>
                  {/if}
                </div>
                <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">{wsrs.length} WSRs</span>
              </div>

              <!-- WSR list -->
              <div class="divide-y divide-gray-50 dark:divide-gray-800">
                {#each wsrs as wsr}
                  <label class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-50 cursor-pointer">
                    <input
                      type="checkbox"
                      class="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      checked={selectedWSRIds.has(wsr.id)}
                      onchange={() => toggleWSR(wsr.id)}
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{wsr.user?.full_name}</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">{getWeekLabel(wsr.week_ending)}</span>
                        <span class="badge badge-gray capitalize">{wsr.report_type}</span>
                      </div>
                      {#if wsr.accomplishments}
                        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{wsr.accomplishments}</p>
                      {/if}
                      {#if wsr.work_type_tags?.length}
                        <div class="flex flex-wrap gap-1 mt-1">
                          {#each wsr.work_type_tags.slice(0, 3) as tag}
                            <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-50 text-gray-500 dark:text-gray-400 text-xs rounded">{tag}</span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Past Performance Narrative Modal -->
<Modal bind:open={narrativeModalOpen} title="Past Performance Narrative" size="xl">
  <div class="bg-gray-50 dark:bg-dark-50 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
    <pre class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">{narrative}</pre>
  </div>

  {#snippet footer()}
  
      <button class="btn-secondary" onclick={exportNarrative}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export Markdown
      </button>
      <button class="btn-secondary" onclick={exportPDF}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
        Export PDF
      </button>
      <button class="btn-primary" onclick={() => (narrativeModalOpen = false)}>Close</button>
    
  {/snippet}
</Modal>
