<script lang="ts">
  import { enhance } from '$app/forms';
  import { createSupabaseBrowserClient } from '$lib/supabase';
  import { toast } from '$lib/stores/toast';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import type { ActionData } from './$types';

  export let form: ActionData;

  const supabase = createSupabaseBrowserClient();
  let msLoading = false;
  let formLoading = false;

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

          <!-- Email/password form (primary) -->
          <form
            method="POST"
            action="?/demo"
            use:enhance={() => {
              formLoading = true;
              return async ({ result, update }) => {
                await update();
                formLoading = false;
              };
            }}
          >
            <div class="space-y-3 mb-4">
              <div>
                <label class="label" for="login-email">Email</label>
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  class="input"
                  placeholder="you@dynamo.works"
                  autocomplete="email"
                  required
                />
              </div>
              <div>
                <label class="label" for="login-password">Password</label>
                <input
                  type="password"
                  name="password"
                  id="login-password"
                  class="input"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  required
                />
              </div>

              {#if form?.error}
                <p class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {form.error}
                </p>
              {/if}

              <button type="submit" class="btn-primary w-full justify-center" disabled={formLoading}>
                {#if formLoading}
                  <Spinner size="sm" color="text-white" />
                  Signing in...
                {:else}
                  Sign In
                {/if}
              </button>
            </div>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-5">
            <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span class="text-xs text-gray-400 dark:text-gray-500">or</span>
            <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          <!-- Microsoft SSO -->
          <button
            on:click={signInWithMicrosoft}
            disabled={msLoading}
            class="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300
                   rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-150
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

          <!-- Demo hint -->
          <div class="mt-6 p-3 bg-gray-50 dark:bg-dark-50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Demo credentials</p>
            <p class="text-xs text-gray-600 dark:text-gray-300 font-mono">admin.one@dynamo.works</p>
            <p class="text-xs text-gray-600 dark:text-gray-300 font-mono">password</p>
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        Dynamo WSR Platform &copy; {new Date().getFullYear()} &middot; Internal Use Only
      </p>
    </div>
  </div>
</div>
