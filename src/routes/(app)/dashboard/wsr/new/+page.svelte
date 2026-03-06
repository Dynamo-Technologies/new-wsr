<script lang="ts">
  import { run } from 'svelte/legacy';

  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import { getUpcomingFriday, toInputDate } from '$lib/utils/dates';
  import TagInput from '$lib/components/ui/TagInput.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import type { ActionData } from './$types';

  interface Props {
    data: any;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let loading = $state(false);
  let reportType: 'technical' | 'pm' | 'admin' = $state('technical');
  let selectedTags: string[] = $state([]);
  let multiProject = $state(false);

  // Default week ending to upcoming Friday
  const defaultWeekEnding = toInputDate(getUpcomingFriday());

  // Project entries state
  interface ProjectEntry {
    project_id: string;
    hours: string;
    description: string;
  }

  let entries: ProjectEntry[] = $state([{ project_id: '', hours: '', description: '' }]);

  function addEntry() {
    entries = [...entries, { project_id: '', hours: '', description: '' }];
  }

  function removeEntry(index: number) {
    entries = entries.filter((_, i) => i !== index);
  }

  // Get available projects for a given entry (exclude already-selected projects)
  function availableProjects(entryIndex: number) {
    const selectedIds = entries
      .map((e, i) => (i !== entryIndex ? e.project_id : null))
      .filter(Boolean);
    return data.projects.filter((p: { id: string }) => !selectedIds.includes(p.id));
  }

  // Tag options by report type
  const tagsByType = {
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

  let currentTags = $derived(tagsByType[reportType] ?? []);
  run(() => {
    selectedTags = selectedTags.filter((t) => currentTags.includes(t));
  });

  // When multiProject is unchecked, trim to first entry only
  run(() => {
    if (!multiProject && entries.length > 1) {
      entries = [entries[0]];
    }
  });

  const reportTypeOptions = [
    {
      value: 'technical',
      label: 'Technical',
      description: 'Engineering, development, cybersecurity',
      icon: `<path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>`
    },
    {
      value: 'pm',
      label: 'Project Management',
      description: 'PM, capture, business development',
      icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>`
    },
    {
      value: 'admin',
      label: 'Administrative',
      description: 'HR, finance, operations support',
      icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`
    }
  ];

  function handleSubmitResult({ result }: { result: { type: string; status?: number } }) {
    loading = false;
    if (result.type === 'redirect') {
      toast.success('WSR submitted successfully!');
    } else if (result.type === 'failure') {
      toast.error(form?.error || 'Failed to submit WSR. Please try again.');
    }
  }
</script>

<div class="max-w-3xl mx-auto">
  <!-- Page header -->
  <div class="flex items-center gap-3 mb-6">
    <a href="/dashboard" class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-50 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </a>
    <div>
      <h1>Submit Weekly Status Report</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">Document your accomplishments and plans</p>
    </div>
  </div>

  {#if form?.error}
    <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      return async ({ result, update }) => {
        await update();
        handleSubmitResult({ result });
      };
    }}
  >
    <!-- Section 1: Report Details -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="section-title mb-0">Report Details</h2>
      </div>
      <div class="card-body space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Week Ending -->
          <div>
            <label class="label" for="week_ending">
              Week Ending (Friday) <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="date"
              name="week_ending"
              id="week_ending"
              class="input"
              value={defaultWeekEnding}
              required
            />
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Auto-set to upcoming Friday</p>
          </div>
        </div>

        <!-- Report Type -->
        <div>
          <label class="label">Report Type <span class="text-red-500 dark:text-red-400">*</span></label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
            {#each reportTypeOptions as opt}
              <label
                class="relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150
                       {reportType === opt.value
                         ? 'border-primary bg-primary-50 dark:bg-primary-950/30'
                         : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-50'}"
              >
                <input
                  type="radio"
                  name="report_type"
                  value={opt.value}
                  class="sr-only"
                  bind:group={reportType}
                  required
                />
                <div class="mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="{reportType === opt.value ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}"
                  >
                    {@html opt.icon}
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold {reportType === opt.value ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}">
                    {opt.label}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.description}</p>
                </div>
                {#if reportType === opt.value}
                  <div class="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                {/if}
              </label>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Project Entries -->
    <input type="hidden" name="entry_count" value={multiProject ? entries.length : 1} />

    {#each (multiProject ? entries : [entries[0]]) as entry, i}
      <div class="card mb-4">
        <div class="card-header flex items-center justify-between">
          <h2 class="section-title mb-0">
            {#if multiProject}
              Project {i + 1}
            {:else}
              Project & Hours
            {/if}
          </h2>
          {#if multiProject && entries.length > 1 && i > 0}
            <button
              type="button"
              onclick={() => removeEntry(i)}
              class="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          {/if}
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <!-- Project -->
            <div class="sm:col-span-3">
              <label class="label" for="project_id_{i}">Project <span class="text-red-500 dark:text-red-400">*</span></label>
              <select name="project_id_{i}" id="project_id_{i}" class="select" required bind:value={entry.project_id}>
                <option value="">Select a project...</option>
                {#each availableProjects(i) as project}
                  <option value={project.id}>
                    {project.name}
                  </option>
                {/each}
              </select>
            </div>

            <!-- Hours -->
            <div>
              <label class="label" for="hours_{i}">Hours <span class="text-red-500 dark:text-red-400">*</span></label>
              <input
                type="number"
                name="hours_{i}"
                id="hours_{i}"
                class="input"
                min="0"
                max="168"
                step="0.5"
                placeholder="40"
                required
                bind:value={entry.hours}
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="label" for="description_{i}">
              What did you work on? <span class="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              name="description_{i}"
              id="description_{i}"
              class="textarea"
              placeholder="Describe your accomplishments and tasks for this project"
              rows="4"
              required
              bind:value={entry.description}
            ></textarea>
          </div>
        </div>
      </div>
    {/each}

    <!-- Multi-project toggle -->
    <div class="mb-6">
      <label class="flex items-center gap-3 cursor-pointer group">
        <div class="relative">
          <input
            type="checkbox"
            bind:checked={multiProject}
            class="sr-only peer"
          />
          <div class="w-10 h-6 bg-gray-200 dark:bg-dark-100 rounded-full peer-checked:bg-primary transition-colors duration-200"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4"></div>
        </div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          I billed another project this week
        </span>
      </label>

      {#if multiProject}
        <button
          type="button"
          onclick={addEntry}
          class="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary-600 font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
          </svg>
          Add another project
        </button>
      {/if}
    </div>

    <!-- Section 3: Shared Fields -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="section-title mb-0">Blockers & Next Week</h2>
      </div>
      <div class="card-body space-y-5">
        <!-- Blockers -->
        <div>
          <label class="label" for="blockers">
            Blockers <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <textarea
            name="blockers"
            id="blockers"
            class="textarea"
            placeholder="Describe any blockers preventing progress (or 'None')"
            rows="2"
            required
          ></textarea>
        </div>

        <!-- Next Week -->
        <div>
          <label class="label" for="next_week">
            Tasks Next Week <span class="text-red-500 dark:text-red-400">*</span>
          </label>
          <textarea
            name="next_week"
            id="next_week"
            class="textarea"
            placeholder="What are you planning to work on next week?"
            rows="3"
            required
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Section 4: Work Type Tags -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="section-title mb-0">Work Type Tags</h2>
      </div>
      <div class="card-body">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Select tags that best describe the type of work performed this week.
        </p>
        <TagInput options={currentTags} bind:selected={selectedTags} />

        {#each selectedTags as tag}
          <input type="hidden" name="work_type_tags" value={tag} />
        {/each}
      </div>
    </div>

    <!-- Submit -->
    <div class="flex items-center justify-end gap-3">
      <a href="/dashboard" class="btn-secondary">Cancel</a>
      <button type="submit" class="btn-primary" disabled={loading}>
        {#if loading}
          <Spinner size="sm" color="text-white" />
          Submitting...
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Submit WSR
        {/if}
      </button>
    </div>
  </form>
</div>
