// FSL TRADER — AI MARKET VISION PRO
// Watchlist View Component

import React, { useEffect, useState } from 'react';
import { MarketSummary } from '../types';
import { apiClient } from '../services/apiClient';
import { Star, Trash2, Plus, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WatchlistViewProps {
  onSelectSymbol: (symbol: string) => void;
  availableMarkets: MarketSummary[];
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectSymbol,
  availableMarkets,
}) => {
  const [watchlist, setWatchlist] = useState<MarketSummary[]>([]);
  const [newSymbolInput, setNewSymbolInput] = useState('');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const res = await apiClient.getWatchlist();
      setWatchlist(res.watchlist);
    } catch (err) {
      console.warn('Failed to load watchlist:', err);
    }
  };

  const addSymbol = async () => {
    if (!newSymbolInput) return;
    try {
      await apiClient.addToWatchlist(newSymbolInput);
      setNewSymbolInput('');
      loadWatchlist();
    } catch (err) {
      console.warn('Failed to add to watchlist:', err);
    }
  };

  const removeSymbol = async (sym: string) => {
    try {
      await apiClient.removeFromWatchlist(sym);
      loadWatchlist();
    } catch (err) {
      console.warn('Failed to remove from watchlist:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10">
        <div>
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            CUSTOM ASSET RADAR WATCHLIST
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Pin and monitor priority financial instruments with continuous state tracking.
          </p>
        </div>

        {/* Add Asset */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <select
            value={newSymbolInput}
            onChange={(e) => setNewSymbolInput(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none"
          >
            <option value="">Select Asset to Track...</option>
            {availableMarkets.map((m) => (
              <option key={m.symbol} value={m.symbol}>
                {m.symbol} ({m.marketType})
              </option>
            ))}
          </select>
          <button
            onClick={addSymbol}
            disabled={!newSymbolInput}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-all disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            PIN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlist.map((item) => (
          <div
            key={item.symbol}
            className="p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 hover:border-indigo-500/30 transition-all font-mono space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white tracking-wider">
                {item.symbol}
              </span>
              <button
                onClick={() => removeSymbol(item.symbol)}
                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-all"
                title="Remove from watchlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-100">
                {item.lastPrice > 100 ? item.lastPrice.toFixed(2) : item.lastPrice.toFixed(4)}
              </span>
              <span
                className={`flex items-center text-xs font-bold ${
                  item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {item.change24h >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {item.change24h}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
              <span>
                Confluence: <strong className="text-indigo-300">{item.confluence}/100</strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                  item.signalState === 'UP'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : item.signalState === 'DOWN'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {item.signalState}
              </span>
            </div>

            <button
              onClick={() => onSelectSymbol(item.symbol)}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <span>ANALYZE LIVE</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
