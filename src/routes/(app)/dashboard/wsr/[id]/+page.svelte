<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import { formatDate, getWeekLabel } from '$lib/utils/dates';
  import TagInput from '$lib/components/ui/TagInput.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import type { ActionData } from './$types';

  interface Props {
    data: any;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let editing = $state(false);
  let saving = $state(false);
  let deleting = $state(false);
  let showDeleteConfirm = $state(false);
  let selectedTags: string[] = $state(data.wsr.work_type_tags ?? []);

  const tagsByType: Record<string, string[]> = {
    technical: [
      'API Development', 'Cybersecurity', 'Data Engineering', 'ETL',
      'Cloud Infrastructure', 'DevSecOps', 'Machine Learning', 'Software Development',
      'Systems Integration', 'Testing/QA', 'Documentation', 'Code Review'
    ],
    pm: [
      'Program Management', 'Capture', 'Business Development', 'Proposal Writing',
      'Risk Management', 'Stakeholder Engagement', 'Contract Management',
      'Budget Tracking', 'Reporting', 'Planning', 'Status Meetings'
    ],
    admin: [
      'Human Resources', 'Administrative Support', 'Finance', 'Procurement',
      'Training', 'Compliance', 'Facilities', 'IT Support', 'Communications'
    ]
  };

  let currentTags = $derived(tagsByType[data.wsr.report_type] ?? []);

  const typeLabels: Record<string, string> = {
    technical: 'Technical',
    pm: 'Project Management',
    admin: 'Administrative'
  };

  const typeBadge: Record<string, string> = {
    technical: 'badge-blue',
    pm: 'badge-yellow',
    admin: 'badge-gray'
  };

  onMount(() => {
    if ($page.url.searchParams.get('submitted') === 'true') {
      toast.success('WSR submitted successfully!');
    }
  });

  function handleUpdateResult({ result }: { result: { type: string } }) {
    saving = false;
    if (result.type === 'success') {
      editing = false;
      toast.success('WSR updated successfully');
    } else {
      toast.error('Failed to save changes');
    }
  }
</script>

<div class="max-w-3xl mx-auto">
  <!-- Back + header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <a href="/dashboard" class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-50 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </a>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Status Report</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">{getWeekLabel(data.wsr.week_ending)}</p>
      </div>
    </div>

    {#if data.canEdit}
      <div class="flex items-center gap-2">
        {#if !editing}
          <button class="btn-secondary" onclick={() => (editing = true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button class="btn-ghost text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" onclick={() => (showDeleteConfirm = true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Delete
          </button>
        {:else}
          <button class="btn-ghost" onclick={() => { editing = false; selectedTags = data.wsr.work_type_tags ?? []; }}>
            Cancel
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- WSR metadata bar -->
  <div class="card mb-6 p-4">
    <div class="flex flex-wrap items-center gap-3">
      <span class="badge {typeBadge[data.wsr.report_type] ?? 'badge-gray'}">
        {typeLabels[data.wsr.report_type] ?? data.wsr.report_type}
      </span>
      {#if data.wsr.project}
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{data.wsr.project.name}</span>
        {#if data.wsr.project.client_agency}
          <span class="badge badge-gray">{data.wsr.project.client_agency}</span>
        {/if}
      {/if}
      <span class="text-sm text-gray-400 dark:text-gray-500 ml-auto">
        Submitted {formatDate(data.wsr.submitted_at ?? data.wsr.created_at)}
      </span>
    </div>
  </div>

  {#if data.isManagerView}
    <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg text-sm mb-6">
      <strong>Manager View:</strong> You're viewing {data.wsr.user?.full_name}'s WSR in read-only mode.
    </div>
  {/if}

  {#if editing}
    <!-- Edit form -->
    <form
      method="POST"
      action="?/update"
      use:enhance={() => {
        saving = true;
        return async ({ result, update }) => {
          await update({ reset: false });
          handleUpdateResult({ result });
        };
      }}
    >
      <div class="card mb-6">
        <div class="card-header">
          <h2 class="section-title mb-0">Edit WSR Content</h2>
        </div>
        <div class="card-body space-y-5">
          <div>
            <label class="label" for="edit-accomplishments">Accomplishments</label>
            <textarea name="accomplishments" id="edit-accomplishments" class="textarea" rows="4" value={data.wsr.accomplishments ?? ''}></textarea>
          </div>
          <div>
            <label class="label" for="edit-this-week">This Week</label>
            <textarea name="this_week" id="edit-this-week" class="textarea" rows="3" value={data.wsr.this_week ?? ''}></textarea>
          </div>
          <div>
            <label class="label" for="edit-blockers">Blockers / Risks</label>
            <textarea name="blockers" id="edit-blockers" class="textarea" rows="2" value={data.wsr.blockers ?? ''}></textarea>
          </div>
          <div>
            <label class="label" for="edit-next-week">Next Week</label>
            <textarea name="next_week" id="edit-next-week" class="textarea" rows="3" value={data.wsr.next_week ?? ''}></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label class="label" for="edit-hours">Hours</label>
              <input type="number" name="hours" id="edit-hours" class="input" min="0" max="168" step="0.5" value={data.wsr.hours ?? ''} />
            </div>
            <div class="sm:col-span-3">
              <label class="label" for="edit-hours-narrative">Hours Narrative</label>
              <textarea name="hours_narrative" id="edit-hours-narrative" class="textarea" rows="2" value={data.wsr.hours_narrative ?? ''}></textarea>
            </div>
          </div>
          <div>
            <TagInput options={currentTags} bind:selected={selectedTags} label="Work Type Tags" />
            {#each selectedTags as tag}
              <input type="hidden" name="work_type_tags" value={tag} />
            {/each}
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button type="button" class="btn-secondary" onclick={() => (editing = false)}>Cancel</button>
        <button type="submit" class="btn-primary" disabled={saving}>
          {#if saving}<Spinner size="sm" color="text-white" />{/if}
          Save Changes
        </button>
      </div>
    </form>
  {:else}
    <!-- View mode -->
    <div class="card mb-6">
      <div class="card-body space-y-6">
        {#if data.wsr.accomplishments}
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Accomplishments</h3>
            <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{data.wsr.accomplishments}</p>
          </div>
        {/if}

        {#if data.wsr.this_week}
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">This Week</h3>
            <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{data.wsr.this_week}</p>
          </div>
        {/if}

        {#if data.wsr.blockers}
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {data.wsr.report_type === 'pm' ? 'Risks & Issues' : 'Blockers'}
            </h3>
            <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{data.wsr.blockers}</p>
          </div>
        {/if}

        {#if data.wsr.next_week}
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Next Week</h3>
            <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{data.wsr.next_week}</p>
          </div>
        {/if}

        {#if data.wsr.hours != null || data.wsr.hours_narrative}
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Hours</h3>
            {#if data.wsr.hours != null}
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{data.wsr.hours} hrs</p>
            {:else}
              <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{data.wsr.hours_narrative}</p>
            {/if}
          </div>
        {/if}

        {#if data.wsr.work_type_tags?.length}
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Work Type Tags</h3>
            <div class="flex flex-wrap gap-2">
              {#each data.wsr.work_type_tags as tag}
                <span class="px-2.5 py-1 bg-gray-100 dark:bg-dark-50 text-gray-700 dark:text-gray-300 text-xs rounded-full">{tag}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Delete confirmation -->
<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Delete WSR"
  message="Are you sure you want to delete this WSR? This action cannot be undone."
  confirmLabel="Delete"
  confirmClass="btn-danger"
  loading={deleting}
  on:confirm={async () => {
    deleting = true;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '?/delete';
    document.body.appendChild(form);
    form.submit();
  }}
/>
