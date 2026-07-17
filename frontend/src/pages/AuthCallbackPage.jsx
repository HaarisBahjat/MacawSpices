import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../store/useAuthStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { handleGoogleCallback, initAuth } = useAuthStore();
  const [statusText, setStatusText] = useState('Verifying your Google sign in...');

  useEffect(() => {
    let isSubscribed = true;

    const processCallback = async () => {
      try {
        // If there is a PKCE ?code= parameter in the URL, exchange it for session
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          setStatusText('Exchanging authentication token...');
          await supabase.auth.exchangeCodeForSession(window.location.href).catch(() => null);
        }

        // Check active session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          setStatusText('Syncing profile...');
          await handleGoogleCallback(session);
          if (isSubscribed) {
            toast.success('Successfully signed in with Google!');
            navigate('/', { replace: true });
          }
          return;
        }

        // If session is still null, wait briefly for Supabase URL hash parsing or onAuthStateChange
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY') && session) {
            authListener?.subscription.unsubscribe();
            if (event === 'PASSWORD_RECOVERY') {
              navigate('/reset-password', { replace: true });
              return;
            }
            await handleGoogleCallback(session);
            if (isSubscribed) {
              toast.success('Successfully signed in with Google!');
              navigate('/', { replace: true });
            }
          }
        });

        // Timeout fallback after 4 seconds
        setTimeout(async () => {
          if (isSubscribed) {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              await handleGoogleCallback(retrySession);
              navigate('/', { replace: true });
            } else {
              toast.error('Could not complete Google sign in. Please try again.');
              navigate('/login', { replace: true });
            }
          }
        }, 4000);

      } catch (err) {
        console.error('OAuth callback error:', err);
        if (isSubscribed) {
          toast.error('Authentication error. Redirecting to login...');
          navigate('/login', { replace: true });
        }
      }
    };

    processCallback();

    return () => {
      isSubscribed = false;
    };
  }, [navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center bg-surface-container p-8 rounded-2xl border border-outline-variant/30 max-w-sm w-full shadow-lg">
        <div className="spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Google Authentication</h3>
        <p className="text-sm text-on-surface-variant animate-pulse">{statusText}</p>
      </div>
    </div>
  );
}
