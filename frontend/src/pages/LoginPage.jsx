import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiChiliPepper } from 'react-icons/gi';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, simulateGoogleDevLogin, isLoading, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [showDevGoogle, setShowDevGoogle] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  const handleGoogleClick = async () => {
    setError('');
    const res = await loginWithGoogle();
    if (res && !res.success) {
      if (res.isProviderDisabled || res.error?.toLowerCase().includes('not enabled')) {
        setError('Google OAuth provider is not enabled in your Supabase Dashboard under Authentication -> Providers -> Google.');
        setShowDevGoogle(true);
        toast.error('Google provider not enabled in Supabase');
      } else {
        setError(res.error || 'Failed to initiate Google login.');
        toast.error(res.error || 'Google login error');
      }
    }
  };

  const handleDevSimulation = async () => {
    setError('');
    const res = await simulateGoogleDevLogin();
    if (res.success) {
      toast.success('Signed in with Google (Demo/Dev Mode)!');
      navigate('/');
    } else {
      setError(res.error || 'Failed to run dev simulation.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-chilli-600 rounded-xl flex items-center justify-center">
              <GiChiliPepper className="text-white text-xl" />
            </div>
            <span className="font-display font-bold text-xl text-bark-900">Macaw<span className="text-macaw-500">Spice</span></span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-bark-900 mb-1">Welcome back!</h1>
          <p className="text-bark-500 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-chilli-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-600"
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-chilli-50 border border-chilli-200 rounded-xl text-sm text-chilli-700">
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {isLoading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-spice-200" />
            <span className="text-sm text-bark-400">or</span>
            <div className="flex-1 h-px bg-spice-200" />
          </div>

          <button
            id="login-google-btn"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-spice-200 rounded-xl font-medium text-bark-700 hover:border-chilli-300 hover:bg-spice-50 transition-all disabled:opacity-50"
          >
            <FcGoogle className="text-xl" /> Continue with Google
          </button>

          {showDevGoogle && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-800 mb-2 font-medium">
                Tip: Since Google OAuth isn't enabled in Supabase yet, you can test the exact Google Sign-In user experience right now using Dev Mode:
              </p>
              <button
                type="button"
                onClick={handleDevSimulation}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-amber-600 text-white font-semibold rounded-lg text-xs hover:bg-amber-700 transition-colors shadow-sm"
              >
                ⚡ Simulate Google Sign-In (Demo User)
              </button>
            </div>
          )}

          <p className="text-center text-sm text-bark-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-chilli-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-100"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-white text-center px-12 flex flex-col items-center justify-center w-full h-full bg-black/20">
          <h2 className="font-display text-5xl font-bold mb-4 drop-shadow-lg">
            The Spice<br />of Life
          </h2>
          <p className="text-spice-100 text-xl drop-shadow">
            Authentic Indian spices<br />delivered to your doorstep
          </p>
        </div>
      </div>
    </div>
  );
}
