import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../store/useAuthStore';
import useAuthStore from '../store/useAuthStore';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        await initAuth();
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4" />
        <p className="text-bark-500">Completing sign in...</p>
      </div>
    </div>
  );
}
