<script lang="ts">
  import { run } from 'svelte/legacy';

  import { enhance } from '$app/forms';
  import { toast } from '$lib/stores/toast';
  import { formatDate, getRecentQuarters, parseQuarterDates, toInputDate } from '$lib/utils/dates';
  import { downloadMarkdown } from '$lib/utils/export';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';

  let { data } = $props();

  let generating = $state(false);
  let saving = $state(false);
  let selectedQuarter = $state(getRecentQuarters()[1]); // Last quarter
  let selectedReviewId = $state('');
  let managerNotes = $state('');
  let editedStatus = $state('draft');

  const recentQuarters = getRecentQuarters(8);

  let quarterDates = $derived(parseQuarterDates(selectedQuarter));
  let selectedReview = $derived(data.reviews.find((r) => r.id === selectedReviewId) ?? null);
  run(() => {
    if (selectedReview) {
      managerNotes = selectedReview.manager_notes ?? '';
      editedStatus = selectedReview.status;
    }
  });

  function handleGenerateResult({ result }: { result: { type: string; data?: { reviewId?: string } } }) {
    generating = false;
    if (result.type === 'success') {
      toast.success('Quarterly review generated! Refresh to see it.');
    } else {
      toast.error('Failed to generate review. Please try again.');
    }
  }

  function handleSaveResult({ result }: { result: { type: string } }) {
    saving = false;
    if (result.type === 'success') {
      toast.success('Review saved successfully');
    } else {
      toast.error('Failed to save review');
    }
  }

  function exportReview() {
    if (!selectedReview) return;
    const content = [
      `# Quarterly Performance Review`,
      `**Employee:** ${data.employee.full_name}`,
      `**Quarter:** ${selectedReview.quarter}`,
      '',
      '## AI Summary',
      selectedReview.ai_summary ?? '_Not generated_',
      '',
      '## Manager Notes',
      selectedReview.manager_notes ?? '_No notes added_'
    ].join('\n');
    downloadMarkdown(content, `QR_${data.employee.full_name.replace(' ', '_')}_${selectedReview.quarter.replace(' ', '_')}`);
    toast.success('Exported as Markdown');
  }
</script>

<div class="max-w-3xl mx-auto">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <a href="/manager" class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-50 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </a>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
        {data.employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">{data.employee.full_name}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">{data.employee.role} -- Quarterly Review</p>
      </div>
    </div>
  </div>

  <!-- Generate new review -->
  <div class="card mb-6">
    <div class="card-header">
      <h2 class="section-title mb-0">Generate New Review</h2>
    </div>
    <div class="card-body">
      <form
        method="POST"
        action="?/generate"
        use:enhance={() => {
          generating = true;
          return async ({ result, update }) => {
            await update();
            handleGenerateResult({ result });
          };
        }}
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="label" for="quarter-select">Quarter</label>
            <select name="quarter" id="quarter-select" class="select" bind:value={selectedQuarter} required>
              {#each recentQuarters as q}
                <option value={q}>{q}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="label" for="start-date">Start Date</label>
            <input type="date" name="start_date" id="start-date" class="input" value={quarterDates?.start ?? ''} required />
          </div>
          <div>
            <label class="label" for="end-date">End Date</label>
            <input type="date" name="end_date" id="end-date" class="input" value={quarterDates?.end ?? ''} required />
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
          This will fetch all WSRs for this employee in the date range and generate an AI performance summary using Claude.
        </p>
        <button type="submit" class="btn-primary" disabled={generating}>
          {#if generating}
            <Spinner size="sm" color="text-white" />
            Generating with AI...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Generate Review Summary
          {/if}
        </button>
      </form>
    </div>
  </div>

  <!-- Existing reviews -->
  {#if data.reviews.length === 0}
    <EmptyState
      title="No reviews yet"
      message="Generate your first quarterly review using the form above."
      icon="document"
    />
  {:else}
    <div class="card">
      <div class="card-header">
        <h2 class="section-title mb-0">Existing Reviews</h2>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        {#each data.reviews as review}
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.quarter}</h3>
                <span class="badge {review.status === 'completed' ? 'badge-green' : 'badge-yellow'}">
                  {review.status}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="text-xs text-primary hover:underline"
                  onclick={() => (selectedReviewId = selectedReviewId === review.id ? '' : review.id)}
                >
                  {selectedReviewId === review.id ? 'Collapse' : 'View/Edit'}
                </button>
                <button class="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" onclick={exportReview}>
                  Export
                </button>
              </div>
            </div>

            {#if selectedReviewId === review.id}
              <!-- AI Summary (read-only) -->
              {#if review.ai_summary}
                <div class="mb-4">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">AI-Generated Summary</h4>
                  <div class="bg-gray-50 dark:bg-dark-50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {review.ai_summary}
                  </div>
                </div>
              {/if}

              <!-- Manager notes + save -->
              <form
                method="POST"
                action="?/save"
                use:enhance={() => {
                  saving = true;
                  return async ({ result, update }) => {
                    await update({ reset: false });
                    handleSaveResult({ result });
                  };
                }}
              >
                <input type="hidden" name="review_id" value={review.id} />
                <div class="mb-3">
                  <label class="label" for="manager-notes-{review.id}">Manager Notes</label>
                  <textarea
                    name="manager_notes"
                    id="manager-notes-{review.id}"
                    class="textarea"
                    rows="4"
                    placeholder="Add your manager notes, observations, and recommendations..."
                    bind:value={managerNotes}
                  ></textarea>
                </div>
                <div class="flex items-center gap-3">
                  <select name="status" class="select w-auto" bind:value={editedStatus}>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button type="submit" class="btn-primary" disabled={saving}>
                    {#if saving}<Spinner size="sm" color="text-white" />{/if}
                    Save Review
                  </button>
                </div>
              </form>
            {:else}
              {#if review.ai_summary}
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{review.ai_summary}</p>
              {:else}
                <p class="text-sm text-gray-400 dark:text-gray-500 italic">No summary generated yet</p>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
