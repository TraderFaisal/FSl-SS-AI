// FSL TRADER — AI MARKET VISION PRO
// Authentication Modal (Sign In / Register / Role Switching)

import React, { useState } from 'react';
import { User, License } from '../types';
import { apiClient } from '../services/apiClient';
import {
  User as UserIcon,
  Lock,
  Mail,
  X,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, license: License | null, valid: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (tab === 'LOGIN') {
        const res = await apiClient.login(email, password);
        setSuccessMessage('Logged in successfully.');
        onAuthSuccess(res.user, res.license, res.licenseValid);
        onClose();
      } else {
        const res = await apiClient.register(name, email, password, licenseKey);
        setSuccessMessage('Account created successfully.');
        onAuthSuccess(res.user, res.license, res.licenseValid);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.login(presetEmail, presetPass);
      onAuthSuccess(res.user, res.license, res.licenseValid);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0b0e1a] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono tracking-wide">
                FSL TRADER ACCESS
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {tab === 'LOGIN' ? 'Sign in to your account' : 'Create trader profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/10 font-mono text-xs">
          <button
            onClick={() => setTab('LOGIN')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'LOGIN' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => setTab('REGISTER')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'REGISTER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {tab === 'REGISTER' && (
            <div className="space-y-1">
              <label className="text-slate-300">FULL NAME</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 focus-within:border-indigo-500">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="flex-1 bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-300">EMAIL ADDRESS</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 focus-within:border-indigo-500">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="flex-1 bg-transparent text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300">PASSWORD</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 focus-within:border-indigo-500">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-white focus:outline-none"
              />
            </div>
          </div>

          {tab === 'REGISTER' && (
            <div className="space-y-1">
              <label className="text-slate-300">LICENSE KEY (OPTIONAL)</label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="FSL-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold tracking-wider text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {isLoading ? 'AUTHENTICATING...' : tab === 'LOGIN' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ONE-CLICK DEMO ACCOUNTS:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <button
              onClick={() => handleQuickLogin('faisal.sokal55@gmail.com', 'Password123!')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-rose-500/20 text-left transition-all"
            >
              <div className="font-bold text-rose-300 flex items-center gap-1">
                <Shield className="h-3 w-3" /> SUPER ADMIN
              </div>
              <div className="text-[9px] text-slate-400 truncate">Faisal (Enterprise)</div>
            </button>

            <button
              onClick={() => handleQuickLogin('trader@fsltrader.io', 'TraderPass123!')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/20 text-left transition-all"
            >
              <div className="font-bold text-indigo-300">PRO TRADER</div>
              <div className="text-[9px] text-slate-400 truncate">Active License Tier</div>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@fsltrader.io', 'AdminPassword123!')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-violet-500/20 text-left transition-all"
            >
              <div className="font-bold text-violet-300">ADMINISTRATOR</div>
              <div className="text-[9px] text-slate-400 truncate">Syndicate Control</div>
            </button>

            <button
              onClick={() => handleQuickLogin('newuser@fsltrader.io', 'NewUser123!')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-amber-500/20 text-left transition-all"
            >
              <div className="font-bold text-amber-300">UNLICENSED USER</div>
              <div className="text-[9px] text-slate-400 truncate">Test License Wall</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
