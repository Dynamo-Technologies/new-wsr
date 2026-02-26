<script lang="ts">
  import { page } from '$app/stores';
  import type { User } from '$lib/types';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

  export let user: User;
  export let onMenuClick: () => void;

  const pageLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/wsr/new': 'Submit Weekly Status Report',
    '/manager': 'Manager Dashboard',
    '/bd': 'Past Performance',
    '/admin': 'Admin Panel'
  };

  $: currentLabel = Object.entries(pageLabels)
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => $page.url.pathname.startsWith(path))?.[1] ?? 'Dashboard';

  $: initials = user?.full_name
    ? user.full_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';
</script>

<header class="bg-white dark:bg-dark border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 h-14 flex items-center gap-4 shrink-0">
  <!-- Mobile menu toggle -->
  <button
    on:click={onMenuClick}
    class="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
           dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-dark-50 transition-colors"
    aria-label="Toggle menu"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>

  <!-- Page title -->
  <h1 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">{currentLabel}</h1>

  <!-- Right side: user info -->
  <div class="flex items-center gap-3">
    <ThemeToggle />
    <div class="hidden sm:flex flex-col items-end">
      <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{user?.full_name}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</span>
    </div>
    <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  </div>
</header>
