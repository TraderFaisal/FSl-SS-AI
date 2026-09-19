// FSL TRADER — AI MARKET VISION PRO
// Interactive HTML5 Canvas Candlestick Chart Engine
// High-FPS rendering of OHLCV candles, EMA overlays, Bollinger Bands, and Support/Resistance lines.

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { OHLCVCandle } from '../types';
import { calculateEMA, calculateBollingerBands } from '../server/indicators';
import { Layers, Eye, RefreshCw } from 'lucide-react';

interface CandlestickChartProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe?: string;
  supportLevels?: number[];
  resistanceLevels?: number[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  symbol,
  timeframe = '1m',
  supportLevels = [],
  resistanceLevels = [],
  onRefresh,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });
  const [hoveredCandle, setHoveredCandle] = useState<OHLCVCandle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Indicator Visibility Toggles
  const [showEma9, setShowEma9] = useState(true);
  const [showEma21, setShowEma21] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showSR, setShowSR] = useState(true);

  // ResizeObserver for accurate sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.max(340, height) });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pre-calculate indicators
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema9 = useMemo(() => calculateEMA(closes, 9), [closes]);
  const ema21 = useMemo(() => calculateEMA(closes, 21), [closes]);
  const ema50 = useMemo(() => calculateEMA(closes, 50), [closes]);

  // Main Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina / HiDPI Scaling
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Padding parameters
    const padTop = 30;
    const padBottom = 35;
    const padRight = 75; // Y-Axis Price scale
    const padLeft = 10;
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    // Determine min/max price for scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    // Include S/R levels in min/max to ensure they are visible
    if (showSR) {
      for (const s of supportLevels) if (s > 0) minPrice = Math.min(minPrice, s);
      for (const r of resistanceLevels) if (r > 0) maxPrice = Math.max(maxPrice, r);
    }

    // Add 8% buffer
    const priceRange = maxPrice - minPrice || 0.0001;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const fullRange = maxPrice - minPrice;

    const getY = (price: number) => padTop + (1 - (price - minPrice) / fullRange) * chartHeight;
    const numCandles = candles.length;
    const candleSlotWidth = chartWidth / numCandles;
    const candleBodyWidth = Math.max(2, Math.min(18, candleSlotWidth * 0.72));

    // 1. Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridRows = 5;
    for (let r = 0; r <= gridRows; r++) {
      const y = padTop + (r / gridRows) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Right Axis Price Label
      const pVal = maxPrice - (r / gridRows) * fullRange;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(pVal > 100 ? pVal.toFixed(2) : pVal.toFixed(4), width - padRight + 6, y + 3);
    }

    // 2. Draw Bollinger Bands
    if (showBollinger && candles.length >= 20) {
      const bbObj = calculateBollingerBands(closes, 20, 2);
      const upperY = getY(bbObj.upper);
      const middleY = getY(bbObj.middle);
      const lowerY = getY(bbObj.lower);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.035)';
      ctx.fillRect(padLeft, upperY, chartWidth, lowerY - upperY);

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, upperY);
      ctx.lineTo(width - padRight, upperY);
      ctx.moveTo(padLeft, lowerY);
      ctx.lineTo(width - padRight, lowerY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(padLeft, middleY);
      ctx.lineTo(width - padRight, middleY);
      ctx.stroke();
    }

    // 3. Draw Support & Resistance Horizontal Barriers
    if (showSR) {
      // Resistance (Red dashed)
      for (const res of resistanceLevels) {
        if (res <= 0) continue;
        const y = getY(res);
        if (y >= padTop && y <= padTop + chartHeight) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(padLeft, y);
          ctx.lineTo(width - padRight, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Tag
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(width - padRight, y - 8, 70, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillText(`RES ${res.toFixed(4)}`, width - padRight + 4, y + 4);
        }
      }

      // Support (Green dashed)
      for (const sup of supportLevels) {
        if (sup <= 0) continue;
        const y = getY(sup);
        if (y >= padTop && y <= padTop + chartHeight) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(padLeft, y);
          ctx.lineTo(width - padRight, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Tag
          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.fillRect(width - padRight, y - 8, 70, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillText(`SUP ${sup.toFixed(4)}`, width - padRight + 4, y + 4);
        }
      }
    }

    // 4. Draw Candlesticks & Volume
    const maxVol = Math.max(...candles.map((c) => c.volume), 1);
    const volHeightMax = chartHeight * 0.22;

    for (let i = 0; i < numCandles; i++) {
      const c = candles[i];
      const cx = padLeft + i * candleSlotWidth + candleSlotWidth / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? '#10b981' : '#ef4444';

      // Volume bar
      const vHeight = (c.volume / maxVol) * volHeightMax;
      const vy = padTop + chartHeight - vHeight;
      ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(cx - candleBodyWidth / 2, vy, candleBodyWidth, vHeight);

      // Candle Wick
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, yHigh);
      ctx.lineTo(cx, yLow);
      ctx.stroke();

      // Candle Body
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

      ctx.fillStyle = color;
      ctx.fillRect(cx - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight);
    }

    // 5. Draw Indicator Lines (EMA 9, EMA 21, EMA 50)
    const drawEmaLine = (data: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < numCandles; i++) {
        const val = data[i];
        if (isNaN(val)) continue;
        const cx = padLeft + i * candleSlotWidth + candleSlotWidth / 2;
        const cy = getY(val);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();
    };

    if (showEma9) drawEmaLine(ema9, '#06b6d4'); // Cyan
    if (showEma21) drawEmaLine(ema21, '#f59e0b'); // Amber
    if (showEma50) drawEmaLine(ema50, '#a855f7'); // Purple

    // 6. Current Price Line (Pulsing neon)
    const latestCandle = candles[candles.length - 1];
    if (latestCandle) {
      const cy = getY(latestCandle.close);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padLeft, cy);
      ctx.lineTo(width - padRight, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge on right scale
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(width - padRight, cy - 10, 72, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        latestCandle.close > 100 ? latestCandle.close.toFixed(2) : latestCandle.close.toFixed(4),
        width - padRight + 5,
        cy + 4
      );
    }

    // 7. Hover Crosshair
    if (mousePos && mousePos.x >= padLeft && mousePos.x <= width - padRight && mousePos.y >= padTop && mousePos.y <= padTop + chartHeight) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padTop);
      ctx.lineTo(mousePos.x, padTop + chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, mousePos.y);
      ctx.lineTo(width - padRight, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price at cursor
      const cursorPrice = maxPrice - ((mousePos.y - padTop) / chartHeight) * fullRange;
      ctx.fillStyle = '#334155';
      ctx.fillRect(width - padRight, mousePos.y - 9, 72, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(
        cursorPrice > 100 ? cursorPrice.toFixed(2) : cursorPrice.toFixed(4),
        width - padRight + 5,
        mousePos.y + 4
      );
    }
  }, [
    dimensions,
    candles,
    closes,
    ema9,
    ema21,
    ema50,
    supportLevels,
    resistanceLevels,
    showEma9,
    showEma21,
    showEma50,
    showBollinger,
    showSR,
    mousePos,
  ]);

  // Handle Mouse Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const padLeft = 10;
    const padRight = 75;
    const chartWidth = dimensions.width - padLeft - padRight;
    const candleSlotWidth = chartWidth / candles.length;
    const idx = Math.floor((x - padLeft) / candleSlotWidth);

    if (idx >= 0 && idx < candles.length) {
      setHoveredCandle(candles[idx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  const displayCandle = hoveredCandle || candles[candles.length - 1];

  return (
    <div className="flex flex-col h-full w-full bg-[#090d1a]/95 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold font-mono text-white tracking-wider">
              {symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 font-bold">
              {timeframe}
            </span>
          </div>

          {displayCandle && (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>
                O: <strong className="text-slate-200">{displayCandle.open}</strong>
              </span>
              <span>
                H: <strong className="text-emerald-400">{displayCandle.high}</strong>
              </span>
              <span>
                L: <strong className="text-rose-400">{displayCandle.low}</strong>
              </span>
              <span>
                C:{' '}
                <strong
                  className={
                    displayCandle.close >= displayCandle.open
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  {displayCandle.close}
                </strong>
              </span>
              <span>
                Vol: <strong className="text-slate-200">{displayCandle.volume.toLocaleString()}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Indicators and Controls */}
        <div className="flex items-center gap-2">
          {/* Overlay Toggles */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-white/5 text-[11px] font-mono">
            <button
              onClick={() => setShowEma9(!showEma9)}
              className={`px-2 py-1 rounded transition-all ${
                showEma9 ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              EMA 9
            </button>
            <button
              onClick={() => setShowEma21(!showEma21)}
              className={`px-2 py-1 rounded transition-all ${
                showEma21 ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              EMA 21
            </button>
            <button
              onClick={() => setShowEma50(!showEma50)}
              className={`px-2 py-1 rounded transition-all ${
                showEma50 ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              EMA 50
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 rounded transition-all ${
                showBollinger ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              BB(20,2)
            </button>
            <button
              onClick={() => setShowSR(!showSR)}
              className={`px-2 py-1 rounded transition-all ${
                showSR ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              S/R
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Market Stream"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Container */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[340px] cyber-grid">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 cursor-crosshair"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs font-mono text-indigo-300 shadow-xl">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
              <span>STREAMING TICK DATA...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
