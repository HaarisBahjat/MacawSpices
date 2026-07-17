import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiCheckCircle, FiEye, FiEyeOff, FiKey, FiMail } from 'react-icons/fi';
import { GiChiliPepper } from 'react-icons/gi';
import useAuthStore, { supabase } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isSupabaseRecovery, setIsSupabaseRecovery] = useState(false);

  useEffect(() => {
    // Check if user arrived via Supabase #access_token=...&type=recovery link
    const checkRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user?.email) {
        setIsSupabaseRecovery(true);
        if (!email) setEmail(session.user.email);
      }
    };
    checkRecoverySession();

    // Listen for recovery event
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsSupabaseRecovery(true);
        if (!email && session.user?.email) setEmail(session.user.email);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // If Supabase recovery session is active, update directly
    if (isSupabaseRecovery) {
      const { error: sbErr } = await supabase.auth.updateUser({ password: newPassword });
      if (!sbErr) {
        toast.success('Password updated successfully! You can now sign in.');
        navigate('/login');
        return;
      }
    }

    // Otherwise use backend OTP/token verification
    if (!token && !otp) {
      setError('Please provide the 6-digit verification code from your email.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    const result = await resetPassword({
      email: email.trim(),
      token: token || undefined,
      otp: otp || undefined,
      newPassword
    });

    if (result.success) {
      toast.success('Password updated successfully! You can now sign in.');
      navigate('/login');
    } else {
      setError(result.error || 'Failed to reset password. Please verify your code or request a new one.');
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8 inline-flex">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <GiChiliPepper className="text-on-primary text-xl" />
            </div>
            <span className="font-serif font-bold text-xl text-on-surface">
              MACAW<span className="text-primary font-normal">SPICES</span>
            </span>
          </Link>

          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
            <FiKey className="text-2xl" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-on-surface mb-2">Set New Password</h1>
          <p className="text-on-surface-variant text-sm sm:text-base mb-8">
            Create a secure new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isSupabaseRecovery && !token && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Account Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface placeholder-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <input
                      id="reset-otp-input"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface font-mono tracking-widest text-lg placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg" />
                <input
                  id="reset-pass"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface placeholder-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg" />
                <input
                  id="reset-confirm"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface placeholder-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-error-container/40 border border-error/30 rounded-xl text-sm text-error font-medium flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isLoading ? (
                <span className="spinner w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                'Save New Password'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
            <Link to="/forgot-password" className="text-sm text-outline hover:text-primary transition-colors font-medium">
              Need a new verification code? Request here
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-white text-center px-12 flex flex-col items-center justify-center w-full h-full bg-gradient-to-t from-black/80 via-black/30 to-black/20">
          <h2 className="font-serif text-5xl font-bold mb-4 drop-shadow-lg leading-tight">
            Secure Your<br />Account
          </h2>
          <p className="text-surface/90 text-lg drop-shadow max-w-md">
            Your safety is our priority. Set up a strong password to continue exploring artisanal spices.
          </p>
        </div>
      </div>
    </div>
  );
}
