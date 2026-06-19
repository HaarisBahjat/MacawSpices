import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiChiliPepper } from 'react-icons/gi';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = await register(form.email, form.password, form.name);
    if (result.success) {
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Right Visual */}
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
          <h2 className="font-display text-5xl font-bold mb-4 drop-shadow-lg">Join the<br />Spice Family</h2>
          <p className="text-spice-100 text-xl drop-shadow">Create your account and get<br />exclusive access to our finest blends.</p>
        </div>
      </div>

      {/* Form */}
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
            <span className="font-display font-bold text-xl text-bark-900">Spice<span className="text-chilli-600">Wallah</span></span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-bark-900 mb-1">Create account</h1>
          <p className="text-bark-500 mb-6">Start your spice journey today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
                <input
                  id="register-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your Name"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
                <input
                  id="register-email"
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
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
                <input
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="input pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400">
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
                <input
                  id="register-confirm"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat password"
                  className="input pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-chilli-50 border border-chilli-200 rounded-xl text-sm text-chilli-700">{error}</div>
            )}

            <button id="register-submit-btn" type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
              {isLoading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-spice-200" />
            <span className="text-sm text-bark-400">or</span>
            <div className="flex-1 h-px bg-spice-200" />
          </div>

          <button id="register-google-btn" onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-spice-200 rounded-xl font-medium text-bark-700 hover:border-chilli-300 hover:bg-spice-50 transition-all">
            <FcGoogle className="text-xl" /> Continue with Google
          </button>

          <p className="text-center text-sm text-bark-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-chilli-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
