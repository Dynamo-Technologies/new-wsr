<script lang="ts">
  import { run } from 'svelte/legacy';

  import { page } from '$app/stores';
  import { appUser } from '$lib/stores/auth';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import TopBar from '$lib/components/layout/TopBar.svelte';

  let { data, children } = $props();

  // Hydrate the appUser store from server data
  run(() => {
    appUser.set(data.appUser);
  });

  let sidebarOpen = $state(false);
</script>

<div class="flex h-screen bg-gray-50 dark:bg-dark-700 overflow-hidden">
  <!-- Sidebar -->
  <Sidebar bind:open={sidebarOpen} user={data.appUser} managedProjects={data.managedProjects} isAdmin={data.isAdmin} />

  <!-- Overlay for mobile -->
  {#if sidebarOpen}
    <div
      class="fixed inset-0 z-20 bg-black/40 dark:bg-black/60 lg:hidden"
      onclick={() => (sidebarOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- Main content area -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <TopBar user={data.appUser} onMenuClick={() => (sidebarOpen = !sidebarOpen)} />

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto">
      <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {@render children?.()}
      </div>
    </main>
  </div>
</div>
