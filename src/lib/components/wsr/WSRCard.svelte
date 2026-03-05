<script lang="ts">
  import { formatDate } from '$lib/utils/dates';

  export let wsr: {
    id: string;
    week_ending: string;
    report_type: string;
    accomplishments?: string | null;
    hours?: number | null;
    work_type_tags?: string[];
    submitted_at?: string | null;
    project?: { id: string; name: string; client_agency?: string | null } | null;
    user?: { full_name?: string } | null;
  };

  export let showUser = false;
  export let compact = false;

  const typeColors: Record<string, string> = {
    technical: 'badge-blue',
    pm: 'badge-yellow',
    admin: 'badge-gray'
  };

  const typeLabels: Record<string, string> = {
    technical: 'Technical',
    pm: 'Project Mgmt',
    admin: 'Administrative'
  };
</script>

<a
  href="/dashboard/wsr/{wsr.id}"
  class="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary-50/30
         dark:hover:bg-primary-950/30 transition-all duration-150 group"
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex-1 min-w-0">
      <!-- Project name -->
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        {#if showUser && wsr.user?.full_name}
          <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{wsr.user.full_name}</span>
          <span class="text-gray-300 dark:text-gray-600">·</span>
        {/if}
        {#if wsr.project}
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{wsr.project.name}</span>
          {#if wsr.project.client_agency}
            <span class="badge badge-gray">{wsr.project.client_agency}</span>
          {/if}
        {/if}
        <span class="badge {typeColors[wsr.report_type] ?? 'badge-gray'}">
          {typeLabels[wsr.report_type] ?? wsr.report_type}
        </span>
        {#if wsr.hours != null}
          <span class="badge badge-green">{wsr.hours} hrs</span>
        {/if}
      </div>

      <!-- Accomplishments preview -->
      {#if !compact && wsr.accomplishments}
        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{wsr.accomplishments}</p>
      {/if}

      <!-- Tags -->
      {#if wsr.work_type_tags?.length}
        <div class="flex flex-wrap gap-1 mt-2">
          {#each wsr.work_type_tags.slice(0, 4) as tag}
            <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-50 text-gray-600 dark:text-gray-400 text-xs rounded">{tag}</span>
          {/each}
          {#if wsr.work_type_tags.length > 4}
            <span class="text-xs text-gray-400 dark:text-gray-500">+{wsr.work_type_tags.length - 4} more</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Date + arrow -->
    <div class="shrink-0 flex flex-col items-end gap-1">
      <span class="text-xs text-gray-400 dark:text-gray-500">{formatDate(wsr.week_ending, 'MMM d')}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors"
      >
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  </div>
</a>
