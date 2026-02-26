<script lang="ts">
  export let options: string[] = [];
  export let selected: string[] = [];
  export let label = '';
  export let placeholder = 'Select tags...';

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      selected = selected.filter((t) => t !== tag);
    } else {
      selected = [...selected, tag];
    }
  }
</script>

<div>
  {#if label}
    <label class="label">{label}</label>
  {/if}
  <div class="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[44px] bg-white dark:bg-dark-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
    {#each options as tag}
      <button
        type="button"
        on:click={() => toggle(tag)}
        class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-100 {selected.includes(tag)
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-100 dark:text-gray-300 dark:hover:bg-dark-200'}"
      >
        {tag}
      </button>
    {/each}
    {#if options.length === 0}
      <span class="text-xs text-gray-400 dark:text-gray-500 px-1 py-1">{placeholder}</span>
    {/if}
  </div>
  {#if selected.length > 0}
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{selected.length} tag{selected.length > 1 ? 's' : ''} selected</p>
  {/if}
</div>
