<script lang="ts">
  export let label = '';
  export let value: string | number = '';
  export let subtext = '';
  export let color: 'primary' | 'green' | 'blue' | 'yellow' | 'gray' = 'primary';

  const colors = {
    primary: 'bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-dark-50 dark:text-gray-400'
  };
</script>

<div class="card p-5">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {#if subtext}
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtext}</p>
      {/if}
    </div>
    {#if $$slots.icon}
      <div class="w-10 h-10 rounded-xl flex items-center justify-center {colors[color]}">
        <slot name="icon" />
      </div>
    {/if}
  </div>
</div>
