import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { authAPI } from '../services/api';
import useCartStore from './useCartStore';
import useWishlistStore from './useWishlistStore';

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

          // Merge any guest cart & wishlist items into the server DB
          useCartStore.getState().syncGuestCartToServer();
          useWishlistStore.getState().syncGuestWishlistToServer();

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
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
              },
            }
          });
          if (error) throw error;
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const isNotEnabled = error.message?.toLowerCase().includes('not enabled') || error.message?.toLowerCase().includes('unsupported provider');
          return {
            success: false,
            error: isNotEnabled
              ? 'Google OAuth provider is not enabled in your Supabase Dashboard under Authentication -> Providers -> Google.'
              : error.message,
            isProviderDisabled: isNotEnabled
          };
        }
      },

      simulateGoogleDevLogin: async () => {
        set({ isLoading: true });
        try {
          // In Dev Mode / fallback: Register or login a simulated Google User
          const demoEmail = 'google_demo_user@macawspices.com';
          const demoPassword = 'GoogleDemoUserAuth#2026';
          const demoName = 'Google Demo User';
          const demoAvatar = '/images/macaw_product_banner.png';

          // Try signing up or logging in with password in Supabase first
          let { data, error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
          if (error) {
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email: demoEmail,
              password: demoPassword,
              options: { data: { full_name: demoName, avatar_url: demoAvatar } }
            });
            if (signUpErr) throw signUpErr;
            data = signUpData;
          }

          const token = data?.session?.access_token || 'simulated-google-token';
          if (token && token !== 'simulated-google-token') {
            localStorage.setItem('sw_token', token);
          }

          // Sync with backend API
          let userRes;
          try {
            userRes = await authAPI.googleAuthSync({ access_token: token });
          } catch (e) {
            try {
              userRes = await authAPI.getMe();
            } catch (err) {
              userRes = { data: { user: { id: 'demo-google-id', email: demoEmail, name: demoName, avatarUrl: demoAvatar, role: 'CUSTOMER' } } };
            }
          }

          set({
            user: userRes?.data?.user || { id: 'demo-google-id', email: demoEmail, name: demoName, avatarUrl: demoAvatar, role: 'CUSTOMER' },
            token,
            isAuthenticated: true,
            isLoading: false
          });

          useCartStore.getState().syncGuestCartToServer();
          useWishlistStore.getState().syncGuestWishlistToServer();
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      handleGoogleCallback: async (session) => {
        set({ isLoading: true });
        try {
          const token = session.access_token;
          localStorage.setItem('sw_token', token);

          // Sync with our backend to ensure profile & avatar are created/updated
          let userRes;
          try {
            userRes = await authAPI.googleAuthSync({ access_token: token });
          } catch (e) {
            userRes = await authAPI.getMe();
          }

          set({
            user: userRes?.data?.user || session.user,
            token,
            isAuthenticated: true,
            isLoading: false
          });

          useCartStore.getState().syncGuestCartToServer();
          useWishlistStore.getState().syncGuestWishlistToServer();
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message || 'Google login verification failed' };
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          // Trigger both custom backend OTP generator AND Supabase recovery mailer
          const [backendRes] = await Promise.all([
            authAPI.forgotPassword(email),
            supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            }).catch(() => null)
          ]);
          set({ isLoading: false });
          return { success: true, message: backendRes.data?.message || 'Password reset code sent!' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.error || error.message };
        }
      },

      verifyResetOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.verifyResetOtp(email, otp);
          set({ isLoading: false });
          return { success: true, token: res.data.token, message: res.data.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.error || error.message };
        }
      },

      resetPassword: async ({ email, token, otp, newPassword }) => {
        set({ isLoading: true });
        try {
          // If we have an active client-side recovery session, update in Supabase directly
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            await supabase.auth.updateUser({ password: newPassword }).catch(() => null);
          }

          // Also execute backend reset using OTP/token
          const res = await authAPI.resetPassword({ email, token, otp, newPassword });
          set({ isLoading: false });
          return { success: true, message: res.data?.message || 'Password reset successfully!' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.error || error.message };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('sw_token');
        localStorage.removeItem('macawspice-cart');
        localStorage.removeItem('macawspice-wishlist');
        useCartStore.setState({ items: [], subtotal: 0 });
        useWishlistStore.setState({ items: [] });
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
            // Merge any guest cart & wishlist items into the server DB after session restore
            useCartStore.getState().syncGuestCartToServer();
            useWishlistStore.getState().syncGuestWishlistToServer();
          } else {
            set({ user: null, token: null, isAuthenticated: false });
            localStorage.removeItem('sw_token');
            localStorage.removeItem('macawspice-cart');
            localStorage.removeItem('macawspice-wishlist');
            useCartStore.setState({ items: [], subtotal: 0 });
            useWishlistStore.setState({ items: [] });
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
