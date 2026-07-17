import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiCheckCircle, FiArrowLeft, FiLock, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { GiChiliPepper } from 'react-icons/gi';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, resetPassword, isLoading } = useAuthStore();
  
  // Steps: 1 = Enter Email, 2 = Enter OTP & Reset Password directly
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [verifiedToken, setVerifiedToken] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');

    const result = await forgotPassword(email.trim());
    if (result.success) {
      toast.success(result.message || 'Password reset code sent!');
      setStep(2);
    } else {
      setError(result.error || 'Could not send reset code. Please try again.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of 6 digits
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6 && /^[0-9]$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      return;
    }

    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    const result = await resetPassword({
      email: email.trim(),
      otp: otpCode,
      newPassword
    });

    if (result.success) {
      toast.success('Password updated successfully! You can now sign in.');
      navigate('/login');
    } else {
      setError(result.error || 'Failed to reset password. Check your code or try requesting a new one.');
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left: Interactive Form */}
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

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h1 className="font-serif text-3xl font-bold text-on-surface mb-2">Forgot Password?</h1>
                <p className="text-on-surface-variant text-sm sm:text-base mb-8">
                  Enter your registered email address below and we will send you a 6-digit verification code and password reset link.
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface placeholder-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                    disabled={isLoading || !email.trim()}
                    className="w-full py-3.5 px-6 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                  >
                    {isLoading ? (
                      <span className="spinner w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-colors"
                  >
                    <FiArrowLeft /> Back to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <FiKey className="text-2xl" />
                </div>
                <h1 className="font-serif text-3xl font-bold text-on-surface mb-2">Reset Password</h1>
                <p className="text-on-surface-variant text-sm sm:text-base mb-6">
                  We sent a 6-digit verification code to <strong className="text-on-surface">{email}</strong>. Enter the code and choose a new password.
                </p>

                <form onSubmit={handleResetSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
                      Verification Code
                    </label>
                    <div className="flex gap-2 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-input-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 sm:w-14 h-12 sm:h-14 text-center text-xl font-bold bg-surface-container border border-outline-variant/60 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg" />
                      <input
                        id="reset-new-password"
                        type={showPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface placeholder-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                        id="reset-confirm-password"
                        type={showPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-10 py-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface placeholder-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                      'Update Password & Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-between items-center text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="text-outline hover:text-on-surface font-medium transition-colors"
                  >
                    Use different email
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) return;
                      const res = await forgotPassword(email);
                      if (res.success) toast.success('New code resent!');
                      else toast.error(res.error || 'Failed to resend code');
                    }}
                    disabled={isLoading}
                    className="text-primary font-semibold hover:underline transition-colors"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right: Visual Section matching login page */}
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
            Account<br />Recovery
          </h2>
          <p className="text-surface/90 text-lg drop-shadow max-w-md">
            Your spice collection and custom botanical formulas are securely protected. Regain access in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
