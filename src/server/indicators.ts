// FSL TRADER — AI MARKET VISION PRO
// Quantitative Indicator & Market Structure Engine
// Performs mathematical computations directly on OHLCV data.

import { OHLCVCandle, MarketStructureType } from '../types';

export interface CalculatedIndicators {
  currentPrice: number;
  ema9: number;
  ema21: number;
  ema50: number;
  ema100: number;
  ema200: number;
  sma20: number;
  rsi14: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  adx14: {
    adx: number;
    plusDI: number;
    minusDI: number;
  };
  atr14: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  cci: number;
  williamsR: number;
  vwap: number;
  volumeEma: number;
  volumeRatio: number;
  marketStructure: {
    type: MarketStructureType;
    trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    lastSwingHigh: number;
    lastSwingLow: number;
    higherHighs: boolean;
    higherLows: boolean;
    lowerHighs: boolean;
    lowerLows: boolean;
    breakoutPotential: 'BREAKOUT_UP' | 'BREAKDOWN' | 'RETEST' | 'REJECTION' | 'NONE';
  };
  supportLevels: number[];
  resistanceLevels: number[];
  detectedPatterns: string[];
}

export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  let initialSum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    initialSum += data[i];
  }
  let currentEma = initialSum / Math.min(period, data.length);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      ema.push(currentEma);
    } else {
      currentEma = (data[i] - currentEma) * multiplier + currentEma;
      ema.push(currentEma);
    }
  }
  return ema;
}

export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (closes.length <= period) return closes.map(() => 50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) rsi.push(NaN);

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - (100 / (1 + firstRs)));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

export function calculateMACD(closes: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const validMacd = macdLine.filter((v) => !isNaN(v));
  const signalVals = calculateEMA(validMacd, signalPeriod);

  // Align back with full length
  const signalLine: number[] = [];
  let sigIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN);
    } else {
      signalLine.push(signalVals[sigIdx++] ?? NaN);
    }
  }

  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

export function calculateATR(candles: OHLCVCandle[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  return calculateSMA(tr, period);
}

export function calculateADX(candles: OHLCVCandle[], period = 14) {
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
      plusDM.push(0);
      minusDM.push(0);
    } else {
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }

  const smoothedTR = calculateEMA(tr, period);
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);

  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const sTR = smoothedTR[i];
    if (isNaN(sTR) || sTR === 0) {
      plusDI.push(NaN);
      minusDI.push(NaN);
      dx.push(NaN);
    } else {
      const pDI = (smoothedPlusDM[i] / sTR) * 100;
      const mDI = (smoothedMinusDM[i] / sTR) * 100;
      plusDI.push(pDI);
      minusDI.push(mDI);
      const diff = Math.abs(pDI - mDI);
      const sum = pDI + mDI;
      dx.push(sum === 0 ? 0 : (diff / sum) * 100);
    }
  }

  const validDx = dx.filter((v) => !isNaN(v));
  const adxVals = calculateEMA(validDx, period);

  const lastAdx = adxVals[adxVals.length - 1] || 25;
  const lastPlusDI = plusDI[plusDI.length - 1] || 25;
  const lastMinusDI = minusDI[minusDI.length - 1] || 25;

  return {
    adx: Math.round(lastAdx * 100) / 100,
    plusDI: Math.round(lastPlusDI * 100) / 100,
    minusDI: Math.round(lastMinusDI * 100) / 100,
  };
}

export function calculateBollingerBands(closes: number[], period = 20, stdDevMult = 2) {
  const sma = calculateSMA(closes, period);
  const len = closes.length;
  const lastIdx = len - 1;

  if (lastIdx < period) {
    const p = closes[lastIdx] || 1;
    return { upper: p * 1.01, middle: p, lower: p * 0.99, bandwidth: 0.02, percentB: 0.5 };
  }

  let varianceSum = 0;
  for (let i = 0; i < period; i++) {
    const diff = closes[lastIdx - i] - sma[lastIdx];
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / period);
  const upper = sma[lastIdx] + stdDev * stdDevMult;
  const lower = sma[lastIdx] - stdDev * stdDevMult;
  const middle = sma[lastIdx];
  const bandwidth = (upper - lower) / middle;
  const current = closes[lastIdx];
  const percentB = upper !== lower ? (current - lower) / (upper - lower) : 0.5;

  return { upper, middle, lower, bandwidth, percentB };
}

export function calculateStochastic(candles: OHLCVCandle[], kPeriod = 14, dPeriod = 3) {
  const len = candles.length;
  if (len < kPeriod) return { k: 50, d: 50 };

  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < len; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      highest = Math.max(highest, candles[i - j].high);
      lowest = Math.min(lowest, candles[i - j].low);
    }
    const currentClose = candles[i].close;
    const k = highest === lowest ? 50 : ((currentClose - lowest) / (highest - lowest)) * 100;
    kValues.push(k);
  }

  const d = kValues.slice(-dPeriod).reduce((acc, v) => acc + v, 0) / Math.min(dPeriod, kValues.length);
  const lastK = kValues[kValues.length - 1] ?? 50;

  return { k: Math.round(lastK * 10) / 10, d: Math.round(d * 10) / 10 };
}

export function calculateCCI(candles: OHLCVCandle[], period = 20): number {
  if (candles.length < period) return 0;
  const tpList = candles.map((c) => (c.high + c.low + c.close) / 3);
  const recentTP = tpList.slice(-period);
  const mean = recentTP.reduce((a, b) => a + b, 0) / period;
  const meanDev = recentTP.reduce((acc, v) => acc + Math.abs(v - mean), 0) / period;
  const lastTP = tpList[tpList.length - 1];
  if (meanDev === 0) return 0;
  return Math.round(((lastTP - mean) / (0.015 * meanDev)) * 100) / 100;
}

export function calculateWilliamsR(candles: OHLCVCandle[], period = 14): number {
  if (candles.length < period) return -50;
  const slice = candles.slice(-period);
  const highest = Math.max(...slice.map((c) => c.high));
  const lowest = Math.min(...slice.map((c) => c.low));
  const current = slice[slice.length - 1].close;
  if (highest === lowest) return -50;
  return Math.round((((highest - current) / (highest - lowest)) * -100) * 10) / 10;
}

export function calculateVWAP(candles: OHLCVCandle[]): number {
  let cumulativeTPV = 0;
  let cumulativeVol = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    cumulativeTPV += tp * c.volume;
    cumulativeVol += c.volume;
  }
  return cumulativeVol === 0 ? (candles[candles.length - 1]?.close ?? 0) : cumulativeTPV / cumulativeVol;
}

export function detectCandlestickPatterns(candles: OHLCVCandle[]): string[] {
  const patterns: string[] = [];
  const len = candles.length;
  if (len < 3) return patterns;

  const c0 = candles[len - 1];
  const c1 = candles[len - 2];
  const c2 = candles[len - 3];

  const body0 = Math.abs(c0.close - c0.open);
  const range0 = c0.high - c0.low;
  const isBullish0 = c0.close > c0.open;
  const isBearish0 = c0.close < c0.open;
  const upperWick0 = c0.high - Math.max(c0.open, c0.close);
  const lowerWick0 = Math.min(c0.open, c0.close) - c0.low;

  // Doji
  if (range0 > 0 && body0 / range0 <= 0.1) {
    patterns.push('Doji');
  }

  // Hammer & Pin Bar (Bullish)
  if (lowerWick0 >= body0 * 2 && upperWick0 <= body0 * 0.5 && range0 > 0) {
    patterns.push(isBullish0 ? 'Hammer (Bullish)' : 'Pin Bar Reversal');
  }

  // Shooting Star (Bearish)
  if (upperWick0 >= body0 * 2 && lowerWick0 <= body0 * 0.5 && range0 > 0) {
    patterns.push('Shooting Star (Bearish)');
  }

  // Bullish Engulfing
  if (c1.close < c1.open && isBullish0 && c0.open <= c1.close && c0.close >= c1.open) {
    patterns.push('Bullish Engulfing');
  }

  // Bearish Engulfing
  if (c1.close > c1.open && isBearish0 && c0.open >= c1.close && c0.close <= c1.open) {
    patterns.push('Bearish Engulfing');
  }

  // Inside Bar
  if (c0.high <= c1.high && c0.low >= c1.low) {
    patterns.push('Inside Bar (Consolidation)');
  }

  // Morning Star
  if (c2.close < c2.open && Math.abs(c1.close - c1.open) < (c2.open - c2.close) * 0.4 && isBullish0 && c0.close > (c2.open + c2.close) / 2) {
    patterns.push('Morning Star (Strong Bullish)');
  }

  // Evening Star
  if (c2.close > c2.open && Math.abs(c1.close - c1.open) < (c2.close - c2.open) * 0.4 && isBearish0 && c0.close < (c2.open + c2.close) / 2) {
    patterns.push('Evening Star (Strong Bearish)');
  }

  if (patterns.length === 0) {
    patterns.push(isBullish0 ? 'Bullish Candlestick Momentum' : 'Bearish Candlestick Pressure');
  }

  return patterns;
}

export function detectSupportResistance(candles: OHLCVCandle[]): { support: number[]; resistance: number[] } {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const len = candles.length;
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  for (let i = 2; i < len - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
      swingHighs.push(highs[i]);
    }
    if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
      swingLows.push(lows[i]);
    }
  }

  // Cluster and sort
  const currentPrice = candles[len - 1].close;
  const resistance = swingHighs
    .filter((h) => h >= currentPrice * 0.999)
    .sort((a, b) => a - b)
    .slice(0, 3);
  const support = swingLows
    .filter((l) => l <= currentPrice * 1.001)
    .sort((a, b) => b - a)
    .slice(0, 3);

  // Fallbacks if not enough swings
  if (resistance.length === 0) {
    resistance.push(Math.max(...highs.slice(-10)));
  }
  if (support.length === 0) {
    support.push(Math.min(...lows.slice(-10)));
  }

  return {
    support: support.map((v) => Math.round(v * 100000) / 100000),
    resistance: resistance.map((v) => Math.round(v * 100000) / 100000),
  };
}

export function analyzeMarketStructure(candles: OHLCVCandle[], currentPrice: number): CalculatedIndicators['marketStructure'] {
  const len = candles.length;
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 2; i < len - 2; i++) {
    if (candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high) {
      highs.push(candles[i].high);
    }
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) {
      lows.push(candles[i].low);
    }
  }

  const lastHigh = highs[highs.length - 1] || candles[len - 1].high;
  const prevHigh = highs[highs.length - 2] || lastHigh;
  const lastLow = lows[lows.length - 1] || candles[len - 1].low;
  const prevLow = lows[lows.length - 2] || lastLow;

  const higherHighs = lastHigh > prevHigh;
  const higherLows = lastLow > prevLow;
  const lowerHighs = lastHigh < prevHigh;
  const lowerLows = lastLow < prevLow;

  let type: MarketStructureType = 'RANGE';
  let trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (higherHighs && higherLows) {
    type = 'UPTREND';
    trendBias = 'BULLISH';
  } else if (lowerHighs && lowerLows) {
    type = 'DOWNTREND';
    trendBias = 'BEARISH';
  } else if ((higherHighs && lowerLows) || (lowerHighs && higherLows)) {
    type = 'TRANSITION';
    trendBias = higherHighs ? 'BULLISH' : 'BEARISH';
  } else {
    // Check volatility/choppiness
    const atr = calculateATR(candles, 14);
    const avgAtr = atr[atr.length - 1] || 0.001;
    const priceRange = lastHigh - lastLow;
    if (priceRange < avgAtr * 1.2) {
      type = 'CHOPPY';
      trendBias = 'NEUTRAL';
    } else {
      type = 'RANGE';
      trendBias = 'NEUTRAL';
    }
  }

  let breakoutPotential: CalculatedIndicators['marketStructure']['breakoutPotential'] = 'NONE';
  if (currentPrice > lastHigh * 0.9995 && higherLows) {
    breakoutPotential = 'BREAKOUT_UP';
  } else if (currentPrice < lastLow * 1.0005 && lowerHighs) {
    breakoutPotential = 'BREAKDOWN';
  } else if (Math.abs(currentPrice - lastLow) < (lastHigh - lastLow) * 0.15) {
    breakoutPotential = 'RETEST';
  } else if (Math.abs(currentPrice - lastHigh) < (lastHigh - lastLow) * 0.15) {
    breakoutPotential = 'REJECTION';
  }

  return {
    type,
    trendBias,
    lastSwingHigh: Math.round(lastHigh * 100000) / 100000,
    lastSwingLow: Math.round(lastLow * 100000) / 100000,
    higherHighs,
    higherLows,
    lowerHighs,
    lowerLows,
    breakoutPotential,
  };
}

export function computeAllIndicators(candles: OHLCVCandle[]): CalculatedIndicators {
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const currentPrice = closes[closes.length - 1] || 1;

  const ema9Arr = calculateEMA(closes, 9);
  const ema21Arr = calculateEMA(closes, 21);
  const ema50Arr = calculateEMA(closes, 50);
  const ema100Arr = calculateEMA(closes, 100);
  const ema200Arr = calculateEMA(closes, 200);
  const sma20Arr = calculateSMA(closes, 20);

  const rsiArr = calculateRSI(closes, 14);
  const macdObj = calculateMACD(closes, 12, 26, 9);
  const adxObj = calculateADX(candles, 14);
  const atrArr = calculateATR(candles, 14);
  const bbObj = calculateBollingerBands(closes, 20, 2);
  const stochObj = calculateStochastic(candles, 14, 3);
  const cciVal = calculateCCI(candles, 20);
  const wRVal = calculateWilliamsR(candles, 14);
  const vwapVal = calculateVWAP(candles);

  const volEmaArr = calculateEMA(volumes, 20);
  const lastVolEma = volEmaArr[volEmaArr.length - 1] || 1;
  const lastVol = volumes[volumes.length - 1] || 1;
  const volumeRatio = lastVolEma === 0 ? 1 : lastVol / lastVolEma;

  const sr = detectSupportResistance(candles);
  const structure = analyzeMarketStructure(candles, currentPrice);
  const patterns = detectCandlestickPatterns(candles);

  return {
    currentPrice,
    ema9: ema9Arr[ema9Arr.length - 1] || currentPrice,
    ema21: ema21Arr[ema21Arr.length - 1] || currentPrice,
    ema50: ema50Arr[ema50Arr.length - 1] || currentPrice,
    ema100: ema100Arr[ema100Arr.length - 1] || currentPrice,
    ema200: ema200Arr[ema200Arr.length - 1] || currentPrice,
    sma20: sma20Arr[sma20Arr.length - 1] || currentPrice,
    rsi14: Math.round((rsiArr[rsiArr.length - 1] || 50) * 10) / 10,
    macd: {
      macd: Math.round((macdObj.macdLine[macdObj.macdLine.length - 1] || 0) * 100000) / 100000,
      signal: Math.round((macdObj.signalLine[macdObj.signalLine.length - 1] || 0) * 100000) / 100000,
      histogram: Math.round((macdObj.histogram[macdObj.histogram.length - 1] || 0) * 100000) / 100000,
    },
    adx14: adxObj,
    atr14: Math.round((atrArr[atrArr.length - 1] || 0.001) * 100000) / 100000,
    bollingerBands: {
      upper: Math.round(bbObj.upper * 100000) / 100000,
      middle: Math.round(bbObj.middle * 100000) / 100000,
      lower: Math.round(bbObj.lower * 100000) / 100000,
      bandwidth: Math.round(bbObj.bandwidth * 10000) / 100,
      percentB: Math.round(bbObj.percentB * 100) / 100,
    },
    stochastic: stochObj,
    cci: cciVal,
    williamsR: wRVal,
    vwap: Math.round(vwapVal * 100000) / 100000,
    volumeEma: Math.round(lastVolEma),
    volumeRatio: Math.round(volumeRatio * 100) / 100,
    marketStructure: structure,
    supportLevels: sr.support,
    resistanceLevels: sr.resistance,
    detectedPatterns: patterns,
  };
}
