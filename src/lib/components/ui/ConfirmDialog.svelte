<script lang="ts">
  import Modal from './Modal.svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    confirmClass?: string;
    loading?: boolean;
  }

  let {
    open = $bindable(false),
    title = 'Confirm Action',
    message = 'Are you sure?',
    confirmLabel = 'Confirm',
    confirmClass = 'btn-danger',
    loading = false
  }: Props = $props();

  const dispatch = createEventDispatcher();
</script>

<Modal bind:open {title} size="sm">
  <p class="text-sm text-gray-600 dark:text-gray-400">{message}</p>

  {#snippet footer()}
  
      <button class="btn-secondary" onclick={() => (open = false)} disabled={loading}>
        Cancel
      </button>
      <button
        class={confirmClass}
        onclick={() => dispatch('confirm')}
        disabled={loading}
      >
        {#if loading}
          <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        {/if}
        {confirmLabel}
      </button>
    
  {/snippet}
</Modal>
