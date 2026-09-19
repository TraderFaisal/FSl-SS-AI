// FSL TRADER — AI MARKET VISION PRO
// Market Scanner Component
// Scans multiple financial instruments in real-time for high-confluence setups.

import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import {
  Radar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface ScannerItem {
  symbol: string;
  marketType: string;
  lastPrice: number;
  change24h: number;
  volatility: string;
  confluenceScore: number;
  direction: 'UP' | 'DOWN' | 'NO_TRADE';
  setupQuality: string;
  structure: string;
}

interface MarketScannerProps {
  onSelectSymbol: (symbol: string) => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ onSelectSymbol }) => {
  const [scannerData, setScannerData] = useState<ScannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string>('');

  const fetchScan = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.getMarketScanner();
      setScannerData(res.scanner);
      setLastScanTime(new Date(res.timestamp).toLocaleTimeString());
    } catch (err) {
      console.warn('Scanner error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
    const interval = setInterval(fetchScan, 15000); // 15s auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10">
        <div>
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Radar className="h-5 w-5 text-indigo-400" />
            CROSS-ASSET RADAR SCANNER
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated quantitative screen across Forex, Crypto, and Commodity order flow.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            LAST SCAN: <strong className="text-slate-200">{lastScanTime || 'JUST NOW'}</strong>
          </span>
          <button
            id="scanner-refresh-btn"
            onClick={fetchScan}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Scanner Cards / Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e1a]/90 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="px-5 py-3.5">Asset</th>
                <th className="px-5 py-3.5">Market</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">24h Chg</th>
                <th className="px-5 py-3.5">Structure</th>
                <th className="px-5 py-3.5">Confluence</th>
                <th className="px-5 py-3.5">Bias</th>
                <th className="px-5 py-3.5">Quality</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {scannerData.map((item) => (
                <tr
                  key={item.symbol}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-5 py-4 font-bold text-white tracking-wide">
                    {item.symbol}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      {item.marketType}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-200">
                    {item.lastPrice > 100 ? item.lastPrice.toFixed(2) : item.lastPrice.toFixed(4)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`flex items-center gap-0.5 font-bold ${
                        item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.change24h >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {item.change24h > 0 ? `+${item.change24h}%` : `${item.change24h}%`}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {item.structure}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            item.confluenceScore >= 75
                              ? 'bg-emerald-400'
                              : item.confluenceScore >= 60
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${item.confluenceScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-white">{item.confluenceScore}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-extrabold ${
                        item.direction === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : item.direction === 'DOWN'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {item.direction === 'UP' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : item.direction === 'DOWN' ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <MinusCircle className="h-3 w-3" />
                      )}
                      {item.direction}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.setupQuality === 'HIGH'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.setupQuality === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.setupQuality}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onSelectSymbol(item.symbol)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-300 font-bold transition-all text-xs"
                    >
                      <span>ANALYZE</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
