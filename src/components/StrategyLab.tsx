// FSL TRADER — AI MARKET VISION PRO
// Strategy Builder & Quantitative Backtesting Lab

import React, { useEffect, useState } from 'react';
import { Strategy, StrategyCondition, BacktestResult, MarketSummary } from '../types';
import { apiClient } from '../services/apiClient';
import {
  Sliders,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart,
  Percent,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface StrategyLabProps {
  markets: MarketSummary[];
}

export const StrategyLab: React.FC<StrategyLabProps> = ({ markets }) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [backtestSymbol, setBacktestSymbol] = useState<string>('NZD/JPY');
  const [backtestTimeframe, setBacktestTimeframe] = useState<string>('1m');
  const [candleCount, setCandleCount] = useState<number>(60);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // New Strategy Form State
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);
  const [newStratName, setNewStratName] = useState('');
  const [newStratDesc, setNewStratDesc] = useState('');
  const [newStratBias, setNewStratBias] = useState<'UP' | 'DOWN' | 'NO_TRADE'>('UP');
  const [newStratMinConf, setNewStratMinConf] = useState(75);
  const [newStratConditions, setNewStratConditions] = useState<StrategyCondition[]>([
    { id: '1', logicOp: 'IF', indicator: 'EMA', operator: '>', compareValue: 'EMA 21', param1: '9', param2: '21' },
    { id: '2', logicOp: 'AND', indicator: 'RSI', operator: '>', compareValue: '50', param1: '14' },
    { id: '3', logicOp: 'AND', indicator: 'MACD', operator: '>', compareValue: '0' },
  ]);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const res = await apiClient.getAdminStrategies();
      setStrategies(res.strategies);
      if (res.strategies.length > 0 && !selectedStrategyId) {
        setSelectedStrategyId(res.strategies[0].id);
      }
    } catch (err) {
      console.warn('Failed to load strategies:', err);
    }
  };

  const runBacktest = async () => {
    setIsBacktesting(true);
    try {
      const res = await apiClient.runBacktest({
        strategyId: selectedStrategyId,
        symbol: backtestSymbol,
        timeframe: backtestTimeframe,
        candleCount,
      });
      setBacktestResult(res.result);
    } catch (err) {
      console.warn('Backtest error:', err);
    } finally {
      setIsBacktesting(false);
    }
  };

  const addCondition = () => {
    setNewStratConditions([
      ...newStratConditions,
      {
        id: Date.now().toString(),
        logicOp: 'AND',
        indicator: 'RSI',
        operator: '>',
        compareValue: '50',
      },
    ]);
  };

  const removeCondition = (index: number) => {
    setNewStratConditions(newStratConditions.filter((_, i) => i !== index));
  };

  const handleSaveStrategy = async () => {
    if (!newStratName) return;
    try {
      await apiClient.createAdminStrategy({
        name: newStratName,
        description: newStratDesc,
        biasTarget: newStratBias,
        minConfluence: newStratMinConf,
        conditions: newStratConditions,
      });
      setIsCreatingStrategy(false);
      setNewStratName('');
      loadStrategies();
    } catch (err) {
      console.warn('Could not save strategy:', err);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-400" />
            STRATEGY BUILDER & QUANTITATIVE BACKTEST LAB
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Design multi-factor confluence rules and simulate historical execution expectancy.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingStrategy(!isCreatingStrategy)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs tracking-wider transition-all"
        >
          <Plus className="h-4 w-4" />
          {isCreatingStrategy ? 'CLOSE BUILDER' : 'CREATE NEW STRATEGY'}
        </button>
      </div>

      {/* New Strategy Visual Builder */}
      {isCreatingStrategy && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-5 text-xs">
          <div className="border-b border-white/10 pb-3">
            <h4 className="font-bold text-sm text-indigo-300">
              VISUAL CONFLUENCE RULE BUILDER
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Construct logical boolean indicator triggers (IF / AND / OR).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300">STRATEGY NAME</label>
              <input
                type="text"
                value={newStratName}
                onChange={(e) => setNewStratName(e.target.value)}
                placeholder="e.g. Trend Breakout Exhaustion"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">EXECUTION TARGET BIAS</label>
              <select
                value={newStratBias}
                onChange={(e) => setNewStratBias(e.target.value as 'UP' | 'DOWN')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none"
              >
                <option value="UP">UP (LONG CONTINUATION)</option>
                <option value="DOWN">DOWN (SHORT CONTINUATION)</option>
              </select>
            </div>
          </div>

          {/* Condition Stack */}
          <div className="space-y-2">
            <label className="text-slate-300">RULE CONDITIONS</label>
            {newStratConditions.map((cond, idx) => (
              <div
                key={cond.id || idx}
                className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-800/80 border border-white/5"
              >
                <span className="w-10 font-bold text-indigo-400 text-center">
                  {idx === 0 ? 'IF' : 'AND'}
                </span>

                <select
                  value={cond.indicator}
                  onChange={(e) => {
                    const copy = [...newStratConditions];
                    copy[idx].indicator = e.target.value as StrategyCondition['indicator'];
                    setNewStratConditions(copy);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white"
                >
                  <option value="EMA">EMA</option>
                  <option value="RSI">RSI</option>
                  <option value="MACD">MACD</option>
                  <option value="ADX">ADX</option>
                  <option value="S_R">SUPPORT / RESISTANCE</option>
                  <option value="BB">BOLLINGER BANDS</option>
                  <option value="VOLUME">VOLUME</option>
                  <option value="PRICE">PRICE</option>
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => {
                    const copy = [...newStratConditions];
                    copy[idx].operator = e.target.value as StrategyCondition['operator'];
                    setNewStratConditions(copy);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white"
                >
                  <option value=">">&gt; (GREATER THAN)</option>
                  <option value="<">&lt; (LESS THAN)</option>
                  <option value="==">== (EQUALS)</option>
                  <option value="CROSS_UP">CROSSES ABOVE</option>
                  <option value="CROSS_DOWN">CROSSES BELOW</option>
                  <option value="NEAR">NEAR REACTION ZONE</option>
                </select>

                <input
                  type="text"
                  value={cond.compareValue}
                  onChange={(e) => {
                    const copy = [...newStratConditions];
                    copy[idx].compareValue = e.target.value;
                    setNewStratConditions(copy);
                  }}
                  placeholder="e.g. 50 or EMA 21"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white w-28"
                />

                {newStratConditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(idx)}
                    className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addCondition}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              ADD ANOTHER CONDITION
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              onClick={() => setIsCreatingStrategy(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStrategy}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg"
            >
              Save Strategy
            </button>
          </div>
        </div>
      )}

      {/* Backtest Control Deck */}
      <div className="p-6 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-400" />
          HISTORICAL BACKTESTING ENGINE
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400">ACTIVE STRATEGY</label>
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.biasTarget})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">TARGET ASSET</label>
            <select
              value={backtestSymbol}
              onChange={(e) => setBacktestSymbol(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
            >
              {markets.map((m) => (
                <option key={m.symbol} value={m.symbol}>
                  {m.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">TIMEFRAME</label>
            <select
              value={backtestTimeframe}
              onChange={(e) => setBacktestTimeframe(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white"
            >
              <option value="1m">1 MINUTE</option>
              <option value="3m">3 MINUTES</option>
              <option value="5m">5 MINUTES</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={runBacktest}
              disabled={isBacktesting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isBacktesting ? 'animate-spin' : ''}`} />
              {isBacktesting ? 'SIMULATING...' : 'RUN SIMULATION'}
            </button>
          </div>
        </div>

        {/* Backtest Output Metrics */}
        {backtestResult && (
          <div className="space-y-6 pt-4 border-t border-white/10">
            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <span className="text-slate-400">WIN RATE</span>
                <div className="text-2xl font-black text-emerald-400">
                  {backtestResult.winRate}%
                </div>
                <span className="text-[10px] text-slate-400">
                  {backtestResult.winningSetups}W / {backtestResult.losingSetups}L
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <span className="text-slate-400">PROFIT FACTOR</span>
                <div className="text-2xl font-black text-indigo-400">
                  {backtestResult.profitFactor}x
                </div>
                <span className="text-[10px] text-slate-400">Gross Win/Loss</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <span className="text-slate-400">MAX DRAWDOWN</span>
                <div className="text-2xl font-black text-rose-400">
                  {backtestResult.maxDrawdown}%
                </div>
                <span className="text-[10px] text-slate-400">Peak-to-valley</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <span className="text-slate-400">EXPECTANCY</span>
                <div className="text-2xl font-black text-cyan-400">
                  +{backtestResult.expectancy} pips
                </div>
                <span className="text-[10px] text-slate-400">Per execution</span>
              </div>
            </div>

            {/* Recent Simulated Executions Table */}
            <div className="space-y-2">
              <span className="text-slate-400 text-xs uppercase font-bold">
                SIMULATED EXECUTION AUDIT TRAIL
              </span>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/50">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Entry</th>
                      <th className="p-3">Exit</th>
                      <th className="p-3">Confluence</th>
                      <th className="p-3">Pips</th>
                      <th className="p-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {backtestResult.trades.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 text-slate-400">{t.timestamp}</td>
                        <td className="p-3 font-bold text-white">{t.type}</td>
                        <td className="p-3 text-slate-300">{t.entryPrice}</td>
                        <td className="p-3 text-slate-300">{t.exitPrice}</td>
                        <td className="p-3 text-indigo-300">{t.confluence}%</td>
                        <td
                          className={`p-3 font-bold ${
                            t.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.pips > 0 ? `+${t.pips}` : t.pips}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              t.result === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {t.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
