import { writable, derived } from 'svelte/store';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '$lib/types';

export const supabaseUser = writable<SupabaseUser | null>(null);
export const appUser = writable<User | null>(null);
export const authLoading = writable<boolean>(true);

export const userRole = derived(appUser, ($u): UserRole | null => $u?.role ?? null);

export const isEmployee = derived(appUser, ($u) => $u?.role === 'employee');
export const isManager = derived(
  appUser,
  ($u) => $u?.role === 'manager' || $u?.role === 'director' || $u?.role === 'vp'
);
export const isAdmin = derived(appUser, ($u) => $u?.role === 'admin');
export const canManage = derived(
  appUser,
  ($u) =>
    $u?.role === 'manager' ||
    $u?.role === 'director' ||
    $u?.role === 'vp' ||
    $u?.role === 'admin'
);
