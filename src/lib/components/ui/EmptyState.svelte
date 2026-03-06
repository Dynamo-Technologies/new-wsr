<script lang="ts">
  interface Props {
    title?: string;
    message?: string;
    icon?: string;
    children?: import('svelte').Snippet;
  }

  let {
    title = 'No data found',
    message = '',
    icon = 'inbox',
    children
  }: Props = $props();

  const icons: Record<string, string> = {
    inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    document: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  };
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
  <div class="w-16 h-16 bg-gray-100 dark:bg-dark-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
    {@html icons[icon] ?? icons.inbox}
  </div>
  <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
  {#if message}
    <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
  {/if}
  {#if children}
    <div class="mt-4">
      {@render children?.()}
    </div>
  {/if}
</div>
