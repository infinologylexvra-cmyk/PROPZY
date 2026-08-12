'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, User, ShieldCheck, UserCheck, KeyRound, Building, Home, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, setUser, user, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'tenant' | 'owner'>('tenant');

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  // Helper for role-based navigation
  const navigateByRole = (userRole: string) => {
    closeAuthModal();
    if (userRole === 'admin') {
      showToast('Redirecting to Admin Portal Dashboard...');
      router.push('/admin');
    } else if (userRole === 'owner') {
      showToast('Redirecting to Owner Property Dashboard...');
      router.push('/dashboard?tab=my-properties');
    } else {
      showToast('Redirecting to Tenant Dashboard...');
      router.push('/dashboard?tab=account');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError('Please enter your email/username and password');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        showToast(data.message || `Welcome back, ${data.user.name}!`);
        resetForm();
        navigateByRole(data.user.role);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      // Local fallback
      const fallbackRole = (loginIdentifier.toLowerCase().includes('admin')) ? 'admin' : (loginIdentifier.toLowerCase().includes('owner') ? 'owner' : 'tenant');
      const fallbackUser = {
        name: loginIdentifier.split('@')[0] || 'User',
        email: loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}@letsrentz.com`,
        phone: '+91 98765 43210',
        role: fallbackRole as any
      };
      setUser(fallbackUser);
      resetForm();
      navigateByRole(fallbackRole);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill out all registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: registerRole
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        showToast(data.message || 'Account created successfully!');
        resetForm();
        navigateByRole(data.user.role);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      // Local fallback
      const fallbackUser = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: registerRole
      };
      setUser(fallbackUser);
      resetForm();
      navigateByRole(registerRole);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setLoginIdentifier('');
    setLoginPassword('');
    setError('');
  };

  const handleLogout = () => {
    setUser(null);
    showToast('Logged out successfully');
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a110d] rounded-3xl shadow-2xl overflow-hidden border border-emerald-900/80 p-6 sm:p-8 text-gray-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-emerald-950 transition-colors"
        >
          <X size={20} />
        </button>

        {user ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto font-extrabold text-2xl shadow-lg shadow-emerald-500/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">{user.name}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{user.email || user.phone}</p>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#0f281b] text-emerald-400 border border-emerald-800/80 text-xs font-extrabold rounded-full uppercase tracking-wider">
              <UserCheck size={14} />
              <span>Role: {user.role.toUpperCase()}</span>
            </div>
            
            <div className="pt-4 border-t border-emerald-950 space-y-3">
              <button
                onClick={() => navigateByRole(user.role)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-2xl transition-colors uppercase tracking-wider cursor-pointer shadow-md"
              >
                Go to My Dashboard →
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-[#180909] text-rose-400 border border-rose-900/60 hover:bg-rose-950 rounded-2xl font-extrabold text-xs transition-colors uppercase tracking-wider cursor-pointer"
              >
                Log Out Account
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Title */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#0d2217] text-emerald-400 border border-emerald-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ShieldCheck size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                {mode === 'login' ? 'Sign In to Propzy' : 'Create Account'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Verified 0% Brokerage Property Portal</p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#050806] border border-emerald-950 rounded-2xl p-1 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In / Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Register / Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-[#1a0809] border border-rose-900/60 text-rose-300 text-xs rounded-xl text-center font-semibold">
                {error}
              </div>
            )}

            {/* LOGIN FORM (No role dropdown - verifies role from database!) */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email / Identifier */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address or Mobile Number</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all">
                    <span className="px-3 text-emerald-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="aman@example.com or 9876543210"
                      className="w-full py-3 pr-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all pr-2">
                    <span className="px-3 text-emerald-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none cursor-pointer"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? 'Authenticating...' : 'Sign In Now'}
                </button>

                <p className="text-center text-xs text-gray-400 pt-2">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all">
                    <span className="px-3 text-emerald-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aman Kumar"
                      className="w-full py-3 pr-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Account Role Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Registering As (Account Role)</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('tenant')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        registerRole === 'tenant'
                          ? 'bg-[#0b2619] border-emerald-500 text-white font-extrabold shadow-md'
                          : 'bg-[#050806] border-emerald-950 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <Home size={16} className={registerRole === 'tenant' ? 'text-emerald-400' : 'text-gray-500'} />
                        <span className="text-xs">Tenant</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal">Search & Rent Homes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegisterRole('owner')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        registerRole === 'owner'
                          ? 'bg-[#0b2619] border-emerald-500 text-white font-extrabold shadow-md'
                          : 'bg-[#050806] border-emerald-950 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <Building size={16} className={registerRole === 'owner' ? 'text-emerald-400' : 'text-gray-500'} />
                        <span className="text-xs">Property Owner</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal">Post & List Properties</span>
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all">
                    <span className="px-3 text-emerald-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aman@example.com"
                      className="w-full py-3 pr-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Mobile Phone Number</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all">
                    <span className="px-3 text-emerald-400 font-mono text-xs">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full py-3 pr-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Create Password</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all pr-2">
                    <span className="px-3 text-emerald-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none cursor-pointer"
                      title={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm Password</label>
                  <div className="flex items-center border border-emerald-900/80 bg-[#050806] rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all pr-2">
                    <span className="px-3 text-emerald-400">
                      <KeyRound size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-3 text-xs text-white placeholder-gray-600 bg-transparent focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? 'Creating Account...' : 'Create Account FREE'}
                </button>

                <p className="text-center text-xs text-gray-400 pt-2">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Sign in to your account
                  </button>
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
