'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowRight, Home, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useApp, UserProfile } from '@/context/AppContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser, showToast } = useApp();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: adminId.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        const adminUser: UserProfile = {
          ...data.user,
          role: 'admin'
        };
        setUser(adminUser);
        showToast('Admin authentication successful! Welcome.');
        
        // Target redirect page
        const searchParams = new URLSearchParams(window.location.search);
        const fromUrl = searchParams.get('from') || '/admin';
        router.push(fromUrl);
      } else {
        setError(data.message || 'Invalid Admin credentials.');
      }
    } catch (err) {
      setError('Unable to authenticate right now. Please verify your credentials and connection.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#050806] flex items-center justify-center p-4 text-gray-100 font-sans antialiased relative overflow-hidden">
      {/* Background glow overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/40 via-[#050806] to-[#050806] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[#0a110d] rounded-3xl border border-emerald-900/80 p-8 shadow-2xl space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Home size={22} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-wider uppercase text-white">
              PROP<span className="text-emerald-400">ZY</span>
            </span>
          </Link>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0d2417] border border-emerald-800/80 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Administrative Control Login</span>
          </div>

          <p className="text-xs text-gray-400">
            Enter authorized Admin credentials to manage platform listings & leads.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-[#1a0c0e] border border-rose-900/80 rounded-2xl text-rose-400 text-xs font-medium flex items-center space-x-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Admin ID / Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g. admin or admin@propzy.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <User className="absolute left-3.5 top-3.5 text-emerald-400" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-[#050806] border border-emerald-900/80 rounded-xl text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <Lock className="absolute left-3.5 top-3.5 text-emerald-400" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

       
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
          >
            <span>Login to Admin Portal</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-emerald-400 transition-colors">
            ← Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
}
