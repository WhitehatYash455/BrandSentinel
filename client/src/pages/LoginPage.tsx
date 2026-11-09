import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, UserCheck, ShieldCheck, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('creator@vajra.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('CONTENT_CREATOR');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register(email, password, fullName, role);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const prefillDemoAccount = (demoEmail: string, demoRole: UserRole) => {
    setIsRegistering(false);
    setEmail(demoEmail);
    setPassword('password123');
    setRole(demoRole);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-xl shadow-brand-500/20 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">BRAND SENTINEL</h2>
        <p className="mt-1 text-xs text-slate-400 font-medium tracking-wide uppercase">
          Intelligent Pre-Publication Brand Governance Platform
        </p>
        <p className="mt-1 text-xs text-brand-400 font-medium">Team Vajra | CodeTitan Hackathon 2026</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/80 backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick Demo Credentials Switcher */}
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
              Select Demo Identity (1-Click Login):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => prefillDemoAccount('creator@vajra.com', 'CONTENT_CREATOR')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  email === 'creator@vajra.com'
                    ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-xs font-semibold text-slate-200">Creator</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Yash Vardhan</p>
              </button>

              <button
                type="button"
                onClick={() => prefillDemoAccount('reviewer@vajra.com', 'HUMAN_REVIEWER')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  email === 'reviewer@vajra.com'
                    ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-slate-200">Reviewer</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Marcus Vance</p>
              </button>

              <button
                type="button"
                onClick={() => prefillDemoAccount('admin@vajra.com', 'BRAND_ADMIN')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  email === 'admin@vajra.com'
                    ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Admin</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Elena Rostova</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-slate-300">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-slate-300">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="CONTENT_CREATOR">Content Creator</option>
                  <option value="HUMAN_REVIEWER">Human Reviewer</option>
                  <option value="BRAND_ADMIN">Brand Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  {isRegistering ? 'Create Sentinel Account' : 'Sign In to Workspace'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              {isRegistering
                ? 'Already have an account? Sign in here'
                : 'Need a new account? Register user'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

