<script lang="ts">
  export let options: string[] = [];
  export let selected: string[] = [];
  export let label = '';
  export let placeholder = 'Select tags...';

  let customTagInput = '';
  let showAddInput = false;

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      selected = selected.filter((t) => t !== tag);
    } else {
      selected = [...selected, tag];
    }
  }

  function addCustomTag() {
    const tag = customTagInput.trim();
    if (tag && !options.includes(tag) && !selected.includes(tag)) {
      options = [...options, tag];
      selected = [...selected, tag];
    } else if (tag && options.includes(tag) && !selected.includes(tag)) {
      selected = [...selected, tag];
    }
    customTagInput = '';
    showAddInput = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    } else if (e.key === 'Escape') {
      customTagInput = '';
      showAddInput = false;
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

    {#if showAddInput}
      <input
        type="text"
        bind:value={customTagInput}
        on:keydown={handleKeydown}
        on:blur={addCustomTag}
        class="px-2 py-0.5 text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded-full outline-none
               text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 w-36"
        placeholder="Type tag name..."
        autofocus
      />
    {:else}
      <button
        type="button"
        on:click={() => (showAddInput = true)}
        class="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600
               text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors duration-100"
      >
        + Add Tag
      </button>
    {/if}

    {#if options.length === 0 && !showAddInput}
      <span class="text-xs text-gray-400 dark:text-gray-500 px-1 py-1">{placeholder}</span>
    {/if}
  </div>
  {#if selected.length > 0}
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{selected.length} tag{selected.length > 1 ? 's' : ''} selected</p>
  {/if}
</div>
