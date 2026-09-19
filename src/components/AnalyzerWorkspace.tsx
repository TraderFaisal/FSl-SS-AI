// FSL TRADER — AI MARKET VISION PRO
// Main AI Analyzer & Vision Workspace
// Multimodal chart OCR, neural confluence evaluation, multi-timeframe forecasts, and risk filters.

import React, { useState, useRef, useEffect } from 'react';
import {
  SignalResult,
  OHLCVCandle,
  MarketSummary,
} from '../types';
import { CandlestickChart } from './CandlestickChart';
import { apiClient } from '../services/apiClient';
import {
  UploadCloud,
  FileImage,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Sparkles,
  Layers,
  Clock,
  Shield,
  BarChart3,
  RefreshCw,
  Copy,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnalyzerWorkspaceProps {
  markets: MarketSummary[];
  onOpenLicenseModal: () => void;
  isLicenseActive: boolean;
}

export const AnalyzerWorkspace: React.FC<AnalyzerWorkspaceProps> = ({
  markets,
  onOpenLicenseModal,
  isLicenseActive,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NZD/JPY');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SignalResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [indicatorsResult, setIndicatorsResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSignal, setCopiedSignal] = useState(false);

  // Active chart candles
  const [candles, setCandles] = useState<OHLCVCandle[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load candles whenever selected symbol changes
  useEffect(() => {
    loadMarketCandles(selectedSymbol);
  }, [selectedSymbol]);

  const loadMarketCandles = async (sym: string) => {
    try {
      setIsLoadingCandles(true);
      const res = await apiClient.getCandles(sym);
      setCandles(res.candles);
    } catch (err) {
      console.warn('Could not fetch market candles:', err);
    } finally {
      setIsLoadingCandles(false);
    }
  };

  // Paste image handler from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Run AI Vision & Quantitative Confluence Analysis
  const runAnalysis = async () => {
    if (!isLicenseActive) {
      onOpenLicenseModal();
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.analyze({
        imageBase64: imagePreview || undefined,
        symbol: selectedSymbol,
        timeframe: selectedTimeframe,
      });

      setAnalysisResult(res.signal);
      setIndicatorsResult(res.indicators);

      // If symbol detected from chart differs, update selected symbol
      if (res.signal.symbol && res.signal.symbol !== selectedSymbol) {
        setSelectedSymbol(res.signal.symbol);
        loadMarketCandles(res.signal.symbol);
      }

      // If high confluence trade generated, trigger celebratory visual feedback
      if (res.signal.direction !== 'NO_TRADE' && res.signal.confluenceScore >= 80) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: res.signal.direction === 'UP' ? ['#10b981', '#34d399', '#6ee7b7'] : ['#ef4444', '#f87171', '#fca5a5'],
          });
        } catch {}
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      if (anyErr.code === 'LICENSE_REQUIRED') {
        onOpenLicenseModal();
      } else if (anyErr.code === 'MARKET_NOT_DETECTED') {
        setErrorMessage(
          'Chart vision analysis failed: The image did not contain readable candlestick chart structures. Please upload a clear TradingView or broker screenshot.'
        );
      } else {
        setErrorMessage(anyErr.message || 'Analysis could not be completed.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    setImagePreview(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    loadMarketCandles(symbol);
  };

  const copySignalDetails = () => {
    if (!analysisResult) return;
    const text = `FSL TRADER SIGNAL: ${analysisResult.symbol} (${analysisResult.timeframe})
DIRECTION: ${analysisResult.direction}
CONFLUENCE SCORE: ${analysisResult.confluenceScore}/100 [${analysisResult.setupQuality}]
1-MIN: ${analysisResult.timeframeForecasts.next1Min.direction} (${analysisResult.timeframeForecasts.next1Min.confluence}%)
3-MIN: ${analysisResult.timeframeForecasts.next3Min.direction} (${analysisResult.timeframeForecasts.next3Min.confluence}%)
5-MIN: ${analysisResult.timeframeForecasts.next5Min.direction} (${analysisResult.timeframeForecasts.next5Min.confluence}%)
RATIONALE: ${analysisResult.explanation}`;
    navigator.clipboard.writeText(text);
    setCopiedSignal(true);
    setTimeout(() => setCopiedSignal(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">ASSET:</span>
            <select
              id="symbol-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/90 border border-white/15 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
            >
              {markets.map((m) => (
                <option key={m.symbol} value={m.symbol}>
                  {m.symbol} ({m.marketType})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">TIMEFRAME:</span>
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-white/10 font-mono text-xs">
              {['1m', '3m', '5m', '15m'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md transition-all font-bold ${
                    selectedTimeframe === tf
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Quick Pickers */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 hidden sm:inline">DEMO CHARTS:</span>
          {['NZD/JPY', 'EUR/USD', 'BTC/USDT', 'USD/JPY'].map((pair) => (
            <button
              key={pair}
              onClick={() => loadDemoChart(pair)}
              className={`px-2 py-1 rounded border transition-all ${
                selectedSymbol === pair
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                  : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-slate-200'
              }`}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload/Scan Zone & Live Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vision Upload Box & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all bg-[#0b0e1a]/80 backdrop-blur-md min-h-[280px] text-center ${
              imagePreview
                ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'border-white/15 hover:border-indigo-400/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {imagePreview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <div className="relative w-full max-h-[220px] overflow-hidden rounded-xl border border-white/10 shadow-lg">
                  <img
                    src={imagePreview}
                    alt="Chart Screenshot"
                    className="w-full h-full object-cover"
                  />

                  {/* Laser Scanning Overlay during analysis */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xs overflow-hidden flex flex-col justify-between">
                      <div className="w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_15px_#6366f1] animate-bounce"></div>
                      <div className="text-center pb-4 text-xs font-mono text-cyan-300 font-bold tracking-widest animate-pulse">
                        NEURAL OCR SCANNING CANDLES & AXES...
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-mono text-slate-400 hover:text-white underline"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={() => setImagePreview(null)}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 underline"
                  >
                    Clear Image (Use Live Chart)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 font-mono">
                    UPLOAD CHART SCREENSHOT
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Drag & drop or paste (<kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300">Ctrl+V</kbd>) a TradingView, MT4, or broker chart.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    id="upload-chart-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <FileImage className="h-4 w-4 text-indigo-400" />
                    SELECT FILE
                  </button>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Or analyze the live {selectedSymbol} feed directly
                </span>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            id="run-analysis-btn"
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-2xl font-mono font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-2xl transition-all ${
              isAnalyzing
                ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-indigo-400/40 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                EXECUTING AI VISION & CONFLUENCE MATRIX...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 text-amber-300" />
                ANALYZE MARKET VISION ({selectedSymbol})
              </>
            )}
          </button>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="font-bold">ANALYSIS NOTICE:</strong> {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Candlestick Chart (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[340px] lg:h-auto min-h-[340px]">
          <CandlestickChart
            candles={candles}
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            supportLevels={analysisResult?.supportLevels}
            resistanceLevels={analysisResult?.resistanceLevels}
            onRefresh={() => loadMarketCandles(selectedSymbol)}
            isLoading={isLoadingCandles}
          />
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-6 pt-4">
          {/* Main Decision Signal Card */}
          <div
            className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all ${
              analysisResult.direction === 'UP'
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-[#07090e] border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                : analysisResult.direction === 'DOWN'
                ? 'bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-[#07090e] border-rose-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                : 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-[#07090e] border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Direction Indicator */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-400">
                    RECOMMENDED EXECUTION BIAS
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {analysisResult.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {analysisResult.direction === 'UP' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <TrendingUp className="h-10 w-10" />
                      </div>
                      <div>
                        <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                          UP
                        </div>
                        <div className="text-xs font-mono text-emerald-300/80 font-semibold tracking-wider">
                          BUY / LONG BIAS
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisResult.direction === 'DOWN' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <TrendingDown className="h-10 w-10" />
                      </div>
                      <div>
                        <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-rose-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                          DOWN
                        </div>
                        <div className="text-xs font-mono text-rose-300/80 font-semibold tracking-wider">
                          SELL / SHORT BIAS
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisResult.direction === 'NO_TRADE' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <MinusCircle className="h-10 w-10" />
                      </div>
                      <div>
                        <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                          NO TRADE
                        </div>
                        <div className="text-xs font-mono text-amber-300/80 font-semibold tracking-wider">
                          PRESERVING CAPITAL
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Confluence Score Meter */}
              <div className="flex flex-col sm:items-end space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">TOTAL CONFLUENCE SCORE</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      analysisResult.setupQuality === 'HIGH'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : analysisResult.setupQuality === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {analysisResult.setupQuality} QUALITY
                  </span>
                </div>

                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-4xl font-black text-white">
                    {analysisResult.confluenceScore}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/100</span>
                </div>

                {/* Meter Bar */}
                <div className="w-48 h-3 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-700 ${
                      analysisResult.confluenceScore >= 75
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                        : analysisResult.confluenceScore >= 60
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-rose-600 to-rose-400'
                    }`}
                    style={{ width: `${analysisResult.confluenceScore}%` }}
                  />
                </div>

                <button
                  onClick={copySignalDetails}
                  className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 pt-1"
                >
                  <Copy className="h-3 w-3" />
                  {copiedSignal ? 'COPIED TO CLIPBOARD' : 'COPY SIGNAL SUMMARY'}
                </button>
              </div>
            </div>

            {/* Warnings or Conflict Banner */}
            {analysisResult.warnings && analysisResult.warnings.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs font-mono text-amber-200/90 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>CONFLUENCE FILTER / RISK WARNINGS DETECTED:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-300">
                  {analysisResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Multi-Timeframe Forecast Grid (NEXT 1 MIN, NEXT 3 MIN, NEXT 5 MIN) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                MULTI-TIMEFRAME FORECAST MATRIX
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Continuous Order Flow Alignment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                analysisResult.timeframeForecasts.next1Min,
                analysisResult.timeframeForecasts.next3Min,
                analysisResult.timeframeForecasts.next5Min,
              ].map((tf) => (
                <div
                  key={tf.timeframe}
                  className={`p-4 rounded-2xl border transition-all ${
                    tf.direction === 'UP'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : tf.direction === 'DOWN'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-900/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
                      {tf.timeframe}
                    </span>
                    <span
                      className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                        tf.direction === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : tf.direction === 'DOWN'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {tf.direction}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono mb-2">
                    <span className="text-slate-400">Confluence:</span>
                    <strong className="text-white font-bold">{tf.confluence}%</strong>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-white/5 pt-2">
                    <div className="flex justify-between">
                      <span>Structure:</span>
                      <span className="text-slate-200">{tf.marketStructure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Momentum:</span>
                      <span className="text-slate-200">{tf.momentum}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8 Confluence Factor Breakdown */}
          <div className="p-6 rounded-2xl bg-[#0b0e1a]/80 border border-white/10 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              WEIGHTED CONFLUENCE FACTOR BREAKDOWN (100-POINT MATRIX)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisResult.factors.map((f) => (
                <div
                  key={f.category}
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {f.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-200">{f.category}</span>
                      <span className="text-[10px] text-slate-400">(Max {f.weight} pts)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                      {f.details}
                    </p>
                  </div>

                  <div className="font-bold text-right shrink-0">
                    <span className={f.passed ? 'text-emerald-400' : 'text-slate-400'}>
                      +{f.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candlestick Formations & Price Barriers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patterns */}
            <div className="p-5 rounded-2xl bg-[#0b0e1a]/80 border border-white/10 space-y-3">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                DETECTED CANDLESTICK FORMATIONS
              </h5>
              <div className="flex flex-wrap gap-2">
                {analysisResult.detectedCandlesticks.map((pat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono text-xs"
                  >
                    {pat}
                  </span>
                ))}
              </div>
            </div>

            {/* Support / Resistance Levels */}
            <div className="p-5 rounded-2xl bg-[#0b0e1a]/80 border border-white/10 space-y-3">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                KEY SUPPORT & RESISTANCE ZONES
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-emerald-400 font-bold block mb-1">SUPPORT FLOORS</span>
                  {analysisResult.supportLevels.map((s, idx) => (
                    <div key={idx} className="text-slate-300">
                      S{idx + 1}: <strong>{s}</strong>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                  <span className="text-rose-400 font-bold block mb-1">RESISTANCE CEILINGS</span>
                  {analysisResult.resistanceLevels.map((r, idx) => (
                    <div key={idx} className="text-slate-300">
                      R{idx + 1}: <strong>{r}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rationale & Mandatory Safety Disclaimer */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 text-xs font-mono">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              ANALYSIS RATIONALE & EXECUTION DISCIPLINE
            </h5>
            <p className="text-slate-300 leading-relaxed">
              {analysisResult.explanation}
            </p>
            <div className="text-[11px] text-slate-400 border-t border-white/5 pt-3 leading-relaxed">
              <strong>Risk Warning:</strong> FSL TRADER is an analytical quantitative decision-support tool. It does NOT guarantee profits, predict future market outcomes with certainty, or execute live financial transactions. Professional risk management is strictly recommended.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
