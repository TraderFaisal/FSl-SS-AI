// FSL TRADER — AI MARKET VISION PRO
// Global Header Component
// Cyberpunk branding, live system status, license badge, and user controls.

import React from 'react';
import { User, License } from '../types';
import {
  Activity,
  Shield,
  Key,
  User as UserIcon,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  license: License | null;
  licenseValid: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLicenseModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  license,
  licenseValid,
  activeTab,
  setActiveTab,
  onOpenLicenseModal,
  onOpenAuthModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090e]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('analyzer')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-950/80 border border-indigo-500/30 p-1 shadow-[0_0_15px_rgba(99,102,241,0.25)] group-hover:border-indigo-400/60 transition-all">
              <img
                src="/fsl-logo.svg"
                alt="FSL TRADER Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base text-white font-mono flex items-center gap-1.5">
                  FSL TRADER
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                    AI VISION PRO
                  </span>
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-widest text-indigo-400/80 font-mono">
                TRADE | ANALYZE | GROW
              </p>
            </div>
          </button>
        </div>

        {/* Live System Status Pill */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AI VISION: ONLINE</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span>MARKET FEED: LIVE</span>
          </div>
        </div>

        {/* User & License Controls */}
        <div className="flex items-center gap-3">
          {/* License Status Pill */}
          <button
            id="header-license-status-btn"
            onClick={onOpenLicenseModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              licenseValid
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                : 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 animate-pulse'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span className="font-semibold">
              {licenseValid ? `${license?.plan || user?.plan || 'PRO'} TIER` : 'LICENSE REQUIRED'}
            </span>
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user.name}</span>
                <span className="text-[10px] font-mono text-indigo-400 flex items-center justify-end gap-1">
                  {user.role === 'SUPER_ADMIN' ? (
                    <span className="text-rose-400 font-bold flex items-center gap-0.5">
                      <Shield className="h-2.5 w-2.5 inline" /> SUPER ADMIN
                    </span>
                  ) : user.role === 'ADMIN' ? (
                    <span className="text-violet-400 font-bold">ADMIN</span>
                  ) : (
                    <span>TRADER</span>
                  )}
                </span>
              </div>

              {/* Quick switch account / modal trigger */}
              <button
                id="header-user-profile-btn"
                onClick={onOpenAuthModal}
                title="Account Settings & Quick Switch"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-950/30 text-slate-300 hover:text-white transition-all"
              >
                <UserIcon className="h-4 w-4" />
              </button>

              <button
                id="header-logout-btn"
                onClick={onLogout}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-950/20 border border-rose-900/30 hover:border-rose-500/50 hover:bg-rose-950/40 text-rose-400 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="header-login-trigger-btn"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
