<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { User } from '$lib/types';

  interface Props {
    open?: boolean;
    user: User;
    managedProjects?: { id: string; name: string }[];
    isAdmin?: boolean;
  }

  let {
    open = $bindable(false),
    user,
    managedProjects = [],
    isAdmin = false
  }: Props = $props();

  // Role-based navigation
  const employeeNav = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/wsr/new', label: 'Submit WSR', icon: 'plus-circle' }
  ];

  const pmNav = [
    { href: '/manager', label: 'Manager Dashboard', icon: 'users' },
    { href: '/dashboard', label: 'My Dashboard', icon: 'home' },
    { href: '/bd', label: 'Past Performance', icon: 'search' },
    { href: '/dashboard/wsr/new', label: 'Submit WSR', icon: 'plus-circle' }
  ];

  const adminNav = [
    { href: '/dashboard', label: 'My Dashboard', icon: 'home' },
    { href: '/manager', label: 'Manager View', icon: 'users' },
    { href: '/bd', label: 'Past Performance', icon: 'search' },
    { href: '/admin', label: 'Admin Panel', icon: 'settings' },
    { href: '/dashboard/wsr/new', label: 'Submit WSR', icon: 'plus-circle' }
  ];

  let isPM = $derived(managedProjects.length > 0);
  let navItems =
    $derived(isAdmin
      ? adminNav
      : isPM
        ? pmNav
        : employeeNav);

  let currentPath = $derived($page.url.pathname);

  function isActive(href: string, path: string): boolean {
    if (href === '/dashboard') return path === '/dashboard';
    return path.startsWith(href);
  }

  function signOut() {
    goto('/auth/signout');
  }

  const svgIcons: Record<string, string> = {
    home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    'plus-circle': `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
    search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
    'log-out': `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`
  };

  function getRoleLabel(role: string): string {
    if (isAdmin) return 'Administrator';
    if (isPM) return 'Program Manager';
    return 'Employee';
  }

  // User initials for avatar
  let initials = $derived(user?.full_name
    ? user.full_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '??');
</script>

<!-- Sidebar wrapper -->
<aside
  class="fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-dark border-r border-gray-200 dark:border-gray-700 flex flex-col
         transform transition-transform duration-300 ease-in-out
         {open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0"
>
  <!-- Logo area -->
  <div class="px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
    <img src="/dynamo_simple.png" alt="Dynamo" class="h-7 w-auto" />
    <div class="min-w-0">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">WSR</p>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    {#each navItems as item}
      <a
        href={item.href}
        class={isActive(item.href, currentPath) ? 'nav-item-active' : 'nav-item'}
        onclick={() => (open = false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0"
        >
          {@html svgIcons[item.icon] ?? ''}
        </svg>
        <span class="truncate">{item.label}</span>
      </a>
    {/each}

  </nav>

  <!-- User profile footer -->
  <div class="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-3 px-3 py-2 rounded-lg">
      <!-- Avatar -->
      <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shrink-0">
        {initials}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.full_name}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{getRoleLabel(user?.role)}</p>
      </div>
    </div>

    <button
      onclick={signOut}
      class="nav-item w-full mt-1 text-gray-500 hover:text-red-600 hover:bg-red-50
             dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
        {@html svgIcons['log-out']}
      </svg>
      <span>Sign Out</span>
    </button>
  </div>
</aside>
