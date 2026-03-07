<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { supabaseUser } from '$lib/stores/auth';
  import { theme } from '$lib/stores/theme';
  import Toast from '$lib/components/ui/Toast.svelte';

  let { data, children } = $props();
  let { supabase, session } = $derived(data);

  onMount(() => {
    // Ensure theme store is hydrated on client
    const unsubTheme = theme.subscribe(() => {});

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      supabaseUser.set(newSession?.user ?? null);
      if (newSession?.expires_at !== session?.expires_at) {
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
