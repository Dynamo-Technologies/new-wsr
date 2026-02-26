<script lang="ts">
  import { goto } from '$app/navigation';
  import { appUser } from '$lib/stores/auth';
  import StatCard from '$lib/components/ui/StatCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import WSRCard from '$lib/components/wsr/WSRCard.svelte';
  import { getWeekLabel, formatDate, getQuarterLabel } from '$lib/utils/dates';

  export let data;

  $: wsrsByWeek = groupByWeek(data.wsrs);
  $: currentQuarter = getQuarterLabel();

  function groupByWeek(wsrs: typeof data.wsrs) {
    const groups = new Map<string, typeof data.wsrs>();
    for (const wsr of wsrs) {
      const key = wsr.week_ending;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(wsr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }
</script>

<!-- Page header -->
<div class="page-header">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
      Welcome back, {$appUser?.full_name?.split(' ')[0] ?? 'there'} 
    </h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track and submit your weekly status reports</p>
  </div>
  <a href="/dashboard/wsr/new" class="btn-primary">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Submit WSR
  </a>
</div>

<!-- Stats row -->
<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
  <StatCard
    label="WSRs This Quarter"
    value={data.stats?.quarterCount ?? 0}
    subtext={currentQuarter}
    color="primary"
  >
    <svelte:fragment slot="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    </svelte:fragment>
  </StatCard>

  <StatCard
    label="Total WSRs"
    value={data.wsrs.length}
    subtext="All time"
    color="blue"
  >
    <svelte:fragment slot="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </svelte:fragment>
  </StatCard>

  <StatCard
    label="Active Projects"
    value={data.projects.length}
    subtext="Available to report on"
    color="green"
  >
    <svelte:fragment slot="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
      </svg>
    </svelte:fragment>
  </StatCard>
</div>

<!-- WSR History -->
<div class="card">
  <div class="card-header flex items-center justify-between">
    <h2 class="section-title mb-0">Recent Status Reports</h2>
    <span class="text-xs text-gray-400 dark:text-gray-500">Last 20 reports</span>
  </div>

  {#if data.wsrs.length === 0}
    <EmptyState
      title="No WSRs submitted yet"
      message="Submit your first weekly status report to get started."
      icon="document"
    >
      <a href="/dashboard/wsr/new" class="btn-primary text-sm">Submit First WSR</a>
    </EmptyState>
  {:else}
    <div class="divide-y divide-gray-100 dark:divide-gray-800">
      {#each wsrsByWeek as [weekEnding, reports]}
        <div class="px-6 py-4">
          <!-- Week header -->
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 rounded-full bg-primary shrink-0"></div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Week of {getWeekLabel(weekEnding)}
            </h3>
          </div>
          <!-- WSR cards for this week -->
          <div class="space-y-2 ml-4">
            {#each reports as wsr}
              <WSRCard {wsr} />
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
