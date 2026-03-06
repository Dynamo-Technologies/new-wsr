<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createSupabaseBrowserClient } from '$lib/supabase';
  import { supabaseUser } from '$lib/stores/auth';
  import { theme } from '$lib/stores/theme';
  import Toast from '$lib/components/ui/Toast.svelte';

  let { data, children } = $props();

  const supabase = createSupabaseBrowserClient();

  onMount(() => {
    // Ensure theme store is hydrated on client
    const unsubTheme = theme.subscribe(() => {});

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, session) => {
      supabaseUser.set(session?.user ?? null);
      if (session?.expires_at !== data.session?.expires_at) {
        invalidate('supabase:auth');
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubTheme();
    };
  });
</script>

{@render children?.()}
<Toast />
