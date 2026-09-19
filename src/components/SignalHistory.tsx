// FSL TRADER — AI MARKET VISION PRO
// Signal History & Forensic Audit View

import React, { useEffect, useState } from 'react';
import { SignalResult } from '../types';
import { apiClient } from '../services/apiClient';
import {
  History,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Download,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  Layers,
} from 'lucide-react';

export const SignalHistory: React.FC = () => {
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [filterDirection, setFilterDirection] = useState<string>('ALL');
  const [searchSymbol, setSearchSymbol] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalResult | null>(null);

  useEffect(() => {
    loadSignals();
  }, [filterDirection]);

  const loadSignals = async () => {
    try {
      const res = await apiClient.getSignals({
        direction: filterDirection === 'ALL' ? undefined : filterDirection,
        limit: 100,
      });
      setSignals(res.signals);
    } catch (err) {
      console.warn('Failed to load signal history:', err);
    }
  };

  const filtered = signals.filter((s) =>
    searchSymbol ? s.symbol.toLowerCase().includes(searchSymbol.toLowerCase()) : true
  );

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(signals, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `FSL_TRADER_SIGNALS_${Date.now()}.json`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10">
        <div>
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <History className="h-5 w-5 text-purple-400" />
            AI SIGNAL AUDIT LOG & FORENSICS
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Complete verifiable archive of all executed neural scans and confluence evaluations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter symbol..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-28 sm:w-36"
            />
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs font-mono">
            {['ALL', 'UP', 'DOWN', 'NO_TRADE'].map((dir) => (
              <button
                key={dir}
                onClick={() => setFilterDirection(dir)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterDirection === dir
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-white/10 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-purple-400" />
            EXPORT
          </button>
        </div>
      </div>

      {/* Signals Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e1a]/90 shadow-2xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs space-y-2">
            <History className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p>No signals recorded yet.</p>
            <p className="text-[11px] text-slate-400">
              Run an analysis in the AI Analyzer workspace to record verified signal forensics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">ID / Time</th>
                  <th className="px-5 py-3.5">Asset</th>
                  <th className="px-5 py-3.5">TF</th>
                  <th className="px-5 py-3.5">Direction</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">1m / 3m / 5m</th>
                  <th className="px-5 py-3.5">Setup Title</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-200">{s.timestamp}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{s.id}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white tracking-wide">
                      {s.symbol}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{s.timeframe}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-extrabold ${
                          s.direction === 'UP'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : s.direction === 'DOWN'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {s.direction === 'UP' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : s.direction === 'DOWN' ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <MinusCircle className="h-3 w-3" />
                        )}
                        {s.direction}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      {s.confluenceScore}/100
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {s.timeframeForecasts.next1Min.direction}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {s.timeframeForecasts.next3Min.direction}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {s.timeframeForecasts.next5Min.direction}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 truncate max-w-[200px]">
                      {s.setupTitle}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSignal(s)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      >
                        <Eye className="h-4 w-4 text-purple-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forensic Detail Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0b0e1a] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs text-slate-400">{selectedSignal.id}</span>
                <h3 className="text-lg font-bold text-white">
                  {selectedSignal.symbol} ({selectedSignal.timeframe}) — {selectedSignal.direction}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                <div className="text-slate-400 uppercase text-[10px]">ANALYSIS RATIONALE</div>
                <div className="text-slate-200 leading-relaxed">{selectedSignal.explanation}</div>
              </div>

              {/* Confluence Factor Breakdown */}
              <div className="space-y-2">
                <div className="text-slate-400 uppercase text-[10px]">8-FACTOR CONFLUENCE MATRIX</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSignal.factors.map((f) => (
                    <div
                      key={f.category}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between"
                    >
                      <span className="text-slate-300 font-bold">{f.category}</span>
                      <span className={f.passed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        +{f.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Timeframe Matrix */}
              <div className="space-y-2">
                <div className="text-slate-400 uppercase text-[10px]">HORIZON PROJECTIONS</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    selectedSignal.timeframeForecasts.next1Min,
                    selectedSignal.timeframeForecasts.next3Min,
                    selectedSignal.timeframeForecasts.next5Min,
                  ].map((tf) => (
                    <div key={tf.timeframe} className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-center">
                      <div className="text-[10px] text-slate-400">{tf.timeframe}</div>
                      <div className="font-bold text-white text-sm my-1">{tf.direction}</div>
                      <div className="text-[10px] text-indigo-400 font-bold">{tf.confluence}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
