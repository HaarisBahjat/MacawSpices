import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { authAPI } from '../services/api';
import useCartStore from './useCartStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[MacawSpice] Missing Supabase env vars!\n' +
    'Create frontend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        set({ token });
        if (token) localStorage.setItem('sw_token', token);
        else localStorage.removeItem('sw_token');
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const token = data.session.access_token;
          localStorage.setItem('sw_token', token);
          
          try {
             const userRes = await authAPI.getMe();
             set({ user: userRes.data.user, token, isAuthenticated: true, isLoading: false });
          } catch(e) {
             set({ token, isAuthenticated: true, isLoading: false });
          }
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
          });
          if (error) throw error;
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      loginWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` }
        });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('sw_token');
        useCartStore.setState({ items: [], subtotal: 0 });
      },

      initAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('sw_token', session.access_token);
          try {
             const userRes = await authAPI.getMe();
             set({ user: userRes.data.user, token: session.access_token, isAuthenticated: true });
          } catch(e) {
             set({ token: session.access_token, isAuthenticated: true });
          }
        }
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            localStorage.setItem('sw_token', session.access_token);
            try {
               const userRes = await authAPI.getMe();
               set({ user: userRes.data.user, token: session.access_token, isAuthenticated: true });
            } catch(e) {
               set({ token: session.access_token, isAuthenticated: true });
            }
          } else {
            set({ user: null, token: null, isAuthenticated: false });
            localStorage.removeItem('sw_token');
            useCartStore.setState({ items: [], subtotal: 0 });
          }
        });
      },
    }),
    {
      name: 'macawspice-auth',
      // Also persist `user` so name/role shows immediately on reload
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export { supabase };
export default useAuthStore;
