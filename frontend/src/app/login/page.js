'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { User, Lock, Activity, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, error: authError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!email) {
      setValidationError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email format.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setValidationError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-slate-50 py-12 px-6 lg:px-8 text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-950 font-extrabold text-3xl">
          <Activity className="h-8 w-8 animate-pulse" />
          HAQMS
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-950">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Or use one of the pre-seeded credentials in the README
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass py-10 px-8 shadow-xl rounded-4xl border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(validationError || authError) && (
              <div className="p-3 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
                {validationError || authError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                Email Address
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-300 bg-white rounded-2xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all text-sm"
                  placeholder="admin@haqms.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                Password
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 border border-slate-300 bg-white rounded-2xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="glow-btn w-full flex justify-center py-3 px-4 rounded-2xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Seeded Demo Credentials
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('admin@haqms.com'); setPassword('password123'); }}
                className="text-left p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition"
              >
                <strong>Admin:</strong> admin@haqms.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('reception1@haqms.com'); setPassword('password123'); }}
                className="text-left p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition"
              >
                <strong>Receptionist:</strong> reception1@haqms.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('doctor1@haqms.com'); setPassword('password123'); }}
                className="text-left p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition"
              >
                <strong>Doctor:</strong> doctor1@haqms.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
