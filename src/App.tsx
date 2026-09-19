// FSL TRADER — AI MARKET VISION PRO
// Main Application Root
// High-grade cyberpunk multi-market vision platform with institutional RBAC & license protection.

import React, { useState, useEffect } from 'react';
import { User, License, MarketSummary, OHLCVCandle } from './types';
import { apiClient } from './services/apiClient';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AnalyzerWorkspace } from './components/AnalyzerWorkspace';
import { CandlestickChart } from './components/CandlestickChart';
import { MarketScanner } from './components/MarketScanner';
import { SignalHistory } from './components/SignalHistory';
import { WatchlistView } from './components/WatchlistView';
import { StrategyLab } from './components/StrategyLab';
import { AdminPanel } from './components/AdminPanel';
import { LicenseModal } from './components/LicenseModal';
import { AuthModal } from './components/AuthModal';
import {
  KeyRound,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [isLicenseActive, setIsLicenseActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('analyzer');

  // Markets
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string>('NZD/JPY');
  const [chartCandles, setChartCandles] = useState<OHLCVCandle[]>([]);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

  // Modals
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Initial Boot Profile & Markets Load
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const [profileRes, marketsRes] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getMarkets(),
      ]);

      setUser(profileRes.user);
      setLicense(profileRes.license);
      setIsLicenseActive(profileRes.licenseValid);
      setMarkets(marketsRes.markets);

      // Load initial candles for live chart view
      loadCandlesForChart('NZD/JPY');
    } catch (err) {
      console.warn('Init app error:', err);
    }
  };

  const loadCandlesForChart = async (sym: string) => {
    setIsChartLoading(true);
    try {
      const res = await apiClient.getCandles(sym);
      setChartCandles(res.candles);
      setSelectedChartSymbol(sym);
    } catch (err) {
      console.warn('Failed to load chart candles:', err);
    } finally {
      setIsChartLoading(false);
    }
  };

  const handleSelectSymbolFromOtherTab = (sym: string) => {
    setSelectedChartSymbol(sym);
    loadCandlesForChart(sym);
    setActiveTab('analyzer');
  };

  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
    setLicense(null);
    setIsLicenseActive(false);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (u: User, lic: License | null, valid: boolean) => {
    setUser(u);
    setLicense(lic);
    setIsLicenseActive(valid);
  };

  const handleLicenseActivated = (lic: License, u: User) => {
    setLicense(lic);
    setUser(u);
    setIsLicenseActive(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#07090e] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Global Cyberpunk Header */}
      <Header
        user={user}
        license={license}
        licenseValid={isLicenseActive}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Unlicensed Warning Notice Banner */}
      {!isLicenseActive && (
        <div className="w-full bg-gradient-to-r from-amber-950/80 via-rose-950/70 to-amber-950/80 border-b border-amber-500/40 px-4 py-2.5 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>UNLICENSED TERMINAL:</strong> AI Market Vision scans are locked until an authorized license key is verified.
            </span>
          </div>
          <button
            onClick={() => setIsLicenseModalOpen(true)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 transition-all text-xs"
          >
            ACTIVATE LICENSE KEY
          </button>
        </div>
      )}

      {/* Main Layout: Sidebar + Viewport */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: AI Vision Analyzer Workspace */}
          {activeTab === 'analyzer' && (
            <AnalyzerWorkspace
              markets={markets}
              onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
              isLicenseActive={isLicenseActive}
            />
          )}

          {/* TAB 2: Live Dedicated HTML5 Candlestick Chart */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">SELECT ASSET:</span>
                  <select
                    value={selectedChartSymbol}
                    onChange={(e) => loadCandlesForChart(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-white font-bold"
                  >
                    {markets.map((m) => (
                      <option key={m.symbol} value={m.symbol}>
                        {m.symbol} ({m.marketType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-slate-400 hidden sm:inline">
                  Interactive HTML5 Canvas • EMA 9/21/50 • Bollinger Bands • S/R Barriers
                </div>
              </div>

              <div className="h-[620px]">
                <CandlestickChart
                  candles={chartCandles}
                  symbol={selectedChartSymbol}
                  timeframe="1m"
                  onRefresh={() => loadCandlesForChart(selectedChartSymbol)}
                  isLoading={isChartLoading}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Market Scanner */}
          {activeTab === 'scanner' && (
            <MarketScanner onSelectSymbol={handleSelectSymbolFromOtherTab} />
          )}

          {/* TAB 4: Forensic Signal History */}
          {activeTab === 'history' && <SignalHistory />}

          {/* TAB 5: Watchlist */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              onSelectSymbol={handleSelectSymbolFromOtherTab}
              availableMarkets={markets}
            />
          )}

          {/* TAB 6: Strategy Builder & Lab */}
          {activeTab === 'strategies' && <StrategyLab markets={markets} />}

          {/* TAB 7: License & Quotas */}
          {activeTab === 'license' && (
            <div className="max-w-xl mx-auto py-8">
              <div className="p-8 rounded-3xl bg-[#0b0e1a]/90 border border-white/15 space-y-6 font-mono text-xs">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-400">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      COMMERCIAL LICENSE CREDENTIALS
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Device Bindings & Execution Entitlements
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">CURRENT TIER:</span>
                    <span className="font-bold text-purple-300">{license?.plan || user?.plan || 'UNLICENSED'}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">LICENSE KEY:</span>
                    <span className="font-bold text-white tracking-wider">{license?.key || 'None Registered'}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">ACTIVE DEVICES:</span>
                    <span className="text-slate-200">{user?.devicesActive || 1} of {license?.maxDevices || 1} allowed</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">DAILY SCANS QUOTA:</span>
                    <span className="text-slate-200">{user?.scansToday || 0} / {license?.dailyScanLimit || 50} today</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">STATUS:</span>
                    <span className={`font-bold ${isLicenseActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isLicenseActive ? 'VALID & ACTIVE' : 'EXPIRED / INACTIVE'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsLicenseModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white shadow-lg transition-all"
                >
                  UPGRADE OR ENTER NEW LICENSE KEY
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: Admin Control Panel (RBAC Protected) */}
          {activeTab === 'admin' && <AdminPanel currentUser={user} />}
        </main>
      </div>

      {/* Global Modals */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        currentLicense={license}
        user={user}
        onLicenseActivated={handleLicenseActivated}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
