<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

  let { data } = $props();
  let { supabase } = $derived(data);
  let msLoading = $state(false);

  async function signInWithMicrosoft() {
    msLoading = true;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email openid profile',
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      toast.error(error.message);
      msLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-dark-700 flex flex-col">
  <!-- Header bar -->
  <div class="bg-white dark:bg-dark border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
    <img src="/dynamo_simple.png" alt="Dynamo" class="h-8" />
    <ThemeToggle />
  </div>

  <!-- Login card -->
  <div class="flex-1 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Top accent bar -->
        <div class="h-1 bg-primary w-full"></div>

        <div class="px-8 py-10">
          <!-- Logo & title -->
          <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-3 mb-2">
              <img src="/dynamo_simple.png" alt="Dynamo" class="h-8 w-auto" />
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">WSR Platform</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Weekly Status Report Management</p>
          </div>

          <!-- Microsoft SSO -->
          <button
            onclick={signInWithMicrosoft}
            disabled={msLoading}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300
                   rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                   dark:bg-dark-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-100 dark:ring-offset-dark"
          >
            {#if msLoading}
              <Spinner size="sm" />
              <span>Redirecting...</span>
            {:else}
              <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              <span>Sign in with Microsoft</span>
            {/if}
          </button>

          <p class="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
            Use your Dynamo Microsoft 365 account to sign in
          </p>
        </div>
      </div>

      <!-- Footer note -->
      <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        Dynamo WSR Platform &copy; {new Date().getFullYear()} &middot; Internal Use Only
      </p>
    </div>
  </div>
</div>
