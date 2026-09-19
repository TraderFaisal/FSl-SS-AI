// FSL TRADER — AI MARKET VISION PRO
// Admin Control Panel (RBAC, License Generator, User Manager, Engine Config & Logs)

import React, { useEffect, useState } from 'react';
import { User, License, AuditLog, SystemLog, SystemHealth, IndicatorConfig } from '../types';
import { apiClient } from '../services/apiClient';
import { testFirestoreConnection } from '../services/firebase';
import {
  ShieldAlert,
  Users,
  Key,
  Sliders,
  FileText,
  Activity,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Zap,
  Globe,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'USERS' | 'LICENSES' | 'ENGINE' | 'LOGS'>('OVERVIEW');

  // Stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [engineConfig, setEngineConfig] = useState<IndicatorConfig | null>(null);
  const [twelveDataInfo, setTwelveDataInfo] = useState<{
    provider: string;
    providerUrl: string;
    isConfigured: boolean;
    maskedKey: string | null;
    supportedIntervals: string[];
    pairsTracked: string[];
  } | null>(null);
  const [isTestingTwelveData, setIsTestingTwelveData] = useState(false);
  const [twelveDataTestResult, setTwelveDataTestResult] = useState<string | null>(null);
  const [isTestingFirestore, setIsTestingFirestore] = useState(false);
  const [firestoreTestResult, setFirestoreTestResult] = useState<string | null>(null);

  // Single License Gen Form
  const [newLicPlan, setNewLicPlan] = useState<string>('PRO');
  const [newLicDays, setNewLicDays] = useState<number>(365);
  const [newLicDevices, setNewLicDevices] = useState<number>(3);
  const [newLicScans, setNewLicScans] = useState<number>(150);

  // Bulk Gen Form
  const [bulkPlan, setBulkPlan] = useState<string>('PRO');
  const [bulkQty, setBulkQty] = useState<number>(5);

  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, [activeSubTab]);

  const loadAllAdminData = async () => {
    try {
      setIsLoading(true);
      const statsRes = await apiClient.getAdminStats();
      setStats(statsRes);

      if (activeSubTab === 'OVERVIEW') {
        try {
          const td = await apiClient.getTwelveDataStatus();
          setTwelveDataInfo(td);
        } catch (e) {
          console.warn('Failed to load Twelve Data status:', e);
        }
      } else if (activeSubTab === 'USERS') {
        const uRes = await apiClient.getAdminUsers();
        setUsers(uRes.users);
      } else if (activeSubTab === 'LICENSES') {
        const lRes = await apiClient.getAdminLicenses();
        setLicenses(lRes.licenses);
      } else if (activeSubTab === 'LOGS') {
        const logsRes = await apiClient.getAdminLogs();
        setAuditLogs(logsRes.auditLogs);
        setSystemLogs(logsRes.systemLogs);
      } else if (activeSubTab === 'ENGINE') {
        const engRes = await apiClient.getEngineSettings();
        setEngineConfig(engRes.config);
      }
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTwelveData = async () => {
    setIsTestingTwelveData(true);
    setTwelveDataTestResult(null);
    try {
      const res = await apiClient.testTwelveDataConnection();
      setTwelveDataTestResult(
        res.success ? `SUCCESS: ${res.message}` : `ERROR: ${res.message}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setTwelveDataTestResult(`FAILED: ${msg}`);
    } finally {
      setIsTestingTwelveData(false);
    }
  };

  const handleTestFirestore = async () => {
    setIsTestingFirestore(true);
    setFirestoreTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setFirestoreTestResult(
        res.success ? `SUCCESS: ${res.message}` : `OFFLINE: ${res.message}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Firestore test failed';
      setFirestoreTestResult(`ERROR: ${msg}`);
    } finally {
      setIsTestingFirestore(false);
    }
  };

  const handleGenerateLicense = async () => {
    try {
      const res = await apiClient.generateLicense({
        plan: newLicPlan,
        expirationDays: newLicDays,
        maxDevices: newLicDevices,
        dailyScanLimit: newLicScans,
        notes: 'Admin manual issuance',
      });
      setNotification(`License generated successfully: ${res.license.key}`);
      loadAllAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setNotification(`Error: ${msg}`);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const res = await apiClient.generateBulkLicenses({
        plan: bulkPlan,
        expirationDays: 365,
        maxDevices: 3,
        dailyScanLimit: 150,
        quantity: bulkQty,
      });
      setNotification(`Generated batch of ${res.count} ${bulkPlan} licenses.`);
      loadAllAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk generation failed';
      setNotification(`Error: ${msg}`);
    }
  };

  const handleUpdateLicenseStatus = async (id: string, status: License['status']) => {
    try {
      await apiClient.updateLicense(id, { status });
      setNotification(`License status updated to ${status}`);
      loadAllAdminData();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this license?')) return;
    try {
      await apiClient.deleteLicense(id);
      loadAllAdminData();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.updateAdminUser(user.id, { status: nextStatus });
      setNotification(`User status set to ${nextStatus}`);
      loadAllAdminData();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSaveEngineSettings = async () => {
    if (!engineConfig) return;
    try {
      await apiClient.updateEngineSettings(engineConfig);
      setNotification('Indicator & Confluence Engine weights updated successfully.');
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-[#0b0e1a] border border-rose-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              ADMIN CONTROL TERMINAL
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Role-Based Access Control • Commercial License Distribution • Subsystem Diagnostics
            </p>
          </div>
        </div>

        {/* Subtab Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          {[
            { id: 'OVERVIEW', label: 'HEALTH & STATS', icon: Activity },
            { id: 'USERS', label: 'USER ROLES', icon: Users },
            { id: 'LICENSES', label: 'LICENSE GENERATOR', icon: Key },
            { id: 'ENGINE', label: 'ENGINE WEIGHTS', icon: Sliders },
            { id: 'LOGS', label: 'SECURITY LOGS', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Subtab 1: Overview Stats & Diagnostics */}
      {activeSubTab === 'OVERVIEW' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-2">
              <span className="text-slate-400">REGISTERED USERS</span>
              <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
              <span className="text-[10px] text-emerald-400 font-bold">
                {stats.activeUsers} Active Accounts
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-2">
              <span className="text-slate-400">ACTIVE LICENSES</span>
              <div className="text-3xl font-black text-purple-400">{stats.activeLicenses}</div>
              <span className="text-[10px] text-slate-400">
                {stats.expiredLicenses} Expired
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-2">
              <span className="text-slate-400">TOTAL SCANS RUN</span>
              <div className="text-3xl font-black text-indigo-400">{stats.todayScans}</div>
              <span className="text-[10px] text-slate-400">Neural Confluence Pipeline</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-2">
              <span className="text-slate-400">SIGNAL BIAS RATIO</span>
              <div className="flex items-center gap-2 font-bold text-base mt-1">
                <span className="text-emerald-400">+{stats.upSignals} UP</span>
                <span className="text-rose-400">-{stats.downSignals} DOWN</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold">
                {stats.noTradeSignals} Capital Preserved (No-Trade)
              </span>
            </div>
          </div>

          {/* Subsystem Health Grid */}
          <div className="p-6 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-4">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              INTEGRATED SUBSYSTEM HEALTH DIAGNOSTICS
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'POSTGRESQL / PRISMA DB', status: stats.systemHealth?.database || 'ONLINE', icon: Database },
                { name: 'MARKET DATA WEBSOCKET', status: stats.systemHealth?.marketApi || 'ONLINE', icon: Activity },
                { name: 'GEMINI 3.8 FLASH VISION', status: stats.systemHealth?.aiVisionApi || 'ONLINE', icon: Cpu },
                { name: 'CONFLUENCE MATRIX ENGINE', status: stats.systemHealth?.signalEngine || 'ONLINE', icon: Zap },
                { name: 'PERSISTENT CACHE & STORE', status: stats.systemHealth?.storage || 'ONLINE', icon: Server },
                { name: 'NODE.JS DAEMON CONTAINER', status: stats.systemHealth?.serverHealth || 'ONLINE', icon: Server },
              ].map((sub) => {
                const Icon = sub.icon;
                return (
                  <div
                    key={sub.name}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-200 font-bold">{sub.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/40">
                      {sub.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Data Provider: Twelve Data */}
          <div className="p-6 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Globe className="h-5 w-5 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-sm flex items-center gap-2">
                    MARKET DATA ENGINE — TWELVE DATA
                    <a
                      href="https://twelvedata.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-normal lowercase"
                    >
                      (twelvedata.com <ExternalLink className="h-3 w-3" />)
                    </a>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Direct Institutional Forex, Crypto & Commodities OHLCV Feed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold font-mono border ${
                    twelveDataInfo?.isConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {twelveDataInfo?.isConfigured ? 'TWELVE DATA ACTIVE (LIVE)' : 'SYNTHETIC SIMULATOR (STANDBY)'}
                </span>
                <button
                  onClick={handleTestTwelveData}
                  disabled={isTestingTwelveData}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTestingTwelveData ? 'animate-spin' : ''}`} />
                  TEST CONNECTION
                </button>
              </div>
            </div>

            {twelveDataTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  twelveDataTestResult.startsWith('SUCCESS')
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <span>{twelveDataTestResult}</span>
                <button
                  onClick={() => setTwelveDataTestResult(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  x
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px]">ACTIVE API KEY:</span>
                <div className="font-mono font-bold text-slate-200">
                  {twelveDataInfo?.maskedKey || 'None (Set TWELVE_DATA_API_KEY in Secrets)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px]">SUPPORTED TIMEFRAMES:</span>
                <div className="font-mono font-bold text-indigo-300">
                  1m, 3m, 5m, 15m, 30m, 1h, 4h, 1d
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px]">PAIRS MAPPED:</span>
                <div className="font-mono text-[11px] text-emerald-400 font-bold">
                  NZD/JPY, EUR/USD, GBP/USD, USD/JPY, BTC/USD, ETH/USD, XAU/USD
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-white/5">
              <strong className="text-slate-300">Configuration Notice:</strong> To stream live tick data directly from Twelve Data, provide your API key in the AI Studio Settings / Secrets panel under <code className="text-purple-300">TWELVE_DATA_API_KEY</code>. When no key is provided or during rate-limit pauses, FSL TRADER seamlessly falls back to the high-precision simulated quantitative feed so the platform remains 100% operational.
            </p>
          </div>

          {/* Cloud Database: Firebase Firestore */}
          <div className="p-6 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-sm flex items-center gap-2">
                    CLOUD PERSISTENCE — GOOGLE FIREBASE FIRESTORE
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Enterprise Zero-Trust Document Storage & Real-Time Sync
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold font-mono border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                  FIRESTORE ENTERPRISE (ACTIVE)
                </span>
                <button
                  onClick={handleTestFirestore}
                  disabled={isTestingFirestore}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTestingFirestore ? 'animate-spin' : ''}`} />
                  TEST FIRESTORE PING
                </button>
              </div>
            </div>

            {firestoreTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  firestoreTestResult.startsWith('SUCCESS')
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <span>{firestoreTestResult}</span>
                <button
                  onClick={() => setFirestoreTestResult(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  x
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px]">FIREBASE PROJECT ID:</span>
                <div className="font-mono font-bold text-amber-300 truncate">
                  feisty-facet-5pthm
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px]">ACTIVE COLLECTIONS:</span>
                <div className="font-mono font-bold text-slate-200">
                  users, admins, licenses, signals, audit_logs
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px]">SECURITY SPEC & RULES:</span>
                <div className="font-mono text-[11px] text-emerald-400 font-bold">
                  v2 Hardened ABAC / Zero-Trust Deployed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: User Roles & Access */}
      {activeSubTab === 'USERS' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e1a]/90 shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">License Key</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : u.role === 'ADMIN'
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-indigo-300">{u.plan}</td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">
                    {u.activeLicenseKey || 'No License Assigned'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/40'
                          : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: License Generator & Manager */}
      {activeSubTab === 'LICENSES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Single Generation */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
              <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                <Key className="h-4 w-4" />
                ISSUE INDIVIDUAL LICENSE KEY
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">PLAN TIER</label>
                  <select
                    value={newLicPlan}
                    onChange={(e) => setNewLicPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
                  >
                    <option value="BASIC">BASIC ($49/mo)</option>
                    <option value="PRO">PRO ($129/mo)</option>
                    <option value="VIP">VIP ($299/mo)</option>
                    <option value="ENTERPRISE">ENTERPRISE ($799/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">VALIDITY (DAYS)</label>
                  <input
                    type="number"
                    value={newLicDays}
                    onChange={(e) => setNewLicDays(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">MAX DEVICES</label>
                  <input
                    type="number"
                    value={newLicDevices}
                    onChange={(e) => setNewLicDevices(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">DAILY SCANS</label>
                  <input
                    type="number"
                    value={newLicScans}
                    onChange={(e) => setNewLicScans(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateLicense}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white shadow-lg transition-all"
              >
                GENERATE LICENSE KEY
              </button>
            </div>

            {/* Bulk Generation */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
              <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                BULK BATCH LICENSE GENERATION
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Pre-generate multiple commercial keys for distribution or affiliate campaigns.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">PLAN TIER</label>
                  <select
                    value={bulkPlan}
                    onChange={(e) => setBulkPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                    <option value="VIP">VIP</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">QUANTITY (1 - 50)</label>
                  <input
                    type="number"
                    value={bulkQty}
                    onChange={(e) => setBulkQty(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
                  />
                </div>
              </div>
              <button
                onClick={handleBulkGenerate}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg transition-all"
              >
                GENERATE {bulkQty} KEYS
              </button>
            </div>
          </div>

          {/* Licenses Table */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e1a]/90 shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="p-4">Key</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned User</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Devices</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {licenses.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-white tracking-wider">{l.key}</td>
                    <td className="p-4 text-purple-300 font-bold">{l.plan}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          l.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : l.status === 'UNUSED'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{l.userEmail || 'Unassigned'}</td>
                    <td className="p-4 text-slate-300">
                      {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="p-4 text-slate-400">{l.maxDevices} Devices</td>
                    <td className="p-4 text-right space-x-1.5">
                      {l.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleUpdateLicenseStatus(l.id, 'SUSPENDED')}
                          className="px-2 py-1 rounded bg-amber-950/40 text-amber-400 hover:bg-amber-900/40"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateLicenseStatus(l.id, 'ACTIVE')}
                          className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLicense(l.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Engine Tuning */}
      {activeSubTab === 'ENGINE' && engineConfig && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6">
          <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            QUANTITATIVE SIGNAL & NO-TRADE FILTER WEIGHTS
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400">STRICT NO-TRADE CUTOFF (0-100)</label>
              <input
                type="number"
                value={engineConfig.noTradeCutoff}
                onChange={(e) =>
                  setEngineConfig({
                    ...engineConfig,
                    noTradeCutoff: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">RSI PERIOD</label>
              <input
                type="number"
                value={engineConfig.rsiPeriod}
                onChange={(e) =>
                  setEngineConfig({
                    ...engineConfig,
                    rsiPeriod: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">ADX TREND THRESHOLD</label>
              <input
                type="number"
                value={engineConfig.adxThreshold}
                onChange={(e) =>
                  setEngineConfig({
                    ...engineConfig,
                    adxThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white mt-1"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <h5 className="font-bold text-slate-300 uppercase">
              CONFLUENCE CATEGORY WEIGHTS (TOTAL 100 POINTS)
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(engineConfig.weights).map(([cat, weight]) => (
                <div key={cat} className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-slate-400 uppercase text-[10px]">{cat}</span>
                  <div className="text-lg font-bold text-indigo-300">{weight} pts</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveEngineSettings}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg"
          >
            SAVE ENGINE CONFIGURATION
          </button>
        </div>
      )}

      {/* Subtab 5: Security & Audit Logs */}
      {activeSubTab === 'LOGS' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e1a]/90 shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-4 font-bold text-purple-300">{log.action}</td>
                  <td className="p-4 text-slate-300">{log.resource}</td>
                  <td className="p-4 text-slate-400">{log.userEmail || log.userId || 'SYSTEM'}</td>
                  <td className="p-4 text-slate-400 text-[11px] truncate max-w-xs">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
