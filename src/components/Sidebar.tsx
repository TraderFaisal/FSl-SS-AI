// FSL TRADER — AI MARKET VISION PRO
// Navigation Sidebar Component
// Quick tab switching with role-based visibility and badge indicators.

import React from 'react';
import { User } from '../types';
import {
  Scan,
  Radar,
  History,
  Star,
  KeyRound,
  Sliders,
  ShieldAlert,
  BarChart2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  unreadSignalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  unreadSignalsCount = 0,
}) => {
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const navItems = [
    {
      id: 'analyzer',
      label: 'AI Analyzer',
      icon: Scan,
      badge: 'PRO',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    },
    {
      id: 'chart',
      label: 'Live Chart',
      icon: BarChart2,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'scanner',
      label: 'Market Scanner',
      icon: Radar,
    },
    {
      id: 'history',
      label: 'Signal History',
      icon: History,
      counter: unreadSignalsCount > 0 ? unreadSignalsCount : undefined,
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: Star,
    },
    {
      id: 'license',
      label: 'License & Quotas',
      icon: KeyRound,
    },
    {
      id: 'strategies',
      label: 'Strategy & Lab',
      icon: Sliders,
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Terminal',
      icon: ShieldAlert,
      badge: 'RBAC',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    });
  }

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0d17]/80 backdrop-blur-md p-3 md:p-4 flex md:flex-col justify-between overflow-x-auto md:overflow-x-visible">
      <div className="flex md:flex-col gap-1.5 w-full">
        <div className="hidden md:block px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm font-mono tracking-wide transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {item.counter && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                  {item.counter}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cyberpunk Footer Tag */}
      <div className="hidden md:block p-3 rounded-xl bg-slate-900/50 border border-white/5 mt-6 text-[11px] font-mono text-slate-400">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>ENGINE</span>
          <span className="text-indigo-400 font-bold">v4.2-VISION</span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Precision neural confluence matrix active.
        </div>
      </div>
    </aside>
  );
};
